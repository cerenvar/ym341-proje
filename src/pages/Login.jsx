import React, { useState } from 'react';
import axios from 'axios'; // ⬅️ Axios'u dahil ettik
import './AuthForms.css';
import './Login.css';

// Backend API'nizin temel URL'si
const API_URL = 'http://localhost:3001/api/auth/login';

function Login({ onSignUpClick, onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // Hata mesajları için state
    const [loading, setLoading] = useState(false); // Yüklenme durumu için state
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = async (e) => { // ⬅️ Fonksiyonu async yaptık
        e.preventDefault();
        setError(''); // Önceki hataları temizle
        setLoading(true); // Yükleniyor durumunu başlat

        try {
            // 1. Backend'e POST isteği gönder
            // DÜZELTME BURADA: { withCredentials: true } ayarını ekledik.
            // Bu ayar olmadan sunucu senin giriş yaptığını hafızasında tutamaz.
            const response = await axios.post(API_URL, {
                email: email,
                password: password,
            }, {
                withCredentials: true // <--- EKLENEN KISIM BURASI
            });

            // 2. İstek başarılı olduğunda (200 OK)
            console.log('Giriş Başarılı:', response.data);

            // 3. Başarılı giriş sonrası App.jsx'teki onLogin fonksiyonunu çağır
            // Burada backend'den gelen kullanıcı verisini veya token'ı gönderiyoruz
            onLogin(response.data.user);

        } catch (err) {
            // 4. İstek başarısız olduğunda
            let errorMessage = 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.';

            // Backend'den dönen spesifik hata mesajını yakalama
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message;
                // Örnek: "E-posta veya şifre hatalı."
                console.error("Giriş Hatası:", errorMessage);
            } else {
                // Sunucuya hiç ulaşılamazsa
                console.error("Ağ Hatası:", err);
                errorMessage = "Sunucuya ulaşılamıyor. Lütfen backend'in çalıştığından emin olun (http://localhost:3001).";
            }

            setError(errorMessage);
        } finally {
            setLoading(false); // Yükleniyor durumunu bitir
        }
    };

    return (
        <div className="login-page-layout">
            <div className="welcome-section">
                <div className="welcome-text-container">
                    <span className="welcome-subtitle">OgrenPort Üniversite Kampüs Sistemine</span>
                    <h1 className="welcome-text">Hoş Geldiniz</h1>
                </div>
            </div>

            <div className="auth-form-container">
                <div className="form-wrapper login-form-wrapper">
                    <img
                        src="/Adsız tasarım (3).png"
                        alt="OgrenPort Logo"
                        className="form-logo"
                    />
                    <h2>OgrenPort</h2>

                    {/* Hata Mesajı Gösterme Alanı */}
                    {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="E-posta Adresi"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Şifre"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                /> Beni Hatırla
                            </label>
                            <a href="#" className="forgot-password">Şifremi Unuttum?</a>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading} // Yüklenirken butonu devre dışı bırak
                        >
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>

                    <p className="toggle-text">
                        Hesabın yok mu?{' '}
                        <span onClick={onSignUpClick}>
                            Hemen Kaydol
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;