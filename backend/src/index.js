import express from 'express';
import cors from 'cors';
import worksRouter from './routes/works.js';
import backupRouter from './routes/backup.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());
app.use('/api', authMiddleware);

app.use('/api/works', worksRouter);
app.use('/api/backup', backupRouter);

app.listen(PORT, () => {
  console.log(`Backup service running on http://localhost:${PORT}`);
});
