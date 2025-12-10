import React, { useState, useEffect } from 'react';
import StudentQR from '../components/StudentQR';

function QRPage() {
    const [aktifDers, setAktifDers] = useState(null);
    const [gecmisYoklama, setGecmisYoklama] = useState([]);

    useEffect(() => {
        // 1. Aktif Dersi Çek
        fetch('http://localhost:3001/api/student/active-lesson')
            .then(res => res.json())
            .then(data => setAktifDers(data))
            .catch(err => console.error("Ders bilgisi alınamadı:", err));

        // 2. Yoklama Geçmişini Çek (DÜZELTME: credentials eklendi)
        fetch('http://localhost:3001/api/student/attendance-history', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                console.log("Gelen Veri:", data); // Konsola yazdıralım ki görelim
                setGecmisYoklama(data);
            })
            .catch(err => console.error("Geçmiş alınamadı:", err));
    }, []);

    // ... (Geri kalan return kısmı aynı kalacak) ...
    // Kodu kısaltmamak için tam halini aşağıya koyuyorum:
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: "'Segoe UI', sans-serif" }}>
            
            <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '2.5rem' }}>📷 Ders Yoklama Ekranı</h1>
                <p style={{ color: '#7f8c8d', marginTop: '10px' }}>Derse giriş yapmak için QR kodu okutunuz.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', alignItems: 'start', marginBottom: '60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '1.5rem', background: '#e0d4fc', padding: '5px', borderRadius: '8px' }}>🆔</span>
                        <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Ders Giriş Kartım</h2>
                    </div>
                    <StudentQR />
                </div>

                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '1.5rem', background: '#d4fcda', padding: '5px', borderRadius: '8px' }}>🏫</span>
                        <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Şu Anki Ders</h2>
                    </div>

                    {aktifDers ? (
                        <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee', borderLeft: '5px solid #28a745' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <span style={{ background: '#d4edda', color: '#155724', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span className="blink-dot" style={{width:'8px', height:'8px', background:'#28a745', borderRadius:'50%', display:'inline-block'}}></span>
                                    CANLI DERS
                                </span>
                                <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>{aktifDers.gun}</span>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', color: '#333', margin: '0 0 10px 0' }}>{aktifDers.ders_adi}</h2>
                            <p style={{ fontSize: '1.1rem', color: '#666', margin: '0 0 20px 0' }}>👨‍🏫 {aktifDers.hoca_adi}</p>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1, background: '#f8f9fa', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Saat</div>
                                    <div style={{ fontWeight: 'bold', color: '#333' }}>{aktifDers.baslangic_saati ? aktifDers.baslangic_saati.slice(0,5) : '00:00'} - {aktifDers.bitis_saati ? aktifDers.bitis_saati.slice(0,5) : '00:00'}</div>
                                </div>
                                <div style={{ flex: 1, background: '#f8f9fa', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Derslik</div>
                                    <div style={{ fontWeight: 'bold', color: '#6f42c1' }}>{aktifDers.derslik}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: '#f8f9fa', borderRadius: '20px', padding: '30px', textAlign: 'center', color: '#6c757d', border: '2px dashed #dee2e6', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }}>☕</div>
                            <h3>Şu an aktif bir dersin yok.</h3>
                            <p>Serbest zamanın tadını çıkar!</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '1.5rem', background: '#ffe8cc', padding: '5px', borderRadius: '8px' }}>📋</span>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Yoklama Geçmişim</h2>
                </div>

                <div style={{ backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #eee' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>
                                <th style={{ padding: '15px 20px', color: '#6c757d', fontSize: '0.9rem' }}>DERS ADI</th>
                                <th style={{ padding: '15px 20px', color: '#6c757d', fontSize: '0.9rem' }}>HOCA</th>
                                <th style={{ padding: '15px 20px', color: '#6c757d', fontSize: '0.9rem' }}>TARİH & SAAT</th>
                                <th style={{ padding: '15px 20px', color: '#6c757d', fontSize: '0.9rem' }}>DURUM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gecmisYoklama.length > 0 ? (
                                gecmisYoklama.map((kayit) => (
                                    <tr key={kayit.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#333' }}>{kayit.ders_adi}</td>
                                        <td style={{ padding: '15px 20px', color: '#555' }}>{kayit.hoca_adi}</td>
                                        <td style={{ padding: '15px 20px', color: '#666' }}>
                                            {new Date(kayit.tarih).toLocaleDateString('tr-TR')} <span style={{color:'#ccc'}}>|</span> {new Date(kayit.tarih).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <span style={{ 
                                                backgroundColor: '#d4edda', color: '#155724', 
                                                padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' 
                                            }}>
                                                ✅ {kayit.durum}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                                        Henüz kayıtlı yoklamanız bulunmuyor.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <style>{`
                @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                .blink-dot { animation: blink 1.5s infinite; }
            `}</style>
        </div>
    );
}

export default QRPage;