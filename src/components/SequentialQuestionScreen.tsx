import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Answer } from '../types';
import { generateNextQuestion } from '../services/aiService';
import './SequentialQuestionScreen.css';

const catImages = Object.values(
  import.meta.glob('../assets/cats/*.{png,jpg,jpeg,gif}', {
    eager: true,
    import: 'default'
  })
) as string[];

const regenIcon = new URL('../assets/free-refresh-icon-3104-thumb.png', import.meta.url).href;

const OLIVIA_TRIGGER = /i\s+am\s+olivia/i;

type CatDrop = {
  id: number;
  x: number;
  size: number;
  duration: number;
  spinDirection: 1 | -1;
  src: string;
};

interface SequentialQuestionScreenProps {
  brainDump: string;
  answers: Answer[];
  onAnswerSubmitted: (questionId: string, questionText: string, answer: string) => void;
  onDone: () => void;
}

export default function SequentialQuestionScreen({
  brainDump,
  answers,
  onAnswerSubmitted,
  onDone
}: SequentialQuestionScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [rootMode, setRootMode] = useState(false);
  const [catDrops, setCatDrops] = useState<CatDrop[]>([]);
  const [previousQuestionText, setPreviousQuestionText] = useState('');
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

  const loadNextQuestion = async (forceRootMode?: boolean, redirectFromRoot?: boolean) => {
    setIsLoading(true);
    try {
      if (currentQuestion) {
        setPreviousQuestionText(currentQuestion);
      }
      const question = await generateNextQuestion(
        brainDump,
        answers,
        forceRootMode ?? rootMode,
        redirectFromRoot
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

  const isOlivia = OLIVIA_TRIGGER.test(brainDump) || answers.some(a => OLIVIA_TRIGGER.test(a.answer));

  useEffect(() => {
    if (!isOlivia || catImages.length === 0) {
      setCatDrops([]);
      return;
    }

    const spawnCat = () => {
      const src = catImages[Math.floor(Math.random() * catImages.length)];
      const id = Date.now() + Math.random();
      const duration = 5500 + Math.random() * 2500;
      const drop: CatDrop = {
        id,
        x: Math.random() * 100,
        size: 60 + Math.random() * 80,
        duration,
        spinDirection: Math.random() > 0.5 ? 1 : -1,
        src
      };
      setCatDrops(prev => [...prev, drop]);
      setTimeout(() => {
        setCatDrops(prev => prev.filter(c => c.id !== id));
      }, duration + 400);
    };

    const interval = setInterval(spawnCat, 650);
    // Kick off a few instantly
    for (let i = 0; i < 4; i += 1) spawnCat();

    return () => {
      clearInterval(interval);
      setCatDrops([]);
    };
  }, [isOlivia]);

  // Olivia mode disables root-mode UX entirely
  useEffect(() => {
    if (isOlivia) {
      setRootMode(false);
    }
  }, [isOlivia]);

  const handleRefresh = async () => {
    setPreviousQuestionText(currentQuestion || previousQuestionText);
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
    if (!rootMode) {
      setRootMode(true);
      await loadNextQuestion(true);
    } else {
      setRootMode(false);
      await loadNextQuestion(false, true);
    }
  };

  const handlePastQuestion = () => {
    if (!previousQuestionText) return;
    setCurrentQuestion(previousQuestionText);
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

  const catRain = isOlivia ? (
    <div className="cat-rain-layer" aria-hidden>
      {catDrops.map(cat => (
        <img
          key={cat.id}
          src={cat.src}
          className="cat-rain"
          style={{
            left: `${cat.x}%`,
            width: `${cat.size}px`,
            '--fall-duration': `${cat.duration}ms`,
            '--spin-direction': cat.spinDirection
          } as CSSProperties}
          alt=""
        />
      ))}
    </div>
  ) : null;


  if (isLoading) {
    return (
      <div className="question-screen-new" onClick={focusAnswerInput}>
        {catRain}
        <div className="question-content-wrapper question-fade" key="loading">
          <div className="loading-question">thinking...</div>
        </div>
      </div>
    );
  }

  const questionText = currentQuestion.trim() || 'What would you like to explore deeper?';

  return (
    <div className="question-screen-new" onClick={focusAnswerInput}>
      {catRain}
      <div className="question-content-wrapper question-fade" key={questionText}>
        <div className="question-actions-row">
          <button
            className="question-action-circle"
            onClick={handlePastQuestion}
            disabled={!previousQuestionText}
            aria-label="Past question"
          >
            <span className="question-action-icon">←</span>
          </button>
          <h2 className="question-text-new">{questionText}</h2>
          <button
            className="question-action-circle"
            onClick={handleRefresh}
            aria-label="Regenerate question"
          >
            <img src={regenIcon} className="question-action-img mirror" alt="" />
          </button>
        </div>
        
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
          
          <div className="root-done-row">
            {!isOlivia && (
              <button
                type="button"
                className="root-mode-button"
                onClick={handleRootHit}
                aria-pressed={rootMode}
              >
                {rootMode ? (
                <span className="root-mode-label-large">explore something else</span>
              ) : (
                "i've hit a root"
              )}
              </button>
            )}
            <button
              type="button"
              className="done-button-wide"
              onClick={onDone}
            >
              im done
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
