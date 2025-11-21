import type { Session } from '../types';
import './InsightSummaryScreen.css';

interface InsightSummaryScreenProps {
  session: Session;
  onStartNew: () => void;
  onTryDifferentPath: () => void;
}

export default function InsightSummaryScreen({
  session,
  onStartNew,
  onTryDifferentPath
}: InsightSummaryScreenProps) {
  // Note: Session saving is handled in App.tsx, so we don't need to save here

  const groupAnswersByLayer = () => {
    const grouped: { [key: number]: typeof session.answers } = {};
    session.answers.forEach(answer => {
      if (!grouped[answer.layer]) {
        grouped[answer.layer] = [];
      }
      grouped[answer.layer].push(answer);
    });
    return grouped;
  };

  const groupedAnswers = groupAnswersByLayer();

  return (
    <div className="insight-screen">
      <div className="insight-container">
        <h1 className="insight-title">Your Exploration</h1>
        
        <div className="insight-section">
          <h2 className="section-label">Path</h2>
          <div className="path-badge">
            {session.selectedPath.label}
          </div>
        </div>

        {session.summary && (
          <div className="insight-section">
            <h2 className="section-label">Summary</h2>
            <p className="summary-text">{session.summary}</p>
          </div>
        )}

        {session.rootConcern && (
          <div className="insight-section">
            <h2 className="section-label">Possible Root Concern</h2>
            <p className="root-concern-text">{session.rootConcern}</p>
          </div>
        )}

        {session.answers && session.answers.length > 0 && (
          <div className="insight-section">
            <h2 className="section-label">Your Journey</h2>
            <div className="timeline">
              {Object.keys(groupedAnswers)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(layerNum => {
                  const layer = parseInt(layerNum);
                  return (
                    <div key={layer} className="timeline-layer">
                      <h3 className="layer-title">Layer {layer}</h3>
                      {groupedAnswers[layer].map((answer) => (
                        <div key={answer.questionId} className="timeline-item">
                          <p className="question-timeline">{answer.questionText}</p>
                          <p className="answer-timeline">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div className="follow-up-actions">
          <button className="action-button secondary" onClick={onStartNew}>
            Start a New Thread
          </button>
          <button className="action-button secondary" onClick={onTryDifferentPath}>
            Try a Different Path
          </button>
        </div>
      </div>
    </div>
  );
}

