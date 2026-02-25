import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ollama } from "ollama/browser";
import { getProviderKey, type Provider } from "./db";

export interface Message {
  role: "user" | "assistant";
  content: string;
  feedback?: string;
  isHidden?: boolean;
}

export async function validateProviderKey(
  provider: Provider,
  key: string,
): Promise<boolean> {
  try {
    switch (provider) {
      case "openai": {
        const client = new OpenAI({
          apiKey: key,
          dangerouslyAllowBrowser: true,
        });
        await client.models.list();
        return true;
      }
      case "anthropic": {
        // Anthropic: test a minimal request to validate auth
        const client = new Anthropic({
          apiKey: key,
          dangerouslyAllowBrowser: true,
        });
        await client.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        });
        return true;
      }
      case "gemini": {
        const ai = new GoogleGenerativeAI(key);
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        await model.generateContent("hi");
        return true;
      }
      case "ollama": {
        const host = key || "http://localhost:11434";
        const client = new Ollama({ host });
        await client.list();
        return true;
      }
    }
  } catch (error) {
    console.error(`Validation failed for ${provider}:`, error);
    return false;
  }
}

export async function streamChat(
  provider: Provider,
  messages: Message[],
  systemInstruction: string,
  onChunk: (chunk: string) => void,
): Promise<string> {
  const key = await getProviderKey(provider);
  if (provider !== "ollama" && !key)
    throw new Error(`Missing API key for ${provider}`);

  let fullResponse = "";

  switch (provider) {
    case "openai": {
      const client = new OpenAI({
        apiKey: key!,
        dangerouslyAllowBrowser: true,
      });
      const stream = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemInstruction }, ...messages],
        stream: true,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        fullResponse += text;
        onChunk(fullResponse);
      }
      break;
    }
    case "anthropic": {
      const client = new Anthropic({
        apiKey: key!,
        dangerouslyAllowBrowser: true,
      });
      const stream = await client.messages.create({
        model: "claude-3-5-sonnet-latest",
        system: systemInstruction,
        messages: messages,
        max_tokens: 4096,
        stream: true,
      });
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          fullResponse += chunk.delta.text;
          onChunk(fullResponse);
        }
      }
      break;
    }
    case "gemini": {
      const ai = new GoogleGenerativeAI(key!);
      const model = ai.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction,
      });
      const formattedMessages = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const result = await model.generateContentStream({
        contents: formattedMessages,
      });
      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullResponse += text;
        onChunk(fullResponse);
      }
      break;
    }
    case "ollama": {
      const host = key || "http://localhost:11434"; // key stores the host for ollama
      const client = new Ollama({ host });
      const stream = await client.chat({
        model: "llama3", // default local model
        messages: [{ role: "system", content: systemInstruction }, ...messages],
        stream: true,
      });
      for await (const chunk of stream) {
        fullResponse += chunk.message.content;
        onChunk(fullResponse);
      }
      break;
    }
  }

  return fullResponse;
}

export async function generateChatResponse(
  provider: Provider,
  messages: Message[],
  systemInstruction: string,
): Promise<{ response: string; feedback: string; rawText: string }> {
  // Use streamChat to get the full raw text, ignoring the chunk updates.
  // We format the history back to standard so the model sees past raw JSON or we just let it see what it generated.
  // Wait, the prior AI prompt used JSON output. The assistant's past `content` was just the `response` string or the full JSON?
  // CLI pushed `{ role: "model", parts: [{ text: responseText }] }` (so raw JSON block).
  const fullText = await streamChat(
    provider,
    messages,
    systemInstruction,
    () => {},
  );

  let parsedContent;
  try {
    let cleanText = fullText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
    }
    parsedContent = JSON.parse(cleanText);
  } catch (error) {
    parsedContent = {
      response: "Lo siento, ha ocurrido un error.",
      feedback: `Failed to parse response. Raw: ${fullText.substring(0, 50)}...`,
    };
  }

  return {
    response: parsedContent.response || "",
    feedback: parsedContent.feedback || "",
    rawText: fullText,
  };
}
