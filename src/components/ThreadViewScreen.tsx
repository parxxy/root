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
        <button className="nav-icon" onClick={onHome} title="Home">●</button>
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

