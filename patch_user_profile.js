const fs = require('fs');
const filePath = 'D:/PRJ301/PRJ301_Project_GitHub/src/UserApp.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject state and function into ProfileView
const profileStartStr = 'function ProfileView({ user, xp, streak, completed, onLogout }) {';
const injectedState = `
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const doChangePass = async (e) => {
    e.preventDefault();
    if (!oldPass || !newPass) return alert('Vui lòng nhập đủ thông tin');
    try {
      const res = await fetch('http://localhost:8080/LucyBackendAPI/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, oldPassword: oldPass, newPassword: newPass })
      });
      if (res.ok) {
        alert('Đổi mật khẩu thành công!');
        setOldPass(''); setNewPass(''); setIsChangingPass(false);
      } else {
        const data = await res.json();
        alert('Lỗi: ' + data.error);
      }
    } catch(err) {
      alert('Lỗi kết nối Server');
    }
  };
`;

if (!content.includes('const [oldPass, setOldPass]')) {
  content = content.replace(profileStartStr, profileStartStr + injectedState);
}

// 2. Inject UI before the Logout button
const logoutSectionStr = `<button onClick={onLogout}`;
const injectedUI = `
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>🔒 Bảo mật tài khoản</div>
          <button onClick={() => setIsChangingPass(!isChangingPass)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Đổi mật khẩu</button>
        </div>
        
        {isChangingPass && (
          <form onSubmit={doChangePass} style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Mật khẩu cũ</div>
              <input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Nhập mật khẩu hiện tại..." />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Mật khẩu mới</div>
              <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Nhập mật khẩu mới..." />
            </div>
            <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>Lưu mật khẩu</button>
          </form>
        )}
      </div>\n      <button onClick={onLogout}`;

if (!content.includes('Bảo mật tài khoản')) {
  content = content.replace(logoutSectionStr, injectedUI);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('UserApp ProfileView patched!');
