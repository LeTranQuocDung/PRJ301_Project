import { useState } from 'react'

// ─── Seed default accounts ────────────────────────────────────────────────────
const SEED_ACCOUNTS = [
  { id: 'admin-default', name: 'Admin',   password: '123456', roleId: 'admin',    role: 'admin' },
  { id: 'mentor-default', name: 'Mentor', password: '123456', roleId: 'teacher',  role: 'teacher' },
  { id: 'user-default',  name: 'Student', password: '123456', roleId: 'student',  role: 'user'  },
]

const getAccounts = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('lucy_accounts') || '[]')
    if (stored.length === 0) {
      localStorage.setItem('lucy_accounts', JSON.stringify(SEED_ACCOUNTS))
      return SEED_ACCOUNTS
    }
    return stored
  } catch { return SEED_ACCOUNTS }
}

const saveAccount = (acc) => {
  const existing = getAccounts()
  existing.push(acc)
  localStorage.setItem('lucy_accounts', JSON.stringify(existing))
}

const AVATARS = [
  { id: 'fox', icon: '🦊', label: 'Cáo', desc: 'Cáo Tinh Nghịch' },
  { id: 'panda', icon: '🐼', label: 'Gấu', desc: 'Gấu Trúc Đáng Yêu' },
  { id: 'owl', icon: '🦉', label: 'Cú', desc: 'Cú Đêm Học Giỏi' },
  { id: 'monkey', icon: '🐒', label: 'Khỉ', desc: 'Khỉ Nhí Nhố' },
  { id: 'penguin', icon: '🐧', label: 'Cánh cụt', desc: 'Cánh Cụt Lạnh Lùng' },
  { id: 'butterfly', icon: '🦋', label: 'Bướm', desc: 'Bướm Xinh Đẹp' },
  { id: 'fish', icon: '🐠', label: 'Cá', desc: 'Cá Vàng Mất Trí' },
  { id: 'parrot', icon: '🦜', label: 'Vẹt', desc: 'Vẹt Lắm Mồm' },
  { id: 'koala', icon: '🐨', label: 'Koala', desc: 'Koala Ngủ Nướng' },
  { id: 'lion', icon: '🦁', label: 'Sư tử', desc: 'Sư Tử Dũng Mãnh' },
]

const API_BASE = import.meta.env.VITE_LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI';

// ─── Input component ──────────────────────────────────────────────────────────
function AuthInput({ label, type = 'text', value, onChange, placeholder, icon }) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.04em' }}>
        {label}
      </label>}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%', padding: `11px 14px 11px ${icon ? '40px' : '14px'}`,
            borderRadius: 12, fontSize: 14, outline: 'none',
            background: focus ? '#f8f9ff' : '#f1f5f9',
            border: `2px solid ${focus ? '#6366f1' : '#e2e8f0'}`,
            color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box',
            transition: 'all 0.2s',
            boxShadow: focus ? '0 0 0 4px rgba(99,102,241,0.1)' : 'none',
          }}
        />
      </div>
    </div>
  )
}

// ─── LoginPage ─────────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const [tab, setTab]           = useState('register')   // Default to register to show the UI
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('fox')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)

  const reset = () => { setName(''); setPassword(''); setConfirm(''); setError(''); setSuccess('') }

  const handleLogin = async () => {
    setError('')
    if (!name.trim() || !password) return setError('Vui lòng nhập tên và mật khẩu.')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: name.trim(), password })
      })
      if (res.ok) {
        const user = await res.json()
        onLogin({ id: user.id, name: user.username, email: user.email, role: user.role, roleId: user.role, avatarUrl: user.avatarUrl })
      } else {
        setError('Sai tên đăng nhập hoặc mật khẩu.')
        setLoading(false)
      }
    } catch (e) {
      setError('Lỗi kết nối Server.')
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setError('')
    if (!name.trim())       return setError('Vui lòng nhập tên đăng nhập.')
    if (!password)          return setError('Vui lòng nhập mật khẩu.')
    if (password !== confirm) return setError('Mật khẩu xác nhận không khớp.')
    
    setLoading(true)
    try {
      const selectedAvatarEmoji = AVATARS.find(a => a.id === selectedAvatar)?.icon || '🦊';
      
      const reqBody = {
        username: name.trim(),
        email: email.trim() || (name.trim() + '@lucy.edu'),
        password: password,
        avatarUrl: selectedAvatarEmoji,
        role: 'student' // Mặc định chỉ đăng ký học viên
      }
      
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      })
      
      if (res.ok) {
        setSuccess('Đăng ký thành công! Đang đăng nhập...')
        const user = await res.json()
        setTimeout(() => onLogin({ id: user.id, name: user.username, email: user.email, role: user.role, roleId: user.role, avatarUrl: user.avatarUrl }), 800)
      } else {
        const err = await res.text()
        setError(err.includes('exists') ? 'Tên đăng nhập đã tồn tại.' : 'Lỗi đăng ký.')
        setLoading(false)
      }
    } catch (e) {
      setError('Lỗi kết nối Server.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #0ea5e9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Background decorations */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'rgba(255,255,255,0.08)', top:'-150px', left:'-120px', animation:'float0 8s ease-in-out infinite alternate' }}/>
        <div style={{ position:'absolute', width:350, height:350, borderRadius:'50%', background:'rgba(255,255,255,0.06)', top:'55%',   right:'-80px',  animation:'float1 10s ease-in-out infinite alternate' }}/>
        <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.1)',  top:'20%',   left:'65%',     animation:'float2 7s ease-in-out infinite alternate' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'48px 48px' }}/>
        {[...Array(12)].map((_,i) => (
          <div key={i} style={{
            position:'absolute', width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.35)',
            top:`${10 + (i*7.5)%80}%`, left:`${5+(i*8.3)%90}%`,
          }}/>
        ))}
      </div>

      <div style={{ display:'flex', gap: 60, alignItems: 'center', zIndex: 1, width: '100%', maxWidth: 1000, padding: 20 }}>
        
        {/* Left branding panel */}
        <div className="fade-up" style={{
          display:'flex', flexDirection:'column', justifyContent:'center',
          flex: 1,
          '@media(max-width:900px)':{display:'none'},
        }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ width:72, height:72, borderRadius:22, background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, marginBottom:20, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.3)' }}>🎵</div>
            <div style={{ fontSize:52, fontWeight:900, color:'#fff', letterSpacing:'-0.05em', lineHeight:1, fontFamily:"'Outfit',sans-serif", textShadow:'0 4px 24px rgba(0,0,0,0.2)' }}>LUCY</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.9)', marginTop:8, fontWeight:700, letterSpacing: '0.1em' }}>LANGUAGE UNITY & COLLABORATIVE YOUTH</div>
            <div style={{ fontSize:16, color:'rgba(255,255,255,0.75)', marginTop:14, fontWeight:400, lineHeight:1.5 }}>Mạng xã hội âm thanh<br/>kết hợp EdTech</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {['💬 Giao tiếp ẩn danh - giảm áp lực tâm lý','🌍 Học English, 中文 & 日本語','🎙 Phòng Live 100 levels theo 3 Stage','👨‍🏫 Mentor dạy theo giáo trình LISA/ZH/JA','🎁 Tặng quà ảo & bảng xếp hạng','🎧 Podcast & Premium Content'].map((t,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', borderRadius:20, padding:'10px 16px', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:13, fontWeight:600, width: 'fit-content' }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Auth card */}
        <div className="fade-up" style={{
          width: 480, flexShrink: 0,
          background:'#ffffff',
          borderRadius:24, padding:'30px 36px 26px',
          boxShadow:'0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.5)',
          maxHeight: '90vh', overflowY: 'auto'
        }}>

          {/* Tabs */}
          <div style={{ display:'flex', background:'#f1f5f9', borderRadius:14, padding:4, marginBottom:20, gap:4 }}>
            {[['login','🔑 Đăng nhập'],['register','✨ Đăng ký']].map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);reset()}} style={{
                flex:1, padding:'10px 0', borderRadius:11, border:'none', cursor:'pointer',
                background: tab===t ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'transparent',
                color: tab===t ? '#fff' : '#64748b',
                fontSize:13.5, fontWeight:700, fontFamily:'inherit', transition:'all 0.2s',
                boxShadow: tab===t ? '0 3px 14px rgba(79,70,229,0.35)' : 'none',
              }}>{l}</button>
            ))}
          </div>

          {error && <div style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626', display:'flex', gap:8, alignItems:'center' }}>⚠️ {error}</div>}
          {success && <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#16a34a', display:'flex', gap:8, alignItems:'center' }}>✅ {success}</div>}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <div className="fade-in">
              <AuthInput label="Tên đăng nhập / Email" value={name}     onChange={setName}     placeholder="Nhập admin hoặc admin@lucy.edu..." icon="👤" />
              <AuthInput label="Mật khẩu"      value={password} onChange={setPassword} placeholder="Nhập mật khẩu..."     icon="🔒" type="password" />

              <button onClick={handleLogin} disabled={loading} style={{
                width:'100%', padding:'13px 0', borderRadius:13, border:'none',
                background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                color: loading ? '#94a3b8' : '#fff', fontSize:15, fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                boxShadow: loading ? 'none' : '0 6px 24px rgba(79,70,229,0.4)',
                transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                marginBottom:16,
              }}>
                {loading ? 'Đang đăng nhập...' : '🔑 Đăng nhập'}
              </button>

              <div style={{ background:'#f8fafc', padding:'16px 20px', borderRadius:12, border:'1px solid #e2e8f0', fontSize:14, color:'#64748b', display:'flex', flexDirection:'column', gap:14 }}>
                <strong style={{ color:'#334155', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>💡 Tài khoản mẫu:</strong>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>👨‍🏫 <span style={{ color:'#6366f1', fontWeight:700 }}>Admin / Pass:123456</span></div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>🧑‍💻 <span style={{ color:'#f97316', fontWeight:700 }}>Mentor / Pass:123456</span></div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>🎓 <span style={{ color:'#10b981', fontWeight:700 }}>Student / Pass:123456</span></div>
              </div>
            </div>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <div className="fade-in">
              <AuthInput value={name}     onChange={setName}     placeholder="Tên đăng nhập..."      icon="👤" />
              <AuthInput value={email}    onChange={setEmail}    placeholder="Email đăng ký..."      icon="✉️" />
              <AuthInput value={password} onChange={setPassword} placeholder="Tạo mật khẩu..."       icon="🔒" type="password" />
              <AuthInput value={confirm}  onChange={setConfirm}  placeholder="Nhập lại mật khẩu..."  icon="🛡" type="password" />

              {/* AVATAR SELECTOR */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 10, letterSpacing: '0.05em' }}>🎭 CHỌN AVATAR ẨN DANH</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, background: '#f8fafc', padding: 12, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  {AVATARS.map((a) => (
                    <div 
                      key={a.id} 
                      onClick={() => setSelectedAvatar(a.id)}
                      style={{ 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
                        padding: '8px 0', borderRadius: 12,
                        background: selectedAvatar === a.id ? '#6366f1' : '#fff',
                        border: `1px solid ${selectedAvatar === a.id ? '#6366f1' : '#e2e8f0'}`,
                        boxShadow: selectedAvatar === a.id ? '0 4px 12px rgba(99,102,241,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 24, lineHeight: 1 }}>{a.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: selectedAvatar === a.id ? '#fff' : '#64748b' }}>{a.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                  {AVATARS.find(a => a.id === selectedAvatar)?.icon} {AVATARS.find(a => a.id === selectedAvatar)?.desc} — Danh tính ẩn trong phòng Live
                </div>
              </div>

              <button onClick={handleRegister} disabled={loading} style={{
                width:'100%', padding:'14px 0', borderRadius:14, border:'none',
                background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                color: loading ? '#94a3b8' : '#fff', fontSize:15, fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                boxShadow: loading ? 'none' : '0 6px 24px rgba(79,70,229,0.4)',
                transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              }}>
                {loading ? 'Đang tạo tài khoản...' : '✨ Tạo tài khoản'}
              </button>
            </div>
          )}

          <div style={{ textAlign:'center', marginTop:20, fontSize:11.5, color:'#94a3b8', fontWeight: 500 }}>
            🌍 English · 中文 · 日本語 — LUCY Platform v2
          </div>
        </div>
      </div>
    </div>
  )
}
