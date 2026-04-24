import { useState, useEffect, useRef } from "react";
import { generateChatResponse, generateReport } from "../lib/ai";
import {
  clearAllCredentials,
  saveConversation,
  getConversation,
  saveConversationReport,
  getRecentReports,
  type Provider,
  type UserProfile,
  type Message,
} from "../lib/db";
import { getSystemPrompt, getReportPrompt } from "../lib/prompt";
import {
  LogOut,
  Bot,
  Loader2,
  RefreshCw,
  Sun,
  Moon,
  FileText,
} from "lucide-react";

import logoImg from "../assets/logo.png";
import { Report } from "./Report";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { useTheme } from "../hooks/useTheme";

const MAX_TURNS = 2;

/**
 * Extracts and maps the relevant user mistakes and assistant feedback
 * from the conversation history into the required Prompt schema array.
 */
const buildMistakeLog = (msgs: Message[]) => {
  return msgs
    .filter((m) => m.role === "assistant" && m.feedback && !m.isHidden)
    .map((m) => {
      const userMsg = msgs
        .slice(0, msgs.indexOf(m))
        .reverse()
        .find((msg) => msg.role === "user");
      return {
        user_input: userMsg ? userMsg.content : "",
        feedback: m.feedback!,
      };
    });
};

export const ChatInterface: React.FC<{
  provider: Provider;
  profile: UserProfile;
  conversationId: string;
  onLogout: () => void;
  onReturnToList: () => void;
}> = ({ provider, profile, conversationId, onLogout, onReturnToList }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [report, setReport] = useState<string | null>(null);
  const [isScenarioComplete, setIsScenarioComplete] = useState(false);
  const [isViewingReport, setIsViewingReport] = useState(false);
  const [conceptsToReview, setConceptsToReview] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handleAutoStartRef = useRef(false);

  const turnCount = messages.filter(
    (m) => m.role === "user" && !m.isHidden,
  ).length;

  useEffect(() => {
    const initOrLoad = async () => {
      let loadedConceptsToReview: string[] = [];

      try {
        const recentReports = await getRecentReports(3);
        const allConcepts = new Set<string>();

        recentReports.forEach((reportStr) => {
          try {
            const parsed = JSON.parse(reportStr);
            if (parsed && Array.isArray(parsed.concepts_to_review)) {
              parsed.concepts_to_review.forEach((c: string) =>
                allConcepts.add(c),
              );
            }
          } catch {
            // Ignore parse errors from LLM output
          }
        });
        loadedConceptsToReview = Array.from(allConcepts);
        setConceptsToReview(loadedConceptsToReview);
      } catch (err) {
        console.error("Failed to load recent reports for concepts", err);
      }

      if (conversationId) {
        const convo = await getConversation(conversationId);
        if (convo) {
          setMessages(convo.messages);
          // Check if the conversation was already completed
          const userTurns = convo.messages.filter(
            (m) => m.role === "user" && !m.isHidden,
          ).length;
          if (userTurns >= MAX_TURNS) {
            setIsScenarioComplete(true);
            if (convo.report) {
              setReport(convo.report);
            } else {
              // Regenerate report if needed
              const mistakeLog = buildMistakeLog(convo.messages);

              const systemInstruction = getReportPrompt(profile, mistakeLog);
              const finalReport = await generateReport(
                provider,
                systemInstruction,
              );
              setReport(finalReport);
              await saveConversationReport(conversationId, finalReport);
            }
          }
          return;
        }
      }
    };
    initOrLoad();
  }, [profile, provider, conversationId]);

  useEffect(() => {
    const handleAutoStart = async () => {
      const userMessage: Message = {
        role: "user",
        content:
          "Let's start the role-play scenario. Please initiate the conversation without responding to this message.",
        isHidden: true,
      };
      const newMessages = [userMessage];
      setMessages(newMessages);
      setIsLoading(true);

      try {
        const systemInstruction = getSystemPrompt(
          profile,
          [],
          conceptsToReview,
        );
        setMessages([...newMessages, { role: "assistant", content: "" }]);

        const { response, translation } = await generateChatResponse(
          provider,
          newMessages,
          systemInstruction,
        );

        const finalAssistantMessage: Message = {
          role: "assistant",
          content: response,
          translation: translation || undefined,
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
  }, [
    conversationId,
    messages.length,
    isLoading,
    profile,
    provider,
    isScenarioComplete,
    conceptsToReview,
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = async () => {
    await clearAllCredentials();
    onLogout();
  };

  const handleReturnToList = () => {
    onReturnToList();
  };

  const handleSubmit = async (inputStr: string) => {
    if (!inputStr.trim() || isLoading || isScenarioComplete) return;

    const userMessage: Message = { role: "user", content: inputStr };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build mistake log from previous messages
      const mistakeLog = buildMistakeLog(messages);

      const systemInstruction = getSystemPrompt(
        profile,
        mistakeLog,
        conceptsToReview,
      );

      // Append blank assistant message to trigger loading spinner in UI
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      const { response, feedback, translation } = await generateChatResponse(
        provider,
        newMessages,
        systemInstruction,
      );

      const finalAssistantMessage: Message = {
        role: "assistant",
        content: response,
        feedback,
        translation: translation || undefined,
      };
      const finalMessages = [...newMessages, finalAssistantMessage];

      setMessages(finalMessages);
      await saveConversation(conversationId, finalMessages);

      // Check if scenario is complete
      const updatedTurnCount = turnCount + 1;
      if (updatedTurnCount >= MAX_TURNS) {
        setIsScenarioComplete(true);
        // Generate final report
        const finalMistakeLog = buildMistakeLog(finalMessages);

        const reportSystemInstruction = getReportPrompt(
          profile,
          finalMistakeLog,
        );
        const finalReport = await generateReport(
          provider,
          reportSystemInstruction,
        );
        setReport(finalReport);
        await saveConversationReport(conversationId, finalReport);
      }
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
            onClick={handleReturnToList}
            className="logout-button"
            title="Return to Conversations"
            disabled={isLoading}
          >
            <RefreshCw size={18} />
            <span>Conversations</span>
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
        {report && isViewingReport ? (
          <Report report={report} onClose={() => setIsViewingReport(false)} />
        ) : messages.filter((m) => !m.isHidden).length === 0 && !isLoading ? (
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
              <MessageBubble
                key={idx}
                message={msg}
                isLoading={isLoading}
                isLastMessage={idx === arr.length - 1}
              />
            ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-footer glass-panel">
        {isScenarioComplete && !report ? (
          <div className="scenario-complete-message">
            <p>Scenario complete! Generating your report...</p>
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : report ? (
          <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
            <button
              onClick={() => setIsViewingReport(true)}
              className="view-report-button"
              style={{
                flex: 1,
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
              <FileText size={20} />
              View My Report
            </button>
            <button
              onClick={handleReturnToList}
              className="view-report-button"
              style={{
                flex: 1,
                padding: "1rem",
                background: "var(--bg-panel)",
                color: "var(--text-primary)",
                borderRadius: "4px",
                border: "1px solid var(--border-color)",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <RefreshCw size={20} />
              Conversations List
            </button>
          </div>
        ) : (
          <ChatInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            language={profile.language}
          />
        )}
      </footer>
    </div>
  );
};
