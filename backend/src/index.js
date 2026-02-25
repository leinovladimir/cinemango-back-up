import express from 'express';
import cors from 'cors';
import worksRouter from './routes/works.js';
import backupRouter from './routes/backup.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/works', worksRouter);
app.use('/api/backup', backupRouter);

app.listen(PORT, () => {
  console.log(`Backup service running on http://localhost:${PORT}`);
});
