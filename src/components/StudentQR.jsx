import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

function StudentQR() {
  const [token, setToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5); // 5 saniyelik sayaç
  const [hata, setHata] = useState(null);

  // Sunucudan Yeni QR Token İsteyen Fonksiyon
  const yeniKodGetir = async () => {
    try {
      // credentials: 'include' çok önemli! Oturum bilgisini gönderir.
      const res = await fetch('http://localhost:3001/api/student/generate-qr', { 
        method: 'GET',
        credentials: 'include' 
      });
      
      const data = await res.json();
      
      if (data.error) {
        setHata(data.error);
        setToken(null);
      } else {
        setToken(data.token);
        setTimeLeft(5); 
        setHata(null);
      }
    } catch (err) {
      console.error("QR servisine ulaşılamadı", err);
      setHata("Bağlantı Hatası");
    }
  };

  useEffect(() => {
    yeniKodGetir();

    const interval = setInterval(() => {
      yeniKodGetir();
    }, 5000);

    const countdown = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, []);

  if (hata) return (
    <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '15px', borderRadius: '10px', textAlign: 'center', margin: '20px auto', maxWidth: '350px' }}>
        ⚠️ <strong>Hata:</strong> {hata} <br/>
        Lütfen giriş yaptığınızdan emin olun.
    </div>
  );

  return (
    <div style={{ textAlign: 'center', padding: '25px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxWidth: '350px', margin: '20px auto', border: '1px solid #e0e0e0' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '1.2rem' }}>🆔 Ders Giriş Kimliği</h3>
      
      <div style={{ border: '3px dashed #6f42c1', padding: '15px', borderRadius: '15px', display: 'inline-block', background: '#fdfdfd' }}>
        {token ? (
            <QRCodeSVG value={token} size={180} />
        ) : (
            <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Yükleniyor...
            </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
           Kod her <span style={{color:'#6f42c1', fontWeight:'bold'}}>5 saniyede</span> bir yenilenir.
        </p>
        <div style={{ width: '100%', height: '6px', background: '#e9ecef', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(timeLeft / 5) * 100}%`, background: 'linear-gradient(90deg, #6f42c1, #007bff)', transition: 'width 1s linear' }}></div>
        </div>
      </div>
    </div>
  );
}

export default StudentQR;