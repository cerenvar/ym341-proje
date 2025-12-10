import { useState } from 'react';

function AiAsistan() {
  const [acik, setAcik] = useState(false); // Başlangıçta kapalı (sadece buton)
  const [mesaj, setMesaj] = useState('');
  const [sohbetGecmisi, setSohbetGecmisi] = useState([
    { gonderen: 'bot', metin: 'Merhaba! Ben OgrenPort Asistanı. Akademik takvim, dersler veya kulüpler hakkında bana soru sorabilirsin.' }
  ]);
  const [yukleniyor, setYukleniyor] = useState(false);

  const mesajGonder = async () => {
    if (!mesaj.trim()) return;

    const yeniGecmis = [...sohbetGecmisi, { gonderen: 'ben', metin: mesaj }];
    setSohbetGecmisi(yeniGecmis);
    setMesaj('');
    setYukleniyor(true);

    try {
      const cevap = await fetch('http://localhost:3001/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: mesaj })
      });
      const veri = await cevap.json();
      setSohbetGecmisi([...yeniGecmis, { gonderen: 'bot', metin: veri.reply }]);
    } catch (error) {
      console.error('Hata:', error);
      setSohbetGecmisi([...yeniGecmis, { gonderen: 'bot', metin: 'Bağlantı hatası oluştu.' }]);
    } finally {
      setYukleniyor(false);
    }
  };

  // --- DURUM 1: KAPALIYSA (Sadece Mor Buton) ---
  if (!acik) {
    return (
      <button 
        onClick={() => setAcik(true)}
        style={{
          width: '60px', height: '60px', borderRadius: '50%', 
          backgroundColor: '#6f42c1', // <-- İŞTE MOR RENK BURADA
          color: 'white', border: 'none',
          fontSize: '30px', cursor: 'pointer', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'} // Üstüne gelince büyüsün
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        💬
      </button>
    );
  }

  // --- DURUM 2: AÇIKSA (Sohbet Penceresi) ---
  return (
    <div style={{ 
      width: '350px', backgroundColor: 'white', borderRadius: '15px',
      boxShadow: '0 5px 20px rgba(0,0,0,0.3)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s'
    }}>
      {/* Başlık (Uyumlu olması için burayı da mor yaptım) */}
      <div style={{ 
        backgroundColor: '#6f42c1', color: 'white', padding: '15px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>🤖 OgrenPort Asistan</h3>
        <button 
          onClick={() => setAcik(false)} 
          style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}
        >
          ✖
        </button>
      </div>

      {/* Sohbet Alanı */}
      <div style={{ 
        height: '350px', overflowY: 'auto', padding: '15px', 
        backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        {sohbetGecmisi.map((chat, index) => (
          <div key={index} style={{ 
            alignSelf: chat.gonderen === 'ben' ? 'flex-end' : 'flex-start',
            maxWidth: '80%', padding: '10px 15px', borderRadius: '15px',
            backgroundColor: chat.gonderen === 'ben' ? '#6f42c1' : '#e9ecef', // Mesaj balonunu da mor yaptım
            color: chat.gonderen === 'ben' ? 'white' : 'black',
            fontSize: '0.9rem'
          }}>
            {chat.metin}
          </div>
        ))}
        {yukleniyor && <div style={{ alignSelf: 'flex-start', color: '#888', fontSize: '0.8rem' }}>Yazıyor...</div>}
      </div>

      {/* Input Alanı */}
      <div style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '5px' }}>
        <input 
          type="text" 
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          placeholder="Sorunuzu yazın..."
          onKeyPress={(e) => e.key === 'Enter' && mesajGonder()}
          style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' }}
        />
        <button 
          onClick={mesajGonder}
          style={{ 
            backgroundColor: '#28a745', color: 'white', border: 'none', 
            borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' 
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default AiAsistan;
