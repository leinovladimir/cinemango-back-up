const BASE = '/api';

function getPassword() {
  return sessionStorage.getItem('password') || '';
}

function authHeaders() {
  return { 'x-password': getPassword() };
}

export async function fetchWorks() {
  const res = await fetch(`${BASE}/works`, { headers: authHeaders() });
  if (res.status === 401) throw new Error('401');
  if (!res.ok) throw new Error('Failed to fetch works');
  return res.json();
}

export async function startBackup() {
  const res = await fetch(`${BASE}/backup/start`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('401');
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to start backup');
  }
  return res.json();
}

export function subscribeToProgress(onEvent) {
  const es = new EventSource(`${BASE}/backup/progress?password=${encodeURIComponent(getPassword())}`);
  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    onEvent(event);
  };
  es.onerror = () => es.close();
  return () => es.close();
}

export function downloadUrl() {
  return `${BASE}/backup/download?password=${encodeURIComponent(getPassword())}`;
}
