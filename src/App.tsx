import { useState } from 'react';
import type { Session, Path, Answer } from './types';
import { upsertSession } from './utils/storage';
import BrainDumpScreen from './components/BrainDumpScreen';
import SequentialQuestionScreen from './components/SequentialQuestionScreen';
import InsightSummaryScreen from './components/InsightSummaryScreen';
import PastThreadsScreen from './components/PastThreadsScreen';
import ThreadViewScreen from './components/ThreadViewScreen';
import SettingsScreen from './components/SettingsScreen';
import './App.css';

type Screen = 'brainDump' | 'sequentialQuestions' | 'insight' | 'pastThreads' | 'threadView' | 'settings';

const defaultPath: Path = {
  id: 'exploration',
  label: 'Exploration',
  description: 'A thoughtful exploration of what\'s on your mind'
};

function App() {
  const [screen, setScreen] = useState<Screen>('brainDump');
  const [brainDump, setBrainDump] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isWelcomeFading, setIsWelcomeFading] = useState(false);

  const dismissWelcome = () => {
    setIsWelcomeFading(true);
    setTimeout(() => {
      setShowWelcome(false);
      setIsWelcomeFading(false);
    }, 400);
  };

  const handleStartExploring = (dump: string) => {
    setBrainDump(dump);
    setAnswers([]);
    setError(null);
    const session: Session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      brainDump: dump,
      selectedPath: defaultPath,
      answers: []
    };
    const updatedSession = { ...session, brainDump: dump, answers: [], timestamp: Date.now() };
    setCurrentSession(updatedSession);
    upsertSession(updatedSession);
    setScreen('sequentialQuestions');
  };

  const handleAnswerSubmitted = (questionId: string, questionText: string, answer: string) => {
    const newAnswer: Answer = {
      questionId,
      questionText,
      answer,
      layer: Math.floor(answers.length / 3) + 1 // Approximate layer based on question count
    };
    
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    const sessionToSave: Session = currentSession ?? {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      brainDump,
      selectedPath: defaultPath,
      answers: []
    };
    const updatedSession: Session = {
      ...sessionToSave,
      brainDump,
      answers: updatedAnswers,
      timestamp: Date.now()
    };
    setCurrentSession(updatedSession);
    upsertSession(updatedSession);
  };

  const handleQuestionsDone = async () => {
    if (answers.length === 0) {
      // Still allow saving even with no answers
      setBrainDump('');
      setScreen('brainDump');
      return;
    }
    
    setIsLoading(true);
    try {
      // Create a default path for the session
      const session: Session = currentSession ?? {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        brainDump,
        selectedPath: defaultPath,
        answers: []
      };
      
      // Save session without generating insights (per user's request - no advice/summaries unless asked)
      const finalizedSession: Session = {
        ...session,
        timestamp: Date.now(),
        brainDump,
        selectedPath: session.selectedPath ?? defaultPath,
        answers,
        summary: '', // Empty - no summary unless requested
        rootConcern: '' // Empty - no summary unless requested
      };
      
      setCurrentSession(finalizedSession);
      upsertSession(finalizedSession);
      setBrainDump('');
      setScreen('brainDump'); // Return to brain dump instead of insight screen
    } catch (err) {
      console.error('Error saving session:', err);
      setError('Failed to save session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleStartNew = () => {
    setScreen('brainDump');
    setBrainDump('');
    setAnswers([]);
    setCurrentSession(null);
    setError(null);
  };

  const handleTryDifferentPath = () => {
    // Restart questions with same brain dump
    setAnswers([]);
    setScreen('sequentialQuestions');
  };

  const handleCloseSettings = () => {
    setBrainDump('');
    setScreen('brainDump');
  };

  const handleViewThreads = () => {
    setScreen('pastThreads');
  };

  const handleViewThread = (session: Session) => {
    setViewingSession(session);
    setScreen('threadView');
  };

  const handleContinueThread = (session: Session) => {
    setBrainDump(session.brainDump);
    setAnswers(session.answers);
    setCurrentSession(session);
    setScreen('sequentialQuestions');
  };

  const handleGoBrainDump = () => {
    setBrainDump('');
    setScreen('brainDump');
  };

  return (
    <div className="app">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Thinking...</div>
        </div>
      )}
      
      {showWelcome && (
        <div
          className={`welcome-overlay ${isWelcomeFading ? 'fade-out' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Root"
        >
          <div className="welcome-dialog">
            <button
              className="welcome-close"
              onClick={dismissWelcome}
              aria-label="Close welcome message"
            >
              ×
            </button>
            <p className="welcome-greeting">hi! its nice to see you.</p>
            <p>
              root can help you dig deeper to help you uncover how you <em><strong>really feel</strong></em> one question at a time.
            </p>
            <p>
              if a question isn&apos;t quite right, hit the refresh button to create a new one </p>

            <p>
              you can visit your past threads by clicking the chat icon &amp; start fresh by going home
            </p>
            <p>enjoy :)</p>
            <button className="welcome-action" onClick={dismissWelcome}>
              start exploring
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {screen === 'settings' && (
        <SettingsScreen onClose={handleCloseSettings} />
      )}
      {screen === 'brainDump' && (
        <BrainDumpScreen 
          onStartExploring={handleStartExploring}
          initialText={brainDump}
          onViewThreads={handleViewThreads}
        />
      )}
      {screen === 'sequentialQuestions' && (
        <SequentialQuestionScreen 
          brainDump={brainDump}
          answers={answers}
          onAnswerSubmitted={handleAnswerSubmitted}
          onDone={handleQuestionsDone}
          onHome={handleGoBrainDump}
          onViewThreads={handleViewThreads}
        />
      )}
      {screen === 'pastThreads' && (
        <PastThreadsScreen
          onViewThread={handleViewThread}
          onHome={handleGoBrainDump}
        />
      )}
      {screen === 'threadView' && viewingSession && (
        <ThreadViewScreen
          session={viewingSession}
          onHome={handleGoBrainDump}
          onContinueThread={handleContinueThread}
        />
      )}
      {screen === 'insight' && currentSession && (
        <InsightSummaryScreen 
          session={currentSession}
          onStartNew={handleStartNew}
          onTryDifferentPath={handleTryDifferentPath}
        />
      )}
      <button className="app-version" onClick={() => setShowAbout(true)} aria-label="About Root">
        v5.7
      </button>
      {showAbout && (
        <div className="about-overlay" role="dialog" aria-modal="true" aria-label="About Root">
          <div className="about-dialog">
            <div className="about-header">
              <h2>About Root</h2>
              <button className="about-close" onClick={() => setShowAbout(false)} aria-label="Close about">×</button>
            </div>
            <p>Root helps you dig to the real reason you’re feeling the way you do.<br />There’s always something deeper…and Root helps you find it.</p>
            <p className="about-note">No user info is saved.</p>
            <p className="about-footer">Made by Parker.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
