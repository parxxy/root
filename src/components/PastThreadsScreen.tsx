import type { Session } from '../types';
import { getSessions } from '../utils/storage';
import './PastThreadsScreen.css';

interface PastThreadsScreenProps {
  onViewThread: (session: Session) => void;
  onHome: () => void;
}

export default function PastThreadsScreen({ onViewThread, onHome }: PastThreadsScreenProps) {
  const sessions = getSessions();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const hour = date.getHours();
    const period = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${month} ${day}${getOrdinal(day)} ${hour12}${period}`;
  };

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="past-threads-screen">
      <div className="nav-icon-top">
        <button className="nav-icon" onClick={onHome} title="Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
      </div>
      
      <h1 className="past-threads-title">past threads</h1>
      
      <div className="threads-grid">
        {sessions.map((session) => {
          const preview = session.brainDump.length > 30 
            ? session.brainDump.substring(0, 30) + '...'
            : session.brainDump;
          
          return (
            <div
              key={session.id}
              className="thread-card"
              onClick={() => onViewThread(session)}
            >
              <div className="thread-date">{formatDate(session.timestamp)}</div>
              <div className="thread-preview">{preview}</div>
            </div>
          );
        })}
      </div>
      
      {sessions.length === 0 && (
        <p className="no-threads">no threads yet</p>
      )}
    </div>
  );
}
