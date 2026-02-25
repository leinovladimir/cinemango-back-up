import { Router } from 'express';
import { fetchWorks } from '../services/apiService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const works = await fetchWorks();
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
