import fs from 'fs';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_YzuC5xVf3oZK@ep-withered-feather-ad2ecejp-pooler.c-2.us-east-1.aws.neon.tech/capadental?sslmode=require'
});

const rawData = fs.readFileSync('./products.json', 'utf8');
const products = JSON.parse(rawData);

async function insertProducts() {
  for (const p of products) {
    try {
      await pool.query(
        `INSERT INTO products (
          Id, KatId, UrunAdi, StokKodu, UstStokKodu, MuhasebeKodu, Barkod,
          Fiyat, AlisFiyati, SiraNo, Aktif, BayiId, Birim, Resim, Dizin,
          AltUrunVarmi, Aciklama, Kdv, KdvDahil, Ozellestirme,
          SikKullanilanaEkle, SatisMiktari, KampanyaAktif, IndirimTuru, IndirimOrani,
          Puan, VaryasyonLimit, ToptanFiyati, IsAmbalaj, OdemeTipi, IndirimSaati,
          KullanimSekli, Marka, KeyWords, ParaBirimi, UrunLink, VideoLink,
          IndirimAktif, SpotAktif, PopulerUrunAktif, Mensei, AlerjenUyari,
          AlokolDomuzIcerik, BirimFiyati, ResimAdi, sort_id, ResimYolu,
          user_indirim, fiyat_try
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $30, $31,
          $32, $33, $34, $35, $36, $37,
          $38, $39, $40, $41, $42,
          $43, $44, $45, $46, $47,
          $48, $49
        )`,
        [
          p.Id, p.KatId, p.UrunAdi, p.StokKodu, p.UstStokKodu, p.MuhasebeKodu, p.Barkod,
          p.Fiyat, p.AlisFiyati, p.SiraNo, p.Aktif, p.BayiId, p.Birim, p.Resim, p.Dizin,
          p.AltUrunVarmi, p.Aciklama, p.Kdv, p.KdvDahil, p.Ozellestirme,
          p.SikKullanilanaEkle, p.SatisMiktari, p.KampanyaAktif, p.IndirimTuru, p.IndirimOrani,
          p.Puan, p.VaryasyonLimit, p.ToptanFiyati, p.IsAmbalaj, p.OdemeTipi, p.IndirimSaati,
          p.KullanimSekli, p.Marka, p.KeyWords, p.ParaBirimi, p.UrunLink, p.VideoLink,
          p.IndirimAktif, p.SpotAktif, p.PopulerUrunAktif, p.Mensei, p.AlerjenUyari,
          p.AlokolDomuzIcerik, p.BirimFiyati, p.ResimAdi, p.sort_id, p.ResimYolu,
          p.user_indirim, p.fiyat_try
        ]
      );
      console.log(`✅ Eklendi: ${p.UrunAdi} (${p.StokKodu})`);
    } catch (err) {
      console.error(`❌ Hata: ${p.UrunAdi} (${p.StokKodu}) →`, err.message);
    }
  }

  await pool.end();
  console.log('✔️ Tüm ürünler işlendi.');
}

insertProducts();