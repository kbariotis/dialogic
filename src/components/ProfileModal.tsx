import { useState } from "react";
import { saveProfile, type UserProfile } from "../lib/db";
import { UserCircle } from "lucide-react";

interface Props {
  onProfileSaved: (profile: UserProfile) => void;
}

export const ProfileModal: React.FC<Props> = ({ onProfileSaved }) => {
  const [language, setLanguage] = useState("");
  const [baseLanguage, setBaseLanguage] = useState("English");
  const [level, setLevel] = useState("");
  const [interests, setInterests] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !language.trim() ||
      !baseLanguage.trim() ||
      !level.trim() ||
      !interests.trim()
    )
      return;

    const profile: UserProfile = {
      language: language.trim(),
      baseLanguage: baseLanguage.trim(),
      level: level.trim(),
      interests: interests.trim(),
    };

    await saveProfile(profile);
    onProfileSaved(profile);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: "500px" }}>
        <div className="modal-header">
          <UserCircle className="modal-icon" size={24} />
          <h2>Setup Your Profile</h2>
        </div>
        <p className="modal-description" style={{ marginBottom: "1.5rem" }}>
          Tell us a bit about yourself to personalize your language learning
          experience.
        </p>

        <form onSubmit={handleSubmit} className="modal-form">
          <label style={labelStyle}>
            What language are you trying to learn?
          </label>
          <input
            type="text"
            placeholder="e.g., Spanish, Japanese, French"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="modal-input"
            required
          />

          <label style={labelStyle}>What is your base language?</label>
          <input
            type="text"
            placeholder="e.g., English, Spanish, German"
            value={baseLanguage}
            onChange={(e) => setBaseLanguage(e.target.value)}
            className="modal-input"
            required
          />

          <label style={labelStyle}>What is your current level?</label>
          <input
            type="text"
            placeholder="e.g., Beginner, A2, B1, Advanced"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="modal-input"
            required
          />

          <label style={labelStyle}>What are a few interests of yours?</label>
          <input
            type="text"
            placeholder="e.g., travel, technology, cooking"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="modal-input"
            required
          />

          <button
            type="submit"
            disabled={
              !language.trim() ||
              !baseLanguage.trim() ||
              !level.trim() ||
              !interests.trim()
            }
            className="modal-submit"
            style={{ marginTop: "1rem" }}
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  textAlign: "left" as const,
  fontSize: "0.9rem",
  color: "var(--text-secondary)",
  marginBottom: "-0.5rem",
  marginLeft: "2px",
};
