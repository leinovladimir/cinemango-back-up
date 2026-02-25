import { useEffect, useRef, useState } from 'react';
import { fetchWorks, startBackup, subscribeToProgress, downloadUrl } from './api.js';
import GalleryList from './components/GalleryList.jsx';
import BackupProgress from './components/BackupProgress.jsx';
import LoginForm from './components/LoginForm.jsx';

export default function App() {
  const [authenticated, setAuthenticated] = useState(!!sessionStorage.getItem('password'));
  const [works, setWorks] = useState([]);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [galleryStatus, setGalleryStatus] = useState({});
  const [progress, setProgress] = useState({
    downloaded: 0,
    total: 0,
    currentGallery: '',
    currentFile: '',
  });
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!authenticated) return;
    fetchWorks()
      .then((data) => {
        setWorks(data);
        const total = data.reduce((sum, w) => sum + (w.gallery_images?.length || 0), 0);
        setProgress((p) => ({ ...p, total }));
      })
      .catch((err) => {
        if (err.message === '401') {
          sessionStorage.removeItem('password');
          setAuthenticated(false);
        } else {
          setError(err.message);
        }
      });
  }, [authenticated]);

  const handleLogin = async (password) => {
    sessionStorage.setItem('password', password);
    setAuthenticated(true);
  };

  const handleStart = async () => {
    try {
      setIsRunning(true);
      setIsDone(false);
      setGalleryStatus({});
      setProgress((p) => ({ ...p, downloaded: 0, currentGallery: '', currentFile: '' }));

      const unsubscribe = subscribeToProgress((event) => {
        if (event.type === 'start') {
          setGalleryStatus((s) => ({ ...s, [event.gallery]: 'downloading' }));
          setProgress((p) => ({ ...p, currentGallery: event.gallery }));
        } else if (event.type === 'progress') {
          setProgress((p) => ({
            ...p,
            downloaded: p.downloaded + 1,
            currentFile: event.file,
            currentGallery: event.gallery,
          }));
        } else if (event.type === 'done') {
          setGalleryStatus((s) => ({ ...s, [event.gallery]: 'done' }));
        } else if (event.type === 'error') {
          setGalleryStatus((s) => ({ ...s, [event.gallery]: 'error' }));
        } else if (event.type === 'complete') {
          setIsRunning(false);
          setIsDone(true);
          unsubscribeRef.current?.();
        }
      });

      unsubscribeRef.current = unsubscribe;
      await startBackup();
    } catch (err) {
      if (err.message === '401') {
        sessionStorage.removeItem('password');
        setAuthenticated(false);
      } else {
        setError(err.message);
      }
      setIsRunning(false);
    }
  };

  if (!authenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cinemango Backup</h1>
        <button
          className="btn-start"
          onClick={handleStart}
          disabled={isRunning || !works.length}
        >
          {isRunning ? 'Running...' : 'Start Backup'}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <BackupProgress
        progress={progress}
        isRunning={isRunning}
        isDone={isDone}
        downloadHref={downloadUrl()}
      />

      <GalleryList works={works} galleryStatus={galleryStatus} />
    </div>
  );
}
