import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import session from 'express-session';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { chatWithAI } from './aiController.js';
import activityController from './activityController.js';
import feedbackController from './feedbackController.js';
import authController from './authController.js';
import adminRoutes from './routes.js'; 

dotenv.config();

// ES MODULES İÇİN __dirname TANIMLAMASI
const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// --- MySQL Bağlantısı ---
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('❌ MySQL bağlantı hatası:', err.stack);
        return;
    }
    console.log('✅ MySQL veritabanına başarıyla bağlanıldı.');
});

// --- Middleware Ayarları ---
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true, // Cookie gönderimi için çok önemli
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// UPLOADS KLASÖRÜNÜ DIŞARI AÇMA
app.use('/uploads', express.static(path.join(_dirname, 'uploads')));

// --- GÜNCELLENMİŞ OTURUM AYARLARI ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'cok_gizli_bir_anahtar',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Localhost'ta çalıştığımız için FALSE olmalı
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 gün
    } 
}));

// --- MULTER AYARLARI ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // uploads klasörü yoksa oluştur
        if (!fs.existsSync('uploads')){
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// ============================================================
// --- ROTALAR ---
// ============================================================

app.use('/api/auth', authController(db));
app.use('/api/admin', adminRoutes(db)); 

// AI Chat Rotası
app.post('/api/ai-chat', chatWithAI);

app.use('/api/activities', activityController(db));

// Etkinlik geri dönüş analizi
app.use('/api/feedback', feedbackController(db));


// ============================================================
// --- AI ETKİNLİK ÖNERİSİ ---
// ============================================================
app.post('/api/recommend', (req, res) => {
    const { ilgiAlanlari } = req.body; 

    if (!ilgiAlanlari) {
        return res.status(400).json({ error: "İlgi alanları boş olamaz." });
    }

    const kategoriSozlugu = {
        "yazılım": ["kodlama", "python", "java", "javascript", "c#", "react", "algoritma", "web", "mobil", "bilişim", "bilgisayar", "backend", "frontend", "sql"],
        "yapay zeka": ["ai", "makine öğrenmesi", "veri", "data", "chatgpt", "otomasyon", "robot", "derin öğrenme"],
        "siber": ["güvenlik", "security", "hack", "network", "ağ", "linux", "kali"],
        "sanat": ["resim", "müzik", "tiyatro", "sinema", "fotoğraf", "tasarım", "sergi", "heykel", "drama"],
        "müzik": ["konser", "gitar", "piyano", "şarkı", "sahne", "koro", "orkestra"],
        "spor": ["futbol", "voleybol", "basketbol", "yüzme", "tenis", "turnuva", "koşu", "fitness", "yoga"],
        "kariyer": ["cv", "mülakat", "staj", "linkedin", "iş hayatı", "sektör", "girişimcilik", "liderlik"],
        "doğa": ["kamp", "yürüyüş", "gezi", "trekking", "çevre", "piknik"],
        "oyun": ["game", "espor", "valorant", "lol", "turnuva", "oyuncu", "unity", "unreal"],
        "mühendislik": ["teknoloji", "üretim", "elektronik", "makine", "inşaat", "endüstri"]
    };

    const girilenKelimeler = ilgiAlanlari.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
        .split(/\s+/);

    let genisletilmisAnahtarKelimeler = [...girilenKelimeler];

    girilenKelimeler.forEach(kelime => {
        if (kategoriSozlugu[kelime]) {
            genisletilmisAnahtarKelimeler.push(...kategoriSozlugu[kelime]);
        }
        Object.keys(kategoriSozlugu).forEach(anaKategori => {
            if (kategoriSozlugu[anaKategori].includes(kelime)) {
                genisletilmisAnahtarKelimeler.push(anaKategori);
            }
        });
    });

    const aranacakKelimeler = [...new Set(genisletilmisAnahtarKelimeler)];
    
    const sql = "SELECT * FROM etkinlikler"; 
    
    db.query(sql, (err, results) => {
      if (err) {
        console.error("AI Öneri Hatası:", err);
        return res.status(500).json({ error: "Veritabanı hatası" });
      }
  
      const puanliEtkinlikler = results.map(etkinlik => {
        let puan = 0;
        const baslik = (etkinlik.baslik || "").toLowerCase();
        const aciklama = (etkinlik.aciklama || "").toLowerCase();
        const kulup = (etkinlik.kulup_adi || "").toLowerCase();

        aranacakKelimeler.forEach(anahtarKelime => {
            if (anahtarKelime.length < 2) return; 
            if (baslik.includes(anahtarKelime)) puan += 10;
            if (kulup.includes(anahtarKelime)) puan += 8;
            if (aciklama.includes(anahtarKelime)) puan += 3;
        });

        return { ...etkinlik, uygunlukPuani: puan };
      });

      const onerilenler = puanliEtkinlikler
          .filter(e => e.uygunlukPuani > 0)
          .sort((a, b) => b.uygunlukPuani - a.uygunlukPuani); 

      res.json(onerilenler);
    });
});

// ============================================================
// --- NOT SİSTEMİ ROTALARI ---
// ============================================================

// 1. DOSYA YÜKLEME
app.post('/api/notes', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'Lütfen bir dosya seçin.' });
    }

    const { title, course_code, description, tags, uploaded_by } = req.body;
    const file_path = req.file.filename;
    const file_type = path.extname(req.file.originalname);

    const sql = `INSERT INTO lecture_notes 
                 (title, course_code, description, file_path, file_type, tags, uploaded_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [title, course_code, description, file_path, file_type, tags, uploaded_by];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Veritabanı Kayıt Hatası:", err);
            return res.status(500).send({ message: 'Veritabanı hatası oluştu.' });
        }
        res.status(200).send({ message: 'Dosya başarıyla yüklendi!', noteId: result.insertId });
    });
});

// 2. NOTLARI LİSTELEME
app.get('/api/notes', (req, res) => {
    const sql = `
        SELECT lecture_notes.*, users.name as uploader_name 
        FROM lecture_notes 
        LEFT JOIN users ON lecture_notes.uploaded_by = users.id 
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Veri çekme hatası:", err);
            return res.status(500).send('Veri çekilemedi.');
        }
        res.json(results);
    });
});

// 3. NOT SİLME
app.delete('/api/notes/:id', (req, res) => {
    const noteId = req.params.id;
    const selectSql = "SELECT file_path FROM lecture_notes WHERE id = ?";

    db.query(selectSql, [noteId], (err, results) => {
        if (err) return res.status(500).send('Veritabanı hatası.');
        if (results.length === 0) return res.status(404).send('Not bulunamadı.');

        const filename = results[0].file_path;
        const filePath = path.join(_dirname, 'uploads', filename);

        fs.unlink(filePath, (err) => {
            if (err) console.error("Dosya silinirken hata:", err);
            
            const deleteSql = "DELETE FROM lecture_notes WHERE id = ?";
            db.query(deleteSql, [noteId], (deleteErr) => {
                if (deleteErr) return res.status(500).send('Veritabanından silinemedi.');
                res.send('Not ve dosya başarıyla silindi.');
            });
        });
    });
});

// 4. BEĞENİ & ŞİKAYET
// --- 4. GÜNCELLENMİŞ BEĞENİ (TOGGLE: BEĞEN / GERİ AL) ---
app.post('/api/notes/like/:id', (req, res) => {
    const noteId = req.params.id;
    const { userId } = req.body;

    // İşleme Başla
    db.beginTransaction(err => {
        if (err) {
            console.error('İşlem başlatma hatası:', err);
            return res.status(500).json({ error: 'Sunucu hatası: İşlem başlatılamadı.' });
        }

        // 1. Kontrol Et: Bu kullanıcı bu notu beğenmiş mi?
        const checkSql = "SELECT * FROM note_likes WHERE user_id = ? AND note_id = ?";
        
        db.query(checkSql, [userId, noteId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Kontrol sorgusu hatası:', err);
                    res.status(500).json({ error: 'Sunucu hatası: Beğeni durumu kontrol edilemedi.' });
                });
            }

            let action; // 'liked' veya 'unliked'
            let updateSql;

            if (results.length > 0) {
                // DURUM A: Zaten beğenmiş -> BEĞENİYİ GERİ ÇEK (SİL) ve Sayıyı AZALT
                action = 'unliked';
                updateSql = "DELETE FROM note_likes WHERE user_id = ? AND note_id = ?";
            } else {
                // DURUM B: Henüz beğenmemiş -> BEĞENİ EKLE ve Sayıyı ARTTIR
                action = 'liked';
                updateSql = "INSERT INTO note_likes (user_id, note_id) VALUES (?, ?)";
            }

            // 2. Beğeni Tablosunu Güncelle (Ekle/Sil)
            db.query(updateSql, [userId, noteId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Beğeni tablosu güncelleme hatası:', err);
                        res.status(500).json({ error: 'Sunucu hatası: Beğeni işlemi başarısız.' });
                    });
                }

                // 3. Not Tablosundaki Beğeni Sayısını Güncelle (+1 veya -1)
                const countUpdateSql = action === 'liked' 
                    ? "UPDATE lecture_notes SET likes = likes + 1 WHERE id = ?"
                    : "UPDATE lecture_notes SET likes = likes - 1 WHERE id = ?";

                db.query(countUpdateSql, [noteId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Beğeni sayacı güncelleme hatası:', err);
                            res.status(500).json({ error: 'Sunucu hatası: Beğeni sayacı güncellenemedi.' });
                        });
                    }

                    // Her iki işlem de başarılı oldu -> İşlemi Tamamla (Commit)
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('İşlemi tamamlama (commit) hatası:', err);
                                res.status(500).json({ error: 'Sunucu hatası: Veri kaydedilemedi.' });
                            });
                        }
                        
                        // Başarılı Yanıt
                        const message = action === 'liked' ? 'Beğenildi.' : 'Beğeni geri alındı.';
                        res.json({ status: action, message: message });
                    });
                });
            });
        });
    });
});



app.put('/api/notes/report/:id', (req, res) => {
    db.query("UPDATE lecture_notes SET is_reported = 1 WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).send('Hata');
        res.send('Şikayet edildi.');
    });
});

app.put('/api/notes/unreport/:id', (req, res) => {
    db.query("UPDATE lecture_notes SET is_reported = 0 WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).send('Hata');
        res.send('Şikayet kaldırıldı.');
    });
});


// ============================================================
// --- QR & YOKLAMA SİSTEMİ (Yeni Eklenenler) ---
// ============================================================

// 1. ÖĞRENCİ İÇİN DİNAMİK QR KOD ÜRET
app.get('/api/student/generate-qr', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Giriş yapmalısınız." });
    }

    const studentId = req.session.userId;
    const timestamp = Date.now();
    const secret = "gizli_okul_anahtari"; 
    
    // Basit token: OgrenciID_ZamanDamgasi_Secret
    const rawData = `${studentId}_${timestamp}_${secret}`;
    const qrToken = Buffer.from(rawData).toString('base64');

    res.json({ token: qrToken });
});

// 2. ÖĞRETMEN İÇİN QR OKUTMA
app.post('/api/teacher/scan-student', (req, res) => {
    const { qrToken, lessonId } = req.body; 

    try {
        const decodedString = Buffer.from(qrToken, 'base64').toString('utf-8');
        const [studentId, timestamp, secret] = decodedString.split('_');

        if (secret !== "gizli_okul_anahtari") {
            return res.status(400).json({ error: "Sahte QR Kod!" });
        }

        // 15 Saniye Kontrolü
        const now = Date.now();
        const qrTime = parseInt(timestamp);
        if (now - qrTime > 15000) { 
            return res.status(400).json({ error: "QR Kodun süresi dolmuş! Öğrenci sayfayı yenilesin." });
        }

        console.log(`✅ Öğrenci ${studentId} derse (${lessonId}) eklendi.`);
        res.json({ message: "Öğrenci başarıyla kaydedildi!", studentId: studentId });

    } catch (error) {
        res.status(400).json({ error: "Geçersiz veri." });
    }
});

// 3. ÖĞRENCİNİN YOKLAMA GEÇMİŞİNİ GETİR
app.get('/api/student/attendance-history', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.json([]); 
    }

    const userId = req.session.userId;

    const sql = `
        SELECT 
            yoklama.id, 
            ders_programi.ders_adi, 
            ders_programi.hoca_adi, 
            yoklama.tarih, 
            yoklama.durum 
        FROM yoklama
        JOIN ders_programi ON yoklama.ders_id = ders_programi.id
        WHERE yoklama.user_id = ?
        ORDER BY yoklama.tarih DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Yoklama geçmişi hatası:", err);
            return res.status(500).json({ error: "Veri çekilemedi" });
        }
        res.json(results);
    });
});

// 4. ŞU ANKİ AKTİF DERSİ GETİR (EKSİK OLAN KISIM EKLENDİ)
app.get('/api/student/active-lesson', (req, res) => {
    // MySQL WEEKDAY(): 0=Pazartesi, 1=Salı...
    const sql = `
        SELECT * FROM ders_programi 
        WHERE gun = ELT(WEEKDAY(NOW()) + 1, 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar')
        AND CURTIME() BETWEEN baslangic_saati AND bitis_saati
        LIMIT 1
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Ders programı hatası:", err);
            return res.status(500).json({ error: "Veri çekilemedi" });
        }

        if (results.length > 0) {
            res.json(results[0]); 
        } else {
            res.json(null); 
        }
    });
});


// --- KÖK ROTA ---
app.get('/', (req, res) => {
    const routerFunction = adminRoutes(db);
    routerFunction.handle(req, res); 
});

// ============================================================
// --- SUNUCUYU BAŞLAT (EN SONDA OLMALI) ---
// ============================================================
app.listen(PORT, () => {
    console.log(`✅ Node.js sunucusu http://localhost:${PORT} adresinde çalışıyor...`);
});