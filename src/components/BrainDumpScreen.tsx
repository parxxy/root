import { useState, useRef, useEffect } from 'react';
import { getSessions } from '../utils/storage';
import './BrainDumpScreen.css';

interface BrainDumpScreenProps {
  onStartExploring: (dump: string) => void;
  initialText?: string;
  onViewThreads?: () => void;
}

export default function BrainDumpScreen({ onStartExploring, initialText = '', onViewThreads }: BrainDumpScreenProps) {
  const [brainDump, setBrainDump] = useState(initialText);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasSessions, setHasSessions] = useState(false);

  const focusInput = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    input.setSelectionRange(input.value.length, input.value.length);
  };

  // Focus input on mount so user can type immediately
  useEffect(() => {
    // Small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      focusInput();
    }, 50);
    return () => clearTimeout(timer);
  }, [initialText]);

  useEffect(() => {
    setHasSessions(getSessions().length > 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrainDump(e.target.value);
    setError('');
  };

  const handleSubmit = () => {
    const trimmed = brainDump.trim();
    if (trimmed.length < 10) {
      setError('Try writing at least a sentence or two so we have something to explore.');
      return;
    }
    setError('');
    onStartExploring(trimmed);
  };

  return (
    <div className="brain-dump-screen-new" onClick={focusInput}>
      {hasSessions && onViewThreads && (
        <button
          className="brain-chat-button"
          onClick={onViewThreads}
          title="past threads"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
      <div className="input-fade-container visible">
        <div className="textarea-wrapper">
          <input
            type="text"
            ref={inputRef}
            className="brain-dump-input-new"
            value={brainDump}
            onChange={handleChange}
            placeholder="what's going on?"
            autoFocus
            onKeyDown={(e) => {
              // Allow Enter to submit
              if (e.key === 'Enter' && brainDump.trim().length >= 10) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {brainDump.length === 0 && (
            <div className="type-to-begin">tap to begin</div>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        {brainDump.trim().length >= 10 && (
          <button 
            className="explore-button-new"
            onClick={handleSubmit}
          >
            continue
          </button>
        )}
      </div>
    </div>
  );
}
