import { useState, useEffect, useRef } from 'react';
import type { Answer } from '../types';
import { generateNextQuestion } from '../services/aiService';
import './SequentialQuestionScreen.css';

interface SequentialQuestionScreenProps {
  brainDump: string;
  answers: Answer[];
  onAnswerSubmitted: (questionId: string, questionText: string, answer: string) => void;
  onDone: () => void;
  onHome: () => void;
  onViewThreads: () => void;
}

export default function SequentialQuestionScreen({
  brainDump,
  answers,
  onAnswerSubmitted,
  onHome,
  onViewThreads
}: SequentialQuestionScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [rootMode, setRootMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusAnswerInput = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    input.setSelectionRange(input.value.length, input.value.length);
  };

  const loadNextQuestion = async (forceRootMode?: boolean) => {
    setIsLoading(true);
    try {
      const question = await generateNextQuestion(
        brainDump,
        answers,
        forceRootMode ?? rootMode
      );
      const trimmed = question.trim();
      setCurrentQuestion(trimmed.length > 0 ? trimmed : 'What would you like to explore deeper?');
    } catch (error) {
      console.error('Error loading question:', error);
      setCurrentQuestion('What would you like to explore deeper?');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNextQuestion();
  }, [answers.length]);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => focusAnswerInput(), 50);
    return () => clearTimeout(timer);
  }, [currentQuestion, isLoading]);

  useEffect(() => {
    const touchCapable = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setIsTouch(touchCapable);
  }, []);

  const handleRefresh = async () => {
    setAnswer('');
    setCurrentQuestion('');
    setIsLoading(true);
    // Reset scroll position
    if (inputRef.current) {
      inputRef.current.scrollLeft = 0;
    }
    await loadNextQuestion();
  };

  const handleRootHit = async () => {
    if (rootMode) return;
    setRootMode(true);
    await loadNextQuestion(true);
  };

  const handleSubmit = async () => {
    const effectiveQuestion = currentQuestion.trim() || 'What would you like to explore deeper?';
    if (!answer.trim() || !effectiveQuestion) return;
    
    setIsSubmitting(true);
    const questionId = `q_${Date.now()}`;
    
    onAnswerSubmitted(questionId, effectiveQuestion, answer.trim());
    
    setAnswer('');
    setIsSubmitting(false);
  };


  if (isLoading) {
    return (
      <div className="question-screen-new" onClick={focusAnswerInput}>
        <div className="nav-icons-top">
          <button className="nav-icon" onClick={onHome} title="Home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
          <button className="nav-icon" onClick={handleRefresh} title="New Question">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
          <button className="nav-icon" onClick={onViewThreads} title="Past Threads">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        </div>
        <div className="question-content-wrapper question-fade" key="loading">
          <div className="loading-question">thinking...</div>
        </div>
      </div>
    );
  }

  const questionText = currentQuestion.trim() || 'What would you like to explore deeper?';

  return (
    <div className="question-screen-new" onClick={focusAnswerInput}>
      <div className="nav-icons-top">
        <button className="nav-icon" onClick={onHome} title="Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
        <button className="nav-icon" onClick={handleRefresh} title="New Question">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
        <button className="nav-icon" onClick={onViewThreads} title="Past Threads">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
      
      <div className="question-content-wrapper question-fade" key={questionText}>
        <h2 className="question-text-new">{questionText}</h2>
        
        <div className="answer-section-new">
          <div className="answer-input-wrapper">
            <input
              type="text"
              ref={inputRef}
              className="answer-input-new"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                // Scroll to the end to show newest text
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.scrollLeft = inputRef.current.scrollWidth;
                  }
                }, 0);
              }}
              onKeyDown={(e) => {
                // Allow Enter to submit
                if (e.key === 'Enter' && answer.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={isTouch ? 'tap to reply' : 'type to reply'}
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          
          {answer.trim().length > 0 && (
            <button 
              className="continue-link-new"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              continue
            </button>
          )}
          
          {answers.length >= 3 && (
            <button
              type="button"
              className="root-mode-button"
              onClick={handleRootHit}
              disabled={rootMode}
              aria-pressed={rootMode}
            >
              {rootMode ? 'root mode active' : "i've hit a root"}
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
}
