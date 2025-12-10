import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Google AI Bağlantısı
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default (db) => {

  // 1. YORUM EKLEME (Öğrenci Yorum Yapınca Burası Çalışır)
  router.post('/add', (req, res) => {
    const { etkinlik_id, ogrenci_adi, yorum, puan } = req.body;
    const sql = "INSERT INTO geri_bildirimler (etkinlik_id, ogrenci_adi, yorum, puan) VALUES (?, ?, ?, ?)";
    db.query(sql, [etkinlik_id, ogrenci_adi, yorum, puan], (err, result) => {
      if (err) return res.status(500).json({ error: "Yorum kaydedilemedi." });
      res.json({ message: "Yorum alındı." });
    });
  });

  // 2. ANALİZ YAPMA (Yönetici Butona Basınca Burası Çalışır)
  router.get('/analyze/:etkinlikId', (req, res) => {
    const id = req.params.etkinlikId;

    // A) Veritabanından o etkinliğin yorumlarını çek
    db.query("SELECT yorum, puan FROM geri_bildirimler WHERE etkinlik_id = ?", [id], async (err, rows) => {
      if (err) return res.status(500).json({ error: "Veritabanı hatası" });
      
      // Eğer hiç yorum yoksa AI'ı yorma
      if (rows.length === 0) {
        return res.json({ analiz: "⚠️ Bu etkinlik için henüz hiç yorum yapılmamış. Lütfen önce değerlendirme yapın." });
      }

      // B) Yorumları birleştirip tek metin yap
      const tumYorumlar = rows.map(r => `- ${r.yorum} (Verilen Puan: ${r.puan})`).join("\n");

      // C) AI'a gönderilecek emir (Prompt)
      const prompt = `
        Sen bir etkinlik analiz uzmanısın. Aşağıda bir üniversite etkinliği için öğrenci yorumları var.
        Bunları analiz et ve şu başlıklarla kısa, net bir rapor çıkar:

        📊 **GENEL MEMNUNİYET:** (Genel hava nasıl? Puanlar yüksek mi?)
        ✅ **BEĞENİLENLER:** (Öğrenciler en çok neyi sevmiş?)
        ⚠️ **ŞİKAYETLER:** (Nelerden hoşlanmamışlar?)
        💡 **KULÜBE TAVSİYE:** (Gelecek sefer ne yapsınlar?)

        İŞTE YORUMLAR:
        ${tumYorumlar}
      `;

      try {
        // D) Gemini Modelini Çalıştır
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ analiz: text });

      } catch (error) {
        console.error("AI Hatası:", error);
        res.status(500).json({ error: "Analiz servisinde hata oluştu." });
      }
    });
  });

  return router;
};