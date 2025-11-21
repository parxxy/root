import { useState, useEffect } from 'react';
import type { Path, Answer, Question } from '../types';
import { getQuestionsForPath } from '../utils/questions';
import { hasApiKey, generateQuestions as aiGenerateQuestions } from '../services/aiService';
import './LayerQuestionScreen.css';

interface LayerQuestionScreenProps {
  path: Path;
  currentLayer: number;
  answers: Answer[];
  questionsShown: Set<string>;
  brainDump: string;
  onAnswerSubmitted: (questionId: string, questionText: string, answer: string) => void;
  onDoneForNow: () => void | Promise<void>;
  usingAI: boolean;
}

export default function LayerQuestionScreen({
  path,
  currentLayer,
  answers,
  questionsShown,
  brainDump,
  onAnswerSubmitted,
  onDoneForNow,
  usingAI
}: LayerQuestionScreenProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [dynamicQuestions, setDynamicQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  // Load questions when layer changes or path changes
  useEffect(() => {
    const loadQuestions = async () => {
      if (hasApiKey() && usingAI) {
        setIsLoadingQuestions(true);
        try {
          const previousAnswersInLayer = answers.filter(a => a.layer < currentLayer);
          const questions = await aiGenerateQuestions(brainDump, path, currentLayer, previousAnswersInLayer);
          setDynamicQuestions(questions);
        } catch (err) {
          console.error('Error loading AI questions:', err);
          // Fallback to static questions
          const questions = getQuestionsForPath(path.id, currentLayer);
          setDynamicQuestions(questions);
        } finally {
          setIsLoadingQuestions(false);
        }
      } else {
        const questions = getQuestionsForPath(path.id, currentLayer);
        setDynamicQuestions(questions);
      }
    };
    
    loadQuestions();
  }, [path.id, currentLayer, brainDump, usingAI, answers]);
  
  const unansweredQuestions = dynamicQuestions.filter(q => !questionsShown.has(q.id));
  const currentQuestions = unansweredQuestions.slice(0, 3); // Show 2-4 questions
  
  const answeredInThisLayer = answers.filter(a => a.layer === currentLayer).length;

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestion(questionId);
    setAnswerText('');
  };

  const handleAnswerSubmit = () => {
    if (!selectedQuestion || !answerText.trim()) return;
    
    const question = currentQuestions.find(q => q.id === selectedQuestion);
    if (!question) return;

    onAnswerSubmitted(question.id, question.text, answerText.trim());
    setSelectedQuestion(null);
    setAnswerText('');
  };

  const handleCancel = () => {
    setSelectedQuestion(null);
    setAnswerText('');
  };

  if (selectedQuestion) {
    const question = currentQuestions.find(q => q.id === selectedQuestion);
    
    return (
      <div className="layer-question-screen">
        <div className="answer-input-container">
          <h2 className="layer-number">Layer {currentLayer}</h2>
          <p className="question-text">{question?.text}</p>
          
          <textarea
            className="answer-input"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Write your answer here..."
            rows={8}
            autoFocus
          />

          <div className="answer-actions">
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
            <button 
              className="submit-answer-button"
              onClick={handleAnswerSubmit}
              disabled={!answerText.trim()}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const layerHeaders = [
    'Let\'s start by going a bit deeper...',
    'Now let\'s explore what\'s underneath that...',
    'One more layer—what\'s at the core?'
  ];

  if (isLoadingQuestions) {
    return (
      <div className="layer-question-screen">
        <div className="layer-question-container">
          <div className="loading-message">Generating thoughtful questions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="layer-question-screen">
      <div className="layer-question-container">
        <h1 className="layer-header">{layerHeaders[currentLayer - 1] || 'Let\'s go deeper...'}</h1>
        <p className="layer-path-name">Exploring: {path.label}</p>
        
        {currentQuestions.length === 0 ? (
          <div className="no-questions-message">
            No more questions for this layer. Click "I'm done for now" to see your insights.
          </div>
        ) : (
          <div className="questions-grid">
            {currentQuestions.map((question) => (
              <div
                key={question.id}
                className="question-card"
                onClick={() => handleQuestionSelect(question.id)}
              >
                <p className="question-card-text">{question.text}</p>
              </div>
            ))}
          </div>
        )}

        {(answeredInThisLayer > 0 || currentLayer > 1) && (
          <button className="done-button" onClick={onDoneForNow}>
            I'm done for now
          </button>
        )}
      </div>
    </div>
  );
}

