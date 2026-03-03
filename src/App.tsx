import { useState, useEffect } from "react";
import {
  getActiveProvider,
  getProfile,
  type Provider,
  type UserProfile,
} from "./lib/db";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { ChatInterface } from "./components/ChatInterface";
import { ConversationList } from "./components/ConversationList";
import { ProfileModal } from "./components/ProfileModal";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [isChecking, setIsChecking] = useState(true);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >(undefined);

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
      ) : activeConversationId === undefined ? (
        <ConversationList
          provider={activeProvider}
          profile={profile}
          onLogout={() => setActiveProvider(null)}
          onSelectConversation={(id) => {
            if (id) {
              setActiveConversationId(id);
            } else {
              setActiveConversationId(uuidv4());
            }
          }}
        />
      ) : (
        <ChatInterface
          provider={activeProvider}
          profile={profile}
          conversationId={activeConversationId}
          onLogout={() => setActiveProvider(null)}
          onReturnToList={() => setActiveConversationId(undefined)}
        />
      )}
    </div>
  );
}

export default App;
