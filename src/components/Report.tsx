import React from "react";
import { FileText, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportProps {
  report: string;
  onClose?: () => void;
}

export const Report: React.FC<ReportProps> = ({ report, onClose }) => {
  let parsedReport: {
    human_summary: string;
    concepts_to_review: string[];
  };
  try {
    parsedReport = JSON.parse(report);
  } catch {
    parsedReport = {
      human_summary: "Error: Could not parse generated report.",
      concepts_to_review: [],
    };
  }

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
        <FileText size={24} /> Performance Report
      </h2>

      <div style={{ fontSize: "1rem" }} className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {parsedReport.human_summary || ""}
        </ReactMarkdown>
      </div>

      {parsedReport.concepts_to_review &&
        parsedReport.concepts_to_review.length > 0 && (
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <h3
              style={{
                color: "var(--text-secondary)",
                marginBottom: "0.5rem",
                fontSize: "1.1rem",
              }}
            >
              Targeted Concepts for Next Session
            </h3>
            <ul
              style={{
                paddingLeft: "1.5rem",
                color: "var(--text-primary)",
              }}
            >
              {parsedReport.concepts_to_review.map((concept, idx) => (
                <li key={idx} style={{ marginBottom: "0.5rem" }}>
                  {concept}
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
};
