import { useState, useRef, useEffect } from 'react';
import './BrainDumpScreen.css';

interface BrainDumpScreenProps {
  onStartExploring: (dump: string) => void;
  initialText?: string;
}

export default function BrainDumpScreen({ onStartExploring, initialText = '' }: BrainDumpScreenProps) {
  const [brainDump, setBrainDump] = useState(initialText);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTouch, setIsTouch] = useState(false);

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
    const touchCapable = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setIsTouch(touchCapable);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrainDump(e.target.value);
    setError('');
  };

  const handleSubmit = () => {
    const trimmed = brainDump.trim();
    if (trimmed.length < 10) {
      setError('tell me more');
      return;
    }
    setError('');
    onStartExploring(trimmed);
  };

  return (
    <div className="brain-dump-screen-new" onClick={focusInput}>
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
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {brainDump.length === 0 && (
            <div className="type-to-begin">{isTouch ? 'tap to begin' : 'type to begin'}</div>
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
