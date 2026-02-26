import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type Provider = "openai" | "anthropic" | "gemini" | "ollama";

export interface UserProfile {
  language: string;
  baseLanguage: string;
  level: string;
  interests: string;
}

interface LanguageCoachDB extends DBSchema {
  credentials: {
    key: string;
    value: string;
  };
  profile: {
    key: "user-profile";
    value: UserProfile;
  };
  conversations: {
    key: string;
    value: {
      id: string;
      messages: {
        role: "user" | "assistant";
        content: string;
        feedback?: string;
        isHidden?: boolean;
      }[];
      updatedAt: number;
      report?: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<LanguageCoachDB>>;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<LanguageCoachDB>("LanguageCoachDB", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore("credentials");
          db.createObjectStore("conversations", { keyPath: "id" });
        }
        if (oldVersion < 2) {
          db.createObjectStore("profile");
        }
      },
    });
  }
  return dbPromise;
}

export async function getApiKey(): Promise<string | undefined> {
  const db = await initDB();
  return db.get("credentials", "openai-key"); // fallback/legacy
}

export async function setProviderKey(
  provider: Provider,
  key: string,
): Promise<void> {
  const db = await initDB();
  await db.put("credentials", key, `${provider}-key`);
}

export async function getProviderKey(
  provider: Provider,
): Promise<string | undefined> {
  const db = await initDB();
  return db.get("credentials", `${provider}-key`);
}

export async function getActiveProvider(): Promise<Provider | undefined> {
  const db = await initDB();
  const val = await db.get("credentials", "active-provider");
  return val as Provider | undefined;
}

export async function setActiveProvider(provider: Provider): Promise<void> {
  const db = await initDB();
  await db.put("credentials", provider, "active-provider");
}

export async function clearAllCredentials(): Promise<void> {
  const db = await initDB();
  await db.delete("credentials", "openai-key");
  await db.delete("credentials", "anthropic-key");
  await db.delete("credentials", "gemini-key");
  await db.delete("credentials", "ollama-key");
  await db.delete("credentials", "active-provider");
}

export async function saveConversation(
  id: string,
  messages: {
    role: "user" | "assistant";
    content: string;
    feedback?: string;
    isHidden?: boolean;
  }[],
): Promise<void> {
  const db = await initDB();
  await db.put("conversations", { id, messages, updatedAt: Date.now() });
}

export async function getConversation(id: string): Promise<
  | {
      id: string;
      messages: {
        role: "user" | "assistant";
        content: string;
        feedback?: string;
        isHidden?: boolean;
      }[];
      updatedAt: number;
      report?: string;
    }
  | undefined
> {
  const db = await initDB();
  return db.get("conversations", id);
}

export async function saveConversationReport(
  id: string,
  report: string,
): Promise<void> {
  const db = await initDB();
  const convo = await db.get("conversations", id);
  if (convo) {
    convo.report = report;
    convo.updatedAt = Date.now();
    await db.put("conversations", convo);
  }
}

export async function clearApiKey(): Promise<void> {
  const db = await initDB();
  await db.delete("credentials", "openai-key");
}

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await initDB();
  return db.get("profile", "user-profile");
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await initDB();
  await db.put("profile", profile, "user-profile");
}
