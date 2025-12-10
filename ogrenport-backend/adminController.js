// adminController.js
// ÖNEMLİ: Bu dosyanın dışarıdan gelen 'db' bağlantısını alması gerekiyor. 
// Bu varsayım ile devam ediyoruz, eğer farklı bir yapın varsa haber ver.

// Farz edelim ki, bu dosya Express tarafından çağrılırken 'db' bağlantısını alıyor:
// const db = require('./db'); // Veya ana uygulamanızdaki veritabanı bağlantı yolu

// --- 1. KULLANICI YÖNETİMİ FONKSİYONLARI ---

/**
 * Onay bekleyen kullanıcıları listeler.
 */
const getUnapprovedUsers = (db) => (req, res) => {
    const sql = 'SELECT id, name, email, created_at FROM users WHERE is_approved = 0 ORDER BY created_at ASC';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Veritabanı listeleme hatası:', err);
            return res.status(500).json({ message: 'Listeleme sırasında sunucu hatası oluştu.' });
        }
        res.status(200).json(results);
    });
};


/**
 * Belirli bir kullanıcıyı onaylar (is_approved = 1 yapar).
 */
const approveUser = (db) => (req, res) => {
    const { userId } = req.body; 

    if (!userId) {
        return res.status(400).json({ message: 'Lütfen onaylanacak kullanıcı ID’sini belirtin.' });
    }

    const sql = 'UPDATE users SET is_approved = 1 WHERE id = ? AND is_approved = 0';
    
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Kullanıcı onay hatası:', err);
            return res.status(500).json({ message: 'Kullanıcı onaylanırken sunucu hatası oluştu.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı veya zaten onaylanmış.' });
        }

res.status(200).json({ message: `${userId} ID'li kullanıcı başarıyla onaylandı.` });
    });
};
const getAllUsers = (db) => (req, res) => {
    // is_approved = 0 kısıtlaması olmadan tüm kullanıcıları seçiyoruz
    const sql = 'SELECT id, name, email, role, is_approved, created_at FROM users ORDER BY id ASC';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Tüm kullanıcıları listeleme hatası:', err);
            return res.status(500).json({ message: 'Kullanıcılar listelenirken sunucu hatası oluştu.' });
        }
        res.status(200).json(results);
    });
};


// --- 2. DUYURU YÖNETİMİ FONKSİYONLARI (announcementController'dan taşındı) ---

/**
 * Duyuru oluşturur. (POST /api/admin/announcements/create)
 */
const createAnnouncement = (db) => (req, res) => {
    const { title, content } = req.body;
    const adminId = req.session.userId; 

    if (!title || !content) {
        return res.status(400).json({ message: 'Başlık ve içerik alanları zorunludur.' });
    }

    const sql = 'INSERT INTO announcements (admin_id, title, content) VALUES (?, ?, ?)';
    
    db.query(sql, [adminId, title, content], (err, result) => {
        if (err) {
            console.error('Duyuru ekleme hatası:', err);
            return res.status(500).json({ message: 'Duyuru eklenirken sunucu hatası oluştu.' });
        }

        res.status(201).json({ message: 'Duyuru başarıyla yayımlandı.', announcementId: result.insertId });
    });
};


/**
 * Tüm Duyuruları Çekme (GET /api/announcements) - Admin panelinde listelemek için.
 */
const getAnnouncements = (db) => (req, res) => {
    // Tüm duyuruları çekiyoruz (Bu, Admin'e de lazım olabilir)
    const sql = 'SELECT title, content, created_at FROM announcements ORDER BY created_at DESC';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Duyuru çekme hatası:', err);
            return res.status(500).json({ message: 'Duyurular yüklenirken sunucu hatası oluştu.' });
        }

        res.json(results);
    });
};
const deleteAnnouncement = (db) => (req, res) => {
    // Silinecek duyurunun ID'sini URL parametrelerinden alıyoruz.
    const { id } = req.params; 

    const sql = 'DELETE FROM announcements WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Duyuru silme hatası:', err);
            return res.status(500).json({ message: 'Duyuru silinirken sunucu hatası oluştu.' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Silinecek duyuru bulunamadı.' });
        }
      
res.status(200).json({ message: `${id} ID'li duyuru başarıyla silindi.` });
    });
};


// Tüm yönetici fonksiyonlarını dışa aktar
export default (db) => ({
    getUnapprovedUsers: getUnapprovedUsers(db),
    approveUser: approveUser(db),
    getAllUsers: getAllUsers(db),
    createAnnouncement: createAnnouncement(db),
    getAnnouncements: getAnnouncements(db),
    deleteAnnouncement: deleteAnnouncement(db),
});