import { useState } from "react";
import { setProviderKey, setActiveProvider, type Provider } from "../lib/db";
import { validateProviderKey } from "../lib/ai";
import { KeyRound, Server, Loader2 } from "lucide-react";

interface Props {
  onValidKey: (provider: Provider) => void;
}

const PROVIDERS: {
  id: Provider;
  name: string;
  placeholder: string;
  isLocal?: boolean;
}[] = [
  { id: "openai", name: "OpenAI", placeholder: "sk-proj-..." },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-..." },
  { id: "gemini", name: "Gemini", placeholder: "AIza..." },
  {
    id: "ollama",
    name: "Ollama",
    placeholder: "http://localhost:11434",
    isLocal: true,
  },
];

export const ApiKeyModal: React.FC<Props> = ({ onValidKey }) => {
  const [provider, setProvider] = useState<Provider>("openai");
  const [keyValue, setKeyValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeProvider = PROVIDERS.find((p) => p.id === provider)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue.trim() && !activeProvider.isLocal) return;

    setLoading(true);
    setError("");

    // Use default localhost if empty for ollama
    const finalKey =
      activeProvider.isLocal && !keyValue.trim()
        ? "http://localhost:11434"
        : keyValue;

    const isValid = await validateProviderKey(provider, finalKey);

    if (isValid) {
      await setProviderKey(provider, finalKey);
      await setActiveProvider(provider);
      onValidKey(provider);
    } else {
      setError(
        `Failed to connect to ${activeProvider.name}. Please check your configuration.`,
      );
    }

    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          {activeProvider.isLocal ? (
            <Server className="modal-icon" size={24} />
          ) : (
            <KeyRound className="modal-icon" size={24} />
          )}
          <h2>Select Provider Engine</h2>
        </div>
        <p className="modal-description" style={{ marginBottom: "1.5rem" }}>
          Choose your LLM provider. API keys are <strong>never</strong> sent to
          our servers. They are stored securely in your browser's IndexedDB.
        </p>

        <div
          className="provider-tabs"
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            background: "rgba(0,0,0,0.2)",
            padding: "0.5rem",
            borderRadius: "10px",
          }}
        >
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProvider(p.id);
                setKeyValue("");
                setError("");
              }}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "6px",
                border: "none",
                background:
                  provider === p.id ? "var(--accent-color)" : "transparent",
                color: provider === p.id ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: provider === p.id ? 600 : 400,
                transition: "all 0.2s",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label
            style={{
              textAlign: "left",
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              marginBottom: "-0.5rem",
              marginLeft: "2px",
            }}
          >
            {activeProvider.isLocal
              ? "Ollama Host URL (e.g. http://localhost:11434)"
              : `${activeProvider.name} API Key`}
          </label>
          <input
            type={activeProvider.isLocal ? "url" : "password"}
            placeholder={activeProvider.placeholder}
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            disabled={loading}
            className="modal-input"
            autoComplete="off"
            spellCheck="false"
          />
          {error && <div className="modal-error">{error}</div>}
          <button
            type="submit"
            disabled={loading || (!keyValue.trim() && !activeProvider.isLocal)}
            className="modal-submit"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : activeProvider.isLocal ? (
              "Connect to Localhost"
            ) : (
              "Save Key"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
