import { useEffect, useState } from 'react';
import './HomeScreen.css';
import { getSessions } from '../utils/storage';

interface HomeScreenProps {
  onStartNew: () => void;
  onViewSession?: (session: any) => void | Promise<void>;
  onOpenSettings?: () => void;
  onViewThreads?: () => void;
  usingAI?: boolean;
}

export default function HomeScreen({ onStartNew, onViewThreads }: HomeScreenProps) {
  const [hasSessions, setHasSessions] = useState(false);

  useEffect(() => {
    setHasSessions(getSessions().length > 0);
  }, []);

  return (
    <div className="home-screen-new">
      {hasSessions && onViewThreads && (
        <button
          className="home-chat-button"
          onClick={onViewThreads}
          title="past threads"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
      <div className="orb-container">
        <div className="orb" onClick={onStartNew}></div>
        <p className="tap-to-begin">tap to begin</p>
      </div>
    </div>
  );
}
