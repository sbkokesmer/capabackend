// routes/variations.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/:stockCode', async (req, res) => {
  const { stockCode } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, name, stock_code, price, type, available, stock_quantity 
       FROM variations 
       WHERE stock_code = $1 AND name IS NOT NULL AND price > 0`,
      [stockCode]
    );

    res.json({
      hasVariations: result.rows.length > 0,
      variations: result.rows
    });
  } catch (err) {
    console.error('❌ DB Error:', err.message);
    res.status(500).json({ error: 'Varyasyon verisi alınamadı' });
  }
});

// Admin ve frontend: Tüm varyasyonları getir (filtre destekli)
router.get('/', async (req, res) => {
  const { type, available, min_price, max_price, search } = req.query;

  let conditions = [];
  let values = [];
  let idx = 1;

  if (type) {
    conditions.push(`type = $${idx++}`);
    values.push(type);
  }

  if (available !== undefined) {
    conditions.push(`available = $${idx++}`);
    values.push(available === 'true');
  }

  if (min_price) {
    conditions.push(`price >= $${idx++}`);
    values.push(Number(min_price));
  }

  if (max_price) {
    conditions.push(`price <= $${idx++}`);
    values.push(Number(max_price));
  }

  if (search) {
    conditions.push(`LOWER(name) LIKE $${idx++}`);
    values.push(`%${search.toLowerCase()}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT id, name, stock_code, price, type, available, stock_quantity FROM variations ${whereClause}`
      , values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Admin DB Error:', err.message);
    res.status(500).json({ error: 'Varyasyonlar alınamadı' });
  }
});

// Admin: Varyasyon güncelle
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, stock_code, price, type, available, stock_quantity } = req.body;

  try {
    const result = await pool.query(
      `UPDATE variations
       SET name = $1, stock_code = $2, price = $3, type = $4, available = $5, stock_quantity = $6
       WHERE id = $7
       RETURNING *`,
      [name, stock_code, price, type, available, stock_quantity, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Varyasyon bulunamadı' });
    }

    res.json({ message: 'Varyasyon güncellendi', variation: result.rows[0] });
  } catch (err) {
    console.error('❌ Güncelleme hatası:', err.message);
    res.status(500).json({ error: 'Varyasyon güncellenemedi' });
  }
});

// Admin: Varyasyon sil
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM variations WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Varyasyon bulunamadı' });
    }

    res.json({ message: 'Varyasyon silindi', deleted: result.rows[0] });
  } catch (err) {
    console.error('❌ Silme hatası:', err.message);
    res.status(500).json({ error: 'Varyasyon silinemedi' });
  }
});

// Admin: Yeni varyasyon ekle
router.post('/', async (req, res) => {
  const { name, stock_code, price, type, available, stock_quantity } = req.body;

  // Varsayılan değerler
  const variationName = name || '';
  const variationPrice = price ?? 0;
  const variationType = type || 'GENEL';
  const isAvailable = available ?? true;
  const variationStockQuantity = stock_quantity ?? 10;

  let finalStockCode = stock_code;
  if (!finalStockCode) {
    // Boş olan en küçük stok kodunu bul
    const stockQuery = await pool.query(`
      SELECT LPAD(CAST(CAST(SUBSTRING(stock_code, 3) AS INTEGER) + 1 AS TEXT), 4, '0') AS next_code
      FROM variations
      WHERE stock_code ~ '^U-\\d+$'
      ORDER BY CAST(SUBSTRING(stock_code, 3) AS INTEGER) DESC
      LIMIT 1
    `);
    const nextCode = stockQuery.rows[0]?.next_code || '0001';
    finalStockCode = `U-${nextCode}`;
  }

  try {
    const result = await pool.query(
      `INSERT INTO variations (name, stock_code, price, type, available, stock_quantity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [variationName, finalStockCode, variationPrice, variationType, isAvailable, variationStockQuantity]
    );

    res.status(201).json({ message: 'Varyasyon eklendi', variation: result.rows[0] });
  } catch (err) {
    console.error('❌ Ekleme hatası:', err.message);
    res.status(500).json({ error: 'Varyasyon eklenemedi' });
  }
});

export default router;

// Keyword arama: Kullanıcının yazdığı kelimeye göre eşleşen ürünleri bul
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Arama terimi eksik' });

  try {
    const keywordResult = await pool.query(
      `SELECT DISTINCT stock_code FROM keywords WHERE LOWER(description) LIKE $1`,
      [`%${q.toLowerCase()}%`]
    );

    const stockCodes = keywordResult.rows.map(row => row.stock_code);
    if (stockCodes.length === 0) return res.json([]);

    const placeholders = stockCodes.map((_, i) => `$${i + 1}`).join(',');
    const variationResult = await pool.query(
      `SELECT * FROM variations WHERE stock_code IN (${placeholders})`,
      stockCodes
    );

    res.json(variationResult.rows);
  } catch (err) {
    console.error('❌ Arama hatası:', err.message);
    res.status(500).json({ error: 'Arama yapılamadı' });
  }
});