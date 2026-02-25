import { useState, useEffect, useRef } from "react";
import { generateChatResponse, type Message } from "../lib/ai";
import {
  clearAllCredentials,
  saveConversation,
  getConversation,
  type Provider,
  type UserProfile,
} from "../lib/db";
import { getSystemPrompt } from "../lib/prompt";
import {
  LogOut,
  Send,
  Bot,
  User,
  Loader2,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export const ChatInterface: React.FC<{
  provider: Provider;
  profile: UserProfile;
  onLogout: () => void;
}> = ({ provider, profile, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handleAutoStartRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "dark";
    setTheme(savedTheme as "dark" | "light");
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    const initOrLoad = async () => {
      const activeId = localStorage.getItem("activeConversation");
      if (activeId) {
        const convo = await getConversation(activeId);
        if (convo) {
          setMessages(convo.messages);
          setConversationId(activeId);
          return;
        }
      }
      const newId = uuidv4();
      setConversationId(newId);
      localStorage.setItem("activeConversation", newId);
    };
    initOrLoad();
  }, []);

  useEffect(() => {
    const handleAutoStart = async () => {
      const userMessage: Message = {
        role: "user",
        content:
          "Let's start the role-play scenario. Please initiate the conversation.",
        isHidden: true,
      };
      const newMessages = [userMessage];
      setMessages(newMessages);
      setIsLoading(true);

      try {
        const systemInstruction = getSystemPrompt(profile, []);
        setMessages([...newMessages, { role: "assistant", content: "" }]);

        const { response } = await generateChatResponse(
          provider,
          newMessages,
          systemInstruction,
        );

        const finalAssistantMessage: Message = {
          role: "assistant",
          content: response,
        };
        const finalMessages = [...newMessages, finalAssistantMessage];

        setMessages(finalMessages);
        await saveConversation(conversationId, finalMessages);
      } catch (error) {
        console.error(error);
        setMessages([
          userMessage,
          {
            role: "assistant",
            content:
              "*** Error processing request. Check your API key or network connection. ***",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (
      conversationId &&
      messages.length === 0 &&
      !isLoading &&
      !handleAutoStartRef.current
    ) {
      handleAutoStartRef.current = true;
      handleAutoStart();
    }
  }, [conversationId, messages.length, isLoading, profile, provider]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = async () => {
    await clearAllCredentials();
    localStorage.removeItem("activeConversation");
    onLogout();
  };

  const handleReset = () => {
    const newId = uuidv4();
    setConversationId(newId);
    localStorage.setItem("activeConversation", newId);
    setMessages([]);
    handleAutoStartRef.current = false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Build mistake log from previous messages
      const mistakeLog = messages
        .filter((m) => m.role === "assistant" && m.feedback && !m.isHidden)
        .map((m) => {
          // Find the preceding user message for context
          const userMsg = messages
            .slice(0, messages.indexOf(m))
            .reverse()
            .find((msg) => msg.role === "user");
          return {
            user_input: userMsg ? userMsg.content : "",
            feedback: m.feedback!,
          };
        });

      const systemInstruction = getSystemPrompt(profile, mistakeLog);

      // Append blank assistant message to trigger loading spinner in UI
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      const { response, feedback } = await generateChatResponse(
        provider,
        newMessages,
        systemInstruction,
      );

      const finalAssistantMessage: Message = {
        role: "assistant",
        content: response,
        feedback,
      };
      const finalMessages = [...newMessages, finalAssistantMessage];

      setMessages(finalMessages);
      await saveConversation(conversationId, finalMessages);
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            "*** Error processing request. Check your API key or network connection. ***",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header glass-panel">
        <div className="chat-title">
          <Bot size={24} className="header-icon" />
          <h1>
            Language Coach{" "}
            <span
              style={{
                fontSize: "0.75rem",
                opacity: 0.7,
                marginLeft: "0.5rem",
                fontWeight: "normal",
              }}
            >
              ({provider} - {profile.language})
            </span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={toggleTheme}
            className="logout-button"
            title="Toggle Theme"
            style={{ padding: "0.5rem" }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={handleReset}
            className="logout-button"
            title="Restart Conversation"
            disabled={isLoading}
          >
            <RefreshCw size={18} />
            <span>Restart</span>
          </button>
          <button
            onClick={handleLogout}
            className="logout-button"
            title="Disconnect Provider"
          >
            <LogOut size={18} />
            <span>Disconnect</span>
          </button>
        </div>
      </header>

      <main className="chat-messages">
        {messages.filter((m) => !m.isHidden).length === 0 && !isLoading ? (
          <div className="empty-state">
            <Bot size={64} className="empty-icon" />
            <p>
              Hey! I'm your {profile.language} coach.
              <br />
              Let's chat! I'll help you fix your mistakes.
            </p>
          </div>
        ) : (
          messages
            .filter((m) => !m.isHidden)
            .map((msg, idx, arr) => (
              <div key={idx} className={`message-wrapper ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === "assistant" ? (
                    <Bot size={20} />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="message-content">
                  {msg.content ||
                    (msg.role === "assistant" &&
                    isLoading &&
                    idx === arr.length - 1 ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      ""
                    ))}

                  {msg.role === "assistant" && msg.feedback && (
                    <div
                      className="feedback-box"
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.75rem",
                        background: "rgba(239, 68, 68, 0.1)",
                        borderLeft: "3px solid var(--accent-color)",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <strong>Feedback:</strong> {msg.feedback}
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-footer glass-panel">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Type in ${profile.language}...`}
            className="chat-input"
            disabled={isLoading}
            autoFocus
            autoComplete="on"
            autoCorrect="on"
            spellCheck={true}
          />
          <button
            type="submit"
            className="chat-send"
            disabled={!input.trim() || isLoading}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
};
