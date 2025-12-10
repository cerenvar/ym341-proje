import React, { useState, useEffect } from 'react';
import axios from 'axios'; 

const API_BASE_URL = 'http://localhost:3001/api/admin';

function AdminApprovalList() { 
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUnapprovedUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // DÜZELTME: URL backtick (`) içine alındı
            const response = await axios.get(`${API_BASE_URL}/users/unapproved`, { withCredentials: true });
            setUsers(response.data);
        } catch (err) {
            console.error("Listeleme hatası:", err);
            setError("Liste yüklenemedi.");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnapprovedUsers();
    }, []);

    const handleApprove = async (userId, userName) => {
        // DÜZELTME: Mesaj backtick (`) içine alındı
        if (!window.confirm(`${userName} kullanıcısını onaylamak istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            // DÜZELTME: URL backtick (`) içine alındı
            await axios.put(`${API_BASE_URL}/users/approve`, { userId }, { withCredentials: true });
            
            // DÜZELTME: Mesaj backtick (`) içine alındı
            alert(`${userName} başarıyla onaylandı.`);
            fetchUnapprovedUsers(); // Listeyi yenile
        } catch (err) {
            // DÜZELTME: Mesaj backtick (`) içine alındı
            alert(`İşlem başarısız: ${err.response?.data?.message || 'Hata'}`);
        }
    };

    if (loading) return <div>Yükleniyor...</div>;
    
    // --- SADELEŞTİRİLMİŞ ARAYÜZ (Başlık Yok) ---
    return (
        <div>
            {/* HATA VARSA GÖSTER */}
            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

            {/* LİSTE BOŞSA MESAJ GÖSTER */}
            {users.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <h3>🎉 Harika!</h3>
                    <p>Şu an onay bekleyen yeni kullanıcı yok.</p>
                </div>
            ) : (
                /* DOLUYSA TABLOYU GÖSTER */
                <div>
                    <h3 style={{ marginTop: '0' }}>Onay Bekleyenler ({users.length} kişi)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#fff3cd' }}> {/* Ayırt edici olması için sarımsı başlık */}
                                <th style={{ border: '1px solid #ccc', padding: '10px' }}>ID</th>
                                <th style={{ border: '1px solid #ccc', padding: '10px' }}>İsim</th>
                                <th style={{ border: '1px solid #ccc', padding: '10px' }}>E-posta</th>
                                <th style={{ border: '1px solid #ccc', padding: '10px' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ backgroundColor: 'white' }}>
                                    <td style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>{user.id}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '10px' }}>{user.name}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '10px' }}>{user.email}</td>
                                    <td style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleApprove(user.id, user.name)}
                                            style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                                        >
                                            ✅ Onayla
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AdminApprovalList;