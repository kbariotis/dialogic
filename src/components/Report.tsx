import React from "react";
import { FileText, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportProps {
  report: string;
  onClose?: () => void;
}

export const Report: React.FC<ReportProps> = ({ report, onClose }) => {
  return (
    <div
      className="report-panel glass-panel"
      style={{
        padding: "2rem",
        margin: "1rem",
        position: "relative",
        whiteSpace: "pre-wrap",
        lineHeight: "1.6",
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="logout-button"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            padding: "0.5rem",
          }}
          title="Close Report"
        >
          <X size={20} />
        </button>
      )}
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
    </div>
  );
};
