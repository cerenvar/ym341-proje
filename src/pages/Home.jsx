import React, { useState, useEffect } from 'react';
import './Home.css';
// StudentQR importunu sildik

function Home({ user, onLogout }) {
    const [duyurular, setDuyurular] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3001/api/activities/upcoming')
            .then(res => res.json())
            .then(data => setDuyurular(data))
            .catch(err => console.error("Duyurular çekilemedi:", err));
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', fontFamily: "'Segoe UI', sans-serif" }}>
            
            <header style={{ marginBottom: '40px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '2rem' }}>
                        Merhaba, <span style={{ color: '#6f42c1' }}>{user ? user.name : 'Öğrenci'}</span> 👋
                    </h1>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>Bugün kampüste neler oluyor?</p>
                </div>
            </header>

            {/* DUYURULAR BÖLÜMÜ */}
            <div style={{ marginBottom: '50px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '1.5rem', background: '#e0d4fc', padding: '5px', borderRadius: '8px' }}>🔔</span>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Bu Hafta Yaklaşanlar</h2>
                </div>

                {duyurular.length === 0 ? (
                    <div style={{ padding: '40px', background: 'linear-gradient(to right, #f8f9fa, #e9ecef)', borderRadius: '20px', textAlign: 'center', color: '#6c757d', border: '2px dashed #dee2e6' }}>
                        <h3>🔕 Bu hafta planlanmış bir etkinlik yok.</h3>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', paddingLeft: '5px', scrollbarWidth: 'thin' }}>
                        {duyurular.map((duyuru) => (
                            <div key={duyuru.id} style={{ minWidth: '300px', maxWidth: '300px', backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0', transition: 'transform 0.3s' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ height: '80px', background: 'linear-gradient(135deg, #6f42c1 0%, #a88beb 100%)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
                                    <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '5px 12px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        {duyuru.kulup_adi.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'inline-block', backgroundColor: '#fff3cd', color: '#856404', padding: '5px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px' }}>
                                        📅 {new Date(duyuru.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                    </div>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#2c3e50' }}>{duyuru.baslik}</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#95a5a6' }}>{duyuru.aciklama}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* KULLANICI KARTI */}
            {user && (
                <div style={{ marginTop: '40px', padding: '20px', borderRadius: '15px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#dee2e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                    <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#495057' }}>Hesap Bilgileri</h4>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}><span>ID: {user.id}</span> • <span>{user.email}</span></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;