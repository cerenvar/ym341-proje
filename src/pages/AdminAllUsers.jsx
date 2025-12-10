import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminAllUsers = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); 
  
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/admin/users', { withCredentials: true });
      setUsers(response.data);
    } catch (error) {
      console.error("Kullanıcılar yüklenemedi:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // SİLME İŞLEMİ (Her Admin yapabilir)
  const handleDelete = async (userId) => {
    if (window.confirm("Bu kullanıcıyı silmek istediğine emin misin?")) {
      try {
        // DÜZELTME: URL backtick (`) içine alındı
        await axios.delete(`http://localhost:3001/api/admin/users/${userId}`, { withCredentials: true });
        setUsers(users.filter(u => u.id !== userId)); 
        alert("Kullanıcı silindi! 🗑");
      } catch (error) {
        console.error(error);
        alert("Silme işlemi başarısız.");
      }
    }
  };

  const handleApprove = async (userId) => {
    try {
      // DÜZELTME: URL backtick (`) içine alındı
      await axios.put(`http://localhost:3001/api/admin/approve`, { userId }, { withCredentials: true });
      setUsers(users.map(u => (u.id === userId ? { ...u, is_approved: 1 } : u)));
    } catch (error) {
      console.error("Onaylama hatası:", error);
    }
  };

  const displayedUsers = activeTab === 'all' 
    ? users 
    : users.filter(u => u.is_approved === 0);

  return (
    <div style={{ padding: '20px' }}>
      
      <h2>Merhaba, Admin {user.name}!</h2>
      
      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
         <button 
           onClick={() => setActiveTab('all')}
           style={{
             padding: '10px 20px', 
             background: activeTab === 'all' ? '#007bff' : '#e9ecef', 
             color: activeTab === 'all' ? 'white' : 'black', 
             border:'none', cursor: 'pointer', borderRadius: '5px'
           }}>
           Tüm Kullanıcılar
         </button>

         <button 
           onClick={() => setActiveTab('pending')}
           style={{
             padding: '10px 20px', 
             background: activeTab === 'pending' ? '#ffc107' : '#e9ecef', 
             color: activeTab === 'pending' ? 'black' : 'black', 
             border:'none', cursor: 'pointer', borderRadius: '5px'
           }}>
           Onay Bekleyenler
         </button>
      </div>

      <h3>
        {activeTab === 'all' ? 'Tüm Kampüs Üyeleri' : 'Onay Bekleyen Kullanıcılar'} 
        ({displayedUsers.length} kişi)
      </h3>
      
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: 'white' }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th>ID</th>
            <th>İsim</th>
            <th>E-posta</th>
            <th>Rol</th>
            <th>Onay Durumu</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {displayedUsers.length > 0 ? (
            displayedUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                {/* İSİMLENDİRMELERİ GÜNCELLEDİK */}
                <td>
                    {u.role === 'admin' ? 
                        <span style={{fontWeight:'bold', color:'#d35400'}}>Admin 🛠</span> : 
                        <span style={{color:'#2c3e50'}}>User 👤</span>
                    }
                </td>
                <td>
                  {u.is_approved ? (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>✅ Onaylı</span>
                  ) : (
                    <button 
                      onClick={() => handleApprove(u.id)}
                      style={{ background: '#ffc107', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius:'4px' }}>
                      Onayla
                    </button>
                  )}
                </td>
                <td>
                  {/* SİLME BUTONU: Kendin hariç herkesi silebilirsin */}
                  {u.id !== user.id && (
                      <button 
                      onClick={() => handleDelete(u.id)}
                      style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}>
                      Sil 🗑
                      </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{textAlign:'center', padding:'20px'}}>Hiç kullanıcı bulunamadı.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminAllUsers;