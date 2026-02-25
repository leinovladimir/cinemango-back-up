const BASE = '/api';

export async function fetchWorks() {
  const res = await fetch(`${BASE}/works`);
  if (!res.ok) throw new Error('Failed to fetch works');
  return res.json();
}

export async function startBackup() {
  const res = await fetch(`${BASE}/backup/start`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to start backup');
  }
  return res.json();
}

export function subscribeToProgress(onEvent) {
  const es = new EventSource(`${BASE}/backup/progress`);
  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    onEvent(event);
  };
  es.onerror = () => es.close();
  return () => es.close();
}
