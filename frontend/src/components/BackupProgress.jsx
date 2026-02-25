export default function BackupProgress({ progress, isRunning, isDone, downloadHref }) {
  if (!isRunning && !isDone) return null;

  const percent = progress.total > 0
    ? Math.round((progress.downloaded / progress.total) * 100)
    : 0;

  return (
    <div className="backup-progress">
      <div className="progress-header">
        <span>{isDone ? 'Backup complete!' : `Backing up: ${progress.currentGallery || '...'}`}</span>
        <span>{progress.downloaded} / {progress.total}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      {progress.currentFile && !isDone && (
        <p className="current-file">{progress.currentFile}</p>
      )}
      {isDone && (
        <div className="done-row">
          <p className="done-message">
            Downloaded {progress.downloaded} files
          </p>
          <a className="btn-download" href={downloadHref} download>
            Download ZIP
          </a>
        </div>
      )}
    </div>
  );
}
