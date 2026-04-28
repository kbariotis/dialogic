import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ollama } from "ollama/browser";
import { getProviderKey, getProviderModel, type Provider, type Message } from "./db";

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

export async function fetchOllamaModels(host: string): Promise<string[]> {
  try {
    const client = new Ollama({ host });
    const response = await client.list();
    return response.models.map((m) => m.name);
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    return [];
  }
}

export async function generateCompletion(
  provider: Provider,
  messages: Message[],
  systemInstruction: string,
): Promise<string> {
  const key = await getProviderKey(provider);
  if (provider !== "ollama" && !key) {
    throw new Error(`Missing API key for ${provider}`);
  }

  switch (provider) {
    case "openai": {
      const client = new OpenAI({
        apiKey: key!,
        dangerouslyAllowBrowser: true,
      });
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemInstruction }, ...messages],
      });
      return response.choices[0]?.message?.content || "";
    }
    case "anthropic": {
      const client = new Anthropic({
        apiKey: key!,
        dangerouslyAllowBrowser: true,
      });
      const response = await client.messages.create({
        model: "claude-3-5-sonnet-latest",
        system: systemInstruction,
        messages: messages,
        max_tokens: 4096,
      });
      return response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
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
      const result = await model.generateContent({
        contents: formattedMessages,
      });
      return result.response.text();
    }
    case "ollama": {
      const host = key || "http://localhost:11434";
      const model = (await getProviderModel("ollama")) || "qwen3.5:9b";
      const client = new Ollama({ host });
      const response = await client.chat({
        model: model,
        messages: [{ role: "system", content: systemInstruction }, ...messages],
      });
      return response.message.content;
    }
  }
}

export async function generateChatResponse(
  provider: Provider,
  messages: Message[],
  systemInstruction: string,
): Promise<{
  thought: string;
  response: string;
  feedback: string;
  translation: string;
  stems: string[];
  hint: string;
  worldLog: string;
  rawText: string;
}> {
  const fullText = await generateCompletion(
    provider,
    messages,
    systemInstruction,
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
  } catch {
    parsedContent = {
      response: "Lo siento, ha ocurrido un error.",
      feedback: `Failed to parse response. Raw: ${fullText.substring(0, 50)}...`,
    };
  }

  return {
    thought: parsedContent.thought || "",
    response: parsedContent.response || "",
    feedback: parsedContent.feedback || "",
    translation: parsedContent.translation || "",
    stems: Array.isArray(parsedContent.stems) ? parsedContent.stems : [],
    hint: parsedContent.hint || "",
    worldLog: parsedContent.world_log_update || "",
    rawText: fullText,
  };
}

export async function generateReport(
  provider: Provider,
  systemInstruction: string,
): Promise<string> {
  const dummyMessage: Message = {
    role: "user",
    content:
      "Please generate my performance report based on the system instructions.",
  };

  const reportText = await generateCompletion(
    provider,
    [dummyMessage],
    systemInstruction,
  );
  return reportText.trim();
}
