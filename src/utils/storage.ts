import type { Session } from '../types';

const STORAGE_KEY = 'layers_sessions';

export function saveSession(session: Session): void {
  const sessions = getSessions();
  sessions.unshift(session); // Add to beginning
  // Keep only last 50 sessions
  const limited = sessions.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
}

export function getSessions(): Session[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading sessions from localStorage:', error);
    return [];
  }
}

export function getSession(id: string): Session | null {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
}

export function deleteSession(id: string): void {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function upsertSession(session: Session): void {
  const sessions = getSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  if (existingIndex >= 0) {
    sessions.splice(existingIndex, 1);
  }
  sessions.unshift(session);
  const limited = sessions.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
}
