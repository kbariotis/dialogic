import { useState } from "react";
import { Bot, User, Loader2, Languages } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type Message } from "../lib/db";

interface MessageBubbleProps {
  message: Message;
  isLoading: boolean;
  isLastMessage: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLoading,
  isLastMessage,
}) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isAssistant = message.role === "assistant";
  const hasTranslation = isAssistant && !!message.translation;
  const isLoadingPlaceholder =
    isAssistant && !message.content && isLoading && isLastMessage;

  return (
    <div className={`message-wrapper ${message.role}`}>
      <div className="message-avatar">
        {isAssistant ? <Bot size={20} /> : <User size={20} />}
      </div>
      <div className="message-content">
        {isAssistant && message.content ? (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : message.content ? (
          message.content
        ) : isLoadingPlaceholder ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          ""
        )}

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          {hasTranslation && (
            <button
              className="translation-toggle"
              onClick={() => setShowTranslation((prev) => !prev)}
              title={showTranslation ? "Hide translation" : "Show translation"}
              aria-expanded={showTranslation}
            >
              <Languages size={14} />
              <span>{showTranslation ? "Hide" : "Translate"}</span>
            </button>
          )}

          {isAssistant && message.hint && (
            <button
              className="translation-toggle"
              onClick={() => setShowHint((prev) => !prev)}
              title={showHint ? "Hide hint" : "Show hint"}
              aria-expanded={showHint}
            >
              <span>💡 {showHint ? "Hide Hint" : "Show Hint"}</span>
            </button>
          )}
        </div>

        {hasTranslation && showTranslation && (
          <div className="translation-block">{message.translation}</div>
        )}

        {isAssistant && message.feedback && (
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
            <strong>Feedback:</strong> {message.feedback}
          </div>
        )}

        {isAssistant && message.hint && showHint && (
          <div
            className="hint-box"
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              background: "rgba(59, 130, 246, 0.1)",
              borderLeft: "3px solid var(--primary-color)",
              borderRadius: "4px",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            <strong>💡 Hint:</strong> {message.hint}
          </div>
        )}

        {isAssistant && message.stems && message.stems.length > 0 && (
          <div
            className="stems-box"
            style={{
              marginTop: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Try saying:</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {message.stems.map((stem, i) => (
                <span
                  key={i}
                  className="stem-item"
                  style={{
                    padding: "0.25rem 0.75rem",
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    // Logic to populate input could go here, but for now just display
                  }}
                >
                  {stem}...
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
