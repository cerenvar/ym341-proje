import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';

// onLoginSuccess prop'u App.jsx'ten gelir ve başarılı girişte Home'a geçişi tetikler.
function AuthPage({ onLoginSuccess }) {
    // Hangi formun gösterileceğini tutan yerel durum ('login' veya 'signup')
    const [currentForm, setCurrentForm] = useState('login');

    // Sayfalar arası geçişi yöneten fonksiyon
    const toggleForm = (formName) => {
        setCurrentForm(formName);
    };

    // AuthPage bileşeni sadece Login veya SignUp'ı render eder.

    return (
        <> {/* Fragment kullanıldı, AuthPage'in kendi ekstra div'i yok */}
            {
                currentForm === 'login' ? (
                    // Login bileşenine iki prop iletiyoruz:
                    // 1. Kayıt olmaya geçiş butonu için 'onSignUpClick'
                    // 2. Başarılı giriş sonrası ana sayfaya geçiş için 'onLogin' (onLoginSuccess'ı kullanır)
                    <Login
                        onSignUpClick={() => toggleForm('signup')}
                        onLogin={onLoginSuccess}
                    />
                ) : (
                    // SignUp bileşenine iki prop iletiyoruz:
                    // 1. Giriş yapmaya geçiş butonu için 'onLoginClick'
                    // 2. Kayıt sonrası otomatik Logine dönmek için 'onSignUpSuccess'
                    <SignUp
                        onLoginClick={() => toggleForm('login')}
                        onSignUpSuccess={() => toggleForm('login')}
                    />
                )
            }
        </>
    );
}


export default AuthPage;