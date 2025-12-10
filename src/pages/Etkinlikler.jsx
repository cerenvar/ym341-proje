import { useState, useEffect } from 'react';

function Etkinlikler() {
  const [etkinlikler, setEtkinlikler] = useState([]);
  const [katildiklarim, setKatildiklarim] = useState({});
  const [analizSonucu, setAnalizSonucu] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Yorum Popup
  const [yorumModalAcik, setYorumModalAcik] = useState(false);
  const [secilenEtkinlikId, setSecilenEtkinlikId] = useState(null);
  const [yeniYorum, setYeniYorum] = useState("");
  const [yeniPuan, setYeniPuan] = useState(5);

  // Filtreler
  const [aramaMetni, setAramaMetni] = useState("");
  const [secilenKulup, setSecilenKulup] = useState("Tümü");
  const [aktifSekme, setAktifSekme] = useState("tum");

  // AI Asistan State'leri
  const [aiModalAcik, setAiModalAcik] = useState(false);
  const [ilgiAlaniGiris, setIlgiAlaniGiris] = useState("");
  const [onerilenEtkinlikler, setOnerilenEtkinlikler] = useState(null);
  const [aiYukleniyor, setAiYukleniyor] = useState(false);

  // --- DÜZELTME 1: useEffect GÜNCELLENDİ ---
  useEffect(() => {
    // 1. Tüm Etkinlikleri Getir
    fetch('http://localhost:3001/api/activities')
      .then(res => res.json())
      .then(data => setEtkinlikler(data))
      .catch(err => console.error(err));

    // 2. YENİ EKLENEN: Benim Katıldıklarımı Getir (Sayfa yenilenince hatırlaması için)
    fetch('http://localhost:3001/api/activities/my-joined-events', { credentials: 'include' })
      .then(res => res.json())
      .then(ids => {
        if (Array.isArray(ids)) {
          // Gelen ID listesini { 1: true, 3: true } formatına çevir
          const katilimObjesi = {};
          ids.forEach(id => {
            katilimObjesi[id] = true;
          });
          setKatildiklarim(katilimObjesi);
        }
      })
      .catch(err => console.error("Katılım verisi çekilemedi:", err));
  }, []);

  // --- DÜZELTME 2: credentials: 'include' EKLENDİ ---
  const etkinligeKatil = (id) => {
    // credentials: 'include' sayesinde oturum çerezi sunucuya gider
    fetch(`http://localhost:3001/api/activities/join/${id}`, { method: 'POST', credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
            alert(data.error); // Giriş yapmamışsa uyarı ver
        } else {
            setEtkinlikler(etkinlikler.map(etkinlik => 
              etkinlik.id === id ? { ...etkinlik, katilimci_sayisi: data.yeniSayi } : etkinlik
            ));
            setKatildiklarim({ ...katildiklarim, [id]: true });
        }
      })
      .catch(err => console.error(err));
  };

  const yorumGonder = async () => {
    if (!yeniYorum.trim()) return alert("Lütfen bir yorum yazın.");
    try {
      await fetch('http://localhost:3001/api/feedback/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etkinlik_id: secilenEtkinlikId,
          ogrenci_adi: "Öğrenci",
          yorum: yeniYorum,
          puan: yeniPuan
        })
      });
      alert("Yorumunuz kaydedildi! 🎉");
      setYorumModalAcik(false);
      setYeniYorum("");
    } catch (error) { alert("Hata oluştu."); }
  };

  const raporuGetir = async (id) => {
    setYukleniyor(true);
    setAnalizSonucu(null);
    try {
      const res = await fetch(`http://localhost:3001/api/feedback/analyze/${id}`);
      const data = await res.json();
      setAnalizSonucu(data.analiz);
    } catch (error) { alert("Analiz alınamadı."); } 
    finally { setYukleniyor(false); }
  };

  const aiOneriGetir = async () => {
    if (!ilgiAlaniGiris.trim()) return alert("Lütfen ilgi alanlarınızı yazın!");
    
    setAiYukleniyor(true);
    setOnerilenEtkinlikler(null);

    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ilgiAlanlari: ilgiAlaniGiris })
        });
        const data = await res.json();
        if (Array.isArray(data)) {
            setOnerilenEtkinlikler(data);
        } else {
            setOnerilenEtkinlikler([]);
        }
      } catch (error) {
        console.error("Öneri hatası", error);
        alert("AI şu an yanıt veremiyor.");
      } finally {
        setAiYukleniyor(false);
      }
    }, 1500);
  };

  const tumKulupler = ["Tümü", ...new Set(etkinlikler.map(e => e.kulup_adi))];

  const filtrelenmisEtkinlikler = etkinlikler.filter(etkinlik => {
    const metinUyumu = etkinlik.baslik.toLowerCase().includes(aramaMetni.toLowerCase()) || etkinlik.aciklama.toLowerCase().includes(aramaMetni.toLowerCase());
    const kulupUyumu = secilenKulup === "Tümü" || etkinlik.kulup_adi === secilenKulup;
    const sekmeUyumu = aktifSekme === "tum" || katildiklarim[etkinlik.id];
    return metinUyumu && kulupUyumu && sekmeUyumu;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>📅 Kampüs Etkinlikleri</h1>

      {/* Sekmeler */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        <button onClick={() => setAktifSekme("tum")} style={{ padding: '10px 30px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: aktifSekme === "tum" ? '#6f42c1' : '#e0e0e0', color: aktifSekme === "tum" ? 'white' : '#555' }}>Tüm Etkinlikler</button>
        <button onClick={() => setAktifSekme("katildiklarim")} style={{ padding: '10px 30px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: aktifSekme === "katildiklarim" ? '#6f42c1' : '#e0e0e0', color: aktifSekme === "katildiklarim" ? 'white' : '#555' }}>Katıldıklarım 🎫</button>
      </div>

      {/* Filtre ve AI Butonu */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Etkinlik ara..." 
          value={aramaMetni} 
          onChange={(e) => setAramaMetni(e.target.value)} 
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '200px' }} 
        />
        
        <button 
          onClick={() => setAiModalAcik(true)}
          style={{
            background: 'linear-gradient(45deg, #6f42c1, #007bff)',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          ✨ AI Öneri
        </button>

        <select value={secilenKulup} onChange={(e) => setSecilenKulup(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '150px' }}>
          {tumKulupler.map((kulup, index) => <option key={index} value={kulup}>{kulup}</option>)}
        </select>
      </div>

      {/* Yorum Modal */}
      {yorumModalAcik && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '400px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Etkinliği Değerlendir ⭐</h3>
            <div style={{ margin: '20px 0', fontSize: '24px' }}>
              {[1, 2, 3, 4, 5].map(yildiz => (
                <span key={yildiz} onClick={() => setYeniPuan(yildiz)} style={{ cursor: 'pointer', color: yildiz <= yeniPuan ? '#ffc107' : '#ddd' }}>★</span>
              ))}
            </div>
            <textarea rows="4" placeholder="Düşünceleriniz..." value={yeniYorum} onChange={(e) => setYeniYorum(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setYorumModalAcik(false)} style={{ flex: 1, padding: '10px', background: '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>İptal</button>
              <button onClick={yorumGonder} style={{ flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Gönder</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Rapor Modal */}
      {analizSonucu && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', width: '80%', maxWidth: '600px', zIndex: 2000, maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
             <h2 style={{ color: '#6f42c1', margin: 0 }}>🤖 AI Analiz Raporu</h2>
             <button onClick={() => setAnalizSonucu(null)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✖</button>
          </div>
          <div style={{ marginTop: '20px', whiteSpace: 'pre-line', lineHeight: '1.6', color: '#444' }}>{analizSonucu.replace(/\*\*/g, '')}</div>
        </div>
      )}

      {/* AI Öneri Modalı */}
      {aiModalAcik && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '500px', maxWidth: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, background: '-webkit-linear-gradient(45deg, #6f42c1, #007bff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🤖 Yapay Zeka Asistanı</h2>
              <button onClick={() => setAiModalAcik(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>

            {!onerilenEtkinlikler ? (
              <>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Hangi alanlara ilgin var? Senin için en uygun kulüp ve etkinlikleri analiz edip bulayım.
                </p>
                <input 
                  type="text" 
                  placeholder="Örn: Yazılım, Müzik, Satranç, Doğa..." 
                  value={ilgiAlaniGiris}
                  onChange={(e) => setIlgiAlaniGiris(e.target.value)}
                  style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '2px solid #eee', fontSize: '1rem', marginBottom: '20px', outline: 'none' }}
                />
                <button 
                  onClick={aiOneriGetir} 
                  disabled={aiYukleniyor}
                  style={{ width: '100%', padding: '15px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', cursor: 'pointer', opacity: aiYukleniyor ? 0.7 : 1 }}
                >
                  {aiYukleniyor ? 'Analiz Ediliyor... 🧠' : 'Bana Önerileri Bul 🚀'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ marginBottom: '15px' }}>🎯 Senin İçin Seçtiklerim:</h3>
                {onerilenEtkinlikler.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center' }}>Maalesef bu ilgi alanlarına uygun aktif bir etkinlik bulamadım. 😔</p>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {onerilenEtkinlikler.map(ozelEtkinlik => (
                      <div key={ozelEtkinlik.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '10px', background: '#f8f9fa' }}>
                        <div style={{ fontWeight: 'bold', color: '#6f42c1' }}>{ozelEtkinlik.kulup_adi}</div>
                        <div>{ozelEtkinlik.baslik}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>📅 {new Date(ozelEtkinlik.tarih).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => { setOnerilenEtkinlikler(null); setIlgiAlaniGiris(""); }} style={{ marginTop: '20px', width: '100%', padding: '10px', border: '1px solid #ddd', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Yeni Arama Yap</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
        {filtrelenmisEtkinlikler.map(etkinlik => {
          
          const etkinlikTarihi = new Date(etkinlik.tarih); 
          const suAn = new Date(); 
          const etkinlikBitti = etkinlikTarihi < suAn; 

          const doluMu = etkinlik.katilimci_sayisi >= etkinlik.kontenjan;
          const dolulukOrani = (etkinlik.katilimci_sayisi / etkinlik.kontenjan) * 100;
          const renk = doluMu ? '#dc3545' : (dolulukOrani > 80 ? '#ffc107' : '#28a745');

          return (
            <div key={etkinlik.id} style={{ border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ height: '80px', backgroundColor: '#6f42c1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <h3 style={{ color: 'white', margin: 0 }}>{etkinlik.kulup_adi}</h3>
              </div>
              
              <div style={{ padding: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>{etkinlik.baslik}</h2>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    📍 {etkinlik.konum} <br/> 
                    <span style={{ color: etkinlikBitti ? 'red' : 'green', fontWeight: 'bold' }}>
                        🕒 {etkinlikTarihi.toLocaleDateString('tr-TR')} {etkinlikBitti ? '(Bitti)' : '(Yaklaşıyor)'}
                    </span>
                </p>
                
                <div style={{ margin: '15px 0' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      <span>Katılımcı: {etkinlik.katilimci_sayisi} / {etkinlik.kontenjan}</span>
                      <span style={{ color: renk }}>{doluMu ? 'DOLU' : '%'+Math.round(dolulukOrani)}</span>
                   </div>
                   <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${dolulukOrani}%`, height: '100%', backgroundColor: renk, transition: 'width 0.5s' }}></div>
                   </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#444' }}>{etkinlik.aciklama}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                  
                  <button 
                    onClick={() => etkinligeKatil(etkinlik.id)}
                    disabled={katildiklarim[etkinlik.id] || doluMu} 
                    style={{ 
                      width: '100%', padding: '10px', border: 'none', borderRadius: '6px', cursor: (doluMu) ? 'not-allowed' : 'pointer',
                      backgroundColor: katildiklarim[etkinlik.id] ? '#28a745' : (doluMu ? '#6c757d' : '#007bff'), 
                      color: 'white', fontWeight: 'bold'
                    }}
                  >
                    {katildiklarim[etkinlik.id] ? 'Katıldınız ✅' : (doluMu ? 'Kontenjan Dolu ❌' : 'Katıl')}
                  </button>

                  {katildiklarim[etkinlik.id] && etkinlikBitti && (
                    <button onClick={() => { setSecilenEtkinlikId(etkinlik.id); setYorumModalAcik(true); }} style={{ width: '100%', padding: '8px', border: '1px solid #ffc107', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#fff3cd', color: '#856404', fontWeight: 'bold' }}>
                      ⭐ Etkinliği Değerlendir
                    </button>
                  )}

                  {katildiklarim[etkinlik.id] && !etkinlikBitti && (
                    <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', fontStyle: 'italic', marginTop:'5px' }}>
                       (Etkinlik tamamlanınca değerlendirme açılacaktır)
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Etkinlikler;