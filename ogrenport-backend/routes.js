import express from 'express';
import adminController from './adminController.js';

// Middleware: Sadece yöneticilerin erişimine izin verir
const isAdmin = (req, res, next) => {
    if (!req.session || !req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Bu işlem için yönetici yetkiniz yok.' });
    }
    next();
};

export default (db) => {
    const router = express.Router();
    
    // Controller fonksiyonlarını başlatıyoruz
    const adminFunctions = adminController(db); 

    // --- KULLANICI İŞLEMLERİ ---

    // 1. Onay Bekleyenleri Listele
    router.get('/users/unapproved', isAdmin, adminFunctions.getUnapprovedUsers);

    // 2. Kullanıcı Onayla
    router.put('/users/approve', isAdmin, adminFunctions.approveUser);

    // 3. Tüm Kullanıcıları Listele (React tarafı /users diye istek atıyor, o yüzden /all'ı sildim)
    router.get('/users', isAdmin, adminFunctions.getAllUsers);

    // 4. Kullanıcı Sil (DİKKAT: isAdmin EKLENDİ!)
    router.delete('/users/:id', isAdmin, (req, res) => {
        const userId = req.params.id;
        const sql = "DELETE FROM users WHERE id = ?";

        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Veritabanı hatası');
            }
            res.send('Kullanıcı başarıyla silindi.');
        });
    });

    // --- DUYURU İŞLEMLERİ ---

    // 5. Duyuru Oluştur
    router.post('/announcements/create', isAdmin, adminFunctions.createAnnouncement);

    // 6. Tüm Duyuruları Çek
    router.get('/announcements', isAdmin, adminFunctions.getAnnouncements); 
    
    // 7. Duyuru Sil
    router.delete('/announcements/:id', isAdmin, adminFunctions.deleteAnnouncement);

    return router;
};