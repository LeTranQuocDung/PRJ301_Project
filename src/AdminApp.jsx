import { useState, useEffect, useRef } from 'react'
import { api } from './apiClient'
import {
  BookOpen, Play, FileText, Headphones, Upload, Eye, Zap,
  MessageSquare, Mic, Users, Radio, Pin, PhoneOff, Phone,
  Plus, Star, Volume2, Layers, RefreshCw, Trash2,
  CheckCircle, AlertCircle, Info, ChevronRight, Settings,
  Globe, Lock, Database, Award, LayoutDashboard, LogOut,
  BarChart2, TrendingUp, Sparkles
} from 'lucide-react'

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
  blue: { c: '#3b82f6', l: '#eff6ff', b: '#bfdbfe', g: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
  green: { c: '#10b981', l: '#ecfdf5', b: '#6ee7b7', g: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  red: { c: '#ef4444', l: '#fef2f2', b: '#fca5a5', g: 'linear-gradient(135deg,#ef4444,#f97316)' },
  amber: { c: '#f59e0b', l: '#fffbeb', b: '#fde68a', g: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  purple: { c: '#8b5cf6', l: '#f5f3ff', b: '#c4b5fd', g: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
  cyan: { c: '#06b6d4', l: '#ecfeff', b: '#a5f3fc', g: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  pink: { c: '#ec4899', l: '#fdf2f8', b: '#f9a8d4', g: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
  indigo: { c: '#6366f1', l: '#eef2ff', b: '#c7d2fe', g: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
}

// ─── Shared primitives ──────────────────────────────────────────────────────
const ABadge = ({ children, accent = 'blue', style }) => {
  const a = ACCENTS[accent]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: a.c, background: a.l, border: `1px solid ${a.b}`, whiteSpace: 'nowrap', ...style }}>
      {children}
    </span>
  )
}

const ABtn = ({ children, onClick, variant = 'primary', accent = 'blue', sm, disabled, fullWidth, style = {} }) => {
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
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: sm ? '5px 12px' : '8px 16px',
      borderRadius: sm ? 8 : 10, fontSize: sm ? 12 : 13, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, background: v.bg, color: v.color, border: v.border,
      boxShadow: v.shadow, width: fullWidth ? '100%' : undefined,
      transition: 'all 0.2s', fontFamily: 'inherit', ...style
    }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, color: gradient ? '#fff' : a.c }}>
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
  { items: [{ id: 'dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard', emoji: '📊' }] },
  {
    label: 'COURSES', color: '#3b82f6', items: [
      { id: 'courses', icon: <BookOpen size={15} />, label: 'Courses', emoji: '📚' },
      { id: 'chapters', icon: <Layers size={15} />, label: 'Chapters', emoji: '📖' },
      { id: 'lessons', icon: <FileText size={15} />, label: 'Lessons', emoji: '📝' },
    ]
  },
  {
    label: 'ROOMS', color: '#10b981', items: [
      { id: 'live-rooms', icon: <Mic size={15} />, label: 'Live Rooms', emoji: '🎙' },
    ]
  },
  {
    label: 'CONTENT', color: '#8b5cf6', items: [
      { id: 'podcasts', icon: <Headphones size={15} />, label: 'Podcasts', emoji: '🎧' },
      { id: 'premium', icon: <Star size={15} />, label: 'Premium', emoji: '⭐' },
    ]
  },
  {
    label: 'IMPORT', color: '#f59e0b', items: [
      { id: 'import', icon: <Upload size={15} />, label: 'Import Files', emoji: '📤' },
      { id: 'preview', icon: <Eye size={15} />, label: 'DOCX Preview', emoji: '👁' },
    ]
  },
  {
    label: 'AI', color: '#ec4899', items: [
      { id: 'templates', icon: <Zap size={15} />, label: 'AI Templates', emoji: '⚡' },
      { id: 'questions', icon: <MessageSquare size={15} />, label: 'AI Questions', emoji: '🤖' },
    ]
  },
  {
    label: 'USERS', color: '#06b6d4', items: [
      { id: 'users', icon: <Users size={15} />, label: 'Users', emoji: '👥' },
    ]
  },
]

function Sidebar({ active, setActive, user, onLogout, isOffline }) {
  const [hov, setHov] = useState(null)
  return (
    <aside style={{
      width: 220, minWidth: 220, background: S.sidebar,
      display: 'flex', flexDirection: 'column', height: '100vh',
      overflowY: 'auto', flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
            boxShadow: '0 0 16px rgba(99,102,241,0.5)',
          }}>🎵</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: '-0.03em', fontFamily: "'Outfit',sans-serif" }}>LUCY</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 0, letterSpacing: '0.08em' }}>ADMIN PANEL</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '8px 0' }}>
        {NAV_GROUPS.map((g, gi) => (
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
                  }}>
                  <span style={{ opacity: on ? 1 : 0.7 }}>{item.icon}</span>
                  {item.label}
                  {on && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>👨‍🏫</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Admin</div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '8px 0', borderRadius: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
        ><LogOut size={13} /> Đăng xuất</button>

        {/* Connection Status */}
        <div style={{
          background: isOffline ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${isOffline ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
          borderRadius: 8,
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontWeight: 600,
          color: isOffline ? '#f87171' : '#34d399',
          marginTop: 10,
          transition: 'all 0.3s ease'
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isOffline ? '#ef4444' : '#10b981',
            display: 'inline-block',
            boxShadow: `0 0 6px ${isOffline ? '#ef4444' : '#10b981'}`
          }} />
          {isOffline ? 'API Offline (Dữ liệu tĩnh)' : 'Database Connected'}
        </div>
      </div>
    </aside>
  )
}

// ─── Dashboard View ─────────────────────────────────────────────────────────
function DashboardView({ setActive }) {
  const stats = [
    { label: 'Khóa học', value: '7', icon: '📚', accent: 'blue', sub: '3 ngôn ngữ' },
    { label: 'Học viên', value: '455', icon: '🎓', accent: 'green', sub: '+12 tuần này' },
    { label: 'Bài học', value: '159', icon: '📝', accent: 'purple', sub: 'EN/ZH/JA' },
    { label: 'Live Rooms', value: '3', icon: '🔴', accent: 'red', sub: '2 đang live' },
  ]
  const recent = [
    { action: 'Học viên mới đăng ký', who: 'Nguyen_An', when: '5 phút trước', icon: '🎓', color: '#10b981' },
    { action: 'Import file DOCX thành công', who: 'LISA_English_Stage1.docx', when: '1 giờ trước', icon: '📤', color: '#3b82f6' },
    { action: 'Live Room bắt đầu', who: 'English Beginner – Daily Conversation', when: '2 giờ trước', icon: '🎙', color: '#ef4444' },
    { action: 'AI tạo 5 câu hỏi mới', who: 'Claude AI', when: '3 giờ trước', icon: '🤖', color: '#8b5cf6' },
    { action: 'Học viên hoàn thành Level 3', who: 'Tran_Linh', when: '4 giờ trước', icon: '🏆', color: '#f59e0b' },
  ]
  const quickActions = [
    { label: 'Thêm Khóa học', icon: '📚', accent: 'blue', id: 'courses' },
    { label: 'Live Room', icon: '🎙', accent: 'green', id: 'live-rooms' },
    { label: 'AI Questions', icon: '🤖', accent: 'purple', id: 'questions' },
    { label: 'Import File', icon: '📤', accent: 'amber', id: 'import' },
  ]

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Dashboard</h1>
        <p style={{ color: S.muted, fontSize: 13.5, margin: 0 }}>Tổng quan hoạt động nền tảng LUCY</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <ACard>
          <ACardHead icon={<TrendingUp size={15} />} title="Hoạt động gần đây" accent="blue" />
          <div style={{ padding: '4px 0' }}>
            {recent.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < recent.length - 1 ? `1px solid ${S.borderLight}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: S.text, fontWeight: 500 }}>{r.action}</div>
                  <div style={{ fontSize: 11.5, color: S.muted, marginTop: 2 }}>{r.who}</div>
                </div>
                <span style={{ fontSize: 11, color: S.light, whiteSpace: 'nowrap' }}>{r.when}</span>
              </div>
            ))}
          </div>
        </ACard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ACard>
            <ACardHead icon={<Sparkles size={15} />} title="Thao tác nhanh" accent="purple" />
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {quickActions.map(q => (
                <button key={q.id} onClick={() => setActive(q.id)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '14px 10px', borderRadius: 12,
                  background: ACCENTS[q.accent].l, border: `1px solid ${ACCENTS[q.accent].b}`,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = '' }}
                >
                  <span style={{ fontSize: 24 }}>{q.icon}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: ACCENTS[q.accent].c, textAlign: 'center', lineHeight: 1.3 }}>{q.label}</span>
                </button>
              ))}
            </div>
          </ACard>

          <ACard>
            <ACardHead icon={<BarChart2 size={15} />} title="Tiến độ ngôn ngữ" accent="green" />
            <div style={{ padding: 16 }}>
              {[
                { lang: '🇬🇧 English (LISA)', done: 145, total: 200, color: '#3b82f6' },
                { lang: '🇨🇳 Chinese (ZH)', done: 67, total: 150, color: '#ef4444' },
                { lang: '🇯🇵 Japanese (JA)', done: 52, total: 180, color: '#ec4899' },
              ].map((l, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: S.muted, marginBottom: 5 }}>
                    <span>{l.lang}</span>
                    <span style={{ fontWeight: 600, color: S.text }}>{l.done}/{l.total}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: l.color, width: `${(l.done / l.total) * 100}%`, transition: 'width 0.8s ease' }} />
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
  const courses = [
    { flag: '🇬🇧', lang: 'English', name: 'English Stage 1', level: 'Beginner', lessons: 20, students: 145, status: 'active' },
    { flag: '🇬🇧', lang: 'English', name: 'English Stage 2', level: 'Intermediate', lessons: 25, students: 89, status: 'active' },
    { flag: '🇬🇧', lang: 'English', name: 'English Stage 3', level: 'Advanced', lessons: 30, students: 43, status: 'draft' },
    { flag: '🇨🇳', lang: 'Chinese', name: 'Chinese Stage 1', level: 'Beginner', lessons: 18, students: 67, status: 'active' },
    { flag: '🇨🇳', lang: 'Chinese', name: 'Chinese Stage 2', level: 'Intermediate', lessons: 22, students: 31, status: 'active' },
    { flag: '🇯🇵', lang: 'Japanese', name: 'Japanese Stage 1', level: 'Beginner', lessons: 20, students: 52, status: 'active' },
    { flag: '🇯🇵', lang: 'Japanese', name: 'Japanese Stage 2', level: 'Intermediate', lessons: 24, students: 28, status: 'draft' },
  ]
  const active = courses.filter(c => c.status === 'active')
  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Courses</h1>
          <p style={{ color: S.muted, fontSize: 13.5, margin: 0 }}>Quản lý khóa học theo 3 ngôn ngữ và nhiều cấp độ</p>
        </div>
        <ABtn accent="blue"><Plus size={14} /> Khóa học mới</ABtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Tổng khóa học" value={courses.length} icon="📚" accent="blue" />
        <StatCard label="Đang active" value={active.length} icon="✅" accent="green" />
        <StatCard label="Tổng bài học" value={courses.reduce((a, c) => a + c.lessons, 0)} icon="📝" accent="purple" />
        <StatCard label="Học viên" value={courses.reduce((a, c) => a + c.students, 0)} icon="🎓" accent="cyan" />
      </div>
      <ACard>
        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 90px 80px 90px 90px', padding: '11px 18px', background: '#f8fafc', borderBottom: `1px solid ${S.border}`, fontSize: 11, fontWeight: 700, color: S.light, gap: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>#</span><span>Khóa học</span><span>Cấp độ</span><span>Ngôn ngữ</span><span>Bài học</span><span>Học viên</span><span>Trạng thái</span>
        </div>
        {courses.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 90px 80px 90px 90px', padding: '13px 18px', borderBottom: i < courses.length - 1 ? `1px solid ${S.borderLight}` : 'none', fontSize: 13, alignItems: 'center', gap: 12, transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <span style={{ color: S.light, fontSize: 12 }}>{i + 1}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{c.flag}</span>
              <span style={{ fontWeight: 600, color: S.text }}>{c.name}</span>
            </div>
            <ABadge accent={c.level === 'Beginner' ? 'green' : c.level === 'Intermediate' ? 'blue' : 'purple'}>{c.level}</ABadge>
            <span style={{ color: S.muted, fontSize: 12 }}>{c.lang}</span>
            <span style={{ color: S.muted }}>{c.lessons}</span>
            <span style={{ color: S.muted }}>{c.students}</span>
            <ABadge accent={c.status === 'active' ? 'green' : 'amber'}>{c.status}</ABadge>
          </div>
        ))}
      </ACard>
    </div>
  )
}

// ─── Chapters View ───────────────────────────────────────────────────────────
function ChaptersView() {
  const chapters = [
    { course: 'English Stage 1', chapter: 'Chapter 1: Hello World', topics: 5, done: true },
    { course: 'English Stage 1', chapter: 'Chapter 2: My Family', topics: 4, done: true },
    { course: 'English Stage 1', chapter: 'Chapter 3: At School', topics: 6, done: false },
    { course: 'English Stage 2', chapter: 'Chapter 1: City Life', topics: 5, done: true },
    { course: 'Chinese Stage 1', chapter: 'Chapter 1: Ni Hao', topics: 4, done: true },
    { course: 'Japanese Stage 1', chapter: 'Chapter 1: Hajimemashite', topics: 5, done: false },
  ]
  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Chapters</h1>
          <p style={{ color: S.muted, fontSize: 13.5, margin: 0 }}>Cấu trúc chương học theo từng khóa</p>
        </div>
        <ABtn accent="indigo"><Plus size={14} /> Chương mới</ABtn>
      </div>
      <ACard>
        {chapters.map((ch, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', borderBottom: i < chapters.length - 1 ? `1px solid ${S.borderLight}` : 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: ch.done ? ACCENTS.green.l : S.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ch.done ? <CheckCircle size={18} color={ACCENTS.green.c} /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${S.border}` }} />}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: S.text }}>{ch.chapter}</div>
                <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>{ch.course} · {ch.topics} topics</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ABadge accent={ch.done ? 'green' : 'amber'}>{ch.done ? 'Hoàn thành' : 'Đang soạn'}</ABadge>
              <ChevronRight size={15} color={S.light} />
            </div>
          </div>
        ))}
      </ACard>
    </div>
  )
}

// ─── Lessons View ─────────────────────────────────────────────────────────────
const LESSON_DATA = {
  EN: [
    { level: 1, title: 'SAYING WHO I AM', vi: 'Tự giới thiệu', stage: 'Stage 1', vocab: 'Hello, Name, Nice to meet you', grammar: 'I am + [Name]: I am Lucy.', question: 'What does "Nice to meet you" mean?', answer: 'Rất vui được gặp bạn' },
    { level: 2, title: "WHERE I'M FROM", vi: 'Quê quán', stage: 'Stage 1', vocab: 'Country, Vietnam, Where', grammar: 'I am from + [Country]: I am from Vietnam.', question: 'I am _____ Vietnam.', answer: 'from' },
    { level: 3, title: 'MY FAMILY', vi: 'Gia đình', stage: 'Stage 1', vocab: 'Father - Bố, Mother - Mẹ, Brother - Anh em trai', grammar: 'This is my [family member].', question: "What is 'mother' in Vietnamese?", answer: 'Mẹ' },
    { level: 4, title: 'NUMBERS & TIME', vi: 'Số và Thời gian', stage: 'Stage 1', vocab: 'One - Một, Time - Thời gian, Clock - Đồng hồ', grammar: "It is [number] o'clock.", question: 'What time is it? (8:00)', answer: "It is eight o'clock." },
    { level: 5, title: 'DAILY ROUTINE', vi: 'Sinh hoạt', stage: 'Stage 1', vocab: 'Wake up - Thức dậy, Sleep - Ngủ', grammar: 'I + verb + every day.', question: 'I _____ at 6AM every day.', answer: 'wake up' },
    { level: 6, title: 'FOOD & DRINKS', vi: 'Đồ ăn', stage: 'Stage 1', vocab: 'Rice - Cơm, Water - Nước', grammar: 'I would like + [food/drink], please.', question: 'How do you order rice politely?', answer: 'I would like rice, please.' },
    { level: 7, title: 'SHOPPING', vi: 'Mua sắm', stage: 'Stage 1', vocab: 'Buy - Mua, Money - Tiền', grammar: 'How much does this cost?', question: 'How do you ask for a price?', answer: 'How much does this cost?' },
    { level: 8, title: 'ASKING FOR DIRECTIONS', vi: 'Hỏi đường', stage: 'Stage 1', vocab: 'Left - Trái, Right - Phải', grammar: 'Could you tell me how to get to [place]?', question: 'How do you ask for directions to the station?', answer: 'Could you tell me how to get to the station?' },
    { level: 9, title: 'AT THE HOTEL', vi: 'Khách sạn', stage: 'Stage 1', vocab: 'Room - Phòng, Bed - Giường', grammar: 'I have a reservation.', question: 'How do you say you booked a room?', answer: 'I have a reservation.' },
    { level: 10, title: 'HEALTH & BODY', vi: 'Sức khỏe', stage: 'Stage 1', vocab: 'Head - Đầu, Hand - Tay', grammar: 'I have a + [symptom].', question: 'How do you say you have a headache?', answer: 'I have a headache.' },
    { level: 11, title: 'WEATHER & SEASONS', vi: 'Thời tiết', stage: 'Stage 1', vocab: 'Rain - Mưa, Sun - Nắng', grammar: 'It is + adjective + today.', question: 'How do you say it is raining?', answer: 'It is raining today.' },
  ],
  ZH: [
    { level: 1, title: '介绍', vi: 'Giới thiệu', stage: 'Stage 1', vocab: 'ni hao, xie xie, zai jian', grammar: 'Wo jiao [Name].', question: 'Ni jiao shenme mingzi?', answer: 'Wo jiao Xiao Ming.' },
    { level: 2, title: '家庭', vi: 'Gia đình', stage: 'Stage 1', vocab: 'ba ba, ma ma, ge ge, mei mei', grammar: 'Wo jia you [number] kou ren.', question: 'Ni jia you ji kou ren?', answer: 'Wo jia you si kou ren.' },
    { level: 3, title: '数字和时间', vi: 'Số và Thời gian', stage: 'Stage 1', vocab: 'yi er san si wu liu qi ba jiu shi', grammar: 'Xianzai [number] dian.', question: 'Xianzai ji dian?', answer: 'Xianzai ba dian.' },
    { level: 4, title: '日常生活', vi: 'Sinh hoạt', stage: 'Stage 1', vocab: 'qi chuang, shui jiao', grammar: 'Wo mei tian [number] dian qi chuang.', question: 'Ni mei tian ji dian qi chuang?', answer: 'Wo liu dian qi chuang.' },
    { level: 5, title: '饮食', vi: 'Ăn uống', stage: 'Stage 1', vocab: 'mi fan, mian tiao, ji dan', grammar: 'Wo xiang chi [food].', question: 'Ni xiang chi shenme?', answer: 'Wo xiang chi mi fan.' },
    { level: 6, title: '购物', vi: 'Mua sắm', stage: 'Stage 1', vocab: 'duo shao qian, pian yi, gui', grammar: 'Zhe ge duo shao qian?', question: 'How do you ask for a price in Chinese?', answer: 'Zhe ge duo shao qian?' },
    { level: 7, title: '交通', vi: 'Giao thông', stage: 'Stage 2', vocab: 'gong jiao, zuo, qu', grammar: 'Wo zuo [transport] qu [place].', question: 'Ni zenme qu xuexiao?', answer: 'Wo zuo gong jiao che qu.' },
    { level: 8, title: '住宿', vi: 'Chỗ ở', stage: 'Stage 2', vocab: 'fang jian, zhu, na li', grammar: 'Wo zhu zai [place].', question: 'Ni zhu zai nali?', answer: 'Wo zhu zai Beijing.' },
    { level: 9, title: '身体健康', vi: 'Sức khỏe', stage: 'Stage 2', vocab: 'tou, shou, bing', grammar: 'Wo [symptom] le.', question: 'Ni zenme le?', answer: 'Wo ganmao le.' },
    { level: 10, title: '天气', vi: 'Thời tiết', stage: 'Stage 2', vocab: 'xia yu, qing tian, leng, re', grammar: 'Jintian tianqi [adjective].', question: 'Jintian tianqi zenmeyang?', answer: 'Jintian xia yu.' },
    { level: 11, title: '爱好', vi: 'Sở thích', stage: 'Stage 2', vocab: 'shu, yinyue, yundong', grammar: 'Wo xihuan [activity].', question: 'Ni de aihao shi shenme?', answer: 'Wo xihuan kan shu.' },
  ],
  JA: [
    { level: 1, title: '自己紹介', vi: 'Tự giới thiệu', stage: 'Stage 1', vocab: 'watashi, namae', grammar: 'Watashi wa [Name] desu.', question: 'How do you introduce yourself in Japanese?', answer: 'Hajimemashite! Watashi wa Lucy desu.' },
    { level: 2, title: '家族', vi: 'Gia đình', stage: 'Stage 1', vocab: 'chichi, haha, oniisan', grammar: 'Kore wa watashi no [family] desu.', question: "How do you say 'This is my mother'?", answer: 'Kore wa watashi no haha desu.' },
    { level: 3, title: '数字と時間', vi: 'Số và Thời gian', stage: 'Stage 1', vocab: 'ichi ni san, ji', grammar: '[number]-ji desu.', question: 'How do you say it is 8 o\'clock?', answer: 'Hachi-ji desu.' },
    { level: 4, title: '毎日の生活', vi: 'Sinh hoạt', stage: 'Stage 1', vocab: 'okiru, neru, taberu', grammar: 'Watashi wa mai nichi [time] ni [action].', question: 'How do you say you wake up at 6?', answer: 'Watashi wa roku-ji ni okimasu.' },
    { level: 5, title: '食べ物と飲み物', vi: 'Đồ ăn', stage: 'Stage 1', vocab: 'taberu, nomu, gohan', grammar: '[food] o tabetai desu.', question: 'How do you say you want to eat rice?', answer: 'Gohan o tabetai desu.' },
    { level: 6, title: '買い物', vi: 'Mua sắm', stage: 'Stage 1', vocab: 'kau, okane, yasui, takai', grammar: 'Kore wa ikura desu ka?', question: 'How do you ask how much something costs?', answer: 'Kore wa ikura desu ka?' },
    { level: 7, title: '道を聞く', vi: 'Hỏi đường', stage: 'Stage 2', vocab: 'migi, hidari, massugu', grammar: '[place] wa doko desu ka?', question: 'How do you ask where the station is?', answer: 'Eki wa doko desu ka?' },
    { level: 8, title: 'ホテルで', vi: 'Khách sạn', stage: 'Stage 2', vocab: 'heya, beddo, chekku in', grammar: 'Yoyaku shite imasu.', question: 'How do you say you have a reservation?', answer: 'Yoyaku shite imasu.' },
    { level: 9, title: '体と健康', vi: 'Sức khỏe', stage: 'Stage 2', vocab: 'atama, te, byoki', grammar: '[body part] ga itai desu.', question: 'How do you say your head hurts?', answer: 'Atama ga itai desu.' },
    { level: 10, title: '天気と季節', vi: 'Thời tiết', stage: 'Stage 2', vocab: 'ame, hare, samui, atsui', grammar: 'Kyou wa [weather] desu.', question: 'How do you say it is raining today?', answer: 'Kyou wa ame desu.' },
    { level: 11, title: '趣味', vi: 'Sở thích', stage: 'Stage 2', vocab: 'hon, ongaku, eiga', grammar: '[activity] ga suki desu.', question: 'How do you say you like music?', answer: 'Ongaku ga suki desu.' },
  ],
}

// ─── Database Mapper ──────────────────────────────────────────────────────────
const DB_EMOJIS = {
  EN: ['👋', '🌏', '👨‍👩‍👧', '🕐', '🌅', '🍜', '🛍', '🗺', '🏨', '🏥', '⛅'],
  ZH: ['🙋', '👨‍👩‍👧', '🔢', '🌄', '🍱', '🛒', '🚌', '🏠', '💊', '🌤', '🎭'],
  JA: ['🤝', '👪', '⏱', '🌸', '🍣', '🏪', '🗾', '🏯', '🏥', '🌸', '🎌']
}

const mapRealDataToLessons = (realData) => {
  const mapped = { EN: [], ZH: [], JA: [] }
  realData.forEach((item) => {
    let lang = item.languageCode === 'LISA' ? 'EN' : (item.languageCode || 'EN')
    if (!mapped[lang]) mapped[lang] = []
    const levelNumber = mapped[lang].length + 1
    const emojiList = DB_EMOJIS[lang] || []
    const emoji = emojiList[(levelNumber - 1) % emojiList.length] || '📚'

    const staticLesson = LESSON_DATA[lang]?.[levelNumber - 1] || {}

    mapped[lang].push({
      level: levelNumber,
      title: item.levelName || staticLesson.title || 'Nội dung học',
      emoji: emoji,
      vi: item.stage || staticLesson.vi || 'Sơ cấp',
      vocab: item.subLevel || staticLesson.vocab || 'Từ vựng & hội thoại liên quan',
      grammar: staticLesson.grammar || `Hội thoại & Cấu trúc thực hành cấp độ ${levelNumber}`,
      question: item.questionAi || staticLesson.question || 'Luyện tập trả lời câu hỏi của AI.',
      answer: item.answer || staticLesson.answer || 'Câu trả lời mẫu.',
      stage: item.stage || staticLesson.stage || 'Stage 1'
    })
  })
  // Fallback to static mock data if a language is empty
  Object.keys(mapped).forEach((lang) => {
    if (mapped[lang].length === 0) {
      mapped[lang] = LESSON_DATA[lang]
    }
  })
  return mapped
}

const renderFormattedVocab = (text, primaryColor) => {
  if (!text) return null
  let formatted = text
  formatted = formatted.replace(/\s+(Sub-level \d+:|\d+:)/g, '\n$1')
  const lines = formatted.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length <= 1) {
    return <div style={{ fontSize: 13, color: S.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{text}</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '6px 0' }}>
      {lines.map((line, i) => {
        const isHeader = line.startsWith('Sub-level') || /^\d+:/.test(line)
        return (
          <div key={i} style={{
            background: isHeader ? 'rgba(0,0,0,0.02)' : 'transparent',
            borderLeft: isHeader ? `2.5px solid ${primaryColor}` : 'none',
            padding: isHeader ? '4px 8px' : '2px 8px 2px 16px',
            fontSize: isHeader ? 12.5 : 12,
            fontWeight: isHeader ? 700 : 500,
            color: isHeader ? S.text : S.muted,
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {!isHeader && (
              <span style={{
                width: 4, height: 4, borderRadius: '50%',
                background: primaryColor, display: 'inline-block',
                flexShrink: 0
              }} />
            )}
            {line}
          </div>
        )
      })}
    </div>
  )
}

const LANG_CFG = {
  EN: { flag: '🇬🇧', name: 'English', accent: 'blue', stageColor: { 'Stage 1': ACCENTS.blue, 'Stage 2': ACCENTS.cyan } },
  ZH: { flag: '🇨🇳', name: 'Chinese', accent: 'red', stageColor: { 'Stage 1': ACCENTS.red, 'Stage 2': ACCENTS.amber } },
  JA: { flag: '🇯🇵', name: 'Japanese', accent: 'pink', stageColor: { 'Stage 1': ACCENTS.pink, 'Stage 2': ACCENTS.purple } },
}

function LessonsView({ lessonsData }) {
  const [tab, setTab] = useState('EN')
  const [openId, setOpenId] = useState(null)
  const cfg = LANG_CFG[tab]
  const lessons = lessonsData[tab]

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Lessons</h1>
          <p style={{ color: S.muted, fontSize: 13.5, margin: 0 }}>Bài học chi tiết theo từng ngôn ngữ — click để xem nội dung</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['EN', 'ZH', 'JA'].map(l => {
            const c = LANG_CFG[l]
            const a = ACCENTS[c.accent]
            const on = tab === l
            return (
              <button key={l} onClick={() => { setTab(l); setOpenId(null) }} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                background: on ? a.g : '#fff', color: on ? '#fff' : S.muted,
                border: `1.5px solid ${on ? 'transparent' : S.border}`,
                fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: on ? `0 4px 14px ${a.c}44` : 'none', transition: 'all 0.2s',
              }}>
                <span>{c.flag}</span> {c.name} ({lessonsData[l].length})
              </button>
            )
          })}
        </div>
      </div>
      <ACard>
        {lessons.map((l, i) => {
          const isOpen = openId === l.level
          const a = cfg.stageColor[l.stage] || ACCENTS.blue
          return (
            <div key={l.level}>
              <div onClick={() => setOpenId(isOpen ? null : l.level)}
                style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${S.borderLight}`, cursor: 'pointer', background: isOpen ? a.l : '', transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = '' }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: isOpen ? a.g : S.borderLight, color: isOpen ? '#fff' : S.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0, marginRight: 14, transition: 'all 0.2s' }}>{l.level}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: S.text }}>{cfg.flag} {l.title}</div>
                  <div style={{ fontSize: 11.5, color: S.muted, marginTop: 2 }}>{l.vi}</div>
                </div>
                <ABadge accent={cfg.accent}>{l.stage}</ABadge>
                <span style={{ marginLeft: 12, color: S.light, transform: isOpen ? 'rotate(90deg)' : '', display: 'inline-block', transition: 'transform 0.2s', fontSize: 18 }}>›</span>
              </div>
              {isOpen && (
                <div className="fade-up" style={{ padding: '18px 20px 22px 62px', background: `linear-gradient(135deg,${a.l},#fff)`, borderBottom: `1px solid ${S.border}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div style={{ background: ACCENTS.green.l, padding: '12px 16px', borderRadius: 10, border: `1px solid ${ACCENTS.green.b}` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: ACCENTS.green.c, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📖 Vocabulary</div>
                      {renderFormattedVocab(l.vocab, a.c)}
                    </div>
                    <div style={{ background: ACCENTS.blue.l, padding: '12px 16px', borderRadius: 10, border: `1px solid ${ACCENTS.blue.b}` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: ACCENTS.blue.c, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✏️ Grammar</div>
                      <div style={{ fontSize: 13, color: S.text, lineHeight: 1.6 }}>{l.grammar}</div>
                    </div>
                  </div>
                  <div style={{ background: ACCENTS.amber.l, padding: '12px 16px', borderRadius: 10, border: `1px solid ${ACCENTS.amber.b}` }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: ACCENTS.amber.c, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>❓ Practice Question</div>
                    <div style={{ fontSize: 13.5, color: S.text, marginBottom: 6 }}>Q: {l.question}</div>
                    <div style={{ fontSize: 13.5, color: ACCENTS.green.c, fontWeight: 600 }}>✅ A: {l.answer}</div>
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
const AGORA_APP_ID = 'ca82570aa4a3464aadca4e28ee1d73b9'
const AGORA_CHANNEL = 'lucy_room_1'
const AGORA_TOKEN = '006ca82570aa4a3464aadca4e28ee1d73b9IACc5s3b/IwXIquJv0NUyYgLxo3PXKy0esWGIFIZ5GaFrJrnejAAAAAAIgCzgFZ7Vp06agQAAQBWnTpqAgBWnTpqAwBWnTpqBABWnTpq'

function LiveRoomsView() {
  const [uid] = useState(() => Math.floor(Math.random() * 99999) + 1)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [muted, setMuted] = useState(false)
  const [remotes, setRemotes] = useState([])
  const [error, setError] = useState(null)
  const [topicIdx, setTopicIdx] = useState(-1)
  const [selLesson, setSelLesson] = useState('')
  const [pinned, setPinned] = useState([])
  const clientRef = useRef(null)
  const micRef = useRef(null)

  const topics = ['Topic 1: Introducing Yourself', 'Topic 2: Asking Directions', 'Topic 3: Ordering Food', 'Topic 4: Shopping', 'Topic 5: At the Doctor']
  const lessons = ['Lesson 1 - Greetings', 'Lesson 2 - Numbers 1-20', 'Lesson 3 - Colors', 'Lesson 4 - Family Members', 'Lesson 5 - Daily Routines']

  useEffect(() => {
    if (typeof AgoraRTC === 'undefined') { setError('Agora SDK chưa tải. Kiểm tra kết nối internet.'); return }
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    client.on('user-published', async (user, type) => {
      await client.subscribe(user, type)
      if (type === 'audio') { user.audioTrack.play(); setRemotes(p => p.find(u => u.uid === user.uid) ? p : [...p, { uid: user.uid }]) }
    })
    client.on('user-unpublished', user => setRemotes(p => p.filter(u => u.uid !== user.uid)))
    client.on('user-left', user => setRemotes(p => p.filter(u => u.uid !== user.uid)))
    clientRef.current = client
    return () => { doLeave() }
  }, [])

  const doLeave = async () => {
    if (micRef.current) { micRef.current.stop(); micRef.current.close(); micRef.current = null }
    if (clientRef.current && joined) await clientRef.current.leave()
    setJoined(false); setRemotes([]); setMuted(false)
  }
  const doJoin = async () => {
    setJoining(true); setError(null)
    try {
      await clientRef.current.join(AGORA_APP_ID, AGORA_CHANNEL, AGORA_TOKEN, uid)
      const mic = await AgoraRTC.createMicrophoneAudioTrack()
      micRef.current = mic
      await clientRef.current.publish([mic])
      setJoined(true)
    } catch (e) { setError('Join thất bại: ' + e.message) }
    finally { setJoining(false) }
  }
  const doToggleMute = async () => { if (micRef.current) { await micRef.current.setMuted(!muted); setMuted(m => !m) } }

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Live Rooms</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <ABadge accent="green">{joined ? '🔴 LIVE' : '⬤ Offline'}</ABadge>
            <ABadge accent="blue">🇬🇧 English Beginner</ABadge>
          </div>
        </div>
        {joined && <ABtn variant="danger" accent="red" onClick={doLeave}><PhoneOff size={14} /> Rời phòng</ABtn>}
      </div>

      {error && (
        <div style={{ background: ACCENTS.red.l, border: `1px solid ${ACCENTS.red.b}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#991b1b', display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ACard>
            <ACardHead icon={<Volume2 size={14} />} title="Voice Chat (Agora RTC)" accent="blue" gradient action={
              joined ? <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>● LIVE — {remotes.length + 1} người</span>
                : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Chưa kết nối</span>
            } />
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: S.muted, marginBottom: 14, display: 'flex', gap: 20 }}>
                <span>Channel: <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{AGORA_CHANNEL}</code></span>
                <span>UID: <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{uid}</code></span>
              </div>
              {!joined ? (
                <button onClick={doJoin} disabled={joining} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '14px 0',
                  background: joining ? S.light : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                  color: '#fff', border: 'none', borderRadius: 12, fontSize: 14.5, fontWeight: 700,
                  cursor: joining ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  boxShadow: joining ? 'none' : '0 6px 24px rgba(99,102,241,0.4)', transition: 'all 0.2s',
                }}>
                  {joining ? <><div className="spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Đang kết nối...</>
                    : <><Phone size={16} /> Tham gia Voice Chat</>}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={doToggleMute} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0',
                    background: muted ? ACCENTS.red.l : ACCENTS.green.l,
                    color: muted ? ACCENTS.red.c : ACCENTS.green.c,
                    border: `1.5px solid ${muted ? ACCENTS.red.b : ACCENTS.green.b}`,
                    borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}><Mic size={15} />{muted ? 'Bật mic' : 'Tắt mic'}</button>
                  <button onClick={doLeave} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0',
                    background: ACCENTS.red.l, color: ACCENTS.red.c, border: `1.5px solid ${ACCENTS.red.b}`,
                    borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}><PhoneOff size={15} />Rời phòng</button>
                </div>
              )}
              {joined && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${S.border}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: S.light, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Trong phòng</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: ACCENTS.green.l, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENTS.green.c, display: 'inline-block' }} />
                    <span style={{ fontWeight: 700 }}>Bạn</span>
                    {muted && <ABadge accent="red">Muted</ABadge>}
                  </div>
                  {remotes.map(u => (
                    <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: ACCENTS.blue.l, borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENTS.blue.c, display: 'inline-block' }} />
                      <span>User #{u.uid}</span>
                      <ABadge accent="green">Đang nói</ABadge>
                    </div>
                  ))}
                  {remotes.length === 0 && <p style={{ fontSize: 12, color: S.light, fontStyle: 'italic', margin: 0 }}>Chờ người khác vào phòng...</p>}
                </div>
              )}
            </div>
          </ACard>

          <ACard>
            <ACardHead icon={<Radio size={14} />} title="Bài học đang học" accent="green" action={
              <ABtn sm accent="green" onClick={() => setTopicIdx(i => (i + 1) % topics.length)}>» Tiếp theo</ABtn>
            } />
            <div style={{ padding: 16 }}>
              {topicIdx >= 0
                ? <div style={{ background: ACCENTS.blue.l, border: `1px solid ${ACCENTS.blue.b}`, borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: S.light, marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Chủ đề hiện tại</div>
                  <div style={{ fontWeight: 700, color: S.text }}>{topics[topicIdx]}</div>
                </div>
                : <p style={{ fontSize: 13, color: S.light, fontStyle: 'italic', margin: 0 }}>Bấm "Tiếp theo" để bắt đầu.</p>
              }
            </div>
          </ACard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ACard>
            <ACardHead icon={<Info size={14} />} title="Thông tin phòng" accent="indigo" />
            <div style={{ padding: 16 }}>
              {[['Host', 'Mr.John'], ['Khóa học', 'English Stage 1'], ['App ID', AGORA_APP_ID.slice(0, 8) + '...'], ['Token', 'Temp (24h)'], ['Channel', AGORA_CHANNEL]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${S.borderLight}` }}>
                  <span style={{ color: S.muted }}>{k}</span>
                  <span style={{ fontWeight: 600, color: S.text }}>{v}</span>
                </div>
              ))}
            </div>
          </ACard>

          <ACard>
            <ACardHead icon={<Pin size={14} />} title="Tài liệu ghim" accent="amber" />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select value={selLesson} onChange={e => setSelLesson(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 13, background: '#fff', outline: 'none' }}>
                <option value="">-- Chọn bài học --</option>
                {lessons.map(l => <option key={l}>{l}</option>)}
              </select>
              <ABtn accent="amber" fullWidth onClick={() => { if (selLesson) { setPinned(p => [...p, { id: Date.now(), title: selLesson }]); setSelLesson('') } }} disabled={!selLesson}>
                <Pin size={13} /> Ghim tài liệu
              </ABtn>
              {pinned.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: ACCENTS.amber.l, borderRadius: 8, fontSize: 12 }}>
                  <Pin size={11} color={ACCENTS.amber.c} /><span style={{ flex: 1 }}>{m.title}</span>
                  <button onClick={() => setPinned(p => p.filter(x => x.id !== m.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.light, fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          </ACard>
        </div>
      </div>
    </div>
  )
}

// ─── Import Files View ───────────────────────────────────────────────────────
function ImportFilesView() {
  const [drag, setDrag] = useState(false)
  const [files, setFiles] = useState([
    { name: 'LISA_English_Stage1.docx', size: '2.3 MB', status: 'success', records: 145, date: '2026-06-14' },
    { name: 'LISA_English_Stage2.docx', size: '2.7 MB', status: 'success', records: 160, date: '2026-06-14' },
    { name: 'LISA_English_Stage3.docx', size: '3.1 MB', status: 'processing', records: null, date: '2026-06-15' },
    { name: 'Chinese_Stage1_Content.docx', size: '1.8 MB', status: 'success', records: 120, date: '2026-06-10' },
    { name: 'Chinese_Stage2_Content.docx', size: '2.1 MB', status: 'error', records: null, date: '2026-06-10' },
    { name: 'Japanese_Stage1_Content.docx', size: '1.9 MB', status: 'success', records: 130, date: '2026-06-12' },
    { name: 'Japanese_Stage2_Content.docx', size: '2.2 MB', status: 'success', records: 142, date: '2026-06-12' },
    { name: 'Japanese_Stage3_Content.docx', size: '2.5 MB', status: 'pending', records: null, date: '—' },
  ])

  const reimport = name => {
    setFiles(f => f.map(x => x.name === name ? { ...x, status: 'processing', records: null } : x))
    setTimeout(() => setFiles(f => f.map(x => x.name === name ? { ...x, status: 'success', records: Math.floor(Math.random() * 60) + 100 } : x)), 1800)
  }

  const statusBadge = s => ({
    success: <ABadge accent="green">✅ success</ABadge>,
    error: <ABadge accent="red">❌ error</ABadge>,
    processing: <ABadge accent="amber">⏳ processing</ABadge>,
    pending: <ABadge accent="indigo" style={{ color: S.muted }}>⬤ pending</ABadge>,
  }[s])

  const statusIcon = s => ({
    success: <CheckCircle size={15} color={ACCENTS.green.c} />,
    error: <AlertCircle size={15} color={ACCENTS.red.c} />,
    processing: <RefreshCw size={15} color={ACCENTS.amber.c} className="spin" />,
    pending: <div style={{ width: 15, height: 15, borderRadius: '50%', border: `2px solid ${S.border}` }} />,
  }[s])

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Import Files</h1>
      <p style={{ color: S.muted, fontSize: 13.5, margin: '0 0 22px' }}>Upload DOCX (LISA / Chinese / Japanese) để import vào database bằng Apache POI</p>

      <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false) }}
        style={{ border: `2px dashed ${drag ? ACCENTS.blue.c : S.border}`, borderRadius: 16, padding: '40px 24px', textAlign: 'center', background: drag ? ACCENTS.blue.l : '#fafafa', marginBottom: 22, transition: 'all 0.2s', cursor: 'pointer' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: drag ? ACCENTS.blue.c : S.text, marginBottom: 6 }}>{drag ? 'Thả file vào đây' : 'Kéo & Thả file DOCX tại đây'}</div>
        <p style={{ fontSize: 13, color: S.muted, margin: '0 0 16px' }}>Hỗ trợ .docx — LISA, Chinese, Japanese (Apache POI parser)</p>
        <ABtn variant="outline" accent="blue">Chọn file</ABtn>
      </div>

      <ACard>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: S.text }}>📋 Lịch sử import ({files.length} files)</span>
          <span style={{ fontSize: 12, color: S.muted }}>{files.filter(f => f.status === 'success').length}/{files.length} thành công</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 120px 90px 110px', padding: '10px 18px', background: '#f8fafc', borderBottom: `1px solid ${S.border}`, fontSize: 11, fontWeight: 700, color: S.light, gap: 12, textTransform: 'uppercase' }}>
          <span>File</span><span>Kích thước</span><span>Records</span><span>Trạng thái</span><span>Ngày</span><span>Thao tác</span>
        </div>
        {files.map((f, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 120px 90px 110px', padding: '12px 18px', borderBottom: i < files.length - 1 ? `1px solid ${S.borderLight}` : 'none', fontSize: 13, alignItems: 'center', gap: 12, transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{statusIcon(f.status)}<span style={{ fontWeight: 500, color: S.text, fontSize: 12 }}>{f.name}</span></div>
            <span style={{ color: S.muted, fontSize: 12 }}>{f.size}</span>
            <span style={{ color: S.muted, fontSize: 12 }}>{f.records ? f.records.toLocaleString() : '—'}</span>
            {statusBadge(f.status)}
            <span style={{ color: S.muted, fontSize: 12 }}>{f.date}</span>
            <ABtn sm variant="outline" accent="blue" onClick={() => reimport(f.name)}><RefreshCw size={11} /> Re-import</ABtn>
          </div>
        ))}
      </ACard>
    </div>
  )
}

// ─── DOCX Preview View ───────────────────────────────────────────────────────
function DocxPreviewView() {
  const [sel, setSel] = useState('LISA_English_Stage1.docx')
  const previews = {
    'LISA_English_Stage1.docx': {
      title: 'English Stage 1 — Beginner', lessons: [
        { title: 'Lesson 1: Greetings', content: 'Hello / Hi / Good morning / Good afternoon / Good evening', questions: 5 },
        { title: 'Lesson 2: Numbers 1–10', content: 'One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten', questions: 4 },
      ]
    },
    'Chinese_Stage1_Content.docx': {
      title: 'Chinese Stage 1 — Beginner', lessons: [
        { title: '第1课: 介绍', content: 'Ni hao / Xie xie / Zai jian / Wo jiao...', questions: 5 },
        { title: '第2课: 家庭', content: 'Ba ba / Ma ma / Ge ge / Mei mei', questions: 4 },
      ]
    },
    'Japanese_Stage1_Content.docx': {
      title: 'Japanese Stage 1 — Beginner', lessons: [
        { title: '第1課: 自己紹介', content: 'Watashi wa... desu / Hajimemashite / Yoroshiku onegaishimasu', questions: 5 },
        { title: '第2課: 家族', content: 'Chichi / Haha / Oniisan / Imoto', questions: 4 },
      ]
    },
  }
  const preview = previews[sel] || previews['LISA_English_Stage1.docx']
  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>DOCX Preview</h1>
      <p style={{ color: S.muted, fontSize: 13.5, margin: '0 0 18px' }}>Preview nội dung file trước khi đẩy vào database</p>
      <select value={sel} onChange={e => setSel(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${S.border}`, fontSize: 13, color: S.text, background: '#fff', marginBottom: 18, outline: 'none' }}>
        {Object.keys(previews).map(f => <option key={f}>{f}</option>)}
      </select>
      <ACard>
        <ACardHead icon={<FileText size={14} />} title={preview.title} accent="blue" gradient />
        {preview.lessons.map((l, i) => (
          <div key={i} style={{ padding: '16px 18px', borderBottom: `1px solid ${S.borderLight}` }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: S.text, marginBottom: 8 }}>{l.title}</div>
            <div style={{ fontSize: 13, color: S.muted, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginBottom: 10, fontFamily: 'monospace', lineHeight: 1.6 }}>{l.content}</div>
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
    { id: 1, name: 'Generate MCQ Questions', cat: 'Assessment', model: 'claude-sonnet-4-6', tokens: 800, active: true },
    { id: 2, name: 'Summarize Lesson Topic', cat: 'Content', model: 'claude-sonnet-4-6', tokens: 400, active: true },
    { id: 3, name: 'Create Dialog Practice', cat: 'Speaking', model: 'claude-sonnet-4-6', tokens: 600, active: true },
    { id: 4, name: 'Vocabulary Flashcards', cat: 'Vocabulary', model: 'claude-haiku-4-5-20251001', tokens: 300, active: false },
    { id: 5, name: 'Grammar Explanation', cat: 'Grammar', model: 'claude-sonnet-4-6', tokens: 500, active: true },
    { id: 6, name: 'Pronunciation Guide', cat: 'Speaking', model: 'claude-sonnet-4-6', tokens: 350, active: false },
  ])
  const catAccent = { Assessment: 'purple', Content: 'blue', Speaking: 'green', Vocabulary: 'cyan', Grammar: 'amber' }
  const toggle = id => setTemplates(p => p.map(t => t.id === id ? { ...t, active: !t.active } : t))
  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>AI Prompt Templates</h1>
          <p style={{ color: S.muted, fontSize: 13.5, margin: 0 }}>Cấu hình prompt AI cho Claude để tạo nội dung học tự động</p>
        </div>
        <ABtn accent="pink"><Plus size={14} /> Template mới</ABtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {templates.map(t => (
          <ACard key={t.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: S.text, marginBottom: 8 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <ABadge accent={catAccent[t.cat] || 'blue'}>{t.cat}</ABadge>
                  <ABadge accent="indigo" style={{ fontSize: 10 }}>{t.model.split('-').slice(0, 2).join('-')}</ABadge>
                </div>
              </div>
              <button onClick={() => toggle(t.id)} style={{ width: 42, height: 24, borderRadius: 12, background: t.active ? ACCENTS.green.g : '#d1d5db', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.25s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: t.active ? 21 : 3, transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: S.muted, display: 'flex', gap: 16, borderTop: `1px solid ${S.borderLight}`, paddingTop: 12 }}>
              <span>Max tokens: <strong style={{ color: S.text }}>{t.tokens}</strong></span>
              <span>Status: <strong style={{ color: t.active ? ACCENTS.green.c : S.muted }}>{t.active ? 'Active' : 'Inactive'}</strong></span>
            </div>
          </ACard>
        ))}
      </div>
    </div>
  )
}

// ─── AI Generated Questions View ─────────────────────────────────────────────
function GeneratedQuestionsView() {
  const [lang, setLang] = useState('English')
  const [level, setLevel] = useState('Beginner')
  const [topic, setTopic] = useState('Daily Greetings and Introductions')
  const [count, setCount] = useState(3)
  const [loading, setLoading] = useState(false)
  const [qs, setQs] = useState(null)
  const [err, setErr] = useState(null)
  const [sel, setSel] = useState({})

  const generate = async () => {
    setLoading(true); setErr(null); setQs(null); setSel({})
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 1000,
          messages: [{ role: 'user', content: `Generate exactly ${count} multiple-choice questions for ${lang} learners at ${level} level on topic: "${topic}". Return ONLY valid JSON array:\n[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A) ...","explanation":"Brief tip"}]` }]
        })
      })
      const data = await res.json()
      const text = data.content?.map(b => b.text || '').join('') || ''
      setQs(JSON.parse(text.replace(/```json|```/g, '').trim()))
    } catch { setErr('Không thể tạo câu hỏi. Kiểm tra API key và kết nối.') }
    setLoading(false)
  }

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>AI Generated Questions</h1>
      <p style={{ color: S.muted, fontSize: 13.5, margin: '0 0 22px' }}>Tạo câu hỏi MCQ bằng Claude AI cho bài học ngôn ngữ</p>

      <ACard style={{ marginBottom: 20, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: ACCENTS.pink.c, marginBottom: 18 }}><Zap size={16} /> Question Generator — Claude AI</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          {[['Ngôn ngữ', lang, setLang, ['English', 'Chinese', 'Japanese']], ['Cấp độ', level, setLevel, ['Beginner', 'Intermediate', 'Advanced']]].map(([label, val, fn, opts]) => (
            <div key={label}>
              <label style={{ fontSize: 12, fontWeight: 600, color: S.muted, display: 'block', marginBottom: 5 }}>{label}</label>
              <select value={val} onChange={e => fn(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 13, color: S.text, background: '#fff', outline: 'none' }}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: S.muted, display: 'block', marginBottom: 5 }}>Số câu: {count}</label>
            <input type="range" min={2} max={8} step={1} value={count} onChange={e => setCount(+e.target.value)} style={{ width: '100%', marginTop: 8, accentColor: ACCENTS.pink.c }} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: S.muted, display: 'block', marginBottom: 5 }}>Chủ đề / Tiêu đề bài</label>
          <input value={topic} onChange={e => setTopic(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 13, color: S.text, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <ABtn accent="pink" onClick={generate} disabled={loading || !topic.trim()}>
          {loading ? <><RefreshCw size={14} className="spin" />&nbsp;Đang tạo bằng Claude AI...</>
            : <><Sparkles size={14} />&nbsp;Tạo câu hỏi</>}
        </ABtn>
      </ACard>

      {err && <div style={{ background: ACCENTS.red.l, border: `1px solid ${ACCENTS.red.b}`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}><AlertCircle size={15} color={ACCENTS.red.c} /><span style={{ fontSize: 13, color: '#991b1b' }}>{err}</span></div>}
      {loading && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: '40px 0', textAlign: 'center' }}>
          <RefreshCw size={28} color={ACCENTS.pink.c} className="spin" style={{ margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontSize: 14, color: S.muted }}>Đang tạo {count} câu hỏi {level} {lang} về "{topic}"...</div>
        </div>
      )}
      {qs && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: S.muted }}><strong style={{ color: S.text }}>{qs.length} câu hỏi</strong> · {lang} · {level} · "{topic}"</span>
            <ABtn sm variant="outline" accent="pink" onClick={() => { setQs(null); setSel({}) }}>Xóa kết quả</ABtn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {qs.map((q, qi) => (
              <ACard key={qi} style={{ padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: S.text, marginBottom: 14 }}>Q{qi + 1}. {q.question}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {q.options?.map((opt, oi) => {
                    const isAns = opt === q.answer
                    const isSel = sel[qi] === oi
                    const shown = sel[qi] !== undefined
                    return (
                      <button key={oi} onClick={() => setSel(s => ({ ...s, [qi]: oi }))} style={{
                        padding: '10px 14px', borderRadius: 8, fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 8,
                        border: `1.5px solid ${shown && isAns ? ACCENTS.green.b : shown && isSel && !isAns ? ACCENTS.red.b : S.border}`,
                        background: shown && isAns ? ACCENTS.green.l : shown && isSel && !isAns ? ACCENTS.red.l : isSel ? ACCENTS.blue.l : '#fafafa',
                        color: shown && isAns ? '#065f46' : shown && isSel && !isAns ? '#991b1b' : S.text,
                        transition: 'all 0.15s',
                      }}>
                        {shown && isAns && <CheckCircle size={13} color={ACCENTS.green.c} style={{ flexShrink: 0 }} />}
                        {shown && isSel && !isAns && <AlertCircle size={13} color={ACCENTS.red.c} style={{ flexShrink: 0 }} />}
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {sel[qi] !== undefined && q.explanation && (
                  <div style={{ fontSize: 12, color: S.muted, background: '#f0f9ff', padding: '10px 14px', borderRadius: 8, borderLeft: `3px solid ${ACCENTS.blue.c}` }}>💡 {q.explanation}</div>
                )}
              </ACard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Users View ──────────────────────────────────────────────────────────────
function UsersView() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Nguyen_An', email: 'an@lucy.edu', phone: '0901234567', role: 'Anonymous Student', active: true },
    { id: 2, name: 'Mr.John', email: 'john@lucy.edu', phone: '0912345678', role: 'Teacher', active: true },
    { id: 3, name: 'Thao_Reviewer', email: 'thao@lucy.edu', phone: '0923456789', role: 'Influencer', active: false },
    { id: 4, name: 'Tran_Linh', email: 'linh@lucy.edu', phone: '0934567890', role: 'Anonymous Student', active: true },
    { id: 5, name: 'Sensei_Tanaka', email: 'tanaka@lucy.edu', phone: '0945678901', role: 'Teacher', active: true },
  ])
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Anonymous Student' })

  const roleAccent = { 'Anonymous Student': 'blue', Teacher: 'purple', Influencer: 'amber' }
  const roleIcon = { 'Anonymous Student': '🎓', Teacher: '👨‍🏫', Influencer: '👑' }

  const submit = e => {
    e.preventDefault(); if (!form.name) return
    if (editId) { setUsers(u => u.map(x => x.id === editId ? { ...x, ...form } : x)); setEditId(null) }
    else { setUsers(u => [...u, { id: Date.now(), ...form, active: true }]) }
    setForm({ name: '', email: '', phone: '', role: 'Anonymous Student' })
  }
  const startEdit = u => { setEditId(u.id); setForm({ name: u.name, email: u.email || '', phone: u.phone || '', role: u.role }) }
  const del = id => { if (window.confirm('Xóa người dùng này?')) setUsers(u => u.filter(x => x.id !== id)) }

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>User Management</h1>
      <p style={{ color: S.muted, fontSize: 13.5, margin: '0 0 24px' }}>Quản lý học viên, giảng viên và influencer trên nền tảng LUCY</p>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <ACard style={{ alignSelf: 'start' }}>
          <ACardHead icon={editId ? <Settings size={13} /> : <Plus size={13} />} title={editId ? 'Sửa người dùng' : 'Thêm người dùng'} accent="cyan" gradient />
          <form onSubmit={submit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['Tên (*)', 'name', 'text', 'Nhập tên...'], ['Email', 'email', 'email', 'Nhập email...'], ['SĐT', 'phone', 'tel', 'Nhập SĐT...']].map(([lbl, key, type, ph]) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: S.muted, display: 'block', marginBottom: 4 }}>{lbl}</label>
                <input type={type} value={form[key]} placeholder={ph} required={lbl.includes('*')} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: S.muted, display: 'block', marginBottom: 4 }}>Vai trò</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                <option>Anonymous Student</option><option>Teacher</option><option>Influencer</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <ABtn fullWidth accent="cyan">{editId ? 'Cập nhật' : 'Thêm mới'}</ABtn>
              {editId && <ABtn variant="ghost" onClick={() => { setEditId(null); setForm({ name: '', email: '', phone: '', role: 'Anonymous Student' }) }}>Hủy</ABtn>}
            </div>
          </form>
        </ACard>
        <ACard>
          <ACardHead icon={<Users size={13} />} title={`Danh sách (${users.length})`} accent="cyan" gradient />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${S.border}`, background: '#f8fafc' }}>
                  {['Tên', 'Liên hệ', 'Vai trò', 'Trạng thái', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: S.light, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${S.borderLight}` }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: S.text }}>{roleIcon[u.role]} {u.name}</td>
                    <td style={{ padding: '12px 16px', color: S.muted, fontSize: 12 }}>
                      <div>{u.email || <i style={{ color: S.light }}>Chưa có</i>}</div>
                      <div>{u.phone || <i style={{ color: S.light }}>Chưa có</i>}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><ABadge accent={roleAccent[u.role]}>{u.role}</ABadge></td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.active ? <span style={{ color: ACCENTS.green.c, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><CheckCircle size={13} />Active</span>
                        : <span style={{ color: S.light, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><AlertCircle size={13} />Inactive</span>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => startEdit(u)} style={{ background: 'none', border: 'none', color: ACCENTS.blue.c, cursor: 'pointer', padding: 4, marginRight: 4 }}><Settings size={14} /></button>
                      <button onClick={() => del(u.id)} style={{ background: 'none', border: 'none', color: ACCENTS.red.c, cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
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

// ─── Podcasts View ───────────────────────────────────────────────────────────
function PodcastsView() {
  const pods = [
    { title: 'Daily English Tips', ep: 12, lang: 'English', subs: 234, accent: 'blue', flag: '🇬🇧' },
    { title: 'Chinese for Beginners', ep: 8, lang: 'Chinese', subs: 145, accent: 'red', flag: '🇨🇳' },
    { title: 'Japanese Daily Phrases', ep: 15, lang: 'Japanese', subs: 178, accent: 'pink', flag: '🇯🇵' },
  ]
  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: 0 }}>Podcasts</h1>
        <ABtn accent="purple"><Plus size={14} /> Podcast mới</ABtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {pods.map((p, i) => {
          const a = ACCENTS[p.accent]
          return (
            <ACard key={i} style={{ padding: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: a.g, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16, boxShadow: `0 4px 16px ${a.c}44` }}>🎙️</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: S.text, marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: S.muted, marginBottom: 14 }}>{p.flag} {p.lang} · {p.ep} episodes</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: S.muted }}>👥 {p.subs} subscribers</span>
                <ABtn sm variant="outline" accent={p.accent}>Xem</ABtn>
              </div>
            </ACard>
          )
        })}
      </div>
    </div>
  )
}

// ─── Premium Content View ────────────────────────────────────────────────────
function PremiumView() {
  const items = [
    { title: 'Advanced Business English', lang: '🇬🇧', accent: 'blue' },
    { title: 'JLPT N5 Prep Course', lang: '🇯🇵', accent: 'pink' },
    { title: 'HSK 1 Complete Pack', lang: '🇨🇳', accent: 'red' },
    { title: 'Conversational English Master', lang: '🇬🇧', accent: 'indigo' },
  ]
  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Premium Content</h1>
      <p style={{ color: S.muted, fontSize: 13.5, margin: '0 0 24px' }}>Nội dung cao cấp dành cho học viên Premium</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {items.map((t, i) => {
          const a = ACCENTS[t.accent]
          return (
            <ACard key={i} style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: a.g, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>⭐</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: S.text }}>{t.lang} {t.title}</div>
                <div style={{ fontSize: 12, color: S.muted, marginTop: 3 }}>Premium · Đã khóa</div>
              </div>
              <Lock size={16} color={S.light} />
            </ACard>
          )
        })}
      </div>
    </div>
  )
}

// ─── Course Runs View ────────────────────────────────────────────────────────
function CourseRunsView() {
  const runs = [
    { course: 'English Stage 1', host: 'Mr.John', start: '09:00', students: 12, status: 'live' },
    { course: 'Chinese Stage 1', host: 'TeacherLi', start: '10:30', students: 8, status: 'scheduled' },
    { course: 'Japanese Stage 1', host: 'Sensei Tanaka', start: '14:00', students: 15, status: 'live' },
    { course: 'English Stage 2', host: 'Mr.John', start: '16:00', students: 0, status: 'scheduled' },
  ]
  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: S.text, fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Course Runs</h1>
      <p style={{ color: S.muted, fontSize: 13.5, margin: '0 0 24px' }}>Các phiên học trực tuyến đang chạy và theo lịch</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {runs.map((r, i) => (
          <ACard key={i} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 18, borderTop: `3px solid ${r.status === 'live' ? ACCENTS.green.c : S.border}` }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: r.status === 'live' ? ACCENTS.green.c : S.light, flexShrink: 0, boxShadow: r.status === 'live' ? `0 0 8px ${ACCENTS.green.c}` : 'none' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: S.text }}>{r.course}</div>
              <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>Host: {r.host} · Bắt đầu: {r.start}</div>
            </div>
            <ABadge accent={r.status === 'live' ? 'green' : 'amber'}>{r.status}</ABadge>
            <span style={{ fontSize: 13, color: S.muted }}>{r.students} học viên</span>
            <ABtn sm variant={r.status === 'live' ? 'primary' : 'outline'} accent={r.status === 'live' ? 'green' : 'blue'}>{r.status === 'live' ? 'Tham gia' : 'Lịch'}</ABtn>
          </ACard>
        ))}
      </div>
    </div>
  )
}

// ─── Main AdminApp ────────────────────────────────────────────────────────────
export default function AdminApp({ user, onLogout }) {
  const [active, setActive] = useState('dashboard')
  const [lessonsData, setLessonsData] = useState(LESSON_DATA)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    api.lessons.fetchRealData()
      .then(data => {
        if (data && data.length > 0) {
          const mapped = mapRealDataToLessons(data)
          setLessonsData(mapped)
          setIsOffline(false)
        } else {
          setIsOffline(true)
        }
      })
      .catch(err => {
        console.warn('Tomcat Backend /api/contents offline. Using local static lessons:', err)
        setIsOffline(true)
      })
  }, [])

  const renderView = () => {
    switch (active) {
      case 'dashboard': return <DashboardView setActive={setActive} />
      case 'courses': return <CoursesView />
      case 'course-runs': return <CourseRunsView />
      case 'chapters': return <ChaptersView />
      case 'lessons': return <LessonsView lessonsData={lessonsData} />
      case 'live-rooms': return <LiveRoomsView />
      case 'podcasts': return <PodcastsView />
      case 'premium': return <PremiumView />
      case 'import': return <ImportFilesView />
      case 'preview': return <DocxPreviewView />
      case 'templates': return <PromptTemplatesView />
      case 'questions': return <GeneratedQuestionsView />
      case 'users': return <UsersView />
      default: return <DashboardView setActive={setActive} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 14, color: S.text, overflow: 'hidden' }}>
      <Sidebar active={active} setActive={setActive} user={user} onLogout={onLogout} isOffline={isOffline} />
      <main style={{ flex: 1, overflowY: 'auto', background: S.bg }}>
        {renderView()}
      </main>
    </div>
  )
}
