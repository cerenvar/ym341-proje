import React, { useState } from 'react';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Etkinlikler from './pages/Etkinlikler'; 
import AiAsistan from './pages/AiAsistan';     
import OrtakArsiv from './pages/OrtakArsiv';   
import AdminAllUsers from './pages/AdminAllUsers.jsx'; 
import QRPage from './pages/QRPage'; // --- YENİ EKLENEN: QR Sayfası ---
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  // Varsayılan sayfa 'home' olarak ayarlandı
  const [activePage, setActivePage] = useState('home'); 

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    console.log("Kullanıcı Giriş Yaptı:", userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setActivePage('home'); // Çıkış yapınca ana sayfaya dön
  };

  // --- AKTİF BUTON STİLİ (Dinamik Renklendirme) ---
  const getButtonStyle = (pageName) => {
    // YEŞİL MARKA RENGİ
    const brandColor = '#28a745'; 

    return {
      padding: '8px 15px',
      marginRight: '10px',
      cursor: 'pointer',
      border: `1px solid ${brandColor}`,
      borderRadius: '5px',
      // Aktifse arka plan yeşil, değilse şeffaf
      backgroundColor: activePage === pageName ? brandColor : 'transparent',
      color: 'white',
      fontWeight: activePage === pageName ? 'bold' : 'normal',
      transition: '0.3s'
    };
  };

  // 1. KONTROL: Eğer kullanıcı giriş yapmışsa
  if (isLoggedIn) {
    return (
      <div className="app-main-container" style={{ fontFamily: 'Arial, sans-serif' }}>
        
        {/* --- NAVBAR --- */}
        <nav style={{ padding: '15px 30px', background: '#333', color: 'white', display: 'flex', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
          
          {/* Logo Kısmı */}
          <h3 style={{ margin: 0, marginRight: '30px', color: '#28a745', fontWeight: 'bold', display:'flex', alignItems:'center', cursor:'pointer' }} onClick={() => setActivePage('home')}>
            <span style={{ marginRight: '10px', fontSize:'1.4rem' }}>🎓</span>
            <span style={{ fontSize:'1.4rem' }}>OgrenPort</span>
          </h3>
          
          {/* Menü Butonları */}
          <div style={{ display: 'flex' }}>
            <button 
              onClick={() => setActivePage('home')} 
              style={getButtonStyle('home')}>
              🏠 Ana Sayfa
            </button>

            <button 
              onClick={() => setActivePage('etkinlikler')} 
              style={getButtonStyle('etkinlikler')}>
              📅 Etkinlikler
            </button>

            <button 
              onClick={() => setActivePage('arsiv')} 
              style={getButtonStyle('arsiv')}>
              📚 Ortak Arşiv
            </button>

            {/* --- YENİ EKLENEN BUTON: QR / YOKLAMA --- */}
            <button 
              onClick={() => setActivePage('qr')} 
              style={getButtonStyle('qr')}>
              📱 QR / Yoklama
            </button>

            {/* Admin Paneli Butonu (Sadece admin görebilir) */}
            {user && user.role === 'admin' && (
               <button 
                 onClick={() => setActivePage('admin')} 
                 style={getButtonStyle('admin')}>
                 🛠 Admin Paneli
               </button>
            )}
          </div>

          {/* Sağ Taraf: Kullanıcı Bilgisi ve Çıkış */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.95rem' }}>Hoş geldin, <strong>{user.name}</strong></span>
            <button 
              onClick={handleLogout} 
              style={{ background: '#d9534f', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
              Çıkış Yap
            </button>
          </div>
        </nav>

        {/* --- İÇERİK ALANI --- */}
        <div style={{ padding: '20px' }}>
          {activePage === 'home' && <Home user={user} onLogout={handleLogout} />}
          {activePage === 'etkinlikler' && <Etkinlikler />}
          {activePage === 'arsiv' && <OrtakArsiv user={user} />}
          
          {/* --- YENİ EKLENEN SAYFA RENDER --- */}
          {activePage === 'qr' && <QRPage />}
          
          {activePage === 'admin' && user.role === 'admin' && (<AdminAllUsers user={user} />)}
        </div>

        {/* --- AI ASİSTAN (Sabit - Sağ Alt Köşe) --- */}
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          zIndex: 9999,
        }}>
           <AiAsistan />
        </div>

      </div>
    );
  }

  // 2. KONTROL: Giriş yapmamışsa
  return (
    <div className="app-container">
      <AuthPage onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}

export default App;
