import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Arama endpoint’i: ?q=ışın
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Arama terimi eksik' });

  try {
    // 1. Kelimeye göre eşleşen stock_code'ları bul
    const keywordResult = await pool.query(
      `SELECT DISTINCT stock_code FROM keywords WHERE LOWER(keyword) LIKE $1`,
      [`%${q.toLowerCase()}%`]
    );

    const stockCodes = keywordResult.rows.map(row => row.stock_code);
    if (stockCodes.length === 0) return res.json([]);

    // 2. O stock_code’lara ait ürünleri getir
    const placeholders = stockCodes.map((_, i) => `$${i + 1}`).join(',');
    const productResult = await pool.query(
      `SELECT * FROM products WHERE stokkodu IN (${placeholders})`,
      stockCodes
    );

    res.json(productResult.rows);
  } catch (err) {
    console.error('❌ Keyword Arama Hatası:', err.message);
    res.status(500).json({ error: 'Arama sırasında hata oluştu' });
  }
});

// Yeni keyword ekleme
router.post('/', async (req, res) => {
  const { stock_code, keyword } = req.body;
  if (!stock_code || !keyword) {
    return res.status(400).json({ error: 'stock_code ve keyword zorunludur.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO keywords (stock_code, keyword) VALUES ($1, $2) RETURNING *',
      [stock_code, keyword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Keyword Ekleme Hatası:', err.message);
    res.status(500).json({ error: 'Keyword eklenirken hata oluştu' });
  }
});

// Belirli bir ürünün tüm keyword'lerini getir
router.get('/:stock_code', async (req, res) => {
  const { stock_code } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM keywords WHERE stock_code = $1',
      [stock_code]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Keyword Listeleme Hatası:', err.message);
    res.status(500).json({ error: 'Keyword listelenirken hata oluştu' });
  }
});

// Keyword silme
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM keywords WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Keyword Silme Hatası:', err.message);
    res.status(500).json({ error: 'Keyword silinirken hata oluştu' });
  }
});

// Keyword güncelleme
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: 'keyword zorunludur.' });
  }

  try {
    const result = await pool.query(
      'UPDATE keywords SET keyword = $1 WHERE id = $2 RETURNING *',
      [keyword, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Keyword Güncelleme Hatası:', err.message);
    res.status(500).json({ error: 'Keyword güncellenirken hata oluştu' });
  }
});

export default router;