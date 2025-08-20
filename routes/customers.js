

import express from 'express';
import pg from 'pg';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 1. Tüm müşterileri getir
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// 2. Username ile müşteri getir
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query('SELECT * FROM customers WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Müşteri bulunamadı' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// 3. Yeni müşteri ekle
router.post('/', async (req, res) => {
  const {
    customer_name, phone, email, customer_code,
    username, discount_rate, address, city,
    district, password, card_number, qr_data
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO customers
       (customer_name, phone, email, customer_code, username, discount_rate, address, city, district, password, card_number, qr_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [customer_name, phone, email, customer_code, username, discount_rate, address, city, district, password, card_number, qr_data]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ekleme hatası', detail: err.message });
  }
});

// 4. Müşteri güncelle
router.put('/:username', async (req, res) => {
  const { username } = req.params;
  const {
    customer_name, phone, email, customer_code,
    discount_rate, address, city, district,
    password, card_number, qr_data
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE customers SET
        customer_name=$1, phone=$2, email=$3, customer_code=$4,
        discount_rate=$5, address=$6, city=$7, district=$8,
        password=$9, card_number=$10, qr_data=$11
       WHERE username=$12 RETURNING *`,
      [customer_name, phone, email, customer_code,
       discount_rate, address, city, district,
       password, card_number, qr_data, username]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Müşteri bulunamadı' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Güncelleme hatası', detail: err.message });
  }
});

// 5. Müşteri sil
router.delete('/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query('DELETE FROM customers WHERE username = $1 RETURNING *', [username]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Müşteri bulunamadı' });
    res.json({ message: 'Müşteri silindi', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Silme hatası', detail: err.message });
  }
});

export default router;