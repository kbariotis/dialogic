import { chat } from "./llm.js";
import chalk from "chalk";
import { getSystemPrompt } from "./prompt.js";

export async function runAgent(
  userInput,
  spinner,
  signal,
  history = [],
  profile = null,
  mistakeLog = [],
) {
  const systemPrompt = getSystemPrompt(profile, mistakeLog);

  let messages = [...history];
  if (userInput) {
    messages.push({ role: "user", parts: [{ text: userInput }] });
  }

  if (signal?.aborted) {
    throw new Error("Task aborted by user");
  }

  const responseText = await chat(messages, systemPrompt, signal);

  let parsedContent;
  try {
    // Attempt to strip markdown formatting if the model disobeys instructions and includes it.
    let cleanText = responseText.trim();
    if (cleanText.startsWith("\`\`\`json")) {
      cleanText = cleanText
        .replace(/^\`\`\`json/, "")
        .replace(/\`\`\`$/, "")
        .trim();
    } else if (cleanText.startsWith("\`\`\`")) {
      cleanText = cleanText
        .replace(/^\`\`\`/, "")
        .replace(/\`\`\`$/, "")
        .trim();
    }
    parsedContent = JSON.parse(cleanText);
  } catch (error) {
    // Fallback if the LLM output is entirely unparseable
    parsedContent = {
      response:
        "Lo siento, ha ocurrido un error en mi procesamiento. ¿Podemos intentarlo de nuevo?",
      feedback: `[System Error] Failed to parse LLM output as JSON. Raw output: ${responseText.substring(0, 100)}...`,
    };
  }

  // Update history for the next turn. We store the raw block so the model sees its own output.
  messages.push({ role: "model", parts: [{ text: responseText }] });

  return {
    answer: parsedContent.response,
    feedback: parsedContent.feedback,
    history: messages,
  };
}
