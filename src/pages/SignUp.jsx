import React, { useState } from 'react';
import axios from 'axios';
import './AuthForms.css';
import './SignUp.css';

const API_URL = 'http://localhost:3001/api/auth/signup';

function SignUp({ onLoginClick, onSignUpSuccess }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (password !== password2) { 
            setError("Şifreler uyuşmuyor. Lütfen tekrar kontrol edin.");
            setLoading(false); // Eğer şifreler uyuşmazsa loading'i kapat
            return;
        }
        setLoading(true);

        try {
            await axios.post(API_URL, {
                name: name,
                email: email,
                password: password,
                password2: password2
            });

            console.log('Kayıt Başarılı: Kullanıcı oluşturuldu.');

            setSuccess("Kayıt işleminiz başarılı bir şekilde tamamlanmıştır.");

            setName('');
            setEmail('');
            setPassword('');
            setPassword2('');

        } catch (err) {
            let errorMessage = 'Beklenmedik bir ağ hatası oluştu. Lütfen tekrar deneyin.';

            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message;
            } else {
                errorMessage = "Sunucuya ulaşılamıyor (Backend kapalı olabilir).";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-layout">
            <div className="welcome-section">
                <div className="welcome-text-container">
                    <h1 className="welcome-text">Akademiye Adım At</h1>
                </div>
            </div>

            <div className="auth-form-container">
                <div className="form-wrapper signup-form-wrapper">
                    <h2> Hesap Oluştur</h2>

                    {/* Hata Mesajı Gösterme Alanı (Formun üstünde kalsın) */}
                    {error && <div className="message-box error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Ad Soyad"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={!!success}
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="email"
                                placeholder="Üniversite E-postası"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={!!success}
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Şifreyi Girin"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={!!success}
                            />
                             </div>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Şifreyi Tekrar Girin"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                required
                                disabled={!!success}
                            />
                        </div>

                        <button
                            type="submit"
                            className="signup-button"
                            disabled={loading || success}
                        >
                            {loading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
                        </button>

                        {success && (
                            <div className="message-box success" style={{ marginTop: '20px' }}>

                                <p style={{ marginBottom: '10px' }}>{success}</p>
                                <p>
                                    <span
                                        onClick={onLoginClick}
                                        style={{
                                            fontWeight: 'bold',
                                            color: '#004d40',
                                            cursor: 'pointer',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Giriş Yapmak İçin Tıklayın
                                    </span>
                                </p>
                            </div>
                        )}
                        {/* ------------------------------------------------------------------ */}

                    </form>

                    <p className="toggle-text">
                        Zaten hesabın var mı?{' '}
                        <span onClick={onLoginClick}>
                            Giriş Yap
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SignUp;