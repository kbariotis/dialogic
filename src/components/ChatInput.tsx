import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
  language: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  isLoading,
  language,
}) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    onSubmit(input);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="chat-form">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`Type in ${language}...`}
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
  );
};
