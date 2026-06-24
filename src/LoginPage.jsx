import { useState } from 'react'

// â”€â”€â”€ Seed default accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Role options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ROLES = [
  { id: 'admin',      icon: 'ðŸ‘¨â€ðŸ«', label: 'Giáº£ng viÃªn / Admin', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { id: 'student',    icon: 'ðŸŽ“', label: 'Há»c viÃªn',              color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)' },
  { id: 'influencer', icon: 'ðŸ‘‘', label: 'Influencer',            color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
]

// â”€â”€â”€ Input component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ LoginPage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AVATARS = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Lucy',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Max',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Bella',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Luna',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Leo',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe',
  'https://cdn-icons-png.flaticon.com/512/826/826963.png' // CÃ¡nh cá»¥t
];

export default function LoginPage({ onLogin }) {
  const [tab, setTab]           = useState('login')   // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [roleId, setRoleId]     = useState('student')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('')

  const reset = () => { setName(''); setPassword(''); setConfirm(''); setError(''); setSuccess('') }

  const handleLogin = async () => {
    setError('')
    if (!name.trim() || !password) return setError('Vui lÃ²ng nháº­p tÃªn vÃ  máº­t kháº©u.')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/LucyBackendAPI/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: name.trim(), password })
      })
      if (res.ok) {
        const user = await res.json()
        onLogin({ id: user.id, name: user.username, email: user.email, role: user.role, roleId: user.role, avatarUrl: user.avatarUrl })
      } else {
        setError('Sai tÃªn Ä‘Äƒng nháº­p hoáº·c máº­t kháº©u.')
        setLoading(false)
      }
    } catch (e) {
      setError('Lá»—i káº¿t ná»‘i Server.')
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setError('')
    if (!name.trim())       return setError('Vui lÃ²ng nháº­p tÃªn Ä‘Äƒng nháº­p.')
    if (name.trim().length < 3) return setError('TÃªn pháº£i cÃ³ Ã­t nháº¥t 3 kÃ½ tá»±.')
    if (!password)          return setError('Vui lÃ²ng nháº­p máº­t kháº©u.')
    if (password.length < 6)   return setError('Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±.')
    if (password !== confirm)   return setError('Máº­t kháº©u xÃ¡c nháº­n khÃ´ng khá»›p.')
    
    setLoading(true)
    try {
      // Create user object. Email is set to username@lucy.edu for now if not provided
      const reqBody = {
        username: name.trim(),
        email: email.trim() || (name.trim() + '@lucy.edu'),
        password: password,
        role: 'student' // Always force student
      }
      
      const res = await fetch('http://localhost:8080/LucyBackendAPI/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      })
      
      if (res.ok) {
        setSuccess('ÄÄƒng kÃ½ thÃ nh cÃ´ng! Äang Ä‘Äƒng nháº­p...')
        const user = await res.json()
        setTimeout(() => onLogin({ id: user.id, name: user.username, email: user.email, role: user.role, roleId: user.role }), 800)
      } else {
        const err = await res.text()
        setError(err.includes('exists') ? 'TÃªn Ä‘Äƒng nháº­p Ä‘Ã£ tá»“n táº¡i.' : 'Lá»—i Ä‘Äƒng kÃ½.')
        setLoading(false)
      }
    } catch (e) {
      setError('Lá»—i káº¿t ná»‘i Server.')
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
          <div style={{ width:72, height:72, borderRadius:22, background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, marginBottom:20, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', border:'1px solid rgba(255,255,255,0.3)' }}>ðŸŽµ</div>
          <div style={{ fontSize:52, fontWeight:900, color:'#fff', letterSpacing:'-0.05em', lineHeight:1, fontFamily:"'Outfit',sans-serif", textShadow:'0 4px 24px rgba(0,0,0,0.2)' }}>LUCY</div>
          <div style={{ fontSize:18, color:'rgba(255,255,255,0.75)', marginTop:10, fontWeight:400, lineHeight:1.5 }}>Ná»n táº£ng há»c ngÃ´n ngá»¯<br/>thÃ´ng minh vá»›i AI</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {['ðŸŒ  Há»c English, ä¸­æ–‡ & æ—¥æœ¬èªž','âš¡  TÃ­ch XP, lÃªn level má»—i ngÃ y','ðŸŽ™  PhÃ²ng há»c trá»±c tuyáº¿n Live','ðŸ¤–  CÃ¢u há»i AI do Claude táº¡o','ðŸ”¥  Streak & há»‡ thá»‘ng huy hiá»‡u'].map((t,i)=>(
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
            <span style={{ fontSize:22 }}>ðŸŽµ</span>
            <span style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', fontFamily:"'Outfit',sans-serif" }}>LUCY</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:14, padding:4, marginBottom:24, gap:4 }}>
          {[['login','ðŸ”‘ ÄÄƒng nháº­p'],['register','âœ¨ ÄÄƒng kÃ½']].map(([t,l])=>(
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
            âš ï¸ {error}
          </div>
        )}
        {success && (
          <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#16a34a', display:'flex', gap:8, alignItems:'center' }}>
            âœ… {success}
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <div className="fade-in">
            <AuthInput label="TÃªn Ä‘Äƒng nháº­p / Email" value={name}     onChange={setName}     placeholder="Nháº­p admin hoáº·c admin@lucy.edu..." icon="ðŸ‘¤" />
            <AuthInput label="Máº­t kháº©u"      value={password} onChange={setPassword} placeholder="Nháº­p máº­t kháº©u..."     icon="ðŸ”’" type="password" />

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
              {loading ? <><div className="spin" style={{ width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(148,163,184,0.5)',borderTopColor:'#94a3b8' }}/> Äang Ä‘Äƒng nháº­p...</>
                       : 'ðŸ”‘ ÄÄƒng nháº­p'}
            </button>

            {/* Demo hint */}
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'11px 14px', fontSize:12, color:'#64748b', lineHeight:1.7 }}>
              <div style={{ fontWeight:700, color:'#475569', marginBottom:4 }}>ðŸ’¡ TÃ i khoáº£n máº«u:</div>
              <div>ðŸ‘¨â€ðŸ« <strong>Admin</strong> / <strong>123456</strong> â€” Admin Panel</div>
              <div>ðŸŽ“ <strong>Student</strong> / <strong>123456</strong> â€” Há»c viÃªn</div>
            </div>
          </div>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <div className="fade-in">
            <AuthInput label="Há» vÃ  TÃªn (*)"        value={name}     onChange={setName}     placeholder="VÃ­ dá»¥: Nguyá»…n VÄƒn A..."      icon="ðŸ‘¤" />
            <AuthInput label="Email Ä‘Äƒng kÃ½ (*)"        value={email}    onChange={setEmail}    placeholder="VÃ­ dá»¥: hocvien@lucy.edu"     icon="âœ‰ï¸" />
            <AuthInput label="Máº­t kháº©u (*)"             value={password} onChange={setPassword} placeholder="Tá»‘i thiá»ƒu 6 kÃ½ tá»±..."       icon="ðŸ”’" type="password" />
            <AuthInput label="XÃ¡c nháº­n máº­t kháº©u (*)"   value={confirm}  onChange={setConfirm}  placeholder="Nháº­p láº¡i máº­t kháº©u..."        icon="ðŸ›¡" type="password" />

            
            {/* AVATAR SELECTOR */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Chá»n Avatar cá»§a báº¡n</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {AVATARS.map((url, idx) => (
                  <img 
                    key={idx} 
                    src={url} 
                    alt="avatar" 
                    onClick={() => setSelectedAvatar(url)}
                    style={{ 
                      width: '100%', aspectRatio: '1/1', borderRadius: '50%', cursor: 'pointer',
                      border: selectedAvatar === url ? '3px solid #8b5cf6' : '3px solid transparent',
                      background: '#1e293b', padding: 2, transition: 'all 0.2s',
                      boxShadow: selectedAvatar === url ? '0 0 15px rgba(139,92,246,0.5)' : 'none',
                      opacity: selectedAvatar === url ? 1 : 0.6
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => { if (selectedAvatar !== url) e.currentTarget.style.opacity = 0.6 }}
                  />
                ))}
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
              {loading ? <><div className="spin" style={{ width:18,height:18,borderRadius:'50%',border:'2.5px solid rgba(148,163,184,0.5)',borderTopColor:'#94a3b8' }}/> Äang táº¡o tÃ i khoáº£n...</>
                       : 'âœ¨ Táº¡o tÃ i khoáº£n'}
            </button>
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:18, fontSize:11.5, color:'#94a3b8' }}>
          ðŸŒ English Â· ä¸­æ–‡ Â· æ—¥æœ¬èªž â€” LUCY Platform
        </div>
      </div>
    </div>
  )
}

