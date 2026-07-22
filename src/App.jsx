import { useState } from 'react'
import LoginPage from './LoginPage.jsx'
import AdminApp from './AdminApp.jsx'
import UserApp from './UserApp.jsx'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lucy_user')) } catch { return null }
  })

  const handleLogin = (u) => {
    localStorage.setItem('lucy_user', JSON.stringify(u))
    setUser(u)
  }

  const handleLogout = () => {
    localStorage.removeItem('lucy_user')
    setUser(null)
  }

  const isRoleAdmin = (r) => {
    if (!r) return false;
    const str = String(r).toLowerCase();
    return str === 'super' || str === 'pro';
  };

  if (!user) return <LoginPage onLogin={handleLogin} />

  if (isRoleAdmin(user.role) || isRoleAdmin(user.roleId)) {
    return <AdminApp user={user} onLogout={handleLogout} />
  }

  if (user.isActive === false) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 40, borderRadius: 24, backdropFilter: 'blur(10px)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🕒</div>
          <h1 style={{ fontSize: 24, marginBottom: 10 }}>Tài khoản đang chờ duyệt</h1>
          <p style={{ opacity: 0.8, maxWidth: 300, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Xin chào <b>{user.name}</b>, tài khoản của bạn đã được ghi nhận và đang chờ Admin phê duyệt trước khi có thể vào lớp học.
          </p>
          <button onClick={handleLogout} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'white', color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>
            Đăng xuất
          </button>
        </div>
      </div>
    )
  }

  return <UserApp user={user} onLogout={handleLogout} />
}
