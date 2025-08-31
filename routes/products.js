import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Listeleme
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Listeleme hatası:', error);
    res.status(500).json({ error: 'Ürünleri çekerken hata oluştu' });
  }
});

// Güncelleme
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      "varyasyonlimit", "toptanfiyati", "isambalaj", "bayiid", "subcategory_id", "fiyat", "alisfiyati", "alturunvarmi",
      "sirano", "kdv", "kdvdahil", "indirimaktif", "spotaktif", "populerurunaktif", "ozellestirme", "sikkullanilanaekle",
      "birimfiyati", "satismiktari", "sort_id", "kampanyaaktif", "user_indirim", "fiyat_try", "aktif", "indirimorani",
      "puan", "alokoldomuzicerik", "urunadi", "stokkodu", "uststokkodu", "muhasebekodu", "barkod", "birim", "resim",
      "dizin", "aciklama", "indirimturu", "odemetipi", "indirimsaati", "kullanimsekli", "marka", "keywords", "parabirimi",
      "urunlink", "videolink", "mensei", "alerjenuyari", "resimadi", "resimyolu"
    ];

    const updates = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map(field => req.body[field]);

    values.push(id); // for WHERE clause

    const result = await pool.query(
      `UPDATE products SET ${updates} WHERE id = $${values.length} RETURNING *`,
      values
    );

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('❌ Güncelleme hatası:', error);
    res.status(500).json({ error: 'Ürün güncellenemedi' });
  }
});

// Silme
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, message: `ID ${id} ürün silindi.` });
  } catch (error) {
    console.error('❌ Silme hatası:', error);
    res.status(500).json({ error: 'Ürün silinemedi' });
  }
});


// Varyasyon kontrolü
router.get('/:stockCode/has-variation', async (req, res) => {
  try {
    const { stockCode } = req.params;
    const result = await pool.query(
      `SELECT COUNT(*) FROM variations WHERE stock_code = $1`,
      [stockCode]
    );
    const hasVariation = parseInt(result.rows[0].count, 10) > 0;
    res.json({ stockCode, hasVariation });
  } catch (error) {
    console.error('❌ Varyasyon kontrol hatası:', error);
    res.status(500).json({ error: 'Varyasyon kontrolü sırasında hata oluştu' });
  }
});

export default router;

// Kategorileri çekme
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id AS category_id, c.name AS category_name, json_agg(
        json_build_object('id', s.id, 'name', s.name, 'stock_code', s.stock_code)
      ) AS subcategories
      FROM categories c
      LEFT JOIN subcategories s ON s.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Kategori çekme hatası:', error);
    res.status(500).json({ error: 'Kategoriler çekilemedi' });
  }
});

// Filtreli ürün çekme
router.get('/filter', async (req, res) => {
  try {
    const { category_id, subcategory_id, minFiyat, maxFiyat, marka, aktif } = req.query;
    const conditions = [];
    const values = [];

    if (subcategory_id) {
      conditions.push(`subcategory_id = $${values.length + 1}`);
      values.push(subcategory_id);
    }

    if (!subcategory_id && category_id) {
      conditions.push(`subcategory_id IN (
        SELECT id FROM subcategories WHERE category_id = $${values.length + 1}
      )`);
      values.push(category_id);
    }

    if (minFiyat) {
      conditions.push(`fiyat >= $${values.length + 1}`);
      values.push(minFiyat);
    }

    if (maxFiyat) {
      conditions.push(`fiyat <= $${values.length + 1}`);
      values.push(maxFiyat);
    }

    if (marka) {
      conditions.push(`LOWER(marka) LIKE LOWER($${values.length + 1})`);
      values.push(`%${marka}%`);
    }

    if (aktif) {
      conditions.push(`aktif = $${values.length + 1}`);
      values.push(aktif === 'true');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM products ${whereClause} ORDER BY id DESC`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Filtreli ürün çekme hatası:', error);
    res.status(500).json({ error: 'Filtreli ürünler çekilemedi' });
  }
});

// Outlet ürünleri çekme
router.get('/outlet', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM products 
      WHERE LOWER(urunadi) LIKE '%outlet%' 
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Outlet ürün çekme hatası:', error);
    res.status(500).json({ error: 'Outlet ürünler çekilemedi' });
  }
});
