import type { Session } from '../types';
import './ThreadViewScreen.css';

interface ThreadViewScreenProps {
  session: Session;
  onHome: () => void;
  onContinueThread: (session: Session) => void;
}

export default function ThreadViewScreen({ session, onHome, onContinueThread }: ThreadViewScreenProps) {
  return (
    <div className="thread-view-screen">
      <div className="nav-icon-top">
        <button className="nav-icon" onClick={onHome} title="Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
      </div>
      
      <div className="thread-conversation">
        {/* Brain dump at start */}
        <div className="conversation-item">
          <div className="conversation-line"></div>
          <div className="conversation-content">
            <p className="brain-dump-text">{session.brainDump}</p>
          </div>
        </div>
        
        {/* Q&A pairs */}
        {session.answers.map((answer) => (
          <div key={answer.questionId}>
            <div className="conversation-item">
              <div className="conversation-line"></div>
              <div className="conversation-content">
                <p className="question-text-thread">{answer.questionText}</p>
              </div>
            </div>
            
            <div className="conversation-item">
              <div className="conversation-line"></div>
              <div className="conversation-content">
                <p className="answer-text-thread">{answer.answer}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Continue thread button */}
        <div className="conversation-item">
          <div className="conversation-line-last"></div>
          <button 
            className="continue-thread-button"
            onClick={() => onContinueThread(session)}
          >
            continue thread
          </button>
        </div>
      </div>
    </div>
  );
}
