import React, { useEffect, useState } from "react";
import {
  getRecentConversations,
  type Provider,
  type UserProfile,
  type Conversation,
} from "../lib/db";
import { useTheme } from "../hooks/useTheme";
import {
  MessageSquarePlus,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import logoImg from "../assets/logo.png";

export const ConversationList: React.FC<{
  provider: Provider;
  profile: UserProfile;
  onLogout: () => void;
  onSelectConversation: (id: string | null) => void;
}> = ({ provider, profile, onLogout, onSelectConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const loadConversations = async () => {
      const recents = await getRecentConversations(5);
      setConversations(recents);
    };
    loadConversations();
  }, []);

  return (
    <div className="chat-container">
      <header className="chat-header glass-panel">
        <div className="chat-title">
          <img
            src={logoImg}
            alt="Logo"
            className="header-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <h1>
            Dialogic{" "}
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
            onClick={onLogout}
            className="logout-button"
            title="Disconnect Provider"
          >
            <LogOut size={18} />
            <span>Disconnect</span>
          </button>
        </div>
      </header>

      <main
        className="chat-messages"
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "600px", padding: "1rem" }}>
          <h2 style={{ marginBottom: "1.5rem", color: "var(--text-primary)" }}>
            Recent Conversations
          </h2>
          {conversations.length === 0 ? (
            <div className="empty-state" style={{ minHeight: "200px" }}>
              <p>No recent conversations found. Start a new one!</p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {conversations.map((convo) => {
                const lastMessage = convo.messages[convo.messages.length - 1];
                const preview = lastMessage?.content
                  ? lastMessage.content.slice(0, 60) + "..."
                  : "Empty conversation";
                return (
                  <button
                    key={convo.id}
                    onClick={() => onSelectConversation(convo.id)}
                    className="glass-panel"
                    style={{
                      background: "var(--bg-panel)",
                      border: "1px solid var(--border-color)",
                      textAlign: "left",
                      padding: "1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--accent-color)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        "var(--border-color)")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "var(--text-primary)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontWeight: "bold",
                        }}
                      >
                        <MessageSquare size={16} />
                        <span>
                          {new Date(convo.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {new Date(convo.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.9rem",
                        margin: 0,
                      }}
                    >
                      {preview}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="chat-footer glass-panel">
        <button
          onClick={() => onSelectConversation(null)}
          className="view-report-button"
          style={{
            width: "100%",
            padding: "1rem",
            background: "var(--accent-color)",
            color: "white",
            borderRadius: "4px",
            border: "none",
            fontSize: "1rem",
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <MessageSquarePlus size={20} />
          Create new conversation
        </button>
      </footer>
    </div>
  );
};
