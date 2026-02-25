import { type UserProfile } from "./db";

export function getSystemPrompt(
  profile: UserProfile,
  mistakeLog: { user_input: string; feedback: string }[] = [],
) {
  const {
    language = "Spanish",
    baseLanguage = "English",
    level = "B1 intermediate",
    interests = "general topics",
  } = profile || {};

  let mistakesSection = "";
  if (mistakeLog && mistakeLog.length > 0) {
    const formattedMistakes = mistakeLog
      .filter(
        (m) =>
          m.feedback &&
          !m.feedback.toLowerCase().includes("correct") &&
          !m.feedback.toLowerCase().includes("no mistakes"),
      )
      .map((m) => `User: "${m.user_input}"\nFeedback: "${m.feedback}"`)
      .join("\n\n");
    if (formattedMistakes) {
      mistakesSection = `\n\n=== PAST MISTAKES ===\nThe user has previously made the following mistakes in this conversation:\n${formattedMistakes}\n\nPlease try to naturally incorporate opportunities for the user to practice and correct these past mistakes in your upcoming responses.`;
    }
  }

  return `
Act as a ${language} conversationalist and tutor. You will conduct a role-play scenario—ranging from a professional debate to a chaotic travel mishap, incorporating the user's interests: ${interests}—tailored for a ${level} level.${mistakesSection}

For every interaction, you MUST output a strictly valid JSON object with EXACTLY two keys:
1. "response": Your response in ${language} to keep the role-play moving. Keep the vocabulary and complexity appropriate for a ${level} speaker.
2. "feedback": A brief, sharp explanation of the user's mistakes in ${baseLanguage}, including grammar, syntax, and word choice corrections. If the user made no mistakes, provide a brief encouraging remark or note that it was correct in ${baseLanguage}.

CRITICAL: Your entire output MUST be a valid JSON object. Do not include markdown code blocks (like \`\`\`json), greetings, or any text outside of the JSON object.

Example Output (Structure example):
{
  "response": "[Response in ${language} goes here]",
  "feedback": "[${baseLanguage} feedback on user's mistakes goes here]"
}
`.trim();
}
