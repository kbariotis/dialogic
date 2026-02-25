# Dialogic - AI Language Learning Companion

Dialogic is a client-side React application designed for immersive language learning through AI-driven role-play scenarios. It enables users to practice target languages with a variety of LLM providers while receiving real-time linguistic feedback.

## Project Overview

- **Core Objective:** Provide a secure, client-side platform for language acquisition using immersive conversational AI.
- **Primary Technologies:**
  - **Frontend:** React 19, Vite, TypeScript.
  - **AI Providers:** Google Gemini, OpenAI, Anthropic, and local Ollama.
  - **Storage:** IndexedDB (via `idb`) for persistent local storage of credentials, profiles, and chat history.
  - **Icons:** Lucide React.
  - **Styling:** Modern, themeable CSS (Dark/Light modes).

## Architecture

The application is structured as a single-page application (SPA) with a focus on data privacy—all API keys and conversation data remain in the user's browser.

### Key Modules

- **`src/lib/ai.ts`**: Handles validation and interaction with multiple AI provider SDKs. It manages streaming responses and parses the structured JSON output from the models.
- **`src/lib/db.ts`**: Defines the IndexedDB schema and provides asynchronous methods for managing user credentials, profiles, and conversation persistence.
- **`src/lib/prompt.ts`**: Dynamically constructs complex system prompts based on the user's proficiency level, interests, and a "mistake log" compiled from previous interactions to reinforce learning.
- **`src/components/`**:
  - `ChatInterface.tsx`: The primary interaction hub, managing message state, theme toggling, and the feedback loop.
  - `ApiKeyModal.tsx`: Secure entry point for configuring provider-specific API keys.
  - `ProfileModal.tsx`: User onboarding for setting target languages and learning goals.

## Building and Running

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Development Conventions

- **Type Safety:** Strict TypeScript usage for all library functions and component props.
- **JSON Communication:** The AI is instructed to output strictly valid JSON to separate conversational content from linguistic feedback.
- **Local-First:** No external backend is used; all logic for state management and AI orchestration resides in the client.
- **Component Structure:** Functional components with Hooks, utilizing `lucide-react` for consistent iconography and `glass-panel` styling for the UI.
