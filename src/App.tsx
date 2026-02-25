import { useState, useEffect } from "react";
import {
  getActiveProvider,
  getProfile,
  type Provider,
  type UserProfile,
} from "./lib/db";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { ChatInterface } from "./components/ChatInterface";
import { ProfileModal } from "./components/ProfileModal";

function App() {
  const [isChecking, setIsChecking] = useState(true);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const checkState = async () => {
      const provider = await getActiveProvider();
      const userProfile = await getProfile();
      setActiveProvider(provider || null);
      setProfile(userProfile || null);
      setIsChecking(false);
    };
    checkState();
  }, []);

  if (isChecking) {
    return (
      <div className="app-container">
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {!activeProvider ? (
        <ApiKeyModal onValidKey={(provider) => setActiveProvider(provider)} />
      ) : !profile ? (
        <ProfileModal onProfileSaved={(p) => setProfile(p)} />
      ) : (
        <ChatInterface
          provider={activeProvider}
          profile={profile}
          onLogout={() => setActiveProvider(null)}
        />
      )}
    </div>
  );
}

export default App;
