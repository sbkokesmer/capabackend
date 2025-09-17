import express from 'express';
const router = express.Router();
import { pool } from '../db.js';

// GET current exchange rates
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM currency_rates LIMIT 1');
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('💥 GET error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE exchange rates
router.post('/update', async (req, res) => {
  const { usd_rate, eur_rate } = req.body;

  if (!usd_rate || !eur_rate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await pool.query(`
      INSERT INTO currency_rates (id, usd_rate, eur_rate, updated_at)
      VALUES (1, $1, $2, NOW())
      ON CONFLICT (id)
      DO UPDATE SET usd_rate = $1, eur_rate = $2, updated_at = NOW()
    `, [usd_rate, eur_rate]);

    res.status(200).json({ message: 'Exchange rates updated' });
  } catch (error) {
    console.error('💥 POST error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;