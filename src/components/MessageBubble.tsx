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
      </div>
    </div>
  );
};
