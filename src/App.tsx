import { useState } from 'react';
import type { Session, Path, Answer } from './types';
import { saveSession } from './utils/storage';
import { hasApiKey } from './services/aiService';
import BrainDumpScreen from './components/BrainDumpScreen';
import SequentialQuestionScreen from './components/SequentialQuestionScreen';
import InsightSummaryScreen from './components/InsightSummaryScreen';
import HomeScreen from './components/HomeScreen';
import PastThreadsScreen from './components/PastThreadsScreen';
import ThreadViewScreen from './components/ThreadViewScreen';
import SettingsScreen from './components/SettingsScreen';
import './App.css';

type Screen = 'home' | 'brainDump' | 'sequentialQuestions' | 'insight' | 'pastThreads' | 'threadView' | 'settings';

function App() {
  const [screen, setScreen] = useState<Screen>('brainDump');
  const [brainDump, setBrainDump] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingAI, setUsingAI] = useState(hasApiKey());

  const handleStartExploring = (dump: string) => {
    setBrainDump(dump);
    setAnswers([]);
    setError(null);
    setScreen('sequentialQuestions');
  };

  const handleAnswerSubmitted = (questionId: string, questionText: string, answer: string) => {
    const newAnswer: Answer = {
      questionId,
      questionText,
      answer,
      layer: Math.floor(answers.length / 3) + 1 // Approximate layer based on question count
    };
    
    setAnswers([...answers, newAnswer]);
  };

  const handleQuestionsDone = async () => {
    if (answers.length === 0) {
      // Still allow saving even with no answers
      setBrainDump('');
      setScreen('home');
      return;
    }
    
    setIsLoading(true);
    try {
      // Create a default path for the session
      const defaultPath: Path = {
        id: 'exploration',
        label: 'Exploration',
        description: 'A thoughtful exploration of what\'s on your mind'
      };
      
      // Save session without generating insights (per user's request - no advice/summaries unless asked)
      const session: Session = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        brainDump,
        selectedPath: defaultPath,
        answers,
        summary: '', // Empty - no summary unless requested
        rootConcern: '' // Empty - no summary unless requested
      };
      
      setCurrentSession(session);
      saveSession(session);
      setBrainDump('');
      setScreen('home'); // Go back to home instead of insight screen
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

  const handleViewSession = async (session: Session): Promise<void> => {
    // View thread instead of insight screen (no summaries unless requested)
    setViewingSession(session);
    setScreen('threadView');
  };
  
  const handleTryDifferentPath = () => {
    // Restart questions with same brain dump
    setAnswers([]);
    setScreen('sequentialQuestions');
  };

  const handleOpenSettings = () => {
    setScreen('settings');
  };

  const handleCloseSettings = () => {
    setBrainDump('');
    setScreen('home');
    setUsingAI(hasApiKey()); // Update AI status after settings change
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
      
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {screen === 'home' && (
        <HomeScreen 
          onStartNew={handleStartNew}
          onViewSession={handleViewSession}
          onOpenSettings={handleOpenSettings}
          onViewThreads={handleViewThreads}
          usingAI={usingAI}
        />
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
    </div>
  );
}

export default App;
