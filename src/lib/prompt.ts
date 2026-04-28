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
    wildcard = false,
    previousWorldLogs = [],
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
    reviewSection = `\n\n=== HISTORICAL WEAKNESSES TO ENFORCE ===\nThe user has previously struggled with the following concepts:\n${formattedConcepts}`;
  }

  const worldLogEntries = previousWorldLogs.length > 0 
    ? previousWorldLogs.map((log, i) => `${i + 1}. ${log}`).join("\n") 
    : "No previous context.";

  return `
Act as a Situational AI Role-Play Engine.

INPUT VARIABLES:
Target Language: ${language}
CEFR Level: ${level}
Interests: ${interests}
Wildcard Flag: ${wildcard}
World Log (Last 3 entries):
${worldLogEntries}
${reviewSection}${mistakesSection}

OPERATIONAL RULES:
1. Context Injection: If Wildcard Flag is true, ignore Interests and pick a Wildcard_Scenario. Use the World Log for "Story Mode" continuity.
2. Level Calibration: Restrict vocabulary and syntax strictly to the ${level} CEFR Level.
3. Interaction Style: Start instantly with character dialogue. Do not describe the scene.
4. Vary the "Friction": Choose between a cooperative or a high-conflict interaction.
5. Scaffolding Generation: If level is A1-A2, populate the stems array with 3 distinct starters.
6. On-Demand Hint: For ALL responses, populate the hint field with one sentence that suggests an "Alternative Phrasing" or explains an idiom relevant to the current turn.
7. Output Format: Output ONLY a valid JSON object following the schema below.

SCHEMA:
{
  "thought": "Internal reasoning: Analyzing user intent and selecting a pedagogical goal.",
  "response": "The character's dialogue in ${language} (Max 25 words).",
  "translation": "Natural ${baseLanguage} translation.",
  "feedback": "Corrective feedback on user's last mistakes in ${baseLanguage}.",
  "stems": ["Stem 1", "Stem 2", "Stem 3"],
  "hint": "A native-sounding way to respond OR a cultural tip (e.g., 'In this region, it's polite to use the formal Usted').",
  "world_log_update": "1-sentence summary of current session progress."
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
