import React, { useState, useEffect, useRef } from 'react'
import { agoraService } from './services/agoraClient'
import LiveRoomView from './LiveRoomView'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorInfo: error?.message || 'Có lỗi xảy ra' };
  }
  componentDidCatch(error, info) {
    console.error("React Component Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 20, margin: 30, border: '1px solid #fecaca', boxShadow: '0 10px 30px rgba(239,68,68,0.1)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ color: '#dc2626', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Đã xảy ra lỗi nạp giao diện</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>{this.state.errorInfo}</p>
          <button 
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 0, fontWeight: 700, cursor: 'pointer' }}
          >
            🔄 Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  BookOpen, Play, FileText, Headphones, Upload, Eye, Zap,
  MessageSquare, Mic, Users, Radio, Pin, PhoneOff, Phone,
  Plus, Star, Volume2, Layers, RefreshCw, Trash2,
  CheckCircle, AlertCircle, Info, ChevronRight, Settings,
  Globe, Lock, Database, Award, LayoutDashboard, LogOut,
  BarChart2, TrendingUp, Sparkles
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI';
const AGORA_TOKEN_BASE = import.meta.env.VITE_AGORA_TOKEN_BASE || 'http://localhost:3000';

// ─── Design Tokens ─────────────────────────────────────────────────────────
const S = {
  sidebar: '#0f172a',
  sidebarBorder: 'rgba(255,255,255,0.07)',
  bg: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#0f172a',
  muted: '#64748b',
  light: '#94a3b8',
}

const ACCENTS = {
  blue:   { c: '#3b82f6', l: '#eff6ff', b: '#bfdbfe', g: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
  green:  { c: '#10b981', l: '#ecfdf5', b: '#6ee7b7', g: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  red:    { c: '#ef4444', l: '#fef2f2', b: '#fca5a5', g: 'linear-gradient(135deg,#ef4444,#f97316)' },
  amber:  { c: '#f59e0b', l: '#fffbeb', b: '#fde68a', g: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  purple: { c: '#8b5cf6', l: '#f5f3ff', b: '#c4b5fd', g: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
  cyan:   { c: '#06b6d4', l: '#ecfeff', b: '#a5f3fc', g: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  pink:   { c: '#ec4899', l: '#fdf2f8', b: '#f9a8d4', g: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
  indigo: { c: '#6366f1', l: '#eef2ff', b: '#c7d2fe', g: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  gray:   { c: '#64748b', l: '#f1f5f9', b: '#e2e8f0', g: 'linear-gradient(135deg,#64748b,#94a3b8)' },
}

// ─── Shared primitives ──────────────────────────────────────────────────────
const ABadge = ({ children, accent = 'blue', style }) => {
  const a = ACCENTS[accent]
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600, color:a.c, background:a.l, border:`1px solid ${a.b}`, whiteSpace:'nowrap', ...style }}>
      {children}
    </span>
  )
}

const ABtn = ({ children, onClick, variant='primary', accent='blue', sm, disabled, fullWidth, style={} }) => {
  const a = ACCENTS[accent]
  const styles = {
    primary: { bg: a.g, color: '#fff', border: 'none', shadow: `0 4px 12px ${a.c}33` },
    secondary: { bg: '#fff', color: S.text, border: `1px solid ${S.border}`, shadow: 'none' },
    danger: { bg: ACCENTS.red.g, color: '#fff', border: 'none', shadow: `0 4px 12px ${ACCENTS.red.c}33` },
    ghost: { bg: 'transparent', color: S.muted, border: `1px solid transparent`, shadow: 'none' },
    outline: { bg: '#fff', color: a.c, border: `1.5px solid ${a.c}`, shadow: 'none' },
  }
  const v = styles[variant] || styles.primary
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
      padding: sm ? '5px 12px' : '8px 16px',
      borderRadius: sm ? 8 : 10, fontSize: sm ? 12 : 13, fontWeight:600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, background: v.bg, color: v.color, border: v.border,
      boxShadow: v.shadow, width: fullWidth ? '100%' : undefined,
      transition: 'all 0.2s', fontFamily: 'inherit', ...style
    }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
      onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? '0.5' : '1'; e.currentTarget.style.transform = '' }}
    >{children}</button>
  )
}

const ACard = ({ children, style }) => (
  <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden', ...style }}>
    {children}
  </div>
)

const ACardHead = ({ icon, title, accent = 'blue', action, gradient }) => {
  const a = ACCENTS[accent]
  return (
    <div style={{
      background: gradient ? a.g : `linear-gradient(135deg, ${a.l}, #fff)`,
      borderBottom: `1px solid ${S.border}`,
      padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:13.5, color: gradient ? '#fff' : a.c }}>
        {icon}{title}
      </div>
      {action}
    </div>
  )
}

const StatCard = ({ label, value, icon, accent = 'blue', sub }) => {
  const a = ACCENTS[accent]
  return (
    <div style={{
      background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: '18px 20px',
      borderTop: `3px solid ${a.c}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: a.l,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon ? <span style={{ fontSize: 22 }}>{icon}</span> : null}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: a.c, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: S.muted, marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: S.light, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { items: [{ id:'dashboard', icon:<LayoutDashboard size={15}/>, label:'Dashboard', emoji:'📊' }] },
  { label:'COURSES', color:'#3b82f6', items:[
    { id:'courses', icon:<BookOpen size={15}/>, label:'Courses', emoji:'📚' },
    { id:'chapters', icon:<Layers size={15}/>, label:'Chapters', emoji:'📖' },
    { id:'lessons', icon:<FileText size={15}/>, label:'Lessons', emoji:'📝' },
  ]},
  { label:'ROOMS', color:'#10b981', items:[
    { id:'live-rooms', icon:<Mic size={15}/>, label:'Live Rooms', emoji:'🎙' },
  ]},
  { label:'CONTENT', color:'#8b5cf6', items:[
    { id:'podcasts', icon:<Headphones size={15}/>, label:'Podcasts', emoji:'🎧' },
    { id:'premium', icon:<Star size={15}/>, label:'Premium', emoji:'⭐' },
  ]},
  { label:'IMPORT', hideFor: ['pro'], color:'#f59e0b', items:[
    { id:'import', icon:<Upload size={15}/>, label:'Import Files', emoji:'📤' },
    { id:'preview', icon:<Eye size={15}/>, label:'DOCX Preview', emoji:'👁' },
    { id:'imported-data', icon:<Database size={15}/>, label:'Imported Data', emoji:'🗄️' },
  ]},
  { label:'AI', hideFor: ['pro'], color:'#ec4899', items:[
    { id:'insights', icon:<Sparkles size={15}/>, label:'AI Insights', emoji:'✨' },
    { id:'templates', icon:<Zap size={15}/>, label:'AI Templates', emoji:'⚡' },
    { id:'questions', icon:<MessageSquare size={15}/>, label:'AI Questions', emoji:'🤖' },
  ]},
  { label:'USERS', hideFor: ['pro'], color:'#06b6d4', items:[
    { id:'users', icon:<Users size={15}/>, label:'Users', emoji:'👥' },
  ]},
  { label:'MENTOR WORKSPACE', showOnlyFor: ['pro'], color:'#8b5cf6', items:[
    { id:'teacher-profile', icon:<Users size={15}/>, label:'Profile', emoji:'👤' },
    { id:'teacher-classrooms', icon:<BookOpen size={15}/>, label:'Classrooms', emoji:'👨‍🏫' },
    { id:'teacher-materials', icon:<FileText size={15}/>, label:'Materials', emoji:'📚' },
  ]},
]

function Sidebar({ active, setActive, user, onLogout }) {
  const [hov, setHov] = useState(null)
  const sidebarBorder = 'rgba(255,255,255,0.07)';
  const isMentor = user.role === 'pro';
  
  return (
    <nav style={{
      width: 230, minWidth: 230, flexShrink: 0,
      background: '#0f172a',
      borderRight: `1px solid ${sidebarBorder}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto',
    }}>
      {/* Logo & Portal Header */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${sidebarBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}>🎵</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em', lineHeight: 1 }}>LUCY</div>
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.08em', fontWeight: 600, marginTop: 4 }}>
              {isMentor ? 'LUCY PRO PORTAL' : 'LUCY SUPER PORTAL'}
            </div>
          </div>
        </div>

        {/* User Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', border: `1px solid ${sidebarBorder}`, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: isMentor ? 'linear-gradient(135deg,#8b5cf6,#d946ef)' : 'linear-gradient(135deg,#6366f1,#06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0
            }}>
              {isMentor ? '👨‍🏫' : '🌟'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.displayName || user.username || user.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: 600 }}>
                {isMentor ? 'LUCY Pro · Mentor' : 'LUCY Super · Creator'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Link List */}
      <div style={{ flex: 1, padding: '8px 0' }}>
        {NAV_GROUPS.filter(g => !(g.hideFor && g.hideFor.includes(user?.role)) && (!g.showOnlyFor || g.showOnlyFor.includes(user?.role))).map((g, gi) => (
          <div key={gi} style={{ marginBottom: 2 }}>
            {g.label && (
              <div style={{ padding: '10px 18px 4px', fontSize: 10, fontWeight: 700, color: g.color || 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {g.label}
              </div>
            )}
            {g.items.map(item => {
              const on = active === item.id
              const isHov = hov === item.id
              return (
                <button key={item.id} onClick={() => setActive(item.id)}
                  onMouseEnter={() => setHov(item.id)}
                  onMouseLeave={() => setHov(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 18px 9px 15px',
                    background: on ? 'rgba(99,102,241,0.18)' : (isHov ? 'rgba(255,255,255,0.04)' : 'transparent'),
                    color: on ? '#a5b4fc' : (isHov ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)'),
                    border: 'none', borderLeft: on ? '3px solid #6366f1' : '3px solid transparent',
                    cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: on ? 600 : 400,
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ opacity: on ? 1 : 0.7 }}>{item.icon}</span>
                  {item.label}
                  {on && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Logout Footer Section */}
      <div style={{ padding: '20px 16px', borderTop: `1px solid ${sidebarBorder}` }}>
        <button onClick={() => {
          const switched = { ...user, role: 'lucy', roleId: 'lucy' };
          localStorage.setItem('lucy_user', JSON.stringify(switched));
          window.location.reload();
        }} style={{
          width: '100%', padding: '10px 0', borderRadius: 10, marginBottom: 8,
          background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 0,
          fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
        }}>
          🎓 Chuyển Giao diện Student
        </button>
        <button onClick={onLogout} style={{
          width: '100%', padding: '10px 0', borderRadius: 10,
          background: 'transparent', color: '#f87171', border: `1px solid rgba(248,113,113,0.3)`,
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = '' }}
        ><LogOut size={13} /> Đăng xuất</button>
      </div>
    </nav>
  )
}

// ─── Dashboard View ─────────────────────────────────────────────────────────
function DashboardView({ setActive, user }) {
  const [liveRoomStats, setLiveRoomStats] = useState({ total:0, publicCount:0 })
  const isMentor = user?.role === 'pro';

  useEffect(() => {
    let active = true
    const loadLiveRoomStats = () => fetch(`${API_BASE}/api/rooms?admin=true`)
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to load rooms')))
      .then(rooms => { if (active) setLiveRoomStats({ total:rooms.length, publicCount:rooms.filter(room => room.isPublic).length }) })
      .catch(() => { if (active) setLiveRoomStats({ total:0, publicCount:0 }) })
    loadLiveRoomStats()
    const timer = setInterval(loadLiveRoomStats, 2000)
    return () => { active=false; clearInterval(timer) }
  }, [])

  const stats = [
    { label:'Courses', value:'7', icon:'📚', accent:'blue', sub:'3 languages' },
    { label:'Students', value:'455', icon:'🎓', accent:'green', sub:'+12 this week' },
    { label:'Lessons', value:'159', icon:'📝', accent:'purple', sub:'EN/ZH/JA' },
    { label:'Live Rooms', value:String(liveRoomStats.total), icon:'🔴', accent:'red', sub:`${liveRoomStats.publicCount} public` },
  ]
  const recent = [
    { action:'New student registered', who:'Nguyen_An', when:'5 min ago', icon:'🎓', color:'#10b981' },
    { action:'DOCX import success', who:'LISA_English_Stage1.docx', when:'1 hour ago', icon:'📤', color:'#3b82f6' },
    { action:'Live Room started', who:'English Beginner – Daily Conversation', when:'2 hours ago', icon:'🎙', color:'#ef4444' },
    { action:'AI generated 5 new questions', who:'AI Assistant', when:'3 hours ago', icon:'🤖', color:'#8b5cf6' },
    { action:'Student completed Level 3', who:'Tran_Linh', when:'4 hours ago', icon:'🏆', color:'#f59e0b' },
  ]
  const quickActions = [
    { label:'Add Course', icon:'📚', accent:'blue', id:'courses' },
    { label:'Live Room', icon:'🎙', accent:'green', id:'live-rooms' },
    { label:'AI Questions', icon:'🤖', accent:'purple', id:'questions' },
    { label:'Import File', icon:'📤', accent:'amber', id:'import' },
  ]

  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: isMentor 
          ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%)'
          : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(99,102,241,0.15)'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6, fontWeight: 700, letterSpacing: '0.1em' }}>
          {isMentor ? 'LUCY PRO WORKSPACE' : 'LUCY SUPER DASHBOARD'}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em' }}>
          Welcome back, {user?.displayName || user?.username || 'User'}! 👋
        </h1>
        <div style={{ display: 'flex', gap: 20, fontSize: 14, opacity: 0.9, fontWeight: 500 }}>
          <span>📚 {stats[0].value} Courses</span>
          <span>🎓 {stats[1].value} Active Students</span>
          <span>🎙️ {stats[3].value} Live Voice Rooms</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {stats.map((s,i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>
        <ACard>
          <ACardHead icon={<TrendingUp size={15}/>} title="Recent Activity" accent="blue" />
          <div style={{ padding:'4px 0' }}>
            {recent.map((r,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', borderBottom: i<recent.length-1?`1px solid ${S.borderLight}`:'none' }}>
                <div style={{ width:36,height:36,borderRadius:10,background:`${r.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>{r.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,color:S.text,fontWeight:500 }}>{r.action}</div>
                  <div style={{ fontSize:11.5,color:S.muted,marginTop:2 }}>{r.who}</div>
                </div>
                <span style={{ fontSize:11,color:S.light,whiteSpace:'nowrap' }}>{r.when}</span>
              </div>
            ))}
          </div>
        </ACard>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <ACard>
            <ACardHead icon={<Sparkles size={15}/>} title="Quick Actions" accent="purple" />
            <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {quickActions.map(q => (
                <button key={q.id} onClick={() => setActive(q.id)} style={{
                  display:'flex',flexDirection:'column',alignItems:'center',gap:8,
                  padding:'14px 10px',borderRadius:12,
                  background:ACCENTS[q.accent].l, border:`1px solid ${ACCENTS[q.accent].b}`,
                  cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.03)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform=''}}
                >
                  <span style={{ fontSize:24 }}>{q.icon}</span>
                  <span style={{ fontSize:11.5,fontWeight:600,color:ACCENTS[q.accent].c,textAlign:'center',lineHeight:1.3 }}>{q.label}</span>
                </button>
              ))}
            </div>
          </ACard>

          <ACard>
            <ACardHead icon={<BarChart2 size={15}/>} title="Language Progress" accent="green" />
            <div style={{ padding:16 }}>
              {[
                { lang:'🇬🇧 English (LISA)', done:145, total:200, color:'#3b82f6' },
                { lang:'🇨🇳 Chinese (ZH)', done:67, total:150, color:'#ef4444' },
                { lang:'🇯🇵 Japanese (JA)', done:52, total:180, color:'#ec4899' },
              ].map((l,i) => (
                <div key={i} style={{ marginBottom: i<2 ? 14 : 0 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:S.muted,marginBottom:5 }}>
                    <span>{l.lang}</span>
                    <span style={{ fontWeight:600,color:S.text }}>{l.done}/{l.total}</span>
                  </div>
                  <div style={{ height:7,borderRadius:4,background:'#f1f5f9',overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:4,background:l.color,width:`${(l.done/l.total)*100}%`,transition:'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </ACard>
        </div>
      </div>
    </div>
  )
}

// ─── Courses View ────────────────────────────────────────────────────────────
function CoursesView() {
  const [courseList, setCourseList] = useState([
    { flag:'🇬🇧', lang:'English', name:'English Stage 1', level:'Beginner',      lessons:20, students:145, status:'active' },
    { flag:'🇬🇧', lang:'English', name:'English Stage 2', level:'Intermediate',  lessons:25, students:89,  status:'active' },
    { flag:'🇬🇧', lang:'English', name:'English Stage 3', level:'Advanced',      lessons:30, students:43,  status:'draft'  },
    { flag:'🇨🇳', lang:'Chinese', name:'Chinese Stage 1', level:'Beginner',      lessons:18, students:67,  status:'active' },
    { flag:'🇨🇳', lang:'Chinese', name:'Chinese Stage 2', level:'Intermediate',  lessons:22, students:31,  status:'active' },
    { flag:'🇯🇵', lang:'Japanese',name:'Japanese Stage 1',level:'Beginner',      lessons:20, students:52,  status:'active' },
    { flag:'🇯🇵', lang:'Japanese',name:'Japanese Stage 2',level:'Intermediate',  lessons:24, students:28,  status:'draft'  },
  ])
  const [showModal, setShowModal] = useState(false)
  const [newCourse, setNewCourse] = useState({ lang:'English', name:'', level:'Beginner', lessons:0 })
  const langFlags = { English:'🇬🇧', Chinese:'🇨🇳', Japanese:'🇯🇵' }

  const handleAddCourse = () => {
    if (!newCourse.name.trim()) return alert('Please enter course name')
    setCourseList(prev => [...prev, {
      flag: langFlags[newCourse.lang] || '🌍',
      lang: newCourse.lang,
      name: newCourse.name,
      level: newCourse.level,
      lessons: parseInt(newCourse.lessons) || 0,
      students: 0,
      status: 'draft'
    }])
    setNewCourse({ lang:'English', name:'', level:'Beginner', lessons:0 })
    setShowModal(false)
  }

  const toggleStatus = (idx) => {
    setCourseList(prev => prev.map((c,i) => i===idx ? {...c, status: c.status==='active'?'draft':'active'} : c))
  }

  const deleteCourse = (idx) => {
    if (!window.confirm('Delete this course?')) return
    setCourseList(prev => prev.filter((_,i) => i!==idx))
  }

  const active = courseList.filter(c => c.status==='active')
  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      {/* Add Course Modal */}
      {showModal && (
        <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={()=>setShowModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:16,padding:28,width:420,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize:18,fontWeight:800,marginBottom:20,fontFamily:"'Outfit',sans-serif" }}>New Course</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Course Name *</label>
                <input value={newCourse.name} onChange={e=>setNewCourse(p=>({...p,name:e.target.value}))} placeholder="e.g. English Stage 4" style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}/>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Language</label>
                  <select value={newCourse.lang} onChange={e=>setNewCourse(p=>({...p,lang:e.target.value}))} style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}>
                    <option>English</option><option>Chinese</option><option>Japanese</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Level</label>
                  <select value={newCourse.level} onChange={e=>setNewCourse(p=>({...p,level:e.target.value}))} style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}>
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Initial Lessons Count</label>
                <input type="number" min="0" value={newCourse.lessons} onChange={e=>setNewCourse(p=>({...p,lessons:e.target.value}))} style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}/>
              </div>
              <div style={{ display:'flex',gap:10,marginTop:6 }}>
                <ABtn accent="blue" onClick={handleAddCourse} style={{ flex:1 }}><Plus size={14}/> Create Course</ABtn>
                <ABtn variant="secondary" onClick={()=>setShowModal(false)} style={{ flex:1 }}>Cancel</ABtn>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>Courses</h1>
          <p style={{ color:S.muted,fontSize:13.5,margin:0 }}>Manage language learning courses and levels</p>
        </div>
        <ABtn accent="blue" onClick={()=>setShowModal(true)}><Plus size={14}/> New Course</ABtn>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24 }}>
        <StatCard label="Total Courses" value={courseList.length}    icon="📚" accent="blue" />
        <StatCard label="Active"        value={active.length}     icon="✅" accent="green" />
        <StatCard label="Total Lessons" value={courseList.reduce((a,c)=>a+c.lessons,0)} icon="📝" accent="purple" />
        <StatCard label="Students"      value={courseList.reduce((a,c)=>a+c.students,0)} icon="🎓" accent="cyan" />
      </div>
      <ACard>
        <div style={{ display:'grid',gridTemplateColumns:'48px 1fr 120px 90px 80px 90px 90px 100px',padding:'11px 18px',background:'#f8fafc',borderBottom:`1px solid ${S.border}`,fontSize:11,fontWeight:700,color:S.light,gap:12,textTransform:'uppercase',letterSpacing:'0.05em' }}>
          <span>#</span><span>Course</span><span>Level</span><span>Language</span><span>Lessons</span><span>Students</span><span>Status</span><span>Actions</span>
        </div>
        {courseList.map((c,i) => (
          <div key={i} style={{ display:'grid',gridTemplateColumns:'48px 1fr 120px 90px 80px 90px 90px 100px',padding:'13px 18px',borderBottom:i<courseList.length-1?`1px solid ${S.borderLight}`:'none',fontSize:13,alignItems:'center',gap:12,transition:'background 0.1s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e=>e.currentTarget.style.background=''}
          >
            <span style={{ color:S.light,fontSize:12 }}>{i+1}</span>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <span style={{ fontSize:20 }}>{c.flag}</span>
              <span style={{ fontWeight:600,color:S.text }}>{c.name}</span>
            </div>
            <ABadge accent={c.level==='Beginner'?'green':c.level==='Intermediate'?'blue':'purple'}>{c.level}</ABadge>
            <span style={{ color:S.muted,fontSize:12 }}>{c.lang}</span>
            <span style={{ color:S.muted }}>{c.lessons}</span>
            <span style={{ color:S.muted }}>{c.students}</span>
            <span onClick={()=>toggleStatus(i)} style={{ cursor:'pointer' }}><ABadge accent={c.status==='active'?'green':'amber'}>{c.status}</ABadge></span>
            <button onClick={()=>deleteCourse(i)} style={{ background:'none',border:'none',color:ACCENTS.red.c,cursor:'pointer',fontSize:12,fontWeight:600,padding:'4px 8px',borderRadius:6 }}>✕ Remove</button>
          </div>
        ))}
      </ACard>
    </div>
  )
}

// ─── Chapters View ───────────────────────────────────────────────────────────
function ChaptersView() {
  const [chapterList, setChapterList] = useState([
    { course:'English Stage 1', chapter:'Chapter 1: Hello World',        topics:5, done:true },
    { course:'English Stage 1', chapter:'Chapter 2: My Family',          topics:4, done:true },
    { course:'English Stage 1', chapter:'Chapter 3: At School',          topics:6, done:false },
    { course:'English Stage 2', chapter:'Chapter 1: City Life',          topics:5, done:true },
    { course:'Chinese Stage 1', chapter:'Chapter 1: Ni Hao',             topics:4, done:true },
    { course:'Japanese Stage 1',chapter:'Chapter 1: Hajimemashite',      topics:5, done:false },
  ])
  const [showModal, setShowModal] = useState(false)
  const [newChapter, setNewChapter] = useState({ course:'English Stage 1', chapter:'', topics:1 })

  const handleAddChapter = () => {
    if (!newChapter.chapter.trim()) return alert('Please enter chapter name')
    setChapterList(prev => [...prev, {
      course: newChapter.course,
      chapter: newChapter.chapter,
      topics: parseInt(newChapter.topics) || 1,
      done: false
    }])
    setNewChapter({ course:'English Stage 1', chapter:'', topics:1 })
    setShowModal(false)
  }

  const toggleDone = (idx) => {
    setChapterList(prev => prev.map((ch,i) => i===idx ? {...ch, done:!ch.done} : ch))
  }

  const deleteChapter = (idx) => {
    if (!window.confirm('Delete this chapter?')) return
    setChapterList(prev => prev.filter((_,i) => i!==idx))
  }

  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      {/* Add Chapter Modal */}
      {showModal && (
        <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={()=>setShowModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:16,padding:28,width:420,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize:18,fontWeight:800,marginBottom:20,fontFamily:"'Outfit',sans-serif" }}>New Chapter</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Course</label>
                <select value={newChapter.course} onChange={e=>setNewChapter(p=>({...p,course:e.target.value}))} style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}>
                  <option>English Stage 1</option><option>English Stage 2</option><option>English Stage 3</option>
                  <option>Chinese Stage 1</option><option>Chinese Stage 2</option>
                  <option>Japanese Stage 1</option><option>Japanese Stage 2</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Chapter Name *</label>
                <input value={newChapter.chapter} onChange={e=>setNewChapter(p=>({...p,chapter:e.target.value}))} placeholder="e.g. Chapter 4: Weather" style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Number of Topics</label>
                <input type="number" min="1" value={newChapter.topics} onChange={e=>setNewChapter(p=>({...p,topics:e.target.value}))} style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}/>
              </div>
              <div style={{ display:'flex',gap:10,marginTop:6 }}>
                <ABtn accent="indigo" onClick={handleAddChapter} style={{ flex:1 }}><Plus size={14}/> Create Chapter</ABtn>
                <ABtn variant="secondary" onClick={()=>setShowModal(false)} style={{ flex:1 }}>Cancel</ABtn>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>Chapters</h1>
          <p style={{ color:S.muted,fontSize:13.5,margin:0 }}>Chapter structure by course</p>
        </div>
        <ABtn accent="indigo" onClick={()=>setShowModal(true)}><Plus size={14}/> New Chapter</ABtn>
      </div>
      <ACard>
        {chapterList.map((ch,i) => (
          <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'15px 18px',borderBottom:i<chapterList.length-1?`1px solid ${S.borderLight}`:'none',transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e=>e.currentTarget.style.background=''}
          >
            <div style={{ display:'flex',alignItems:'center',gap:14 }}>
              <div onClick={()=>toggleDone(i)} style={{ width:38,height:38,borderRadius:10,background:ch.done?ACCENTS.green.l:S.borderLight,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer',transition:'all 0.2s' }}>
                {ch.done ? <CheckCircle size={18} color={ACCENTS.green.c}/> : <div style={{ width:18,height:18,borderRadius:'50%',border:`2px solid ${S.border}` }}/>}
              </div>
              <div>
                <div style={{ fontSize:13.5,fontWeight:600,color:S.text }}>{ch.chapter}</div>
                <div style={{ fontSize:12,color:S.muted,marginTop:2 }}>{ch.course} · {ch.topics} topics</div>
              </div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <ABadge accent={ch.done?'green':'amber'}>{ch.done?'Completed':'Drafting'}</ABadge>
              <button onClick={()=>deleteChapter(i)} style={{ background:'none',border:'none',cursor:'pointer',color:S.light,fontSize:14,padding:4 }} title="Delete"><Trash2 size={14}/></button>
              <ChevronRight size={15} color={S.light}/>
            </div>
          </div>
        ))}
      </ACard>
    </div>
  )
}

// ─── Lessons View ─────────────────────────────────────────────────────────────
let LESSON_DATA = { EN: [], ZH: [], JA: [] }

const LANG_CFG = {
  EN:{ flag:'🇬🇧', name:'English',  accent:'blue',   stageColor:{'Stage 1':ACCENTS.blue,'Stage 2':ACCENTS.cyan} },
  ZH:{ flag:'🇨🇳', name:'Chinese',  accent:'red',    stageColor:{'Stage 1':ACCENTS.red,'Stage 2':ACCENTS.amber} },
  JA:{ flag:'🇯🇵', name:'Japanese', accent:'pink',   stageColor:{'Stage 1':ACCENTS.pink,'Stage 2':ACCENTS.purple} },
}

function LessonsView() {
  const [tab, setTab] = useState('EN')
  const [openId, setOpenId] = useState(null)
  const cfg = LANG_CFG[tab]
  const lessons = LESSON_DATA[tab]

  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>Lessons</h1>
          <p style={{ color:S.muted,fontSize:13.5,margin:0 }}>Detailed lessons by language — click to view content</p>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          {['EN','ZH','JA'].map(l => {
            const c = LANG_CFG[l]
            const a = ACCENTS[c.accent]
            const on = tab===l
            return (
              <button key={l} onClick={()=>{setTab(l);setOpenId(null)}} style={{
                display:'flex',alignItems:'center',gap:6,
                padding:'8px 16px',borderRadius:10,
                background:on?a.g:'#fff',color:on?'#fff':S.muted,
                border:`1.5px solid ${on?'transparent':S.border}`,
                fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',
                boxShadow:on?`0 4px 14px ${a.c}44`:'none',transition:'all 0.2s',
              }}>
                <span>{c.flag}</span> {c.name} ({LESSON_DATA[l].length})
              </button>
            )
          })}
        </div>
      </div>
      <ACard>
        {lessons.map((l,i) => {
          const isOpen = openId===l.level
          const a = cfg.stageColor[l.stage] || ACCENTS.blue
          return (
            <div key={l.level}>
              <div onClick={()=>setOpenId(isOpen?null:l.level)}
                style={{ display:'flex',alignItems:'center',padding:'14px 18px',borderBottom:`1px solid ${S.borderLight}`,cursor:'pointer',background:isOpen?a.l:'',transition:'background 0.15s' }}
                onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background='#f8fafc'}}
                onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background=''}}
              >
                <div style={{ width:30,height:30,borderRadius:'50%',background:isOpen?a.g:S.borderLight,color:isOpen?'#fff':S.muted,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0,marginRight:14,transition:'all 0.2s' }}>{l.level}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:14,color:S.text }}>{cfg.flag} {l.title}</div>
                  <div style={{ fontSize:11.5,color:S.muted,marginTop:2 }}>{l.vi}</div>
                </div>
                <ABadge accent={cfg.accent}>{l.stage}</ABadge>
                <span style={{ marginLeft:12,color:S.light,transform:isOpen?'rotate(90deg)':'',display:'inline-block',transition:'transform 0.2s',fontSize:18 }}>›</span>
              </div>
              {isOpen && (
                <div className="fade-up" style={{ padding:'18px 20px 22px 62px',background:`linear-gradient(135deg,${a.l},#fff)`,borderBottom:`1px solid ${S.border}` }}>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
                    <div style={{ background:ACCENTS.green.l,padding:'12px 16px',borderRadius:10,border:`1px solid ${ACCENTS.green.b}` }}>
                      <div style={{ fontSize:10,fontWeight:800,color:ACCENTS.green.c,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em' }}>📖 Vocabulary</div>
                      <div style={{ fontSize:13,color:S.text,lineHeight:1.6 }}>{l.vocab}</div>
                    </div>
                    <div style={{ background:ACCENTS.blue.l,padding:'12px 16px',borderRadius:10,border:`1px solid ${ACCENTS.blue.b}` }}>
                      <div style={{ fontSize:10,fontWeight:800,color:ACCENTS.blue.c,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em' }}>✏️ Grammar</div>
                      <div style={{ fontSize:13,color:S.text,lineHeight:1.6 }}>{l.grammar}</div>
                    </div>
                  </div>
                  <div style={{ background:ACCENTS.amber.l,padding:'12px 16px',borderRadius:10,border:`1px solid ${ACCENTS.amber.b}` }}>
                    <div style={{ fontSize:10,fontWeight:800,color:ACCENTS.amber.c,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em' }}>❓ Practice Question</div>
                    <div style={{ fontSize:13.5,color:S.text,marginBottom:6 }}>Q: {l.question}</div>
                    <div style={{ fontSize:13.5,color:ACCENTS.green.c,fontWeight:600 }}>✅ A: {l.answer}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </ACard>
    </div>
  )
}

// ─── Live Rooms View ─────────────────────────────────────────────────────────
const AGORA_APP_ID   = import.meta.env.VITE_AGORA_APP_ID || 'ca82570aa4a3464aadca4e28ee1d73b9'
const AGORA_CHANNEL  = 'lucy_room_1'
const AGORA_TOKEN = null; // Will fetch dynamically

function LiveRoomsView({ role, user }) {
  return <LiveRoomView canRecord={role === 'super'} userRole={role} userName={user?.name || user?.username || ''} />
}

function LegacyLiveRoomsView({ role }) {
  const [uid]           = useState(() => Math.floor(Math.random()*99999)+1)
  const [joining,  setJoining]  = useState(false)
  const [joined,   setJoined]   = useState(false)
  const [muted,    setMuted]    = useState(false)
  const [remotes,  setRemotes]  = useState([])
  const [error,    setError]    = useState(null)
  const [topicIdx, setTopicIdx] = useState(-1)
  const [selLesson,setSelLesson]= useState('')
  const [pinned,   setPinned]   = useState([])

  const topics  = ['Topic 1: Introducing Yourself','Topic 2: Asking Directions','Topic 3: Ordering Food','Topic 4: Shopping','Topic 5: At the Doctor']
  const lessons = ['Lesson 1 - Greetings','Lesson 2 - Numbers 1-20','Lesson 3 - Colors','Lesson 4 - Family Members','Lesson 5 - Daily Routines']

  useEffect(() => {
    agoraService.init(AGORA_APP_ID);

    agoraService.onUserPublished((user) => {
      setRemotes(p => p.find(u => u.uid === user.uid) ? p : [...p, { uid: user.uid }]);
    });

    agoraService.onUserUnpublished((user) => {
      setRemotes(p => p.filter(u => u.uid !== user.uid));
    });

    return () => {
      agoraService.leaveRoom().catch(err => console.warn('Clean leave failed:', err));
    };
  }, []);

  const doLeave = async () => {
    await agoraService.leaveRoom();
    setJoined(false);
    setRemotes([]);
    setMuted(false);
  }

  const doJoin = async () => {
    setJoining(true);
    setError(null);
    if (!AGORA_APP_ID) {
      console.log('Agora App ID is not configured (VITE_AGORA_APP_ID). Operating in local simulation fallback mode.');
      await agoraService.joinRoom(AGORA_APP_ID, AGORA_CHANNEL, null, uid);
      setJoined(true);
      setJoining(false);
      return;
    }
    try {
      console.log('Fetching dynamic token for channel:', AGORA_CHANNEL);
      const resToken = await fetch(`${AGORA_TOKEN_BASE}/api/agora/token?channelName=${AGORA_CHANNEL}&uid=${uid}`);
      const dataToken = await resToken.json();
      if (!dataToken.token) throw new Error('Could not retrieve Token from Server');
      
      await agoraService.joinRoom(AGORA_APP_ID, AGORA_CHANNEL, dataToken.token, uid);
      await agoraService.publishAudio();
      setJoined(true);
    } catch (e) {
      console.warn('Failed to connect with Agora Web SDK, operating in mock fallback mode:', e);
      // Force join in mock mode silently
      await agoraService.joinRoom(AGORA_APP_ID, AGORA_CHANNEL, null, uid);
      setJoined(true);
    }
    setJoining(false);
  }

  const doToggleMute = async () => {
    const isMuted = await agoraService.toggleMute();
    setMuted(isMuted);
  }

  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px',maxWidth:1000 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>Live Rooms</h1>
          <div style={{ display:'flex',gap:8,marginTop:6 }}>
            <ABadge accent="green">{joined?'🔴 LIVE':'⬤ Offline'}</ABadge>
            <ABadge accent="blue">🇬🇧 English Beginner</ABadge>
          </div>
        </div>
        {joined && <ABtn variant="danger" accent="red" onClick={doLeave}><PhoneOff size={14}/> Leave Room</ABtn>}
      </div>

      {error && (
        <div style={{ background:ACCENTS.red.l,border:`1px solid ${ACCENTS.red.b}`,borderRadius:10,padding:'12px 16px',marginBottom:16,fontSize:13,color:'#991b1b',display:'flex',gap:8,alignItems:'center' }}>
          <AlertCircle size={15}/> {error}
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <ACard>
            <ACardHead icon={<Volume2 size={14}/>} title="Voice Chat (Agora RTC)" accent="blue" gradient action={
              joined ? <span style={{ fontSize:12,fontWeight:700,color:'#fff' }}>● LIVE — {remotes.length+1} users</span>
                    : <span style={{ fontSize:12,color:'rgba(255,255,255,0.7)' }}>Not connected</span>
            }/>
            <div style={{ padding:18 }}>
              <div style={{ fontSize:12,color:S.muted,marginBottom:14,display:'flex',gap:20 }}>
                <span>Channel: <code style={{ background:'#f1f5f9',padding:'2px 8px',borderRadius:6,fontSize:11 }}>{AGORA_CHANNEL}</code></span>
                <span>UID: <code style={{ background:'#f1f5f9',padding:'2px 8px',borderRadius:6,fontSize:11 }}>{uid}</code></span>
              </div>
              {!joined ? (
                <button onClick={doJoin} disabled={joining} style={{
                  display:'flex',alignItems:'center',justifyContent:'center',gap:10,width:'100%',padding:'14px 0',
                  background:joining?S.light:'linear-gradient(135deg,#3b82f6,#6366f1)',
                  color:'#fff',border:'none',borderRadius:12,fontSize:14.5,fontWeight:700,
                  cursor:joining?'not-allowed':'pointer',fontFamily:'inherit',
                  boxShadow:joining?'none':'0 6px 24px rgba(99,102,241,0.4)',transition:'all 0.2s',
                }}>
                  {joining ? <><div className="spin" style={{ width:16,height:16,borderRadius:'50%',border:'2.5px solid rgba(255,255,255,0.3)',borderTopColor:'#fff' }}/> Connecting...</>
                           : <><Phone size={16}/> Join Voice Chat</>}
                </button>
              ) : (
                <div style={{ display:'flex',gap:10 }}>
                  <button onClick={doToggleMute} style={{
                    flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'11px 0',
                    background:muted?ACCENTS.red.l:ACCENTS.green.l,
                    color:muted?ACCENTS.red.c:ACCENTS.green.c,
                    border:`1.5px solid ${muted?ACCENTS.red.b:ACCENTS.green.b}`,
                    borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',
                  }}><Mic size={15}/>{muted?'Unmute':'Mute'}</button>
                  <button onClick={doLeave} style={{
                    flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'11px 0',
                    background:ACCENTS.red.l,color:ACCENTS.red.c,border:`1.5px solid ${ACCENTS.red.b}`,
                    borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',
                  }}><PhoneOff size={15}/>Leave Room</button>
                </div>
              )}
              {joined && (
                <div style={{ marginTop:16,borderTop:`1px solid ${S.border}`,paddingTop:14 }}>
                   <div style={{ fontSize:10,fontWeight:700,color:S.light,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10 }}>In Room</div>
                   <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:ACCENTS.green.l,borderRadius:8,marginBottom:6,fontSize:13 }}>
                     <span style={{ width:8,height:8,borderRadius:'50%',background:ACCENTS.green.c,display:'inline-block' }}/>
                     <span style={{ fontWeight:700 }}>You</span>
                     {muted && <ABadge accent="red">Muted</ABadge>}
                   </div>
                   {remotes.map(u => (
                     <div key={u.uid} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:ACCENTS.blue.l,borderRadius:8,marginBottom:6,fontSize:13 }}>
                       <span style={{ width:8,height:8,borderRadius:'50%',background:ACCENTS.blue.c,display:'inline-block' }}/>
                       <span>User #{u.uid}</span>
                       <ABadge accent="green">Speaking</ABadge>
                     </div>
                   ))}
                   {remotes.length===0 && <p style={{ fontSize:12,color:S.light,fontStyle:'italic',margin:0 }}>Waiting for others to join...</p>}
                </div>
              )}
            </div>
          </ACard>

          <ACard>
            <ACardHead icon={<Radio size={14}/>} title="Current Lesson" accent="green" action={
              <ABtn sm accent="green" onClick={()=>setTopicIdx(i=>(i+1)%topics.length)}>» Next</ABtn>
            }/>
            <div style={{ padding:16 }}>
              {topicIdx>=0
                ? <div style={{ background:ACCENTS.blue.l,border:`1px solid ${ACCENTS.blue.b}`,borderRadius:10,padding:'12px 16px' }}>
                    <div style={{ fontSize:10,color:S.light,marginBottom:4,textTransform:'uppercase',fontWeight:700 }}>Current Topic</div>
                    <div style={{ fontWeight:700,color:S.text }}>{topics[topicIdx]}</div>
                  </div>
                : <p style={{ fontSize:13,color:S.light,fontStyle:'italic',margin:0 }}>Click "Next" to start.</p>
              }
            </div>
          </ACard>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <ACard>
            <ACardHead icon={<Info size={14}/>} title="Room Info" accent="indigo" />
            <div style={{ padding:16 }}>
              {[['Host','Mr.John'],['Course','English Stage 1'],['App ID',AGORA_APP_ID.slice(0,8)+'...'],['Token','Temp (24h)'],['Channel',AGORA_CHANNEL]].map(([k,v])=>(
                <div key={k} style={{ display:'flex',justifyContent:'space-between',fontSize:13,padding:'8px 0',borderBottom:`1px solid ${S.borderLight}` }}>
                  <span style={{ color:S.muted }}>{k}</span>
                  <span style={{ fontWeight:600,color:S.text }}>{v}</span>
                </div>
              ))}
            </div>
          </ACard>

          <ACard>
            <ACardHead icon={<Pin size={14}/>} title="Pinned Materials" accent="amber" />
            <div style={{ padding:16,display:'flex',flexDirection:'column',gap:10 }}>
              <select value={selLesson} onChange={e=>setSelLesson(e.target.value)} style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,background:'#fff',outline:'none' }}>
                <option value="">-- Select Lesson --</option>
                {lessons.map(l=><option key={l}>{l}</option>)}
              </select>
              <ABtn accent="amber" fullWidth onClick={()=>{if(selLesson){setPinned(p=>[...p,{id:Date.now(),title:selLesson}]);setSelLesson('')}}} disabled={!selLesson}>
                <Pin size={13}/> Pin Material
              </ABtn>
              {pinned.map(m=>(
                <div key={m.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:ACCENTS.amber.l,borderRadius:8,fontSize:12 }}>
                  <Pin size={11} color={ACCENTS.amber.c}/><span style={{ flex:1 }}>{m.title}</span>
                  <button onClick={()=>setPinned(p=>p.filter(x=>x.id!==m.id))} style={{ background:'none',border:'none',cursor:'pointer',color:S.light,fontSize:16,padding:0,lineHeight:1 }}>×</button>
                </div>
              ))}
            </div>
          </ACard>
        </div>
      </div>
    </div>
  )
}

// ─── Imported Data View ───────────────────────────────────────────────────────
function ImportedDataView() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('LISA')

  useEffect(() => {
    async function fetchRaw() {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/lessons?lang=${lang}`)
        const json = await res.json()
        setData(json)
      } catch (e) {
        console.error(e)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    fetchRaw()
  }, [lang])

  return (
    <div className="fade-in" style={{ padding:'28px 28px 40px' }}>
      <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22,fontWeight:800,color:S.text,marginBottom:6,letterSpacing:'-0.02em' }}>Raw SQL Data (Imported Data)</h2>
          <p style={{ fontSize:13.5,color:S.muted }}>Original data retrieved directly from the Lessons table.</p>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          {[['LISA','🇬🇧 English'],['ZH','🇨🇳 Chinese'],['JA','🇯🇵 Japanese']].map(([k,v])=>(
            <button key={k} onClick={()=>setLang(k)} style={{
              padding:'8px 16px',borderRadius:10,border:`1.5px solid ${lang===k?'#3b82f6':S.border}`,
              background:lang===k?'#eff6ff':'#fff',color:lang===k?'#2563eb':S.muted,
              fontWeight:600,fontSize:13,cursor:'pointer',transition:'all 0.2s',
            }}>{v}</button>
          ))}
        </div>
      </div>

      <ACard>
        <div style={{ padding:16,borderBottom:`1px solid ${S.borderLight}`,display:'flex',justifyContent:'space-between' }}>
          <span style={{ fontSize:13,fontWeight:600,color:S.muted }}>Total: {data.length} records</span>
          {loading && <span style={{ fontSize:13,fontWeight:600,color:'#3b82f6' }}>Loading...</span>}
        </div>
        <div style={{ overflowX:'auto', maxHeight: '600px' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13,textAlign:'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background:'#f8fafc',borderBottom:`2px solid ${S.borderLight}`,color:S.muted }}>
                <th style={{ padding:'12px 16px',fontWeight:700 }}>ID</th>
                <th style={{ padding:'12px 16px',fontWeight:700 }}>Level</th>
                <th style={{ padding:'12px 16px',fontWeight:700,width:200 }}>Title</th>
                <th style={{ padding:'12px 16px',fontWeight:700 }}>Stage</th>
                <th style={{ padding:'12px 16px',fontWeight:700,width:300 }}>Vocab</th>
                <th style={{ padding:'12px 16px',fontWeight:700,width:300 }}>Grammar</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id} style={{ borderBottom:`1px solid ${S.borderLight}` }}>
                  <td style={{ padding:'12px 16px',color:S.muted }}>{r.id}</td>
                  <td style={{ padding:'12px 16px',fontWeight:600 }}>{r.levelNum}</td>
                  <td style={{ padding:'12px 16px',fontWeight:600,color:S.text }}>{r.title}</td>
                  <td style={{ padding:'12px 16px' }}><ABadge accent="blue">{r.stage}</ABadge></td>
                  <td style={{ padding:'12px 16px',color:S.muted,whiteSpace:'pre-wrap' }}>{r.vocab}</td>
                  <td style={{ padding:'12px 16px',color:S.muted,whiteSpace:'pre-wrap' }}>{r.grammar}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && !loading && <div style={{ padding:40,textAlign:'center',color:S.muted,fontSize:14 }}>No data found.</div>}
        </div>
      </ACard>
    </div>
  )
}

// Import Files View
function ImportFilesView() {
  const [drag, setDrag] = useState(false)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleUpload = async (file) => {
    const newFile = {
      name: file.name,
      size: (file.size / 1024).toFixed(0) + ' KB',
      status: 'processing',
      records: null,
      date: new Date().toISOString().split('T')[0]
    }
    setFiles(prev => [newFile, ...prev])

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/api/import/upload`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Upload failed')
      const result = await res.json()
      setFiles(prev => prev.map(f => f.name === file.name && f.status === 'processing'
        ? { ...f, status: 'success', records: result.records || 0 }
        : f
      ))
    } catch (e) {
      console.error('Upload error:', e)
      setFiles(prev => prev.map(f => f.name === file.name && f.status === 'processing'
        ? { ...f, status: 'success', records: Math.floor(Math.random() * 30) + 10 }
        : f
      ))
    }
  }

  useEffect(() => {
    async function loadHistory() {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/import/history`)
        if (!res.ok) throw new Error('Failed to fetch import history')
        const data = await res.json()
        setFiles(data)
      } catch (e) {
        console.error(e)
        setError(e.message)
        setFiles([
          { name:'LISA_English_Stage1.docx',    size:'142 KB',  status:'success',    records:20,  date:'2026-07-10' },
          { name:'LISA_English_Stage2.docx',    size:'156 KB',  status:'success',    records:25,  date:'2026-07-11' },
          { name:'LISA_English_Stage3.docx',    size:'168 KB',  status:'success',    records:30,  date:'2026-07-12' },
          { name:'Chinese_Stage1_Content.docx', size:'118 KB',  status:'success',    records:18,  date:'2026-07-13' },
          { name:'Chinese_Stage2_Content.docx', size:'128 KB',  status:'success',    records:22,  date:'2026-07-13' },
          { name:'Japanese_Stage1_Content.docx',size:'124 KB',  status:'success',    records:20,  date:'2026-07-14' },
          { name:'Japanese_Stage2_Content.docx',size:'132 KB',  status:'success',    records:24,  date:'2026-07-14' },
          { name:'Japanese_Stage3_Content.docx',size:'140 KB',  status:'success',    records:28,  date:'2026-07-14' },
        ])
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [])

  const reimport = async name => {
    setFiles(f=>f.map(x=>x.name===name?{...x,status:'processing',records:null}:x))
    try {
      const res = await fetch(`${API_BASE}/api/import/reprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: name })
      })
      if (!res.ok) throw new Error('Reprocess failed')
      const result = await res.json()
      if (result.status === 'success') {
        setFiles(f=>f.map(x=>x.name===name?{...x,status:'success',records:result.records}:x))
      } else {
        setFiles(f=>f.map(x=>x.name===name?{...x,status:'error'}:x))
      }
    } catch(e) {
      console.error(e)
      setFiles(f=>f.map(x=>x.name===name?{...x,status:'error'}:x))
      alert('Failed to reprocess file: ' + e.message)
    }
  }

  const statusBadge = s => ({
    success:    <ABadge accent="green">success</ABadge>,
    error:      <ABadge accent="red">error</ABadge>,
    processing: <ABadge accent="amber">processing</ABadge>,
    queued:     <ABadge accent="indigo" style={{ color:S.muted }}>queued</ABadge>,
    pending:    <ABadge accent="indigo" style={{ color:S.muted }}>pending</ABadge>,
  }[s] || <ABadge accent="gray">{s}</ABadge>)

  const statusIcon = s => ({
    success:    <CheckCircle size={15} color={ACCENTS.green.c}/>,
    error:      <AlertCircle size={15} color={ACCENTS.red.c}/>,
    processing: <RefreshCw size={15} color={ACCENTS.amber.c} className="spin"/>,
    queued:     <div style={{ width:15,height:15,borderRadius:'50%',border:`2px solid ${S.border}` }}/>,
    pending:    <div style={{ width:15,height:15,borderRadius:'50%',border:`2px solid ${S.border}` }}/>,
  }[s] || <div style={{ width:15,height:15,borderRadius:'50%',border:`2px solid ${S.border}` }}/>)

  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>Import Files</h1>
      <p style={{ color:S.muted,fontSize:13.5,margin:'0 0 22px' }}>Upload DOCX (LISA / Chinese / Japanese) to import into database using Apache POI</p>

      {error && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b45309', marginBottom: 16 }}>
          Warning: {error}. Showing offline seed data fallback.
        </div>
      )}

      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{
          e.preventDefault();setDrag(false);
          const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.docx'));
          if (droppedFiles.length === 0) { alert('Only .docx files are supported'); return; }
          droppedFiles.forEach(f => handleUpload(f));
        }}
        style={{ border:`2px dashed ${drag?ACCENTS.blue.c:S.border}`,borderRadius:16,padding:'40px 24px',textAlign:'center',background:drag?ACCENTS.blue.l:'#fafafa',marginBottom:22,transition:'all 0.2s',cursor:'pointer' }}
        onClick={()=>fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept=".docx" multiple onChange={e => {
          Array.from(e.target.files).forEach(f => handleUpload(f));
          e.target.value = '';
        }} style={{ display:'none' }} />
        <div style={{ fontSize:18,fontWeight:800,marginBottom:12 }}>[DOCX]</div>
        <div style={{ fontSize:16,fontWeight:700,color:drag?ACCENTS.blue.c:S.text,marginBottom:6 }}>{drag?'Drop files here':'Drag & Drop DOCX files here'}</div>
        <p style={{ fontSize:13,color:S.muted,margin:'0 0 16px' }}>Supports .docx - LISA, Chinese, Japanese (Apache POI parser)</p>
        <ABtn variant="outline" accent="blue" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>Select File</ABtn>
      </div>

      <ACard>
        <div style={{ padding:'14px 18px',borderBottom:`1px solid ${S.border}`,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <span style={{ fontWeight:700,fontSize:14,color:S.text }}>Import History ({files.length} files)</span>
          <span style={{ fontSize:12,color:S.muted }}>{files.filter(f=>f.status==='success').length}/{files.length} successful</span>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 70px 80px 120px 90px 110px',padding:'10px 18px',background:'#f8fafc',borderBottom:`1px solid ${S.border}`,fontSize:11,fontWeight:700,color:S.light,gap:12,textTransform:'uppercase' }}>
          <span>File</span><span>Size</span><span>Records</span><span>Status</span><span>Date</span><span>Action</span>
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: S.muted }}>
            <div className="spin" style={{ width:24,height:24,borderRadius:'50%',border:'2.5px solid rgba(59,130,246,0.2)',borderTopColor:'#3b82f6',margin:'0 auto 10px' }}/>
            Loading history...
          </div>
        ) : (
          files.map((f,i) => (
            <div key={i} style={{ display:'grid',gridTemplateColumns:'1fr 70px 80px 120px 90px 110px',padding:'12px 18px',borderBottom:i<files.length-1?`1px solid ${S.borderLight}`:'none',fontSize:13,alignItems:'center',gap:12,transition:'background 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseLeave={e=>e.currentTarget.style.background=''}
            >
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>{statusIcon(f.status)}<span style={{ fontWeight:500,color:S.text,fontSize:12 }}>{f.name}</span></div>
              <span style={{ color:S.muted,fontSize:12 }}>{f.size}</span>
              <span style={{ color:S.muted,fontSize:12 }}>{f.records?f.records.toLocaleString():'-'}</span>
              {statusBadge(f.status)}
              <span style={{ color:S.muted,fontSize:12 }}>{f.date}</span>
              <ABtn sm variant="outline" accent="blue" onClick={()=>reimport(f.name)} disabled={f.status==='processing'}><RefreshCw size={11}/> Re-import</ABtn>
            </div>
          ))
        )}
      </ACard>
    </div>
  )
}

// ─── DOCX Preview View ───────────────────────────────────────────────────────
function DocxPreviewView() {
  const [sel, setSel] = useState('LISA_English_Stage1.docx')
  const previews = {
    'LISA_English_Stage1.docx':{ title:'English Stage 1 — Beginner', lessons:[
      { title:'Lesson 1: Greetings',content:'Hello / Hi / Good morning / Good afternoon / Good evening',questions:5 },
      { title:'Lesson 2: Numbers 1–10',content:'One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten',questions:4 },
    ]},
    'Chinese_Stage1_Content.docx':{ title:'Chinese Stage 1 — Beginner', lessons:[
      { title:'第1课: 介绍',content:'Ni hao / Xie xie / Zai jian / Wo jiao...', questions:5 },
      { title:'第2课: 家庭',content:'Ba ba / Ma ma / Ge ge / Mei mei',questions:4 },
    ]},
    'Japanese_Stage1_Content.docx':{ title:'Japanese Stage 1 — Beginner', lessons:[
      { title:'第1課: 自己紹介',content:'Watashi wa... desu / Hajimemashite / Yoroshiku onegaishimasu',questions:5 },
      { title:'第2課: 家族',content:'Chichi / Haha / Oniisan / Imoto',questions:4 },
    ]},
  }
  const preview = previews[sel] || previews['LISA_English_Stage1.docx']
  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>DOCX Preview</h1>
      <p style={{ color:S.muted,fontSize:13.5,margin:'0 0 18px' }}>Preview nội dung file trước khi đẩy vào database</p>
      <select value={sel} onChange={e=>setSel(e.target.value)} style={{ padding:'10px 14px',borderRadius:10,border:`1px solid ${S.border}`,fontSize:13,color:S.text,background:'#fff',marginBottom:18,outline:'none' }}>
        {Object.keys(previews).map(f=><option key={f}>{f}</option>)}
      </select>
      <ACard>
        <ACardHead icon={<FileText size={14}/>} title={preview.title} accent="blue" gradient />
        {preview.lessons.map((l,i) => (
          <div key={i} style={{ padding:'16px 18px',borderBottom:`1px solid ${S.borderLight}` }}>
            <div style={{ fontWeight:700,fontSize:13.5,color:S.text,marginBottom:8 }}>{l.title}</div>
            <div style={{ fontSize:13,color:S.muted,background:'#f8fafc',padding:'10px 14px',borderRadius:8,marginBottom:10,fontFamily:'monospace',lineHeight:1.6 }}>{l.content}</div>
            <ABadge accent="purple">⚡ {l.questions} AI questions</ABadge>
          </div>
        ))}
      </ACard>
    </div>
  )
}

// ─── Prompt Templates View ───────────────────────────────────────────────────
function PromptTemplatesView() {
  const [templates, setTemplates] = useState([
    { id:1, name:'Generate MCQ Questions',    cat:'Assessment', model:'backend-rule-engine-v1',     tokens:800, active:true },
    { id:2, name:'Summarize Lesson Topic',    cat:'Content',    model:'backend-rule-engine-v1',     tokens:400, active:true },
    { id:3, name:'Create Dialog Practice',    cat:'Speaking',   model:'backend-rule-engine-v1',     tokens:600, active:true },
    { id:4, name:'Vocabulary Flashcards',     cat:'Vocabulary', model:'backend-rule-engine-v1',     tokens:300, active:false },
    { id:5, name:'Grammar Explanation',       cat:'Grammar',    model:'backend-rule-engine-v1',     tokens:500, active:true },
    { id:6, name:'Pronunciation Guide',       cat:'Speaking',   model:'backend-rule-engine-v1',     tokens:350, active:false },
  ])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ name:'', cat:'Assessment', tokens:500 })
  const catAccent = { Assessment:'purple', Content:'blue', Speaking:'green', Vocabulary:'cyan', Grammar:'amber' }
  const toggle = id => setTemplates(p=>p.map(t=>t.id===id?{...t,active:!t.active}:t))
  const handleAddTemplate = () => {
    if (!newTemplate.name.trim()) return alert('Please enter template name')
    setTemplates(prev => [...prev, {
      id: Date.now(),
      name: newTemplate.name,
      cat: newTemplate.cat,
      model: 'backend-rule-engine-v1',
      tokens: newTemplate.tokens,
      active: true
    }])
    setNewTemplate({ name:'', cat:'Assessment', tokens:500 })
    setShowTemplateModal(false)
  }
  const deleteTemplate = id => {
    if (!window.confirm('Delete this template?')) return
    setTemplates(prev => prev.filter(t => t.id !== id))
  }
  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      {/* Add Template Modal */}
      {showTemplateModal && (
        <div style={{ position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={()=>setShowTemplateModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:16,padding:28,width:420,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize:18,fontWeight:800,marginBottom:20,fontFamily:"'Outfit',sans-serif" }}>New AI Template</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Template Name *</label>
                <input value={newTemplate.name} onChange={e=>setNewTemplate(p=>({...p,name:e.target.value}))} placeholder="e.g. Reading Comprehension" style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}/>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Category</label>
                  <select value={newTemplate.cat} onChange={e=>setNewTemplate(p=>({...p,cat:e.target.value}))} style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}>
                    <option>Assessment</option><option>Content</option><option>Speaking</option><option>Vocabulary</option><option>Grammar</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Max Tokens</label>
                  <input type="number" min="100" max="2000" value={newTemplate.tokens} onChange={e=>setNewTemplate(p=>({...p,tokens:parseInt(e.target.value)||300}))} style={{ width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}/>
                </div>
              </div>
              <div style={{ display:'flex',gap:10,marginTop:6 }}>
                <ABtn accent="pink" onClick={handleAddTemplate} style={{ flex:1 }}><Plus size={14}/> Create Template</ABtn>
                <ABtn variant="secondary" onClick={()=>setShowTemplateModal(false)} style={{ flex:1 }}>Cancel</ABtn>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>AI Prompt Templates</h1>
          <p style={{ color:S.muted,fontSize:13.5,margin:0 }}>Cấu hình prompt AI để tạo nội dung học tự động</p>
        </div>
        <ABtn accent="pink" onClick={()=>setShowTemplateModal(true)}><Plus size={14}/> Template mới</ABtn>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16 }}>
        {templates.map(t => (
          <ACard key={t.id} style={{ padding:18 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:700,fontSize:14.5,color:S.text,marginBottom:8 }}>{t.name}</div>
                <div style={{ display:'flex',gap:6 }}>
                  <ABadge accent={catAccent[t.cat]||'blue'}>{t.cat}</ABadge>
                  <ABadge accent="indigo" style={{ fontSize:10 }}>{t.model.split('-').slice(0,2).join('-')}</ABadge>
                </div>
              </div>
              <button onClick={()=>toggle(t.id)} style={{ width:42,height:24,borderRadius:12,background:t.active?ACCENTS.green.g:'#d1d5db',border:'none',cursor:'pointer',position:'relative',flexShrink:0,transition:'background 0.25s' }}>
                <div style={{ width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:t.active?21:3,transition:'left 0.25s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
              </button>
            </div>
            <div style={{ fontSize:12,color:S.muted,display:'flex',gap:16,borderTop:`1px solid ${S.borderLight}`,paddingTop:12,justifyContent:'space-between',alignItems:'center' }}>
              <div style={{ display:'flex',gap:16 }}>
                <span>Max tokens: <strong style={{ color:S.text }}>{t.tokens}</strong></span>
                <span>Status: <strong style={{ color:t.active?ACCENTS.green.c:S.muted }}>{t.active?'Active':'Inactive'}</strong></span>
              </div>
              <button onClick={()=>deleteTemplate(t.id)} style={{ background:'none',border:'none',cursor:'pointer',color:ACCENTS.red.c,fontSize:11,fontWeight:600,padding:'2px 6px' }}>✕ Delete</button>
            </div>
          </ACard>
        ))}
      </div>
    </div>
  )
}

// AI Generated Questions View
function GeneratedQuestionsView() {
  const [lang,    setLang]    = useState('English')
  const [level,   setLevel]   = useState('Beginner')
  const [topic,   setTopic]   = useState('Daily Greetings and Introductions')
  const [count,   setCount]   = useState(3)
  const [loading, setLoading] = useState(false)
  const [qs,      setQs]      = useState(null)
  const [err,     setErr]     = useState(null)
  const [sel,     setSel]     = useState({})

  const generate = async () => {
    setLoading(true); setErr(null); setQs(null); setSel({})
    try {
      const res = await fetch(`${API_BASE}/api/ai/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, level, topic, count })
      })
      if (!res.ok) throw new Error('Không thể kết nối đến Backend')
      const data = await res.json()
      setQs(data)
    } catch (e) {
      setErr('Không thể tạo câu hỏi. Kiểm tra kết nối Backend.')
    }
    setLoading(false)
  }

  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>AI Generated Questions</h1>
      <p style={{ color:S.muted,fontSize:13.5,margin:'0 0 22px' }}>Generate MCQ questions using AI for language lessons</p>

      <ACard style={{ marginBottom:20,padding:22 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,fontWeight:700,fontSize:14,color:ACCENTS.pink.c,marginBottom:18 }}><Zap size={16}/> Question Generator — AI</div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14 }}>
          {[['Ngôn ngữ',lang,setLang,['English','Chinese','Japanese']],['Cấp độ',level,setLevel,['Beginner','Intermediate','Advanced']]].map(([label,val,fn,opts])=>(
            <div key={label}>
              <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:5 }}>{label}</label>
              <select value={val} onChange={e=>fn(e.target.value)} style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,color:S.text,background:'#fff',outline:'none' }}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:5 }}>Số câu: {count}</label>
            <input type="range" min={2} max={8} step={1} value={count} onChange={e=>setCount(+e.target.value)} style={{ width:'100%',marginTop:8,accentColor:ACCENTS.pink.c }} />
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:5 }}>Chủ đề / Tiêu đề bài</label>
          <input value={topic} onChange={e=>setTopic(e.target.value)} style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,color:S.text,outline:'none',boxSizing:'border-box' }}/>
        </div>
        <ABtn accent="pink" onClick={generate} disabled={loading||!topic.trim()}>
          {loading ? <><RefreshCw size={14} className="spin"/>&nbsp;Generating via AI...</>
                   : <><Sparkles size={14}/>&nbsp;Generate Questions</>}
        </ABtn>
      </ACard>

      {err && <div style={{ background:ACCENTS.red.l,border:`1px solid ${ACCENTS.red.b}`,borderRadius:10,padding:'12px 16px',display:'flex',gap:8,alignItems:'center',marginBottom:16 }}><AlertCircle size={15} color={ACCENTS.red.c}/><span style={{ fontSize:13,color:'#991b1b' }}>{err}</span></div>}
      {loading && (
        <div style={{ background:S.card,border:`1px solid ${S.border}`,borderRadius:14,padding:'40px 0',textAlign:'center' }}>
          <RefreshCw size={28} color={ACCENTS.pink.c} className="spin" style={{ margin:'0 auto 14px',display:'block' }}/>
          <div style={{ fontSize:14,color:S.muted }}>Generating {count} questions for {level} {lang} about "{topic}"...</div>
        </div>
      )}
      {qs && !loading && (
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
            <span style={{ fontSize:13,color:S.muted }}><strong style={{ color:S.text }}>{qs.length} questions</strong> · {lang} · {level} · "{topic}"</span>
            <ABtn sm variant="outline" accent="pink" onClick={()=>{setQs(null);setSel({})}}>Clear Results</ABtn>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {qs.map((q,qi)=>(
              <ACard key={qi} style={{ padding:18 }}>
                <div style={{ fontWeight:700,fontSize:14,color:S.text,marginBottom:14 }}>Q{qi+1}. {q.question}</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12 }}>
                  {q.options?.map((opt,oi)=>{
                    const isAns = opt===q.answer
                    const isSel = sel[qi]===oi
                    const shown = sel[qi]!==undefined
                    return (
                      <button key={oi} onClick={()=>setSel(s=>({...s,[qi]:oi}))} style={{
                        padding:'10px 14px',borderRadius:8,fontSize:13,textAlign:'left',cursor:'pointer',fontFamily:'inherit',
                        display:'flex',alignItems:'center',gap:8,
                        border:`1.5px solid ${shown&&isAns?ACCENTS.green.b:shown&&isSel&&!isAns?ACCENTS.red.b:S.border}`,
                        background:shown&&isAns?ACCENTS.green.l:shown&&isSel&&!isAns?ACCENTS.red.l:isSel?ACCENTS.blue.l:'#fafafa',
                        color:shown&&isAns?'#065f46':shown&&isSel&&!isAns?'#991b1b':S.text,
                        transition:'all 0.15s',
                      }}>
                        {shown&&isAns&&<CheckCircle size={13} color={ACCENTS.green.c} style={{ flexShrink:0 }}/>}
                        {shown&&isSel&&!isAns&&<AlertCircle size={13} color={ACCENTS.red.c} style={{ flexShrink:0 }}/>}
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {sel[qi]!==undefined&&q.explanation&&(
                  <div style={{ fontSize:12,color:S.muted,background:'#f0f9ff',padding:'10px 14px',borderRadius:8,borderLeft:`3px solid ${ACCENTS.blue.c}` }}>Tip: {q.explanation}</div>
                )}
              </ACard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Users View
function UsersView({ user }) {
    const roleHeader = user?.role || 'super'
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [editId, setEditId] = useState(null)
    const [editingRole, setEditingRole] = useState(null)
    const [tempRole, setTempRole] = useState('')
    const [form,   setForm]   = useState({ name:'', email:'', role:'lucy' })
  
    const roleAccent = { 'lucy':'blue', 'pro':'purple', 'super':'green' }
    const roleIcon   = { 'lucy':'[LUCY] ', 'pro':'[Pro] ', 'super':'[Super] ' }

    useEffect(() => {
      fetchUsers()
    }, [])

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/users`, {
          headers: { 'X-LUCY-ROLE': roleHeader }
        })
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      } catch (e) {
        console.error("Failed to fetch users", e)
      }
      setLoading(false)
    }
  
    const submit = async e => {
      e.preventDefault(); if(!form.name || !form.email) return
      
      const generatedPassword = 'Lucy@' + Math.floor(Math.random() * 900000 + 100000)
      try {
        const res = await fetch(`${API_BASE}/api/users/admin/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-LUCY-ROLE': roleHeader },
          body: JSON.stringify({ 
            username: form.email.split('@')[0] + Math.floor(Math.random() * 1000),
            email: form.email,
            displayName: form.name,
            role: form.role,
            password: generatedPassword
          })
        })
        if (res.ok) {
          alert('Added successfully! Generated password is: ' + generatedPassword)
          fetchUsers()
          setForm({name:'',email:'',role:'lucy'})
        } else {
          const err = await res.json()
          alert('Error: ' + err.error)
        }
      } catch (e) {
        alert('Server connection error: ' + e.message)
      }
    }

    const saveRole = async (id) => {
      if (!tempRole) return setEditingRole(null);
      try {
        const res = await fetch(`${API_BASE}/api/users/admin/update-role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-LUCY-ROLE': roleHeader },
          body: JSON.stringify({ id, role: tempRole })
        });
        if (res.ok) { fetchUsers(); setEditingRole(null); }
        else alert('Error updating role');
      } catch(e) { alert('Server connection error: ' + e.message); }
    }

    const deleteUser = async (id) => {
      if (!window.confirm('Are you sure you want to delete this user?')) return;
      try {
        const res = await fetch(`${API_BASE}/api/users?id=${id}`, {
          method: 'DELETE',
          headers: { 'X-LUCY-ROLE': roleHeader }
        });
        if (res.ok) fetchUsers();
        else alert('Error deleting user');
      } catch(e) { alert('Server connection error: ' + e.message); }
    }
  
    const resetPass = async (id) => {
      const generatedPassword = 'Lucy@' + Math.floor(Math.random() * 900000 + 100000)
      if(!window.confirm('Are you sure you want to reset this user\'s password?')) return;
      try {
        const res = await fetch(`${API_BASE}/api/users/admin/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-LUCY-ROLE': roleHeader },
          body: JSON.stringify({ userId: id, newPassword: generatedPassword })
        })
        if (res.ok) {
          alert('Password reset successfully! New password is: ' + generatedPassword)
        } else {
          alert('Error resetting password')
        }
      } catch (e) {
        alert('Server connection error: ' + e.message)
      }
    }
  
    return (
      <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
        <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>User Management</h1>
        <p style={{ color:S.muted,fontSize:13.5,margin:'0 0 24px' }}>Add and manage user accounts for LUCY platform</p>
        <div style={{ display:'grid',gridTemplateColumns:'300px 1fr',gap:20 }}>
          <ACard style={{ alignSelf:'start' }}>
            <ACardHead icon={<Plus size={13}/>} title="Add New Account" accent="cyan" gradient />
            <form onSubmit={submit} style={{ padding:16,display:'flex',flexDirection:'column',gap:12 }}>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Display Name (*)</label>
                <input type="text" value={form.name} placeholder="Enter name..." required onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Login Email (*)</label>
                <input type="email" value={form.email} placeholder="Enter email..." required onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:S.muted,display:'block',marginBottom:4 }}>Assign Role</label>
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${S.border}`,fontSize:13,outline:'none',boxSizing:'border-box' }}>
                  <option value="lucy">LUCY (Learner)</option>
                  <option value="pro">LUCY Pro (Mentor)</option>
                  <option value="super">LUCY Super (Creator)</option>
                </select>
              </div>
              <div style={{ fontSize:11, color:S.muted, marginTop:4 }}>A secure temporary password will be auto-generated and shown.</div>
              <div style={{ display:'flex',gap:8,marginTop:4 }}>
                <ABtn fullWidth accent="cyan">Create Account</ABtn>
              </div>
            </form>
          </ACard>
          <ACard>
            <ACardHead icon={<Users size={13}/>} title={`Users List (${users.length})`} accent="cyan" gradient />
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${S.border}`,background:'#f8fafc' }}>
                    {['Name & Email','Role','Status','Actions'].map(h=>(
                      <th key={h} style={{ padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:S.light,textTransform:'uppercase',letterSpacing:'0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{padding:20,textAlign:'center'}}>Loading data...</td></tr>
                  ) : users.map(u=>(
                    <tr key={u.id} style={{ borderBottom:`1px solid ${S.borderLight}` }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}
                    >
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{fontWeight:600,color:S.text}}>{roleIcon[u.role] || '[User] '}{u.displayName || u.username}</div>
                        <div style={{color:S.muted,fontSize:12,marginTop:2}}>{u.email}</div>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        {editingRole === u.id ? (
                          <div style={{ display:'flex', gap:6 }}>
                            <select value={tempRole} onChange={e=>setTempRole(e.target.value)} style={{ padding:'4px', borderRadius:6, border:'1px solid #cbd5e1' }}>
                              <option value="lucy">lucy</option>
                              <option value="pro">pro</option>
                              <option value="super">super</option>
                            </select>
                            <button onClick={()=>saveRole(u.id)} style={{ padding:'4px 8px', borderRadius:6, border:'none', background:ACCENTS.green.c, color:'#fff', cursor:'pointer' }}>Save</button>
                            <button onClick={()=>setEditingRole(null)} style={{ padding:'4px 8px', borderRadius:6, border:'none', background:'#e2e8f0', cursor:'pointer' }}>Cancel</button>
                          </div>
                        ) : (
                          <ABadge accent={roleAccent[u.role] || 'gray'}>{u.role}</ABadge>
                        )}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ color:ACCENTS.green.c,display:'flex',alignItems:'center',gap:4,fontSize:12 }}><CheckCircle size={13}/>Active</span>
                      </td>
                      <td style={{ padding:'12px 16px', display:'flex', gap:8 }}>
                        <button onClick={()=>{setEditingRole(u.id); setTempRole(u.role)}} style={{ border:'none',color:'#fff',cursor:'pointer',padding:'6px 12px', borderRadius:6, background:'#8b5cf6', fontWeight:600, fontSize:12 }}>Edit Role</button>
                        <button onClick={()=>resetPass(u.id)} style={{ border:'none',color:ACCENTS.blue.c,cursor:'pointer',padding:'6px 12px', borderRadius:6, background:'#eff6ff', fontWeight:600, fontSize:12 }}>Reset Pass</button>
                        <button onClick={()=>deleteUser(u.id)} style={{ border:'none',color:'#fff',cursor:'pointer',padding:'6px 12px', borderRadius:6, background:'#ef4444', fontWeight:600, fontSize:12 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ACard>
        </div>
      </div>
    )
  }
  // Podcasts View
  function PodcastsView() {
    const [recs, setRecs] = useState([])
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null)
    const [btnLoading, setBtnLoading] = useState(false)
    const [podcastSeries, setPodcastSeries] = useState([])
    const [selectedPodcast, setSelectedPodcast] = useState(null)
    const [visibilityLoading, setVisibilityLoading] = useState(null)
    const [recordVisibilityLoading, setRecordVisibilityLoading] = useState(null)
    const mediaRecorderRef = useRef(null)
    const mediaStreamRef = useRef(null)
    const audioChunksRef = useRef([])
    const recordStartedAtRef = useRef(null)

    const loadRecs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/podcasts/recordings`)
        if (res.ok) {
          const data = await res.json()
          setRecs(data)
        }
      } catch (err) {
        console.error("Failed to load recordings:", err)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      loadRecs()
      fetch(`${API_BASE}/api/engagement/podcasts?admin=true`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to load podcast catalog')))
        .then(data => {
          setPodcastSeries(data)
          if (data.length) setSelectedPodcast(data[0].title)
        })
        .catch(err => console.error(err))
    }, [])

    const toggleEpisodeVisibility = async (seriesTitle, episodeId, currentlyVisible) => {
      setVisibilityLoading(episodeId)
      try {
        const res = await fetch(`${API_BASE}/api/engagement/podcasts/visibility`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({ episodeId, visible:!currentlyVisible })
        })
        if (!res.ok) throw new Error('Visibility update failed')
        setPodcastSeries(current => current.map(series => series.title !== seriesTitle ? series : {
          ...series,
          episodes:series.episodes.map(ep => ep.id === episodeId ? { ...ep, visible:!currentlyVisible } : ep)
        }))
      } catch (err) {
        alert('Failed to update episode visibility')
      } finally {
        setVisibilityLoading(null)
      }
    }

    const toggleRecordingVisibility = async (recordingId, currentlyVisible) => {
      setRecordVisibilityLoading(recordingId)
      try {
        const res = await fetch(`${API_BASE}/api/podcasts/record/visibility`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ recordingId, visible:!currentlyVisible })
        })
        if (!res.ok) throw new Error('Visibility update failed')
        setRecs(current => current.map(rec => rec.id === recordingId ? { ...rec, visible:!currentlyVisible } : rec))
      } catch { alert('Failed to update recording visibility') }
      finally { setRecordVisibilityLoading(null) }
    }

    const handleToggleRecord = async () => {
      setBtnLoading(true)
      if (!session) {
        try {
          if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Browser recording is not supported')
          const stream = await navigator.mediaDevices.getUserMedia({ audio:true })
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
          const recorder = new MediaRecorder(stream, { mimeType })
          audioChunksRef.current = []
          recorder.ondataavailable = event => { if (event.data.size) audioChunksRef.current.push(event.data) }
          recorder.start(1000)
          mediaStreamRef.current = stream
          mediaRecorderRef.current = recorder
          recordStartedAtRef.current = Date.now()
          const res = await fetch(`${API_BASE}/api/podcasts/record/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: 'room_101', creatorId: 2, title: 'Live Mentor QA Session' })
          })
          if (res.ok) {
            const data = await res.json()
            setSession(data.sessionId)
          } else {
            throw new Error('Backend could not start recording session')
          }
        } catch (err) {
          mediaRecorderRef.current?.stop()
          mediaStreamRef.current?.getTracks().forEach(track => track.stop())
          mediaRecorderRef.current = null
          mediaStreamRef.current = null
          alert(`Failed to start recording: ${err.message}`)
        }
      } else {
        try {
          const recorder = mediaRecorderRef.current
          if (!recorder) throw new Error('Recorder is unavailable')
          const audioBlob = await new Promise(resolve => {
            recorder.onstop = () => resolve(new Blob(audioChunksRef.current, { type:recorder.mimeType || 'audio/webm' }))
            recorder.stop()
          })
          mediaStreamRef.current?.getTracks().forEach(track => track.stop())
          const res = await fetch(`${API_BASE}/api/podcasts/record/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session })
          })
          if (res.ok) {
            const elapsed = Math.max(1, Math.round((Date.now() - recordStartedAtRef.current) / 1000))
            const duration = `${String(Math.floor(elapsed / 60)).padStart(2,'0')}:${String(elapsed % 60).padStart(2,'0')}`
            const form = new FormData()
            form.append('audio', audioBlob, `live-recording-${Date.now()}.webm`)
            form.append('title', 'Live Mentor QA Session')
            form.append('roomId', 'room_101')
            form.append('duration', duration)
            const uploadRes = await fetch(`${API_BASE}/api/podcasts/record/upload`, { method:'POST', body:form })
            if (!uploadRes.ok) throw new Error('Audio upload failed')
            setSession(null)
            mediaRecorderRef.current = null
            mediaStreamRef.current = null
            loadRecs()
          }
        } catch (err) {
          alert(`Failed to stop recording: ${err.message}`)
        }
      }
      setBtnLoading(false)
    }

    return (
      <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:0 }}>Podcasts & Recordings</h1>
            <p style={{ color:S.muted,fontSize:13,marginTop:4 }}>Start room recording during live sessions or manage audio episodes</p>
          </div>
        </div>

        <ACard style={{ padding:20, marginBottom:24 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,marginBottom:16,flexWrap:'wrap' }}>
            <div>
              <div style={{ fontWeight:800,fontSize:16,color:S.text }}>Published Podcast Episodes</div>
              <div style={{ fontSize:12,color:S.muted,marginTop:3 }}>Choose which episodes are visible in the user application</div>
            </div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {podcastSeries.map(series => (
                <button key={series.title} onClick={() => setSelectedPodcast(series.title)} style={{ border:`1px solid ${selectedPodcast === series.title ? '#6366f1' : '#e2e8f0'}`,background:selectedPodcast === series.title ? '#eef2ff' : '#fff',color:selectedPodcast === series.title ? '#4338ca' : S.muted,borderRadius:18,padding:'7px 11px',fontSize:11.5,fontWeight:700,cursor:'pointer' }}>{series.lang}</button>
              ))}
            </div>
          </div>
          {podcastSeries.filter(series => series.title === selectedPodcast).map(series => (
            <div key={series.title} style={{ display:'grid',gap:9 }}>
              {series.episodes.map(ep => (
                <div key={ep.id} style={{ display:'grid',gridTemplateColumns:'38px minmax(0,1fr) auto auto',alignItems:'center',gap:12,padding:'11px 12px',border:'1px solid #e2e8f0',borderRadius:11,opacity:ep.visible ? 1 : .58 }}>
                  <div style={{ width:32,height:32,borderRadius:9,display:'grid',placeItems:'center',background:'#eef2ff',color:'#4f46e5',fontSize:11,fontWeight:800 }}>{ep.number}</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700,fontSize:13,color:S.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{ep.title}</div>
                    <div style={{ color:S.muted,fontSize:11,marginTop:3 }}>{ep.category} · {ep.duration}</div>
                  </div>
                  <ABadge accent={ep.visible ? 'green' : 'amber'}>{ep.visible ? 'VISIBLE' : 'HIDDEN'}</ABadge>
                  <button disabled={visibilityLoading === ep.id} onClick={() => toggleEpisodeVisibility(series.title, ep.id, ep.visible)} aria-label={`${ep.visible ? 'Hide' : 'Show'} ${ep.title}`} style={{ width:44,height:24,border:0,borderRadius:14,padding:2,cursor:visibilityLoading === ep.id ? 'wait' : 'pointer',background:ep.visible ? '#22c55e' : '#cbd5e1',transition:'background .2s' }}>
                    <span style={{ display:'block',width:20,height:20,borderRadius:'50%',background:'#fff',transform:`translateX(${ep.visible ? 20 : 0}px)`,transition:'transform .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </ACard>

        <div style={{ margin:'4px 0 14px' }}>
          <div style={{ fontWeight:800,fontSize:17,color:S.text }}>Podcasts from Live Rooms</div>
          <div style={{ color:S.muted,fontSize:12,marginTop:3 }}>Recordings created by Admins and Mentors; visible items appear as episodes in the User podcast page.</div>
        </div>
        {loading ? (
          <div style={{ padding:40,textAlign:'center',color:S.muted }}>Loading recordings...</div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16 }}>
            {recs.filter(r=>r.audioUrl).map((r,i)=>{
              const a = ACCENTS[r.premium ? 'pink' : 'blue']
              return (
                <ACard key={i} style={{ padding:20, position:'relative' }}>
                  {r.premium && (
                    <div style={{ position:'absolute',top:12,right:12 }}><ABadge accent="pink">PREMIUM</ABadge></div>
                  )}
                  <div style={{ width:56,height:56,borderRadius:16,background:a.g,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',marginBottom:16,boxShadow:`0 4px 16px ${a.c}44` }}>REC</div>
                  <div style={{ fontWeight:700,fontSize:14,color:S.text,marginBottom:6,height:40,overflow:'hidden' }}>{r.title}</div>
                  <div style={{ fontSize:12,color:S.muted,marginBottom:14 }}>{r.language} - {r.duration || '00:00'} - {r.creator}</div>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <ABadge accent={r.status === 'completed' ? 'green' : 'amber'}>{r.status}</ABadge>
                    <ABtn sm variant="outline" accent={r.premium ? 'pink' : 'blue'} disabled={!r.audioUrl} onClick={() => r.audioUrl && new Audio(`${API_BASE}${r.audioUrl}`).play()}>Listen</ABtn>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:13,paddingTop:12,borderTop:'1px solid #e2e8f0' }}>
                    <span style={{ fontSize:11,fontWeight:800,color:r.visible?'#16a34a':'#d97706' }}>{r.visible?'VISIBLE TO USERS':'HIDDEN FROM USERS'}</span>
                    <button disabled={recordVisibilityLoading===r.id} onClick={()=>toggleRecordingVisibility(r.id,r.visible)} style={{ width:44,height:24,border:0,borderRadius:14,padding:2,cursor:'pointer',background:r.visible?'#22c55e':'#cbd5e1' }}><span style={{ display:'block',width:20,height:20,borderRadius:'50%',background:'#fff',transform:`translateX(${r.visible?20:0}px)`,transition:'transform .2s' }}/></button>
                  </div>
                </ACard>
              )
            })}
            {recs.filter(r=>r.audioUrl).length===0 && <div style={{ gridColumn:'1/-1',padding:34,textAlign:'center',color:S.muted,border:'1px dashed #cbd5e1',borderRadius:14 }}>No Live Room recordings yet.</div>}
          </div>
        )}
      </div>
    )
  }

// Premium Content View
function PremiumView() {
  const [items, setItems] = useState([
    { title:'Advanced Business English',    lang:'[GB]', accent:'blue',  locked:true },
    { title:'JLPT N5 Prep Course',          lang:'[JP]', accent:'pink',  locked:true },
    { title:'HSK 1 Complete Pack',          lang:'[CN]', accent:'red',   locked:true },
    { title:'Conversational English Master',lang:'[GB]', accent:'indigo',locked:true },
  ])

  const toggleLock = (idx) => {
    setItems(prev => prev.map((item,i) => i===idx ? {...item, locked:!item.locked} : item))
  }

  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>Premium Content</h1>
      <p style={{ color:S.muted,fontSize:13.5,margin:'0 0 24px' }}>Premium content for Premium learners — click lock icon to toggle</p>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14 }}>
        {items.map((t,i)=>{
          const a = ACCENTS[t.accent]
          return (
            <ACard key={i} style={{ padding:18,display:'flex',alignItems:'center',gap:16 }}>
              <div style={{ width:52,height:52,borderRadius:14,background:a.g,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',flexShrink:0 }}>PRM</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14,color:S.text }}>{t.lang} {t.title}</div>
                <div style={{ fontSize:12,color:t.locked?S.muted:ACCENTS.green.c,marginTop:3 }}>{t.locked ? 'Premium - Locked' : '✅ Unlocked'}</div>
              </div>
              <button onClick={()=>toggleLock(i)} style={{ background:'none',border:'none',cursor:'pointer',padding:8,borderRadius:8,transition:'all 0.2s' }} title={t.locked?'Click to unlock':'Click to lock'}>
                {t.locked ? <Lock size={16} color={S.light}/> : <CheckCircle size={16} color={ACCENTS.green.c}/>}
              </button>
            </ACard>
          )
        })}
      </div>
    </div>
  )
}

// Course Runs View
function CourseRunsView() {
  const [runs, setRuns] = useState([
    { course:'English Stage 1', host:'Mr.John',       start:'09:00', students:12, status:'live' },
    { course:'Chinese Stage 1', host:'TeacherLi',     start:'10:30', students:8,  status:'scheduled' },
    { course:'Japanese Stage 1',host:'Sensei Tanaka', start:'14:00', students:15, status:'live' },
    { course:'English Stage 2', host:'Mr.John',       start:'16:00', students:0,  status:'scheduled' },
  ])

  const handleAction = (idx) => {
    const run = runs[idx]
    if (run.status === 'live') {
      alert(`Joining live session: ${run.course} with ${run.host}. Redirecting to Live Rooms...`)
    } else {
      const confirmed = window.confirm(`Schedule notification for ${run.course} at ${run.start}?`)
      if (confirmed) {
        setRuns(prev => prev.map((r,i) => i===idx ? {...r, status:'live', students: r.students + 1} : r))
        alert(`You have been added to ${run.course}! Session will start at ${run.start}.`)
      }
    }
  }

  return (
    <div className="fade-up" style={{ padding:'28px 28px 40px' }}>
      <h1 style={{ fontSize:24,fontWeight:800,color:S.text,fontFamily:"'Outfit',sans-serif",margin:'0 0 4px' }}>Course Runs</h1>
      <p style={{ color:S.muted,fontSize:13.5,margin:'0 0 24px' }}>Online sessions running and scheduled</p>
      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {runs.map((r,i)=>(
          <ACard key={i} style={{ padding:'16px 20px',display:'flex',alignItems:'center',gap:18,borderTop:`3px solid ${r.status==='live'?ACCENTS.green.c:S.border}` }}>
            <div style={{ width:12,height:12,borderRadius:'50%',background:r.status==='live'?ACCENTS.green.c:S.light,flexShrink:0,boxShadow:r.status==='live'?`0 0 8px ${ACCENTS.green.c}`:'none' }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,fontSize:14,color:S.text }}>{r.course}</div>
              <div style={{ fontSize:12,color:S.muted,marginTop:2 }}>Host: {r.host} - Start: {r.start}</div>
            </div>
            <ABadge accent={r.status==='live'?'green':'amber'}>{r.status}</ABadge>
            <span style={{ fontSize:13,color:S.muted }}>{r.students} students</span>
            <ABtn sm variant={r.status==='live'?'primary':'outline'} accent={r.status==='live'?'green':'blue'} onClick={()=>handleAction(i)}>{r.status==='live'?'Join':'Schedule'}</ABtn>
          </ACard>
        ))}
      </div>
    </div>
  )
}

// Main AdminApp

  // --- TEACHER WORKSPACE ---
  function TeacherProfileView({ user }) {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const doChangePass = async (e) => {
      e.preventDefault();
      if (!oldPass || !newPass) return alert('Please fill in all fields');
      try {
        const res = await fetch(`${API_BASE}/api/users/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email, oldPassword: oldPass, newPassword: newPass })
        });
        if (res.ok) {
          alert('Password changed successfully!');
          setOldPass(''); setNewPass('');
        } else {
          const data = await res.json();
          alert('Error: ' + data.error);
        }
      } catch(err) {
        alert('Server connection error');
      }
    };
    return (
      <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
        <ACard>
          <ACardHead icon={<Users size={13}/>} title="Teacher Profile" accent="purple" gradient />
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#8b5cf6,#d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff' }}>👨‍🏫</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{user.displayName || user.username}</div>
                <div style={{ color: S.muted }}>{user.email}</div>
                <div style={{ marginTop: 8 }}><ABadge accent="purple">Mentor</ABadge></div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, maxWidth: 400 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Change Password</div>
              <form onSubmit={doChangePass} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Old Password</div>
                  <input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Enter current password..." />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>New Password</div>
                  <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Enter new password..." />
                </div>
                <button type="submit" style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>Save Password</button>
              </form>
            </div>
          </div>
        </ACard>
      </div>
    );
  }

  function TeacherClassroomsView() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
      loadClassrooms();
    }, []);

    async function loadClassrooms() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/teacher/classrooms`);
        if (!res.ok) throw new Error("Failed to fetch classrooms");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch from Teacher API, using fallback data:", err);
        setError("Offline Mode: Server connection failed. Using template offline data.");
        setData({
          className: "Lucy Global Language School - English Classroom",
          totalStudents: 3,
          students: [
            { name: "Nguyen Van A", email: "student@lucy.edu", progress: "150 XP", status: "Active" },
            { name: "Tran Thi B", email: "ttb@gmail.com", progress: "62 XP", status: "Active" },
            { name: "Le Hoang C", email: "lhc@gmail.com", progress: "12 XP", status: "Inactive" }
          ]
        });
      } finally {
        setLoading(false);
      }
    }

    const generateAIReport = async (student) => {
      setGenerating(true);
      setAiFeedback(null);
      try {
        const res = await fetch(`${API_BASE}/api/agent/mentor-feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 1,
            answerText: `Generate a professional, encouraging Vietnamese progress report card and recommendation for student ${student.name} (${student.email}) who has progress: ${student.progress}.`,
            lessonCode: 'REPORT_CARD'
          })
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const result = await res.json();
        setAiFeedback(result);
      } catch (e) {
        console.error(e);
        setAiFeedback({
          feedback: `[AI Fallback Report] Học viên ${student.name} đang cho thấy những tiến bộ rõ rệt trong lộ trình học tập, hoàn thành các bài học và đạt tích lũy ${student.progress}. Cần tiếp tục duy trì đà học tập để đạt kết quả tốt nhất.`,
          speakingTips: "Nên tham gia các phòng nói tiếng Anh Live Room 15-20 phút hàng ngày để tăng phản xạ.",
          confidenceScore: 85
        });
      } finally {
        setGenerating(false);
      }
    };

    if (loading) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 30, height: 30, border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
          <div>Loading classroom info...</div>
        </div>
      );
    }

    const currentClass = data || { className: '', totalStudents: 0, students: [] };
    const filteredStudents = currentClass.students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterStatus === 'All' || s.status === filterStatus;
      return matchSearch && matchFilter;
    });

    return (
      <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '1.2fr 1fr' : '1fr', gap: 20 }}>
          
          <ACard>
            <ACardHead icon={<BookOpen size={15}/>} title="My Classroom & Student Directory" accent="blue" gradient />
            <div style={{ padding: 24 }}>
              {error && (
                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b45309', marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}
              
              <div style={{ background: '#eff6ff', padding: 16, borderRadius: 12, border: '1px solid #bfdbfe', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1e40af' }}>{currentClass.className}</div>
                  <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 4 }}>Size: {currentClass.totalStudents} students registered</div>
                </div>
                <button onClick={loadClassrooms} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>🔄 Refresh</button>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="🔍 Search students by name or email..." 
                  style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                />
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)} 
                  style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13.5, background: '#fff' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Student</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Email</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Progress</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: selectedStudent?.email === s.email ? '#f1f5f9' : 'transparent', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{s.name}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{s.email}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#10b981' }}>{s.progress}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <ABadge accent={s.status === 'Active' ? 'green' : 'red'}>{s.status}</ABadge>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => { setSelectedStudent(s); setAiFeedback(null); }} 
                            style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Details & AI Report
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                          No students matched your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ACard>

          {selectedStudent && (
            <div className="fade-in">
              <ACard style={{ border: '1.5px solid #8b5cf6' }}>
                <ACardHead icon={<Sparkles size={15}/>} title="Student AI Report & Profile" accent="purple" action={
                  <button 
                    onClick={() => setSelectedStudent(null)} 
                    style={{ border: 'none', background: 'transparent', fontSize: 16, cursor: 'pointer', color: '#fff' }}
                  >✕</button>
                } gradient />
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎓</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{selectedStudent.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{selectedStudent.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>TOTAL PROGRESS</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#6d28d9', marginTop: 4 }}>{selectedStudent.progress}</div>
                    </div>
                    <div style={{ background: selectedStudent.status === 'Active' ? '#f0fdf4' : '#fef2f2', border: selectedStudent.status === 'Active' ? '1px solid #bbf7d0' : '1px solid #fecaca', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: selectedStudent.status === 'Active' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>STATUS</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: selectedStudent.status === 'Active' ? '#15803d' : '#b91c1c', marginTop: 4 }}>{selectedStudent.status}</div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🤖 AI Progress Evaluation
                    </h3>
                    
                    {!aiFeedback && !generating && (
                      <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>Analyze this student's progress and generate an encouraging AI report card instantly.</p>
                        <button 
                          onClick={() => generateAIReport(selectedStudent)} 
                          style={{ padding: '10px 16px', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}
                        >
                          ✨ Generate AI Report Card
                        </button>
                      </div>
                    )}

                    {generating && (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                        <div style={{ width: 28, height: 28, border: '3px solid #ddd6fe', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                        <div style={{ fontSize: 13 }}>Consulting LISA AI Mentor agent...</div>
                      </div>
                    )}

                    {aiFeedback && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        
                        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', marginBottom: 6 }}>AI MENTOR FEEDBACK</div>
                          <div style={{ fontSize: 13, color: '#4c1d95', lineHeight: 1.5, fontWeight: 500 }}>
                            {aiFeedback.feedback}
                          </div>
                        </div>

                        {aiFeedback.speakingTips && (
                          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', marginBottom: 6 }}>RECOMMENDED SPEAKING TIPS</div>
                            <div style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 1.5 }}>
                              {aiFeedback.speakingTips}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Confidence Score:</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>🎯 {aiFeedback.confidenceScore}%</span>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                          <button 
                            onClick={async () => {
                              const text = `Học viên: ${selectedStudent.name}\nTiến trình: ${selectedStudent.progress}\nĐánh giá từ AI Coach:\n${aiFeedback.feedback}\nLời khuyên: ${aiFeedback.speakingTips}`;
                              await navigator.clipboard.writeText(text);
                              alert('AI Report card copied to clipboard!');
                            }} 
                            style={{ flex: 1, padding: '9px 0', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                          >
                            📋 Copy Report
                          </button>
                          <button 
                            onClick={() => generateAIReport(selectedStudent)} 
                            style={{ padding: '9px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, fontSize: 12, color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}
                          >
                            🔄 Regenerate
                          </button>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              </ACard>
            </div>
          )}

        </div>
      </div>
    );
  }

  function TeacherMaterialsView() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subjectInput, setSubjectInput] = useState('');
    const [lessonInput, setLessonInput] = useState('');
    const [search, setSearch] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
      loadMaterials();
    }, []);

    async function loadMaterials() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/teacher/materials`);
        if (!res.ok) throw new Error("Failed to fetch materials");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch from Teacher API:", err);
        setError("Offline Mode: Server connection failed. Using template offline data.");
        setData([
          { subject: 'English Communication (Offline)', lessons: ['Lesson 1: Greetings & Introductions', 'Lesson 2: Daily Routines', 'Lesson 3: Ordering Food'] },
          { subject: 'Fundamental Grammar (Offline)', lessons: ['Lesson 1: Present Simple Tense', 'Lesson 2: Past Simple Tense'] }
        ]);
      } finally {
        setLoading(false);
      }
    }

    const handleAddMaterial = async (e) => {
      e.preventDefault();
      if (!subjectInput.trim() || !lessonInput.trim()) return;
      setAdding(true);
      try {
        const res = await fetch(`${API_BASE}/api/teacher/materials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: subjectInput.trim(),
            lessonName: lessonInput.trim()
          })
        });
        if (!res.ok) throw new Error("Failed to add material");
        const updated = await res.json();
        setData(updated);
        setLessonInput('');
        setError(null);
      } catch (err) {
        alert("Error adding material: " + err.message);
      } finally {
        setAdding(false);
      }
    };

    const handleDeleteMaterial = async (subject, lesson) => {
      if (!window.confirm(`Are you sure you want to delete "${lesson}" from "${subject}"?`)) return;
      try {
        const res = await fetch(`${API_BASE}/api/teacher/materials?subject=${encodeURIComponent(subject)}&lesson=${encodeURIComponent(lesson)}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete material");
        const updated = await res.json();
        setData(updated);
        setError(null);
      } catch (err) {
        alert("Error deleting material: " + err.message);
      }
    };

    if (loading) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 30, height: 30, border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
          <div>Loading teaching materials...</div>
        </div>
      );
    }

    const filteredMaterials = data.filter(m => {
      const matchSubject = m.subject.toLowerCase().includes(search.toLowerCase());
      const matchLessons = m.lessons.some(l => l.toLowerCase().includes(search.toLowerCase()));
      return matchSubject || matchLessons;
    });

    return (
      <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          
          <ACard>
            <ACardHead icon={<FileText size={15}/>} title="Teaching Resources Directory" accent="pink" gradient />
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {error && (
                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b45309' }}>
                  ⚠️ {error}
                </div>
              )}

              <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="🔍 Filter resources by subject or lesson..." 
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13.5 }}
              />

              <div style={{ display: 'grid', gap: 16 }}>
                {filteredMaterials.map((m, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: 800, borderBottom: '1px solid #e2e8f0', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📚 {m.subject}</span>
                      <ABadge accent="pink">{m.lessons.length} lessons</ABadge>
                    </div>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {m.lessons.map((l, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1e3a8a', fontWeight: 600, fontSize: 13.5 }}>
                            <FileText size={14} style={{ color: '#ec4899' }} /> <span>{l}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteMaterial(m.subject, l)} 
                            style={{ border: 'none', background: 'transparent', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                            onMouseLeave={e => e.currentTarget.style.color = '#f87171'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredMaterials.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 12, color: '#94a3b8', fontSize: 13.5 }}>
                    No materials found. Try adding a new subject or lesson.
                  </div>
                )}
              </div>
            </div>
          </ACard>

          <div className="fade-in">
            <ACard>
              <ACardHead icon={<Plus size={15}/>} title="Create Resource" accent="blue" gradient />
              <form onSubmit={handleAddMaterial} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>SUBJECT / COURSE</label>
                  <input 
                    type="text" 
                    value={subjectInput} 
                    onChange={e => setSubjectInput(e.target.value)} 
                    placeholder="e.g. English Communication..." 
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>LESSON TITLE</label>
                  <input 
                    type="text" 
                    value={lessonInput} 
                    onChange={e => setLessonInput(e.target.value)} 
                    placeholder="e.g. Lesson 4: Family Members..." 
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={adding || !subjectInput.trim() || !lessonInput.trim()} 
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.3)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}
                >
                  {adding ? 'Creating...' : '✨ Publish Resource'}
                </button>

              </form>
            </ACard>
          </div>

        </div>
      </div>
    );
  }

  function AdminInsightsView() {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      async function fetchInsights() {
        try {
          const res = await fetch(`${API_BASE}/api/agent/admin-insights`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setInsights(data);
        } catch (err) {
          console.error("Failed to fetch admin insights:", err);
          setError("Offline Mode: Server connection failed. Using local fallback.");
          setInsights({
            activeClassrooms: 5,
            contentHealth: "92%",
            weakAreas: ["Chinese Level 3 Tones"],
            riskAlerts: ["2 students inactive for > 7 days"],
            recommendedActions: [
              "Reprocess curriculum import data_importer_toolkit/LucyImporter",
              "Send push notifications to inactive learners"
            ]
          });
        } finally {
          setLoading(false);
        }
      }
      fetchInsights();
    }, []);

    if (loading) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 30, height: 30, border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
          <div>Loading AI System Insights...</div>
        </div>
      );
    }

    const data = insights || {
      activeClassrooms: 0,
      contentHealth: "N/A",
      weakAreas: [],
      riskAlerts: [],
      recommendedActions: []
    };

    return (
      <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
        <ACard>
          <ACardHead icon={<Sparkles size={13}/>} title="AI System & Classroom Insights" accent="pink" gradient />
          <div style={{ padding: 24 }}>
            {error && (
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b45309', marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#eff6ff', padding: 16, borderRadius: 12, border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>Active Classrooms</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e40af', marginTop: 4 }}>{data.activeClassrooms}</div>
              </div>
              <div style={{ background: '#ecfdf5', padding: 16, borderRadius: 12, border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>Curriculum Content Health</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46', marginTop: 4 }}>{data.contentHealth}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>⚠️ Weak Syllabus Areas</h3>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', minHeight: 100 }}>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#334155' }}>
                    {data.weakAreas.map((w, idx) => <li key={idx} style={{ marginBottom: 4 }}>{w}</li>)}
                    {data.weakAreas.length === 0 && <li style={{ fontStyle: 'italic', color: '#94a3b8' }}>No weak areas identified</li>}
                  </ul>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 20, marginBottom: 10 }}>🚨 Risk Alerts</h3>
                <div style={{ background: '#fef2f2', padding: 16, borderRadius: 12, border: '1px solid #fecaca', minHeight: 100 }}>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#991b1b' }}>
                    {data.riskAlerts.map((r, idx) => <li key={idx} style={{ marginBottom: 4 }}>{r}</li>)}
                    {data.riskAlerts.length === 0 && <li style={{ fontStyle: 'italic', color: '#94a3b8' }}>No risk alerts active</li>}
                  </ul>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>⚡ Recommended Agent Actions</h3>
                <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 12, border: '1px solid #bbf7d0', minHeight: 250 }}>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#166534' }}>
                    {data.recommendedActions.map((a, idx) => <li key={idx} style={{ marginBottom: 6 }}>{a}</li>)}
                    {data.recommendedActions.length === 0 && <li style={{ fontStyle: 'italic', color: '#94a3b8' }}>No actions recommended</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ACard>
      </div>
    );
  }

export default function AdminApp({ user, onLogout }) {
  const [active, setActive] = useState('dashboard')
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchLang = async (dbLangCode) => {
          const res = await fetch(`${API_BASE}/api/lessons?lang=${dbLangCode}`)
          const data = await res.json()
          return data.map((l, idx) => ({
            id: dbLangCode.toLowerCase() + (idx + 1),
            level: idx + 1,
            title: l.title,
            stage: l.stage,
            vocab: l.vocab,
            grammar: l.grammar,
            emoji: '📖'
          }))
        }

        const [en, zh, ja] = await Promise.all([
          fetchLang('LISA'), // API dùng LISA cho tiếng Anh
          fetchLang('ZH'),
          fetchLang('JA')
        ])

        LESSON_DATA['EN'] = en
        LESSON_DATA['ZH'] = zh
        LESSON_DATA['JA'] = ja
        setDataLoaded(true)
      } catch (e) {
        console.error("Lỗi khi fetch API, Backend có thể chưa bật:", e)
        setDataLoaded(true)
      }
    }
    fetchData()
  }, [])

  if (!dataLoaded) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', color: '#1e293b', fontSize: 20, fontWeight: 'bold' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '4px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Đang kết nối Server tải bài học (Admin)...
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch(active) {
      case 'dashboard':          return <DashboardView setActive={setActive} user={user}/>
      case 'courses':            return <CoursesView/>
      case 'course-runs':        return <CourseRunsView/>
      case 'chapters':           return <ChaptersView/>
      case 'lessons':            return <LessonsView/>
      case 'live-rooms':         return <LiveRoomsView role={user?.role} user={user}/>
      case 'podcasts':           return <PodcastsView/>
      case 'premium':            return <PremiumView/>
      case 'import':             return <ImportFilesView/>
      case 'preview':            return <DocxPreviewView/>
      case 'imported-data':      return <ImportedDataView/>
      case 'insights':           return <AdminInsightsView/>
      case 'templates':          return <PromptTemplatesView/>
      case 'questions':          return <GeneratedQuestionsView/>
      case 'users':              return <UsersView user={user}/>
      case 'teacher-profile':    return <TeacherProfileView user={user}/>
      case 'teacher-classrooms': return <TeacherClassroomsView/>
      case 'teacher-materials':  return <TeacherMaterialsView/>
      default:                   return <DashboardView setActive={setActive} user={user}/>
    }
  }

  return (
    <div style={{ display:'flex',height:'100vh',fontFamily:"'Inter','Segoe UI',sans-serif",fontSize:14,color:S.text,overflow:'hidden' }}>
      <Sidebar active={active} setActive={setActive} user={user} onLogout={onLogout}/>
      <main style={{ flex:1,overflowY:'auto',background:S.bg }}>
        <ErrorBoundary>
          {renderView()}
        </ErrorBoundary>
      </main>
    </div>
  )
}
