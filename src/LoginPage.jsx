import { useState } from 'react'

// ─── Seed default accounts ────────────────────────────────────────────────────
const SEED_ACCOUNTS = [
  { id: 'admin-default', name: 'Admin',   password: '123456', roleId: 'admin',    role: 'admin' },
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

// ─── Role options ─────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'admin',      icon: '👨‍🏫', label: 'Giảng viên / Admin', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { id: 'student',    icon: '🎓', label: 'Học viên',              color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)' },
  { id: 'influencer', icon: '👑', label: 'Influencer',            color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
]

// ─── Input component ──────────────────────────────────────────────────────────
function AuthInput({ label, type = 'text', value, onChange, placeholder, icon }) {
  const [focus, setFocus] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.04em' }}>
        {label}
      </label>
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
  const [tab, setTab]           = useState('login')   // 'login' | 'register'
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [roleId, setRoleId]     = useState('student')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)

  const reset = () => { setName(''); setPassword(''); setConfirm(''); setError(''); setSuccess('') }

  const handleLogin = () => {
    setError('')
    if (!name.trim() || !password) return setError('Vui lòng nhập tên và mật khẩu.')
    const accounts = getAccounts()
    const acc = accounts.find(a => a.name.toLowerCase() === name.trim().toLowerCase() && a.password === password)
    if (!acc) return setError('Tên đăng nhập hoặc mật khẩu không đúng.')
    setLoading(true)
    setTimeout(() => {
      onLogin({ name: acc.name, role: acc.role, roleId: acc.roleId })
    }, 500)
  }

  const handleRegister = () => {
    setError('')
    if (!name.trim())       return setError('Vui lòng nhập tên đăng nhập.')
    if (name.trim().length < 3) return setError('Tên phải có ít nhất 3 ký tự.')
    if (!password)          return setError('Vui lòng nhập mật khẩu.')
    if (password.length < 6)   return setError('Mật khẩu phải có ít nhất 6 ký tự.')
    if (password !== confirm)   return setError('Mật khẩu xác nhận không khớp.')
    const accounts = getAccounts()
    if (accounts.find(a => a.name.toLowerCase() === name.trim().toLowerCase())) {
      return setError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.')
    }
    const role = roleId === 'admin' ? 'admin' : 'user'
    const newAcc = { id: `user-${Date.now()}`, name: name.trim(), password, roleId, role, createdAt: new Date().toISOString() }
    saveAccount(newAcc)
    setSuccess('Đăng ký thành công! Đang đăng nhập...')
    setLoading(true)
    setTimeout(() => onLogin({ name: newAcc.name, role, roleId }), 800)
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
        {/* Light orbs */}
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'rgba(255,255,255,0.08)', top:'-150px', left:'-120px', animation:'float0 8s ease-in-out infinite alternate' }}/>
        <div style={{ position:'absolute', width:350, height:350, borderRadius:'50%', background:'rgba(255,255,255,0.06)', top:'55%',   right:'-80px',  animation:'float1 10s ease-in-out infinite alternate' }}/>
        <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.1)',  top:'20%',   left:'65%',     animation:'float2 7s ease-in-out infinite alternate' }}/>
        {/* Grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'48px 48px' }}/>
        {/* Dots */}
        {[...Array(12)].map((_,i) => (
          <div key={i} style={{
            position:'absolute', width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.35)',
            top:`${10 + (i*7.5)%80}%`, left:`${5+(i*8.3)%90}%`,
          }}/>
        ))}
      </div>

      {/* Left branding panel */}
      <div className="fade-up" style={{
        display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'0 60px', width:380, flexShrink:0,
        '@media(max-width:900px)':{display:'none'},
      }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ width:72, height:72, borderRadius:22, background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, marginBottom:20, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.3)' }}>🎵</div>
          <div style={{ fontSize:52, fontWeight:900, color:'#fff', letterSpacing:'-0.05em', lineHeight:1, fontFamily:"'Outfit',sans-serif", textShadow:'0 4px 24px rgba(0,0,0,0.2)' }}>LUCY</div>
          <div style={{ fontSize:18, color:'rgba(255,255,255,0.75)', marginTop:10, fontWeight:400, lineHeight:1.5 }}>Nền tảng học ngôn ngữ<br/>thông minh với AI</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {['🌍  Học English, 中文 & 日本語','⚡  Tích XP, lên level mỗi ngày','🎙  Phòng học trực tuyến Live','🤖  Câu hỏi AI do Claude tạo','🔥  Streak & hệ thống huy hiệu'].map((t,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', borderRadius:12, padding:'12px 16px', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', fontSize:13.5, fontWeight:500 }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <div className="fade-up" style={{
        width:'100%', maxWidth:420, margin:'20px 20px',
        background:'#ffffff',
        borderRadius:24, padding:'36px 36px 32px',
        boxShadow:'0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.5)',
        zIndex:1,
      }}>

        {/* Logo (compact) */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius:16, padding:'10px 20px', boxShadow:'0 4px 20px rgba(79,70,229,0.35)' }}>
            <span style={{ fontSize:22 }}>🎵</span>
            <span style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', fontFamily:"'Outfit',sans-serif" }}>LUCY</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:14, padding:4, marginBottom:24, gap:4 }}>
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

        {/* Error / Success messages */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626', display:'flex', gap:8, alignItems:'center' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#16a34a', display:'flex', gap:8, alignItems:'center' }}>
            ✅ {success}
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <div className="fade-in">
            <AuthInput label="Tên đăng nhập" value={name}     onChange={setName}     placeholder="Nhập tên đăng nhập..." icon="👤" />
            <AuthInput label="Mật khẩu"      value={password} onChange={setPassword} placeholder="Nhập mật khẩu..."     icon="🔒" type="password" />

            <button onClick={handleLogin} disabled={loading} style={{
              width:'100%', padding:'13px 0', borderRadius:13, border:'none',
              background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: loading ? '#94a3b8' : '#fff', fontSize:15, fontWeight:700,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
              boxShadow: loading ? 'none' : '0 6px 24px rgba(79,70,229,0.4)',
              transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              marginBottom:16,
            }}
              onMouseEnter={e=>{ if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(79,70,229,0.5)'}}}
              onMouseLeave={e=>{ e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=loading?'none':'0 6px 24px rgba(79,70,229,0.4)' }}
            >
              {loading ? <><div className="spin" style={{ width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(148,163,184,0.5)',borderTopColor:'#94a3b8' }}/> Đang đăng nhập...</>
                       : '🔑 Đăng nhập'}
            </button>

            {/* Demo hint */}
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'11px 14px', fontSize:12, color:'#64748b', lineHeight:1.7 }}>
              <div style={{ fontWeight:700, color:'#475569', marginBottom:4 }}>💡 Tài khoản mẫu:</div>
              <div>👨‍🏫 <strong>Admin</strong> / <strong>123456</strong> — Admin Panel</div>
              <div>🎓 <strong>Student</strong> / <strong>123456</strong> — Học viên</div>
            </div>
          </div>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <div className="fade-in">
            <AuthInput label="Tên đăng nhập (*)"        value={name}     onChange={setName}     placeholder="Tối thiểu 3 ký tự..."      icon="👤" />
            <AuthInput label="Mật khẩu (*)"             value={password} onChange={setPassword} placeholder="Tối thiểu 6 ký tự..."       icon="🔒" type="password" />
            <AuthInput label="Xác nhận mật khẩu (*)"   value={confirm}  onChange={setConfirm}  placeholder="Nhập lại mật khẩu..."        icon="🛡" type="password" />

            {/* Role selection */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:8, letterSpacing:'0.04em' }}>VAI TRÒ CỦA BẠN</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {ROLES.map(r => {
                  const on = roleId === r.id
                  return (
                    <button key={r.id} onClick={()=>setRoleId(r.id)} style={{
                      display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:12,
                      background: on ? r.color + '12' : '#f8fafc',
                      border:`2px solid ${on ? r.color + '60' : '#e2e8f0'}`,
                      cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all 0.2s',
                      boxShadow: on ? `0 2px 16px ${r.color}22` : 'none',
                    }}>
                      <div style={{ width:36,height:36,borderRadius:10,background:on?r.gradient:'#e2e8f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,transition:'all 0.2s' }}>{r.icon}</div>
                      <span style={{ fontSize:13.5,fontWeight:on?700:500,color:on?r.color:'#475569',transition:'color 0.2s' }}>{r.label}</span>
                      {on && <div style={{ marginLeft:'auto',width:20,height:20,borderRadius:'50%',background:r.gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:700 }}>✓</div>}
                    </button>
                  )
                })}
              </div>
            </div>

            <button onClick={handleRegister} disabled={loading} style={{
              width:'100%', padding:'13px 0', borderRadius:13, border:'none',
              background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: loading ? '#94a3b8' : '#fff', fontSize:15, fontWeight:700,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
              boxShadow: loading ? 'none' : '0 6px 24px rgba(79,70,229,0.4)',
              transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            }}
              onMouseEnter={e=>{ if(!loading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 32px rgba(79,70,229,0.5)'}}}
              onMouseLeave={e=>{ e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=loading?'none':'0 6px 24px rgba(79,70,229,0.4)' }}
            >
              {loading ? <><div className="spin" style={{ width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(148,163,184,0.5)',borderTopColor:'#94a3b8' }}/> Đang tạo tài khoản...</>
                       : '✨ Tạo tài khoản'}
            </button>
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:18, fontSize:11.5, color:'#94a3b8' }}>
          🌍 English · 中文 · 日本語 — LUCY Platform
        </div>
      </div>
    </div>
  )
}
