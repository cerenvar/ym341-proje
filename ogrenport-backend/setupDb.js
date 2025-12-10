import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) { console.error('Hata:', err); return; }
  console.log('✅ Veritabanına bağlandı.');

  // Önce tabloları temizle
  db.query("DROP TABLE IF EXISTS geri_bildirimler", () => {
    db.query("DROP TABLE IF EXISTS etkinlikler", () => {
      
      // 1. Etkinlikler Tablosu
      const tabloEtkinlik = `
        CREATE TABLE etkinlikler (
          id INT AUTO_INCREMENT PRIMARY KEY,
          baslik VARCHAR(255),
          kulup_adi VARCHAR(255),
          tarih DATETIME,
          konum VARCHAR(255),
          aciklama TEXT,
          katilimci_sayisi INT DEFAULT 0,
          kontenjan INT DEFAULT 50
        )
      `;

      // 2. Geri Bildirimler Tablosu
      const tabloYorum = `
        CREATE TABLE geri_bildirimler (
          id INT AUTO_INCREMENT PRIMARY KEY,
          etkinlik_id INT,
          ogrenci_adi VARCHAR(100),
          yorum TEXT,
          puan INT
        )
      `;

      db.query(tabloEtkinlik, () => {
        db.query(tabloYorum, () => {
          
          // ETKİNLİKLERİ EKLE (Geçmiş Tarihli Yapıldı ki Yorum Yapılabilsin)
          const veriEkle = `
            INSERT INTO etkinlikler (baslik, kulup_adi, tarih, konum, aciklama, katilimci_sayisi, kontenjan) 
            VALUES 
            ('Siber Güvenlik 101', 'DOU Bilişim', '2025-10-25 14:00:00', 'B-301', 'Temel siber güvenlik eğitimi.', 45, 50),
            ('Yapay Zeka Zirvesi', 'Mühendis Beyinler', '2025-11-05 10:00:00', 'Konferans Salonu', 'Geleceğin teknolojileri paneli.', 120, 200),
            ('React ile Web Tasarım', 'IEEE Doğuş', '2026-01-10 13:00:00', 'Lab A', 'Profesyonel web sitesi yapımı.', 30, 30),
            ('Python ile Veri Analizi', 'Data Science Kulübü', '2025-12-10 15:00:00', 'Lab C', 'Veri işleme sanatı.', 10, 55),
            ('Kariyer ve CV Atölyesi', 'Endüstri Müh. Kulübü', '2025-12-28 11:00:00', 'Seminer Salonu 2', 'Mülakat tüyoları.', 80, 100),
            ('Kampüs Satranç Turnuvası', 'Satranç Kulübü', '2025-12-25 09:00:00', 'Kütüphane Yanı', 'Büyük ödüllü turnuva.', 12, 12),
            ('Erasmus Bilgilendirme', 'Uluslararası Ofis', '2026-01-01 14:00:00', 'Amfi 1', 'Yurtdışı fırsatları.', 150, 200),
            ('Doğuş Müzik Festivali', 'Müzik Kulübü', '2025-12-28 18:00:00', 'Kampüs Bahçesi', 'Bahar şenliği.', 350, 500),
            ('Girişimcilik 101', 'Girişimcilik Kulübü', '2026-02-15 13:00:00', 'B-205', 'Start-up kurmak.', 40, 45),
            ('Unity ile Oyun Geliştirme', 'Oyun Tasarım Kulübü', '2025-12-18 15:00:00', 'Lab B', '2D platform oyunu.', 58, 60)
          `;

          // DÜZELTME BURADA: `veriEtkinlik` yerine `veriEkle` kullanıldı
          db.query(veriEkle, (err) => {
             if (err) { console.error(err); return; }

             // 2. "Siber Güvenlik" (ID: 1) İÇİN SAHTE YORUMLAR EKLE
             const veriYorum = `
               INSERT INTO geri_bildirimler (etkinlik_id, ogrenci_adi, yorum, puan) VALUES 
               (1, 'Ali', 'Hoca çok iyiydi ama internet çok yavaştı.', 4),
               (1, 'Ayşe', 'Uygulamalı olması harikaydı, çok şey öğrendim.', 5),
               (1, 'Mehmet', 'Salon çok havasızdı ve projeksiyon çalışmadı.', 2),
               (1, 'Zeynep', 'Konular biraz ağırdı, başlangıç seviyesi değildi bence.', 3),
               (1, 'Can', 'Süper etkinlik, tekrarı olsun!', 5)
             `;

             db.query(veriYorum, (err) => {
               if (err) console.error(err);
               console.log("✅ Etkinlikler ve Test Yorumları Yüklendi!");
               process.exit();
             });
          });
        });
      });
    });
  });
});