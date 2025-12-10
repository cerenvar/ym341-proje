import express from 'express';
const router = express.Router();

export default (db) => {

  // 1. Tüm Etkinlikleri Getir
  router.get('/', (req, res) => {
    const sql = "SELECT * FROM etkinlikler ORDER BY tarih ASC";
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "Veri çekilemedi." });
      res.json(results);
    });
  });

  // SADECE 1 HAFTA (7 GÜN) İÇİNDEKİLERİ GETİR
  router.get('/upcoming', (req, res) => {
    const sql = "SELECT * FROM etkinlikler WHERE tarih >= NOW() AND tarih <= DATE_ADD(NOW(), INTERVAL 7 DAY) ORDER BY tarih ASC";
    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Veri çekilemedi." });
      }
      res.json(results);
    });
  });

  // ============================================================
  // --- YENİ EKLENEN: KULLANICININ KATILDIĞI ETKİNLİKLER ---
  // ============================================================
  router.get('/my-joined-events', (req, res) => {
    // Kullanıcı giriş yapmamışsa boş liste dön
    if (!req.session || !req.session.userId) {
        return res.json([]); 
    }

    const userId = req.session.userId;
    // Kullanıcının katıldığı etkinliklerin ID'lerini çek
    const sql = "SELECT etkinlik_id FROM katilimlar WHERE user_id = ?";

    db.query(sql, [userId], (err, results) => {
        if (err) {
             console.error("Katılımlar çekilemedi:", err);
             return res.json([]);
        }
        // Sonucu sadece ID listesi olarak döndür: [1, 5, 8]
        const ids = results.map(item => item.etkinlik_id);
        res.json(ids);
    });
  });


  // 2. ETKİNLİĞE KATIL (GÜNCELLENMİŞ VERSİYON)
  router.post('/join/:id', (req, res) => {
    const etkinlikId = req.params.id;
    
    // 1. ADIM: KULLANICI GİRİŞ YAPMIŞ MI?
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Lütfen önce giriş yapın." });
    }
    const userId = req.session.userId;

    // 2. ADIM: ZATEN KATILMIŞ MI?
    const checkSql = "SELECT * FROM katilimlar WHERE user_id = ? AND etkinlik_id = ?";
    db.query(checkSql, [userId, etkinlikId], (err, existing) => {
        if (err) return res.status(500).json({ error: "Veritabanı hatası" });
        
        if (existing.length > 0) {
            return res.status(400).json({ error: "Zaten katıldınız!" });
        }

        // 3. ADIM: KONTENJAN KONTROLÜ
        db.query("SELECT katilimci_sayisi, kontenjan FROM etkinlikler WHERE id = ?", [etkinlikId], (err, rows) => {
            if (err || rows.length === 0) return res.status(500).json({ error: "Etkinlik bulunamadı." });

            const etkinlik = rows[0];

            if (etkinlik.katilimci_sayisi >= etkinlik.kontenjan) {
                return res.status(400).json({ error: "Kontenjan dolu!" });
            }

            // 4. ADIM: HEM KATILIM TABLOSUNA EKLE HEM SAYIYI ARTIR
            // Önce 'katilimlar' tablosuna ekle
            const insertSql = "INSERT INTO katilimlar (user_id, etkinlik_id) VALUES (?, ?)";
            db.query(insertSql, [userId, etkinlikId], (insertErr) => {
                if (insertErr) {
                    console.error(insertErr);
                    return res.status(500).json({ error: "Kaydedilemedi." });
                }

                // Sonra sayıyı artır
                const updateSql = "UPDATE etkinlikler SET katilimci_sayisi = katilimci_sayisi + 1 WHERE id = ?";
                db.query(updateSql, [etkinlikId], (updateErr) => {
                    if (updateErr) return res.status(500).json({ error: "Sayı güncellenemedi." });
                    
                    res.json({ 
                        message: "Katılım başarılı!", 
                        yeniSayi: etkinlik.katilimci_sayisi + 1 
                    });
                });
            });
        });
    });
  });

  return router;
};