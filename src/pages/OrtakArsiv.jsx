import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { universityData } from '../data/universityData'; 

const OrtakArsiv = ({ user }) => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  
  // Filtreler
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // YENİ: Sadece şikayet edilenleri gösterme modu (Sadece Admin için)
  const [showReportedOnly, setShowReportedOnly] = useState(false);

  // Yükleme Formu State'leri
  const [uploadFaculty, setUploadFaculty] = useState('');
  const [uploadDept, setUploadDept] = useState('');

  const [previewNoteId, setPreviewNoteId] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({ title: '', course_code: '', description: '', tags: '' });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/notes');
      setNotes(res.data);
      setFilteredNotes(res.data); 
    } catch (error) { console.error("Notlar yüklenemedi", error); }
  };

  // --- ARAMA VE FİLTRELEME MANTIĞI (GÜNCELLENDİ) ---
  useEffect(() => {
    let result = notes;

    // 1. Şikayet Filtresi (Admin bastıysa)
    if (showReportedOnly) {
      result = result.filter(note => note.is_reported === 1);
    }

    // 2. Ders Kodu
    if (filterCourse) {
      const codeOnly = filterCourse.split(' - ')[0];
      result = result.filter(note => note.course_code.includes(codeOnly));
    }

    // 3. Metin Arama
    if (searchTerm) {
      const textMatch = searchTerm.toLowerCase();
      result = result.filter(note => 
        (note.title + note.description + note.tags + note.course_code).toLowerCase().includes(textMatch)
      );
    }

    setFilteredNotes(result);
  }, [filterCourse, searchTerm, showReportedOnly, notes]);


  // Yardımcı Fonksiyonlar (Filtreler)
  const handleFilterFacultyChange = (e) => { setFilterFaculty(e.target.value); setFilterDept(''); setFilterCourse(''); };
  const handleFilterDeptChange = (e) => { setFilterDept(e.target.value); setFilterCourse(''); };
  const handleUploadFacultyChange = (e) => { setUploadFaculty(e.target.value); setUploadDept(''); setFormData({ ...formData, course_code: '' }); };
  const handleUploadDeptChange = (e) => { setUploadDept(e.target.value); setFormData({ ...formData, course_code: '' }); };

  // Form İşlemleri
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setMessage('Lütfen dosya seçin!'); return; }
    if (!formData.course_code) { setMessage('Lütfen bir ders seçin!'); return; }
    const shortCode = formData.course_code.split(' - ')[0];

    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title);
    data.append('course_code', shortCode);
    data.append('description', formData.description);
    data.append('tags', formData.tags);
    data.append('uploaded_by', user.id); 

    try {
      await axios.post('http://localhost:3001/api/notes', data);
      setMessage('✅ Başarıyla Yüklendi!');
      setFormData({ title: '', course_code: '', description: '', tags: '' });
      setUploadFaculty(''); setUploadDept(''); setFile(null);
      if(fileInputRef.current) fileInputRef.current.value = ""; 
      fetchNotes();
    } catch (error) { setMessage('❌ Hata oluştu.'); }
  };

  // --- AKSİYONLAR ---
  const handleDelete = async (noteId) => {
    if (window.confirm("Silmek istediğine emin misin?")) {
      try {
        // DÜZELTME: URL backtick (`) içine alındı
        await axios.delete(`http://localhost:3001/api/notes/${noteId}`);
        const updatedNotes = notes.filter(n => n.id !== noteId);
        setNotes(updatedNotes); 
        alert("Not silindi. 🗑");
      } catch (error) { alert("Silinemedi."); }
    }
  };

// ====================================================================================
// 🛑 BURASI YENİ/GÜNCELLENEN KISIM: handleLikeToggle FONKSİYONU 🛑
// ====================================================================================
  const handleLikeToggle = async (noteId) => {
    // 1. Kullanıcı girişi kontrolü
    if (!user || !user.id) { 
        alert("Beğenmek için lütfen giriş yapınız.");
        return;
    }

    try {
        const url = `http://localhost:3001/api/notes/like/${noteId}`;
        
        // API İsteği: POST isteği gönderin (Beğeni durumu server'da hesaplanacak)
        const response = await axios.post(url, { userId: user.id });
        const { status } = response.data; // Yanıt: 'liked' veya 'unliked'
        
        // 2. State Güncelleme: Sunucudan gelen yanıta göre not listesini anında güncelle
        setNotes(prevNotes => 
            prevNotes.map(note => {
                if (note.id === noteId) {
                    let newLikes = note.likes || 0;
                    let isUserLiked = note.isUserLiked || false;

                    if (status === 'liked') {
                        newLikes = newLikes + 1;
                        isUserLiked = true;
                    } else if (status === 'unliked') {
                        newLikes = Math.max(0, newLikes - 1); 
                        isUserLiked = false;
                    }

                    return { 
                        ...note, 
                        likes: newLikes, 
                        isUserLiked: isUserLiked 
                    };
                }
                return note;
            })
        );
        
    } catch (error) { 
        console.error("Beğeni isteği başarısız oldu:", error);
        alert("Beğeni işlemi sırasında bir hata oluştu.");
    }
  };
// ====================================================================================


  const handleReport = async (noteId) => {
    if (window.confirm("Bu içeriği bildirmek istiyor musun?")) {
      try {
        // DÜZELTME: URL backtick (`) içine alındı
        await axios.put(`http://localhost:3001/api/notes/report/${noteId}`);
        alert("Bildirildi. 🚩");
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_reported: 1 } : n));
      } catch (error) { console.error(error); }
    }
  };

  // YENİ: Şikayeti Kaldır (Admin)
  const handleUnreport = async (noteId) => {
    if (window.confirm("Şikayet uyarısını kaldırmak istiyor musun? (Not temiz)")) {
      try {
        // DÜZELTME: URL backtick (`) içine alındı
        await axios.put(`http://localhost:3001/api/notes/unreport/${noteId}`);
        alert("Şikayet kaldırıldı. ✅");
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_reported: 0 } : n));
      } catch (error) { console.error(error); }
    }
  };

  // DÜZELTME: URL backtick (`) içine alındı
  const handleDownload = (fileName) => { window.open(`http://localhost:3001/uploads/${fileName}`, '_blank'); };
  const togglePreview = (noteId) => { setPreviewNoteId(previewNoteId === noteId ? null : noteId); };

  const groupedNotes = filteredNotes.reduce((groups, note) => {
    const code = note.course_code;
    if (!groups[code]) groups[code] = [];
    groups[code].push(note);
    return groups;
  }, {});

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom:'50px' }}>
      
      {/* --- ARAMA ALANI --- */}
      <div style={{ marginBottom: '20px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border:'1px solid #ddd' }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
            <h3 style={{margin:0, color:'#555'}}>🔍 Not Ara</h3>
            
            {/* YENİ: ADMİN İÇİN ŞİKAYET BUTONU */}
            {user.role === 'admin' && (
                <button 
                    onClick={() => setShowReportedOnly(!showReportedOnly)}
                    style={{
                        padding: '8px 15px',
                        background: showReportedOnly ? '#dc3545' : 'white',
                        color: showReportedOnly ? 'white' : '#dc3545',
                        border: '2px solid #dc3545',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '5px'
                    }}
                >
                    {showReportedOnly ? '❌ Filtreyi Kaldır' : '⚠ Şikayet Edilenler'}
                </button>
            )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            <select value={filterFaculty} onChange={handleFilterFacultyChange} style={{ padding: '10px', borderRadius:'5px' }}>
                <option value="">Tüm Fakülteler</option>
                {Object.keys(universityData).map(fak => <option key={fak} value={fak}>{fak}</option>)}
            </select>
            <select value={filterDept} onChange={handleFilterDeptChange} disabled={!filterFaculty} style={{ padding: '10px', borderRadius:'5px' }}>
                <option value="">Tüm Bölümler</option>
                {filterFaculty && Object.keys(universityData[filterFaculty]).map(bolum => <option key={bolum} value={bolum}>{bolum}</option>)}
            </select>
            <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} disabled={!filterDept} style={{ padding: '10px', borderRadius:'5px' }}>
                <option value="">Tüm Dersler</option>
                {filterDept && universityData[filterFaculty][filterDept].map(ders => <option key={ders} value={ders}>{ders}</option>)}
            </select>
            <input type="text" placeholder="Kelime ile ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        </div>
      </div>

      {/* --- YÜKLEME FORMU --- */}
      <details style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '30px', cursor:'pointer' }}>
        <summary style={{ fontWeight: 'bold', color: '#28a745', fontSize:'1.1em' }}>📤 Yeni Ders Notu Paylaş (Tıkla)</summary>
        <div style={{ marginTop: '15px' }}>
            {message && <p style={{ color: message.includes('✅') ? 'green' : 'red' }}>{message}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <select value={uploadFaculty} onChange={handleUploadFacultyChange} required style={{ padding: '8px', border:'1px solid #ccc', borderRadius:'4px' }}>
                    <option value="">Fakülte Seçiniz...</option>
                    {Object.keys(universityData).map(fak => <option key={fak} value={fak}>{fak}</option>)}
                </select>
                <select value={uploadDept} onChange={handleUploadDeptChange} disabled={!uploadFaculty} required style={{ padding: '8px', border:'1px solid #ccc', borderRadius:'4px' }}>
                    <option value="">Bölüm Seçiniz...</option>
                    {uploadFaculty && Object.keys(universityData[uploadFaculty]).map(bolum => <option key={bolum} value={bolum}>{bolum}</option>)}
                </select>
                <select name="course_code" value={formData.course_code} onChange={handleChange} disabled={!uploadDept} required style={{ padding: '8px', border:'1px solid #ccc', borderRadius:'4px', gridColumn: '1 / -1' }}>
                    <option value="">Ders Seçiniz...</option>
                    {uploadDept && universityData[uploadFaculty][uploadDept].map(ders => <option key={ders} value={ders}>{ders}</option>)}
                </select>
                <input type="text" name="title" placeholder="Not Başlığı" value={formData.title} onChange={handleChange} required style={{ padding: '8px', border:'1px solid #ccc', borderRadius:'4px' }} />
                <input type="text" name="tags" placeholder="Etiketler" value={formData.tags} onChange={handleChange} style={{ padding: '8px', border:'1px solid #ccc', borderRadius:'4px' }} />
                <textarea name="description" placeholder="Açıklama..." value={formData.description} onChange={handleChange} rows="2" style={{ gridColumn: '1 / -1', padding: '8px', border:'1px solid #ccc', borderRadius:'4px' }}></textarea>
                <input type="file" onChange={handleFileChange} ref={fileInputRef} style={{ gridColumn: '1 / -1' }} />
                <button type="submit" style={{ gridColumn: '1 / -1', background: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' }}>🚀 Paylaş</button>
            </form>
        </div>
      </details>

      {/* --- NOT LİSTESİ --- */}
      <h2 style={{ color: '#333', borderBottom:'2px solid #ddd', paddingBottom:'10px' }}>📚 Paylaşılan Ders Notları</h2>
      
      {Object.keys(groupedNotes).length === 0 ? (
          <div style={{textAlign:'center', padding:'40px', color:'#777'}}>
              <p style={{fontSize:'18px'}}>Bu kriterlere uygun not bulunamadı.</p>
          </div>
      ) : (
          Object.keys(groupedNotes).map(courseCode => (
            <div key={courseCode} style={{ marginBottom: '40px' }}>
                <h3 style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 15px', borderRadius: '5px', display:'inline-block', marginBottom: '15px' }}>
                    📂 {courseCode}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {groupedNotes[courseCode].map((note) => (
                        <div key={note.id} style={{ background: 'white', border: note.is_reported ? '2px solid red' : '1px solid #ddd', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>#{note.id}</span>
                                {note.is_reported === 1 && <span style={{color:'red', fontSize:'12px', fontWeight:'bold', background:'#ffe6e6', padding:'2px 6px', borderRadius:'4px'}}>⚠ Şikayet Edildi</span>}
                            </div>
                            <h4 style={{ margin: '10px 0', fontSize: '18px' }}>{note.title}</h4>
                            <p style={{ color: '#666', fontSize: '14px', minHeight: '40px' }}>{note.description}</p>
                            
                            {previewNoteId === note.id && (
                                <div style={{ margin: '10px 0', padding: '5px', border: '1px dashed #ccc', textAlign:'center', background:'#f9f9f9' }}>
                                    {note.file_type === '.pdf' ? (
                                        // DÜZELTME: src backtick (`) içine alındı
                                        <iframe src={`http://localhost:3001/uploads/${note.file_path}`} width="100%" height="250px" title="PDF"></iframe>
                                    ) : (
                                        // DÜZELTME: src backtick (`) içine alındı
                                        <img src={`http://localhost:3001/uploads/${note.file_path}`} alt="Önizleme" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                                    )}
                                </div>
                            )}

                            <div style={{ fontSize: '12px', color: '#999', marginTop: '10px', borderTop:'1px solid #eee', paddingTop:'10px' }}>
                                👤 {note.uploader_name || 'Bilinmiyor'} | 📅 {new Date(note.created_at).toLocaleDateString()}
                            </div>
                            
                            <div style={{ marginTop: '15px', display: 'flex', gap: '8px', alignItems:'center', flexWrap:'wrap' }}>
                                <button onClick={() => handleDownload(note.file_path)} title="İndir" style={{ flex: 1, background: '#007bff', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>📥</button>
                                <button onClick={() => togglePreview(note.id)} title="Önizle" style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>👁</button>
                                
{/* ==================================================================================== */}
{/* 🛑 BURASI GÜNCELLENEN BUTON KISMI 🛑 */}
                                <button 
                                    onClick={() => handleLikeToggle(note.id)} // Yeni fonksiyonu çağır
                                    title={note.isUserLiked ? "Beğeniyi Geri Al" : "Beğen"} 
                                    style={{ 
                                        background: 'transparent', 
                                        // isUserLiked true ise kırmızı, değilse pembe çerçeve
                                        border: note.isUserLiked ? '1px solid #dc3545' : '1px solid #e83e8c', 
                                        // isUserLiked true ise kırmızı, değilse pembe renk
                                        color: note.isUserLiked ? '#dc3545' : '#e83e8c', 
                                        padding: '6px', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {/* isUserLiked true ise dolu kalp (❤️), değilse boş kalp (🤍) */}
                                    {note.isUserLiked ? '❤️' : '🤍'} {note.likes}
                                </button>
{/* ==================================================================================== */}
                                
                                {/* 1. REPORT (Normal User için) */}
                                {user.id !== note.uploaded_by && !note.is_reported && (
                                    <button onClick={() => handleReport(note.id)} title="Şikayet Et" style={{ background: 'transparent', border: 'none', color: '#6c757d', cursor: 'pointer', fontSize:'16px' }}>🚩</button>
                                )}

                                {/* 2. UN-REPORT (Admin için - Eğer şikayet edildiyse çıkar) */}
                                {user.role === 'admin' && note.is_reported === 1 && (
                                    <button onClick={() => handleUnreport(note.id)} title="Sorun Yok / Temizle" style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>✅ Temizle</button>
                                )}

                                {/* 3. SİLME */}
                                {(user.id === note.uploaded_by || user.role === 'admin') && (
                                    <button onClick={() => handleDelete(note.id)} title="Sil" style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>🗑</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          ))
      )}
    </div>
  );
};

export default OrtakArsiv;