import { type UserProfile } from "./db";

export function getSystemPrompt(
  profile: UserProfile,
  mistakeLog: { user_input: string; feedback: string }[] = [],
  conceptsToReview: string[] = [],
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

  let reviewSection = "";
  if (conceptsToReview && conceptsToReview.length > 0) {
    const formattedConcepts = conceptsToReview.map((c) => `- ${c}`).join("\n");
    reviewSection = `\n\n=== HISTORICAL WEAKNESSES TO ENFORCE ===\nThe user has previously struggled with the following concepts:\n${formattedConcepts}\n\nCRITICAL SCENARIO INSTRUCTION:\n1. Define a specific scenario strictly based on the user's interests: ${interests}.\n2. Actively engineer situational constraints in this role-play that FORCE the user to utilize the specific linguistic mechanics listed above.\n3. Initiate the conversation by immediately placing the user in a context where they MUST respond using those mechanics.`;
  }

  return `
Act as a ${language} conversationalist and tutor. You will conduct a role-play scenario—tailored for a ${level} level. 
If no historical weaknesses are provided, range the scenario from a professional debate to a chaotic travel mishap, incorporating the user's interests: ${interests}.${reviewSection}${mistakesSection}

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

export function getReportPrompt(
  profile: UserProfile,
  mistakeLog: { user_input: string; feedback: string }[],
) {
  const { language = "Spanish", level = "B1 intermediate" } = profile || {};

  const formattedMistakes = mistakeLog
    .filter(
      (m) =>
        m.feedback &&
        !m.feedback.toLowerCase().includes("correct") &&
        !m.feedback.toLowerCase().includes("no mistakes"),
    )
    .map((m) => `- User said: "${m.user_input}"\n  Feedback: "${m.feedback}"`)
    .join("\n");

  return `
Act as an expert ${language} language coach. The user has just completed a ${language} conversation scenario at a ${level} level.

Based on the following list of mistakes and feedback from the session, generate a performance report.

=== MISTAKE LOG ===
${formattedMistakes || "No significant mistakes were recorded."}

You MUST output a strictly valid JSON object with EXACTLY two keys:
1. "human_summary": A markdown-formatted summary of the user's performance, identifying 3-5 core linguistic concepts (grammar rules, vocabulary themes, syntax patterns) they struggled with, brief explanations, and a specific exercise/focus area. Use bullet points.
2. "concepts_to_review": An array of strings, where each string is a concise summary (1-2 sentences max) of a core linguistic concept the user failed, which will be fed to an AI in the future to FORCE practice.

CRITICAL: Your entire output MUST be a valid JSON object. Do not include markdown code blocks (like \`\`\`json), greetings, or any text outside of the JSON object.

Example Output (Structure example):
{
  "human_summary": "### Core Concepts to Review\\n...",
  "concepts_to_review": [
    "Uses incorrect past tense conjugation for regular AR verbs.",
    "Struggles with gender agreement between nouns and adjectives."
  ]
}
`.trim();
}
