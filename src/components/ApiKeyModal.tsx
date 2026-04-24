import { useState, useEffect, useCallback } from "react";
import {
  setProviderKey,
  setActiveProvider,
  getProviderKey,
  setProviderModel,
  getProviderModel,
  type Provider,
} from "../lib/db";
import { validateProviderKey, fetchOllamaModels } from "../lib/ai";
import { KeyRound, Server, Loader2, RefreshCw, Check } from "lucide-react";

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

  // Ollama specific state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const activeProvider = PROVIDERS.find((p) => p.id === provider)!;

  const loadStoredConfig = useCallback(async (targetProvider: Provider) => {
    const key = await getProviderKey(targetProvider);
    if (key) setKeyValue(key);
    else setKeyValue("");

    if (targetProvider === "ollama") {
      const url = key || "http://localhost:11434";
      await handleConnectOllama(url);
    }
  }, []);

  useEffect(() => {
    loadStoredConfig(provider);
  }, [provider, loadStoredConfig]);

  const handleConnectOllama = async (url: string) => {
    setIsConnecting(true);
    setError("");
    try {
      const models = await fetchOllamaModels(url);
      setAvailableModels(models);
      if (models.length > 0) {
        const storedModel = await getProviderModel("ollama");
        if (storedModel && models.includes(storedModel)) {
          setSelectedModel(storedModel);
        } else {
          setSelectedModel(models[0]);
        }
      } else {
        setError("No models found on this Ollama instance.");
      }
    } catch (err) {
      setError("Could not connect to Ollama. Ensure it is running.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue.trim() && !activeProvider.isLocal) return;

    setLoading(true);
    setError("");

    const finalKey =
      activeProvider.isLocal && !keyValue.trim()
        ? "http://localhost:11434"
        : keyValue;

    const isValid = await validateProviderKey(provider, finalKey);

    if (isValid) {
      await setProviderKey(provider, finalKey);
      if (provider === "ollama" && selectedModel) {
        await setProviderModel("ollama", selectedModel);
      }
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              textAlign: "left",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                {activeProvider.isLocal
                  ? "Ollama Host URL"
                  : `${activeProvider.name} API Key`}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={activeProvider.isLocal ? "url" : "password"}
                  placeholder={activeProvider.placeholder}
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  disabled={loading}
                  className="modal-input"
                  style={{ width: "100%", paddingRight: activeProvider.isLocal ? "40px" : "12px" }}
                  autoComplete="off"
                  spellCheck="false"
                />
                {activeProvider.isLocal && (
                  <button
                    type="button"
                    onClick={() => handleConnectOllama(keyValue || "http://localhost:11434")}
                    disabled={isConnecting}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Refresh models"
                  >
                    {isConnecting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>

            {activeProvider.id === "ollama" && availableModels.length > 0 && (
              <div>
                <label
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Select Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="modal-input"
                  style={{ width: "100%", appearance: "none", cursor: "pointer" }}
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && <div className="modal-error">{error}</div>}
          
          <button
            type="submit"
            disabled={loading || isConnecting || (!keyValue.trim() && !activeProvider.isLocal)}
            className="modal-submit"
            style={{ marginTop: "1rem" }}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : activeProvider.isLocal ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                <Check size={18} /> Confirm Configuration
              </span>
            ) : (
              "Save Key"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
