import { useEffect, useState } from 'react';
import type { Session, Path } from '../types';
import { getSessions, upsertSession } from '../utils/storage';
import { generateChatTitle } from '../services/aiService';
import './PastThreadsScreen.css';

interface PastThreadsScreenProps {
  onViewThread: (session: Session) => void;
  onHome: () => void;
}

export default function PastThreadsScreen({ onViewThread, onHome }: PastThreadsScreenProps) {
  const [sessions, setSessions] = useState<Session[]>(() => getSessions());

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

  useEffect(() => {
    let cancelled = false;
    const ensureSummaries = async () => {
      const updated = [...sessions];
      let changed = false;
      for (let i = 0; i < updated.length; i++) {
        const session = updated[i];
        if (!session.summary || session.summary.trim().length === 0) {
          const fallbackPath: Path = session.selectedPath ?? {
            id: 'exploration',
            label: 'Exploration',
            description: 'A thoughtful exploration of what\'s on your mind'
          };
          try {
            const title = await generateChatTitle(session.brainDump, fallbackPath, session.answers ?? []);
            const enriched: Session = {
              ...session,
              summary: title,
            };
            updated[i] = enriched;
            upsertSession(enriched);
            changed = true;
          } catch (err) {
            console.error('Failed to summarize session', session.id, err);
          }
        }
      }
      if (!cancelled && changed) {
        setSessions(updated);
      }
    };
    ensureSummaries();
    return () => {
      cancelled = true;
    };
  }, []); // run once per mount to enrich stored sessions

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
          const previewSource = (session.summary && session.summary.trim()) 
            ? session.summary.trim()
            : session.brainDump;
          const previewWords = previewSource.split(/\s+/).slice(0, 3).join(' ');
          const preview = previewWords || 'recent thread';
          
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
