import express from 'express';
import multer from 'multer';
import supabase from '../supabaseClient.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', upload.single('image'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('Dosya seçilmedi.');

  const filename = `${Date.now()}_${file.originalname}`;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    console.error('Upload Error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  const { data } = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(filename);

  return res.json({ url: data.publicUrl });
});

export default router;