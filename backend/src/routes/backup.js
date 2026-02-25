import { Router } from 'express';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { startBackup, addSSEClient, getIsRunning } from '../services/backupService.js';

const BACKUPS_DIR = path.resolve('backups');

const router = Router();

router.post('/start', async (req, res) => {
  if (getIsRunning()) {
    return res.status(409).json({ error: 'Backup already running' });
  }
  startBackup();
  res.json({ message: 'Backup started' });
});

router.get('/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addSSEClient(res);
});

router.get('/download', (req, res) => {
  if (!fs.existsSync(BACKUPS_DIR)) {
    return res.status(404).json({ error: 'No backups found' });
  }

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="cinemango-backup-${date}.zip"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.pipe(res);
  archive.directory(BACKUPS_DIR, 'backups');
  archive.finalize();

  archive.on('finish', () => {
    fs.rmSync(BACKUPS_DIR, { recursive: true, force: true });
  });
});

export default router;
