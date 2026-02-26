import React from "react";
import { FileText, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportProps {
  report: string;
  onRestart: () => void;
}

export const Report: React.FC<ReportProps> = ({ report, onRestart }) => {
  return (
    <div
      className="report-panel glass-panel"
      style={{
        padding: "2rem",
        margin: "1rem",
        whiteSpace: "pre-wrap",
        lineHeight: "1.6",
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      <h2
        style={{
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--accent-color)",
        }}
      >
        <FileText size={24} /> Concepts to Review
      </h2>
      <div style={{ fontSize: "1rem" }} className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
      </div>
      <button
        onClick={onRestart}
        className="logout-button"
        style={{
          marginTop: "2rem",
          width: "100%",
          justifyContent: "center",
          padding: "1rem",
          background: "var(--accent-color)",
          color: "white",
        }}
      >
        <RefreshCw size={18} />
        <span>Start New Scenario</span>
      </button>
    </div>
  );
};
