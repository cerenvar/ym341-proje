import bcrypt from 'bcryptjs';
import express from 'express';

const saltRounds = 10;

export default (db) => {
    const router = express.Router();

    // ROTA MANTIĞI: Kullanıcı Kaydı (POST /api/auth/signup)
    router.post('/signup', async (req, res) => {
        const { name, email, password, password2 } = req.body;

        if (!name || !email || !password || !password2) {
            return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
        }
        
        // 🔑 KRİTİK KONTROL: Şifre eşleşme kontrolü
        if (password !== password2) { 
            return res.status(400).json({ message: 'Şifreler uyuşmuyor.' });
        }
        
        // ⬇ Hata buradan başlıyordu: Şifreler uyuşmazsa fonksiyon yukarıda biter.
        // Uyuşursa, normal akış try bloğu ile devam eder.

        try {
            const passwordHash = await bcrypt.hash(password, saltRounds);
            // NOT: users tablosuna role eklediğimiz için, varsayılan 'user' atanır
            const sql = 'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'; 

            db.query(sql, [name, email, passwordHash], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ message: 'Bu e-posta adresi zaten kayıtlı.' });
                    }
                    console.error('Veritabanı hatası:', err);
                    return res.status(500).json({ message: 'Kayıt sırasında sunucu hatası oluştu.' });
                }

                res.status(201).json({ message: 'Kayıt başarılı. Şimdi giriş yapabilirsiniz.' });
            });

        } catch (error) {
            console.error('Kayıt işlemi hatası:', error);
            res.status(500).json({ message: 'Kayıt işlemi sırasında beklenmedik bir hata oluştu.' });
        }
    }); // ⬅ router.post buraya kadar gelmeli

    // ROTA MANTIĞI: Kullanıcı Girişi (POST /api/auth/login)
    router.post('/login', (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Lütfen e-posta ve şifrenizi girin.' });
        }

        // ⬅ GÜNCELLEME: role sütununu da çekiyoruz
        const sql = 'SELECT id, name, email, password_hash, role FROM users WHERE email = ?'; 
        
        db.query(sql, [email], async (err, results) => {
            if (err) {
                console.error('Veritabanı hatası:', err);
                return res.status(500).json({ message: 'Giriş sırasında sunucu hatası oluştu.' });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
            }

            const user = results[0];

            try {
                const match = await bcrypt.compare(password, user.password_hash);

                if (match) {
                    // ⬅ KRİTİK EKLEME: Kullanıcı bilgilerini ve ROLÜ oturuma kaydediyoruz
                    req.session.userId = user.id;
                    req.session.userRole = user.role; 

                    res.status(200).json({
                        message: 'Giriş başarılı!',
                        user: { id: user.id, name: user.name, email: user.email, role: user.role } // Frontend'e rol bilgisini gönderiyoruz
                    });
                } else {
                    res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
                }
            } catch (error) {
                console.error('Şifre karşılaştırma hatası:', error);
                res.status(500).json({ message: 'Giriş sırasında bir hata oluştu.' });
            }
        });
    });

    return router;
};