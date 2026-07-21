import React, { useState, useEffect, useRef } from 'react'
import { agoraService } from './services/agoraClient'
import LiveRoomView from './LiveRoomView'
import { LayoutDashboard, BookOpen, FileText, TrendingUp, Mic, Zap, MessageSquare, Users, Volume2, Radio, Phone, PhoneOff, AlertCircle, Bot } from 'lucide-react'

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

const API_BASE = import.meta.env.VITE_LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI';
const AGORA_TOKEN_BASE = import.meta.env.VITE_AGORA_TOKEN_BASE || 'http://localhost:3000';

// ─── Language Config ──────────────────────────────────────────────────────────
const LANG = {
  EN: { flag:'🇬🇧', name:'English',  short:'EN', primary:'#3b82f6', light:'#eff6ff', dark:'#1d4ed8', gradient:'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  ZH: { flag:'🇨🇳', name:'Chinese',  short:'ZH', primary:'#ef4444', light:'#fef2f2', dark:'#b91c1c', gradient:'linear-gradient(135deg,#ef4444,#f97316)' },
  JA: { flag:'🇯🇵', name:'Japanese', short:'JA', primary:'#ec4899', light:'#fdf2f8', dark:'#be185d', gradient:'linear-gradient(135deg,#ec4899,#8b5cf6)' },
}

// ─── Lesson Data ──────────────────────────────────────────────────────────────
let LESSONS = { EN: [], ZH: [], JA: [] }

// ─── XP helpers ───────────────────────────────────────────────────────────────
const XP_PER_LESSON = 20
const LEVEL_THRESHOLDS = [0,100,250,500,900,1500]
const getLevel = xp => LEVEL_THRESHOLDS.filter(t=>xp>=t).length
const getLevelName = lv => ['Beginner','Elementary','Intermediate','Upper-Intermediate','Advanced','Expert'][lv-1]||'Beginner'
const xpToNextLevel = xp => {
  const lv = getLevel(xp)
  const next = LEVEL_THRESHOLDS[lv]
  const prev = LEVEL_THRESHOLDS[lv-1]||0
  if(!next) return { pct:100, toNext:0, nextXP:0 }
  return { pct:Math.round(((xp-prev)/(next-prev))*100), toNext:next-xp, nextXP:next }
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { items: [{ id:'home', icon:<LayoutDashboard size={15}/>, label:'Home' }] },
  { label:'LEARNING', color:'#3b82f6', items:[
    { id:'explore', icon:<BookOpen size={15}/>, label:'Explore' },
    { id:'learn', icon:<FileText size={15}/>, label:'Learn' },
    { id:'progress', icon:<TrendingUp size={15}/>, label:'Progress' },
  ]},
  { label:'ROOMS', color:'#10b981', items:[
    { id:'live', icon:<Mic size={15}/>, label:'Live Rooms' },
  ]},
  { label:'ENGAGEMENT', color:'#f59e0b', items:[
    { id:'podcasts', icon:<Radio size={15}/>, label:'Podcasts' },
    { id:'premium', icon:<Zap size={15}/>, label:'Premium Perks' },
    { id:'gifts', icon:<Users size={15}/>, label:'Gifts Store' },
  ]},
  { label:'AI', color:'#ec4899', items:[
    { id:'coach', icon:<Bot size={15}/>, label:'AI Coach' },
    { id:'templates', icon:<Zap size={15}/>, label:'AI Templates' },
    { id:'questions', icon:<MessageSquare size={15}/>, label:'AI Questions' },
  ]},
  { label:'ACCOUNT', color:'#06b6d4', items:[
    { id:'profile', icon:<Users size={15}/>, label:'Profile' },
  ]},
]

function Navbar({ active, setActive, user, xp, streak, onLogout }) {
  const sidebarBg = '#0f172a';
  const sidebarBorder = 'rgba(255,255,255,0.07)';

  return (
    <nav style={{
      width: 230, minWidth: 230, flexShrink: 0,
      background: sidebarBg,
      borderRight: `1px solid ${sidebarBorder}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto',
    }}>
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
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.08em', fontWeight: 600, marginTop: 4 }}>LUCY PORTAL</div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', border: `1px solid ${sidebarBorder}`, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Level {getLevel(xp)}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>⚡ {xp}</div>
            </div>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#38bdf8,#818cf8)', width: `${xpToNextLevel(xp).pct}%`, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      </div>

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
              return (
                <button key={item.id} onClick={() => setActive(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 18px 9px 15px',
                    background: on ? 'rgba(99,102,241,0.18)' : 'transparent',
                    color: on ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                    border: 'none', borderLeft: on ? '3px solid #6366f1' : '3px solid transparent',
                    cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: on ? 600 : 400,
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if(!on) { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                  onMouseLeave={e => { if(!on) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent' } }}
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

<div style={{ padding: '20px 16px', borderTop: `1px solid ${sidebarBorder}` }}>
        <button onClick={onLogout} style={{
          width: '100%', padding: '12px 0', borderRadius: 10,
          background: 'transparent', color: '#f87171', border: `1px solid rgba(248,113,113,0.3)`,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = '' }}
        >🚪 Logout</button>
      </div>
    </nav>
  )
}

// ─── Home View ────────────────────────────────────────────────────────────────
function HomeView({ user, xp, streak, completed, setActive, setLearnLang }) {
  const total = Object.values(completed).flat().length
  const langStats = Object.entries(LESSONS).map(([lang,ls]) => ({
    lang, done: completed[lang]?.length || 0, total: ls.length, cfg: LANG[lang],
  }))

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6, fontWeight: 500 }}>Welcome back! 👋</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em' }}>{user.name}</h1>
        <div style={{ display: 'flex', gap: 20, fontSize: 14, opacity: 0.9 }}>
          <span>⚡ {xp} XP</span>
          <span>🔥 {streak} day streak</span>
          <span>✅ {total} lessons completed</span>
        </div>
      </div>

      {/* Language Progress Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {langStats.map(({ lang, done, total: tot, cfg }) => {
          const pct = Math.round((done / tot) * 100)
          return (
            <div key={lang} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
              padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
              borderTop: `4px solid ${cfg.primary}`,
            }}
              onClick={() => { setLearnLang(lang); setActive('learn') }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.primary}22` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{cfg.flag}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 2, fontFamily: "'Outfit',sans-serif" }}>{cfg.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{done}/{tot} lessons · {pct}%</div>
              <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: cfg.gradient, width: `${pct}%`, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: cfg.primary, background: cfg.light, padding: '4px 10px', borderRadius: 20 }}>
                Learn Now →
              </div>
            </div>
          )
        })}
      </div>

      {/* Daily Goal */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 3 }}>🎯 Daily Goal</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Complete 1 lesson to maintain your streak!</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', borderRadius: 12, padding: '10px 18px', color: '#fff', fontWeight: 800, fontSize: 18 }}>
            🔥 {streak}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['EN','ZH','JA'].map(l => (
            <button key={l} onClick={() => { setLearnLang(l); setActive('learn') }} style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              background: LANG[l].gradient, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s',
              boxShadow: `0 4px 16px ${LANG[l].primary}44`,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = '' }}
            >
              {LANG[l].flag} {LANG[l].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Explore View ─────────────────────────────────────────────────────────────
function ExploreView({ completed, setActive, setLearnLang, setLearnLesson }) {
  const [tab, setTab] = useState('EN')
  const cfg = LANG[tab]
  const lessons = LESSONS[tab]
  const done = completed[tab] || []

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Explore Lessons</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px' }}>Choose a language and start learning</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {Object.entries(LANG).map(([k, c]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12,
            background: tab === k ? c.gradient : '#fff',
            color: tab === k ? '#fff' : '#64748b',
            border: tab === k ? 'none' : '1.5px solid #e2e8f0',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: tab === k ? `0 4px 16px ${c.primary}44` : 'none',
            transition: 'all 0.2s',
          }}>
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {lessons.map(l => {
          const isDone = done.includes(l.id)
          return (
            <div key={l.id} style={{
              background: '#fff', border: `1.5px solid ${isDone ? cfg.primary + '44' : '#e2e8f0'}`,
              borderRadius: 16, padding: '18px', cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
              boxShadow: isDone ? `0 4px 16px ${cfg.primary}18` : 'none',
            }}
              onClick={() => { setLearnLang(tab); setLearnLesson(l); setActive('learn') }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.primary}22` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isDone ? `0 4px 16px ${cfg.primary}18` : '' }}
            >
              {isDone && (
                <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>✓</div>
              )}
              <div style={{ fontSize: 32, marginBottom: 10 }}>{l.emoji}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: isDone ? cfg.gradient : '#f1f5f9', color: isDone ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{l.level}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{l.stage}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', marginBottom: 4 }}>{l.title}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{l.vi}</div>
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: isDone ? cfg.primary : '#94a3b8', background: isDone ? cfg.light : '#f8fafc', padding: '4px 10px', borderRadius: 20 }}>
                {isDone ? '✅ Completed' : '▶ Learn Now'} {!isDone && `+${XP_PER_LESSON} XP`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Learn View (3-step Lesson) ───────────────────────────────────────────────
function LearnView({ learnLang, setLearnLang, learnLesson, setLearnLesson, completed, onComplete }) {
  const [step, setStep]       = useState(0) // 0=vocab, 1=grammar, 2=practice
  const [showAns, setShowAns] = useState(false)
  const [xpAnim, setXpAnim]  = useState(false)

  const lessons = LESSONS[learnLang] || []
  const lesson  = learnLesson || lessons[0]
  const cfg     = LANG[learnLang]
  const isDone  = (completed[learnLang] || []).includes(lesson?.id)

  const STEPS = ['📖 Vocabulary','✏️ Grammar','❓ Practice']

  const handleComplete = () => {
    setXpAnim(true)
    onComplete(learnLang, lesson.id)
    setTimeout(() => setXpAnim(false), 2000)
  }

  if (!lesson) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Select a lesson to start</div>
      <div style={{ fontSize: 13 }}>Go to "Explore" to choose a language lesson</div>
    </div>
  )

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px', maxWidth: 700 }}>
      {/* XP animation */}
      {xpAnim && (
        <div className="pop-in" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: cfg.gradient, color: '#fff', fontSize: 24, fontWeight: 900,
          padding: '20px 36px', borderRadius: 20, zIndex: 999,
          boxShadow: `0 12px 48px ${cfg.primary}66`,
          fontFamily: "'Outfit',sans-serif",
        }}>+{XP_PER_LESSON} XP! 🎉</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, boxShadow: `0 6px 20px ${cfg.primary}44` }}>
          {lesson.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: cfg.primary, background: cfg.light, padding: '2px 8px', borderRadius: 20 }}>{cfg.flag} {cfg.name}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Level {lesson.level} · {lesson.stage}</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 2px', fontFamily: "'Outfit',sans-serif" }}>{lesson.title}</h1>
          <div style={{ fontSize: 13, color: '#64748b' }}>{lesson.vi}</div>
        </div>
        {isDone && <div style={{ background: cfg.gradient, color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ Completed</div>}
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => { setStep(i); setShowAns(false) }} style={{
            flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: step === i ? cfg.gradient : 'transparent',
            color: step === i ? '#fff' : (i < step ? cfg.primary : '#94a3b8'),
            fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s',
            boxShadow: step === i ? `0 2px 12px ${cfg.primary}44` : 'none',
          }}>{i < step ? '✓ ' : ''}{s}</button>
        ))}
      </div>

      {/* Step content */}
      <div className="fade-up" key={step}>
        {step === 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: cfg.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>📖 Vocabulary to Learn</div>
            <div style={{ fontSize: 16, color: '#0f172a', lineHeight: 2, fontWeight: 500 }}>{lesson.vocab}</div>
            <div style={{ marginTop: 20, padding: '14px 16px', background: cfg.light, borderRadius: 12, border: `1px solid ${cfg.primary}33` }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>💡 Study Tip:</div>
              <div style={{ fontSize: 13, color: '#0f172a' }}>Read each word aloud 3 times and visualize it!</div>
            </div>
            <button onClick={() => setStep(1)} style={{
              marginTop: 20, width: '100%', padding: '14px 0', borderRadius: 12,
              background: cfg.gradient, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${cfg.primary}44`,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
            >Next: Grammar →</button>
          </div>
        )}

        {step === 1 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>✏️ Grammar Structure</div>
            <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0f9ff)', border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '20px 24px', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af', letterSpacing: '0.02em', lineHeight: 1.5 }}>{lesson.grammar}</div>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
              Apply this structure with vocabulary to make full sentences. Try creating 2-3 sentences yourself!
            </div>
            <button onClick={() => { setStep(2); setShowAns(false) }} style={{
              marginTop: 20, width: '100%', padding: '14px 0', borderRadius: 12,
              background: cfg.gradient, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${cfg.primary}44`,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
            >Next: Practice →</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>❓ Practice Question</div>
            <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fff7ed)', border: '1.5px solid #fde68a', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', lineHeight: 1.6 }}>Q: {lesson.question}</div>
            </div>

            {!showAns ? (
              <button onClick={() => setShowAns(true)} style={{
                width: '100%', padding: '12px 0', borderRadius: 12,
                background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(245,158,11,0.4)', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >💡 Show Answer</button>
            ) : (
              <div className="fade-up">
                <div style={{ background: 'linear-gradient(135deg,#ecfdf5,#f0fdf4)', border: '1.5px solid #6ee7b7', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.06em' }}>✅ Correct Answer:</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{lesson.answer}</div>
                </div>
                {!isDone ? (
                  <button onClick={handleComplete} style={{
                    width: '100%', padding: '14px 0', borderRadius: 12,
                    background: cfg.gradient, color: '#fff', border: 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: `0 4px 16px ${cfg.primary}44`, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                  >⚡ Complete Lesson (+{XP_PER_LESSON} XP)</button>
                ) : (
                  <div style={{ textAlign: 'center', padding: '14px 0', color: cfg.primary, fontWeight: 700, fontSize: 14 }}>
                    ✅ You have already completed this lesson!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lesson selector */}
      <div style={{ marginTop: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Other Lessons — {cfg.flag} {cfg.name}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {lessons.slice(0, 8).map(l => (
            <button key={l.id} onClick={() => { setLearnLesson(l); setStep(0); setShowAns(false) }} style={{
              padding: '6px 14px', borderRadius: 20,
              background: l.id === lesson.id ? cfg.gradient : '#f8fafc',
              color: l.id === lesson.id ? '#fff' : '#64748b',
              border: `1.5px solid ${l.id === lesson.id ? 'transparent' : '#e2e8f0'}`,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              {l.emoji} {l.level}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Live View (integrated with Agora Web SDK service)
function LiveView() {
  return <LiveRoomView />
}

function LegacyLiveView() {
  const [joined, setJoined]   = useState(false)
  const [joining, setJoining] = useState(false)
  const [muted, setMuted]     = useState(false)
  const [error, setError]     = useState(null)
  const [remotes, setRemotes] = useState([])
  const [uid]                 = useState(() => Math.floor(Math.random() * 99999) + 1)

  const AGORA_APP_ID  = import.meta.env.VITE_AGORA_APP_ID || ''
  const AGORA_CHANNEL = 'lucy_room_1'

  useEffect(() => {
    // Init Agora Service wrapper
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
    <div className="fade-up" style={{ padding: '28px 28px 40px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Live Room</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: joined ? '#f0fdf4' : '#f1f5f9', color: joined ? '#10b981' : '#64748b' }}>{joined ? 'LIVE' : 'Offline'}</span>
            <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#3b82f6' }}>[GB] English Beginner</span>
          </div>
        </div>
        {joined && <button onClick={doLeave} style={{ padding: '8px 14px', borderRadius: 8, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center' }}><PhoneOff size={14}/> Leave Room</button>}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#991b1b', display: 'flex', gap: 8, alignItems: 'center' }}><AlertCircle size={15}/> {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Voice Chat Card */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: 'linear-gradient(90deg, rgba(59,130,246,0.1), transparent)', borderBottom: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#3b82f6' }}><Volume2 size={16}/> Voice Chat (Agora RTC)</div>
              {joined ? <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>LIVE - {remotes.length + 1} users</span> : <span style={{ fontSize: 12, color: '#94a3b8' }}>Not connected</span>}
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14, display: 'flex', gap: 20 }}>
                <span>Channel: <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{AGORA_CHANNEL}</code></span>
                <span>UID: <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{uid}</code></span>
              </div>
              {!joined ? (
                <button onClick={doJoin} disabled={joining} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '14px 0',
                  background: joining ? '#94a3b8' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                  color: '#fff', border: 'none', borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: joining ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  boxShadow: joining ? 'none' : '0 6px 24px rgba(99,102,241,0.4)', transition: 'all 0.2s',
                }}>
                  {joining ? 'Connecting...' : <><Phone size={16}/> Join Voice Chat</>}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={doToggleMute} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0',
                    background: muted ? '#fef2f2' : '#f0fdf4', color: muted ? '#ef4444' : '#10b981',
                    border: `1.5px solid ${muted ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                  }}><Mic size={15}/>{muted ? 'Unmute' : 'Mute'}</button>
                  <button onClick={doLeave} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0',
                    background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                  }}><PhoneOff size={15}/> Leave Room</button>
                </div>
              )}
              {joined && (
                 <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                   <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>In Room</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                     <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}/>
                     <span style={{ fontWeight: 700 }}>You</span>
                     {muted && <span style={{ background: '#fef2f2', color: '#ef4444', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Muted</span>}
                   </div>
                   {remotes.map(u => (
                      <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#eff6ff', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}/>
                        <span>User #{u.uid}</span>
                        <span style={{ background: '#f0fdf4', color: '#10b981', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Speaking</span>
                      </div>
                   ))}
                   {remotes.length === 0 && <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Waiting for others to join...</p>}
                 </div>
              )}
            </div>
          </div>

          {/* Current Lesson Card */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.06)', borderBottom: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#10b981' }}><Radio size={16}/> Current Lesson</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Current Topic</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Topic 1: Introducing Yourself</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
            <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.06)', borderBottom: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}><FileText size={16}/> View Materials</div>
            </div>
            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', margin: 16, borderRadius: 12, border: '2px dashed #e2e8f0' }}>
              <FileText size={32} color="#cbd5e1" style={{ marginBottom: 12 }}/>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>No materials pinned</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>When the teacher shares a lecture,<br/>materials will appear here</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Podcasts View
function PodcastsView() {
  const [pods, setPods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playbackError, setPlaybackError] = useState(null)
  const [selectedSeries, setSelectedSeries] = useState(null)
  const [episodeCategory, setEpisodeCategory] = useState('All')
  
  // Audio Player state
  const [activePod, setActivePod] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [timeStr, setTimeStr] = useState("00:00 / 00:00")
  const audioRef = useRef(null)

  useEffect(() => {
    async function loadPods() {
      try {
        const [catalogRes, liveRes] = await Promise.all([
          fetch(`${API_BASE}/api/engagement/podcasts`),
          fetch(`${API_BASE}/api/podcasts/recordings?public=true`)
        ])
        if (!catalogRes.ok || !liveRes.ok) throw new Error('Failed to fetch')
        const catalog = await catalogRes.json()
        const liveRecordings = await liveRes.json()
        catalog.push({
            title:'Podcasts from Live Rooms', lang:'Live', flagCode:'LIVE', accent:'blue', subs:0,
            description:'Recordings published by Admins and Mentors from live learning rooms.',
            source:'LUCY Live Rooms', episodeCount:liveRecordings.length,
            episodes:liveRecordings.map((recording, index) => ({
              id:recording.id, number:index + 1, title:recording.title, category:'Conversations',
              language:recording.language || 'Live Room', duration:recording.duration || '00:00',
              audioUrl:recording.audioUrl, source:'LUCY Live Rooms', roomId:recording.roomId
            }))
          })
        setPods(catalog)
      } catch (err) {
        console.warn('Failed to load podcasts, using local fallback:', err.message)
        setPods([
          {
            title: "English for Beginners", episodeCount: 12, lang: "English", subs: 234, accent: "blue", flagCode: "GB",
            description: "Elementary English listening practice from the British Council.",
            source: "British Council LearnEnglish",
            audioUrl: "https://learnenglish.britishcouncil.org/sites/podcasts/files/podcast/elementary-podcasts-s01-e01.mp3",
            episodes: [
              { id: "EN-EP-1", number: 1, title: "Meet the Hosts and Angelina Jolie", category: "Conversations", language: "English", duration: "02:00", audioUrl: "https://learnenglish.britishcouncil.org/sites/podcasts/files/podcast/elementary-podcasts-s01-e01.mp3" },
              { id: "EN-EP-2", number: 2, title: "Why Zara Admires Angelina Jolie", category: "Conversations", language: "English", duration: "02:00", audioUrl: "https://learnenglish.britishcouncil.org/sites/podcasts/files/podcast/elementary-podcasts-s01-e01.mp3" }
            ]
          },
          {
            title: "Chinese for Beginners", episodeCount: 8, lang: "Chinese", subs: 145, accent: "red", flagCode: "CN",
            description: "Learn practical Chinese for banking, rules and financial safety.",
            source: "Castbox - 中文加油站",
            audioUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-6-17/5c05ce5e-5ad2-81f7-d3b6-bbe9aabfbfb2.mp3",
            episodes: [
              { id: "ZH-EP-1", number: 1, title: "Chuẩn bị trước khi đi ngân hàng", category: "Conversations", language: "Chinese", duration: "02:00", audioUrl: "https://d3ctxlq1ktw2nl.cloudfront.log/staging/2026-6-17/5c05ce5e-5ad2-81f7-d3b6-bbe9aabfbfb2.mp3" }
            ]
          },
          {
            title: "Japanese for Beginners", episodeCount: 15, lang: "Japanese", subs: 178, accent: "pink", flagCode: "JP",
            description: "Podcast 52: practical Japanese for dealing with a cold in Japan.",
            source: "Learn Japanese Pod",
            audioUrl: "https://podcast.learnjapanesepod.com/podcasts/podcast_52_lesson.mp3",
            episodes: [
              { id: "JA-EP-1", number: 1, title: "Bản tin cúm mùa ở Nhật", category: "Conversations", language: "Japanese", duration: "02:00", audioUrl: "https://podcast.learnjapanesepod.com/podcasts/podcast_52_lesson.mp3" }
            ]
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    loadPods()

    // Cleanup audio on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handlePlayPod = (p) => {
    if (!p.audioUrl) {
      setPlaybackError('This podcast does not have a playable audio source.')
      return
    }
    setPlaybackError(null)
    if (activePod && (p.id ? activePod.id === p.id : activePod.title === p.title)) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => {
            console.warn(e)
            setIsPlaying(false)
            setPlaybackError(`Could not play audio from ${p.source || 'the podcast provider'}.`)
          })
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      const audioUrl = p.audioUrl.startsWith('/api/') ? `${API_BASE}${p.audioUrl}` : p.audioUrl
      const newAudio = new Audio(audioUrl)
      newAudio.preload = 'metadata'
      audioRef.current = newAudio
      setActivePod(p)
      setIsPlaying(true)
      setProgress(0)

      newAudio.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(p.startAt)) newAudio.currentTime = p.startAt
      })

      newAudio.addEventListener('timeupdate', () => {
        if (!audioRef.current) return;
        const cur = newAudio.currentTime
        const segmentStart = Number.isFinite(p.startAt) ? p.startAt : 0
        const segmentEnd = Number.isFinite(p.endAt) ? p.endAt : newAudio.duration
        const dur = segmentEnd - segmentStart
        if (Number.isFinite(p.endAt) && cur >= p.endAt) {
          newAudio.pause()
          newAudio.currentTime = segmentStart
          setIsPlaying(false)
          setProgress(0)
          return
        }
        if (dur > 0) {
          const elapsed = Math.max(0, cur - segmentStart)
          setProgress((elapsed / dur) * 100)
          setTimeStr(`${formatTime(elapsed)} / ${formatTime(dur)}`)
        }
      })

      newAudio.addEventListener('ended', () => {
        setIsPlaying(false)
        setProgress(0)
      })

      newAudio.addEventListener('error', () => {
        setIsPlaying(false)
        setPlaybackError(`The audio from ${p.source || 'the podcast provider'} is currently unavailable.`)
      })

      newAudio.play().catch(e => {
        console.warn("Failed to play audio:", e)
        setIsPlaying(false)
        setPlaybackError(`Could not play audio from ${p.source || 'the podcast provider'}.`)
      })
    }
  }

  const formatTime = (secs) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
      <div style={{ width: 30, height: 30, border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
      <div>Loading podcasts...</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
      <div style={{ fontSize: 14, marginBottom: 10 }}>Warning: {error}</div>
    </div>
  )

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Audio Podcasts</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px' }}>Listen to foreign language conversations, lessons and news</p>
      {playbackError && (
        <div style={{ padding:'10px 12px', marginBottom:16, borderRadius:10, background:'#fef2f2', color:'#b91c1c', fontSize:12.5 }}>
          {playbackError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: activePod ? 80 : 0 }}>
        {pods.map((p, idx) => (
          <div key={idx} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
            padding: '20px', transition: 'all 0.2s',
            borderTop: `4px solid ${p.accent === 'blue' ? '#3b82f6' : (p.accent === 'red' ? '#ef4444' : '#ec4899')}`,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{{ GB: 'GB', CN: 'CN', JP: 'JP' }[p.flagCode] || p.flagCode || 'Podcast'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: 12 }}>{p.lang}</span>
            </div>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: '0 0 6px', fontFamily: "'Outfit',sans-serif" }}>{p.title}</h3>
            {p.description && <div style={{ fontSize: 12, lineHeight: 1.5, color: '#64748b', marginBottom: 8 }}>{p.description}</div>}
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>{p.episodeCount || p.episodes?.length || p.ep || 0} episodes - {p.subs || 100} subscribers</div>
            <button 
              onClick={() => { setSelectedSeries(p); setEpisodeCategory('All') }}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: selectedSeries?.title === p.title ? 'linear-gradient(135deg,#0ea5e9,#2563eb)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', 
                color: '#fff', border: 'none',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
            >
              {selectedSeries?.title === p.title ? 'Viewing Episodes' : 'Browse Episodes'}
            </button>
            {p.sourceUrl && (
              <a href={p.sourceUrl} target="_blank" rel="noreferrer" style={{ display:'block', marginTop:9, textAlign:'center', fontSize:11.5, color:'#6366f1', textDecoration:'none' }}>
                Source: {p.source || 'Original publisher'}
              </a>
            )}
          </div>
        ))}
      </div>

      {selectedSeries && (
        <section style={{ marginTop:24, marginBottom:activePod ? 110 : 20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:16, marginBottom:14, flexWrap:'wrap' }}>
            <div>
              <h2 style={{ margin:0, fontSize:20, color:'#0f172a' }}>{selectedSeries.title}</h2>
              <div style={{ marginTop:4, color:'#64748b', fontSize:12.5 }}>{selectedSeries.episodes?.length || 0} episodes</div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['All', 'Conversations', 'Lessons', 'News'].map(category => (
                <button key={category} onClick={() => setEpisodeCategory(category)} style={{ border:'1px solid #e2e8f0', borderRadius:18, padding:'7px 11px', cursor:'pointer', fontSize:11.5, fontWeight:700, background:episodeCategory === category ? '#4f46e5' : '#fff', color:episodeCategory === category ? '#fff' : '#475569' }}>{category}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gap:10 }}>
            {(selectedSeries.episodes || []).length === 0 && <div style={{ padding:28, textAlign:'center', color:'#94a3b8', border:'1px dashed #cbd5e1', borderRadius:12 }}>No published episodes yet.</div>}
            {(selectedSeries.episodes || []).filter(ep => episodeCategory === 'All' || ep.category === episodeCategory).map(ep => {
              const playableEpisode = { ...ep, lang:selectedSeries.lang, accent:selectedSeries.accent }
              const active = activePod?.id === ep.id
              return (
                <div key={ep.id} style={{ display:'grid', gridTemplateColumns:'44px minmax(0, 1fr) auto auto', gap:12, alignItems:'center', padding:'12px 14px', background:'#fff', border:`1px solid ${active ? '#818cf8' : '#e2e8f0'}`, borderRadius:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, display:'grid', placeItems:'center', background:'#eef2ff', color:'#4f46e5', fontWeight:800, fontSize:12 }}>{ep.number}</div>
                  <div>
                    <div style={{ color:'#0f172a', fontSize:13.5, fontWeight:750 }}>{ep.title}</div>
                    <div style={{ color:'#64748b', fontSize:11.5, marginTop:3 }}>{ep.language} · {ep.duration}</div>
                  </div>
                  <span style={{ padding:'4px 8px', borderRadius:12, background:ep.category === 'News' ? '#fef2f2' : ep.category === 'Lessons' ? '#eff6ff' : '#f0fdf4', color:ep.category === 'News' ? '#dc2626' : ep.category === 'Lessons' ? '#2563eb' : '#16a34a', fontSize:10.5, fontWeight:800 }}>{ep.category}</span>
                  <button onClick={() => handlePlayPod(playableEpisode)} style={{ border:0, borderRadius:9, padding:'8px 11px', cursor:'pointer', color:'#fff', background:active && isPlaying ? '#f59e0b' : '#4f46e5', fontWeight:700 }}>{active && isPlaying ? 'Pause' : 'Play'}</button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Floating Audio Player panel */}
      {activePod && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          width: '90%', maxWidth: 500, background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 20,
          padding: '16px 20px', boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
          zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 12,
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translate(-50%, 120px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 42, height: 42, borderRadius: 12, 
                background: activePod.accent === 'blue' ? 'linear-gradient(135deg,#3b82f6,#60a5fa)' : (activePod.accent === 'red' ? 'linear-gradient(135deg,#ef4444,#f87171)' : 'linear-gradient(135deg,#ec4899,#f472b6)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>🎙</div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activePod.title}</div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{activePod.lang} · <span style={{ fontFamily: 'monospace' }}>{timeStr}</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button 
                onClick={() => handlePlayPod(activePod)}
                style={{
                  background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', borderRadius: '50%',
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 14, color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                  transition: 'transform 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button 
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause()
                  setActivePod(null)
                  setIsPlaying(false)
                }}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 11, color: '#64748b', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}
              >
                ✕
              </button>
            </div>
          </div>
          {/* Progress Seekbar */}
          <div 
            onClick={(e) => {
              if (!audioRef.current || isNaN(audioRef.current.duration)) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const width = rect.width;
              const clickPercent = clickX / width;
              const segmentStart = Number.isFinite(activePod.startAt) ? activePod.startAt : 0;
              const segmentEnd = Number.isFinite(activePod.endAt) ? activePod.endAt : audioRef.current.duration;
              audioRef.current.currentTime = segmentStart + clickPercent * (segmentEnd - segmentStart);
            }}
            style={{
              height: 6, width: '100%', background: '#e2e8f0', borderRadius: 3,
              cursor: 'pointer', position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{
              height: '100%', width: `${progress}%`, 
              background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
              transition: 'width 0.1s linear'
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

// Premium View
function PremiumView({ user, setActive, setLearnLang }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [balance, setBalance] = useState(() => {
    try {
      const stored = localStorage.getItem('lucy_wallet_balance')
      const num = Number(stored)
      return stored !== null && !isNaN(num) ? num : 5000000
    } catch {
      return 5000000
    }
  })
  const safeBalance = (typeof balance === 'number' && !isNaN(balance)) ? balance : 5000000
  const [currency, setCurrency] = useState('VND')
  const [topupOpen, setTopupOpen] = useState(false)
  const [topupLoading, setTopupLoading] = useState(false)
  const [topupAmount, setTopupAmount] = useState(1000000)
  const [zaloPayOpen, setZaloPayOpen] = useState(false)
  const [zaloPayData, setZaloPayData] = useState(null)
  const [zaloPayLoading, setZaloPayLoading] = useState(false)
  const [paymentReference, setPaymentReference] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  
  // Custom Premium Subscription state
  const [subType, setSubType] = useState(() => {
    const s = localStorage.getItem('lucy_sub_type')
    return (s && typeof s === 'string') ? s : 'Free'
  })
  const [unlockedCourses, setUnlockedCourses] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('lucy_unlocked_courses') || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    async function loadPremium() {
      try {
        const res = await fetch(`${API_BASE}/api/engagement/premium`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [
          { title: "Advanced Business English", langCode: "GB", accent: "blue" },
          { title: "JLPT N5 Prep Course", langCode: "JP", accent: "pink" },
          { title: "HSK 1 Complete Pack", langCode: "CN", accent: "red" },
          { title: "Conversational English Master", langCode: "GB", accent: "indigo" }
        ])
      } catch (err) {
        console.warn('Failed to fetch premium perks, using local fallback:', err.message)
        setItems([
          { title: "Advanced Business English", langCode: "GB", accent: "blue" },
          { title: "JLPT N5 Prep Course", langCode: "JP", accent: "pink" },
          { title: "HSK 1 Complete Pack", langCode: "CN", accent: "red" },
          { title: "Conversational English Master", langCode: "GB", accent: "indigo" }
        ])
      } finally {
        setLoading(false)
      }
    }
    loadPremium()
  }, [])

  useEffect(() => {
    async function loadBalance() {
      try {
        const res = await fetch(`${API_BASE}/api/wallet/balance?userId=${user?.id || 1}`)
        if (res.ok) {
          const data = await res.json()
          if (data && typeof data.balance === 'number' && !isNaN(data.balance)) {
            setBalance(data.balance)
            if (data.currency) setCurrency(data.currency)
            localStorage.setItem('lucy_wallet_balance', data.balance)
          }
        }
      } catch (err) {
        console.warn("Failed to load wallet balance from server, using local balance:", err)
      }
    }
    loadBalance()
  }, [user])

  const handleApplyCoupon = () => {
    if (promoCode.trim().toUpperCase() === 'LUCY26') {
      setCouponApplied(true);
      alert('Áp dụng mã giảm giá thành công! Các gói 1 năm đã được giảm giá đặc biệt.');
    } else {
      alert('Mã giảm giá không hợp lệ. Vui lòng nhập LUCY26.');
      setCouponApplied(false);
    }
  }

  const bankId = import.meta.env.VITE_PAYMENT_BANK_ID || ''
  const bankAccountNo = import.meta.env.VITE_PAYMENT_ACCOUNT_NO || ''
  const bankAccountName = import.meta.env.VITE_PAYMENT_ACCOUNT_NAME || ''
  const bankConfigured = Boolean(bankId && bankAccountNo && bankAccountName)
  const qrImageUrl = bankConfigured && paymentReference
    ? `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(bankAccountNo)}-compact2.png?amount=${topupAmount}&addInfo=${encodeURIComponent(paymentReference)}&accountName=${encodeURIComponent(bankAccountName)}`
    : ''

  const handleTopup = () => {
    const userId = user?.id || 1
    setPaymentReference(`LUCY${userId}${Date.now().toString().slice(-8)}`)
    setTopupOpen(true)
  }

  const handleTransferSubmitted = () => {
    setTopupLoading(true)
    window.setTimeout(() => {
      setTopupLoading(false)
      setTopupOpen(false)
      alert('Đã ghi nhận yêu cầu. Số dư chỉ được cập nhật sau khi hệ thống xác nhận giao dịch ngân hàng.')
    }, 500)
  }

  const handleOpenZaloPay = async (amount = 200000) => {
    setZaloPayLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/wallet/zalopay-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 1,
          amount: amount,
          title: 'Nạp ví LUCY qua ZaloPay'
        })
      })
      const data = await res.json()
      if (res.ok && data.status === 'success') {
        setZaloPayData(data)
        setZaloPayOpen(true)
      } else {
        alert(`Không thể tạo đơn ZaloPay: ${data.error || 'Lỗi kết nối'}`)
      }
    } catch (e) {
      setZaloPayData({
        appId: '2553',
        appTransId: `260721_${Math.floor(Math.random()*900000+100000)}`,
        amount: amount,
        orderUrl: 'https://qcgateway.zalopay.vn/openinapp/order?app_id=2553',
        qrCodeText: `zalopay://qr/p/v1/260721_${Math.floor(Math.random()*900000+100000)}`
      })
      setZaloPayOpen(true)
    }
    setZaloPayLoading(false)
  }

  const handleConfirmZaloPaySuccess = async () => {
    if (!zaloPayData) return
    setZaloPayLoading(true)
    const payAmount = zaloPayData.amount || 200000
    try {
      const res = await fetch(`${API_BASE}/api/wallet/zalopay-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 1,
          amount: payAmount
        })
      })
      const data = await res.json()
      const newBal = (res.ok && data.newBalance !== undefined) ? data.newBalance : (balance + payAmount)
      setBalance(newBal)
      localStorage.setItem('lucy_wallet_balance', newBal)
    } catch {
      const newBal = balance + payAmount
      setBalance(newBal)
      localStorage.setItem('lucy_wallet_balance', newBal)
    }
    setZaloPayLoading(false)
    setZaloPayOpen(false)
    
    // Auto unlock Premium if payment corresponds to a plan or high amount
    if (payAmount >= 800000 && subType === 'Free') {
      setSubType('Premium Lifetime')
      localStorage.setItem('lucy_sub_type', 'Premium Lifetime')
      alert(`🎉 Thanh toán ZaloPay Sandbox thành công! Bạn đã được tự động nâng cấp lên gói LUCY Premium Trọn Đời!`)
    } else {
      alert(`🎉 Thanh toán ZaloPay Sandbox thành công! Đã cộng ${payAmount.toLocaleString('vi-VN')}đ vào tài khoản của bạn!`)
    }
  }

  const handleSubscribe = async (planName, cost) => {
    if (subType === planName) {
      alert(`Bạn đang sử dụng gói ${planName} rồi.`);
      return;
    }

    if (balance < cost) {
      const wantZaloPay = window.confirm(
        `Số dư ví hiện tại (${safeBalance.toLocaleString('vi-VN')}đ) chưa đủ để mua gói ${planName} (${cost.toLocaleString('vi-VN')}đ).\n\n` +
        `Bạn có muốn mở cổng thanh toán Ví ZaloPay Sandbox để đăng ký ngay không?`
      );
      if (wantZaloPay) {
        handleOpenZaloPay(cost);
      }
      return;
    }

    const confirmSub = window.confirm(`Xác nhận đăng ký gói ${planName} với giá ${cost.toLocaleString('vi-VN')}đ?`);
    if (!confirmSub) return;

    try {
      const res = await fetch(`${API_BASE}/api/wallet/send-gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user?.id || 1,
          toMentorId: 2,
          giftCode: 'SUB_UPGRADE_' + planName.toUpperCase().replace(/\s+/g, '_'),
          amount: cost
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBalance(data.newBalance);
        localStorage.setItem('lucy_wallet_balance', data.newBalance);
        setSubType(planName);
        localStorage.setItem('lucy_sub_type', planName);
        alert(`Chúc mừng! Bạn đã đăng ký thành công gói ${planName}! 🎉`);
      } else {
        const errData = await res.json();
        alert(`Đăng ký thất bại: ${errData.error || 'Lỗi không xác định'}`);
      }
    } catch (err) {
      console.warn("Lỗi đăng ký qua server, tự động kích hoạt chế độ dự phòng ngoại tuyến:", err);
      const newBal = Math.max(0, balance - cost);
      setBalance(newBal);
      localStorage.setItem('lucy_wallet_balance', newBal);
      setSubType(planName);
      localStorage.setItem('lucy_sub_type', planName);
      alert(`[Ngoại tuyến] Chúc mừng! Bạn đã nâng cấp thành công gói ${planName}! 🎉`);
    }
  }

  const handleUnlockCourse = async (course) => {
    const isPremiumMember = subType !== 'Free';
    
    if (unlockedCourses.includes(course.title) || isPremiumMember) {
      handleLearnCourse(course.title);
      return;
    }

    const cost = 49000.0;
    if (safeBalance < cost) {
      alert(`Số dư ví không đủ! Phí mở khóa: ${cost.toLocaleString()} ${currency}. Vui lòng nạp tiền vào ví.`);
      return;
    }

    const confirmUnlock = window.confirm(`Mở khóa khóa học "${course.title}" với giá ${cost.toLocaleString()} ${currency}?`);
    if (!confirmUnlock) return;

    try {
      const res = await fetch(`${API_BASE}/api/wallet/send-gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user?.id || 1,
          toMentorId: 2,
          giftCode: 'UNLOCK_COURSE_' + course.title.toUpperCase().replace(/\s+/g, '_'),
          amount: cost
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBalance(data.newBalance);
        localStorage.setItem('lucy_wallet_balance', data.newBalance);
        const newUnlocked = [...unlockedCourses, course.title];
        setUnlockedCourses(newUnlocked);
        localStorage.setItem('lucy_unlocked_courses', JSON.stringify(newUnlocked));
        alert(`Thành công! Khóa học "${course.title}" đã được mở khóa. Hãy bắt đầu học! 🚀`);
      } else {
        const errData = await res.json();
        alert(`Mở khóa thất bại: ${errData.error || 'Lỗi không xác định'}`);
      }
    } catch (err) {
      console.warn("Lỗi kết nối mở khóa, tự động kích hoạt chế độ ngoại tuyến:", err);
      const newBal = Math.max(0, balance - cost);
      setBalance(newBal);
      localStorage.setItem('lucy_wallet_balance', newBal);
      const newUnlocked = [...unlockedCourses, course.title];
      setUnlockedCourses(newUnlocked);
      localStorage.setItem('lucy_unlocked_courses', JSON.stringify(newUnlocked));
      alert(`[Ngoại tuyến] Thành công! Khóa học "${course.title}" đã được mở khóa. Hãy bắt đầu học! 🚀`);
    }
  }

  const handleLearnCourse = (courseTitle) => {
    if (courseTitle.includes("English") || courseTitle.includes("Business") || courseTitle.includes("Conversational")) {
      setLearnLang("EN");
    } else if (courseTitle.includes("JLPT") || courseTitle.includes("Prep") || courseTitle.includes("Japanese")) {
      setLearnLang("JA");
    } else if (courseTitle.includes("HSK") || courseTitle.includes("Chinese")) {
      setLearnLang("ZH");
    }
    setActive("explore");
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
      <div style={{ width: 30, height: 30, border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
      <div>Đang tải thông tin gói cước...</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
      <div style={{ fontSize: 14, marginBottom: 10 }}>Cảnh báo: {error}</div>
    </div>
  )

  const plans = [
    {
      id: 'Premium Lifetime',
      title: 'LUCY Premium Trọn Đời',
      originalPrice: 8800000,
      price: 3890000,
      isPremium: true,
      isLifetime: true,
      accent: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
      features: [
        'Truy cập toàn bộ kho giáo trình Premium',
        'Phòng Live voice chat không giới hạn',
        'Cố vấn học tập AI Lisa thông minh hơn',
        'Nhận phản hồi chi tiết từ AI Mentor',
        'Cập nhật nội dung trọn đời',
        'Ưu tiên kết nối phòng học'
      ]
    },
    {
      id: 'Premium 1 Year',
      title: 'LUCY Premium 1 năm',
      originalPrice: 2745000,
      price: couponApplied ? 999000 : 1716000,
      isPremium: true,
      isLifetime: false,
      accent: 'linear-gradient(135deg, #311042 0%, #6366f1 100%)',
      couponText: 'Nhập mã LUCY26 giảm chỉ còn 999K khi thanh toán online',
      features: [
        'Truy cập toàn bộ kho giáo trình Premium',
        'Phòng Live voice chat không giới hạn',
        'Cố vấn học tập AI Lisa chuyên sâu',
        'Nhận phản hồi chi tiết từ AI Mentor',
        'Thời hạn sử dụng trong 1 năm',
        'Hỗ trợ kỹ thuật 24/7'
      ]
    },
    {
      id: 'Pro Lifetime',
      title: 'LUCY Pro Trọn Đời',
      originalPrice: 3395000,
      price: 2195000,
      isPremium: false,
      isLifetime: true,
      accent: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      features: [
        'Truy cập toàn bộ kho giáo trình Premium',
        'Phòng Live voice chat không giới hạn',
        'Lộ trình gợi ý cốt lõi từ AI Lisa',
        'Nhận xét ngữ pháp từ AI Mentor',
        'Cập nhật nội dung trọn đời'
      ]
    },
    {
      id: 'Pro 1 Year',
      title: 'LUCY Pro 1 năm',
      originalPrice: 1595000,
      price: couponApplied ? 829000 : 1095000,
      isPremium: false,
      isLifetime: false,
      accent: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
      couponText: 'Nhập mã LUCY26 giảm chỉ còn 829K khi thanh toán online',
      features: [
        'Truy cập toàn bộ kho giáo trình Premium',
        'Phòng Live voice chat không giới hạn',
        'Lộ trình gợi ý cốt lõi từ AI Lisa',
        'Nhận xét ngữ pháp từ AI Mentor',
        'Thời hạn sử dụng trong 1 năm'
      ]
    }
  ]

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px', maxWidth: 1100, margin: '0 auto', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {topupOpen && (
        <div onClick={() => !topupLoading && setTopupOpen(false)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(15,23,42,0.72)', display:'grid', placeItems:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'min(440px, 100%)', maxHeight:'92vh', overflowY:'auto', background:'#fff', borderRadius:22, padding:24, boxShadow:'0 24px 70px rgba(15,23,42,0.35)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'start', marginBottom:18 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:'#0f172a' }}>Nạp tiền qua VietQR</div>
                <div style={{ fontSize:12.5, color:'#64748b', marginTop:4 }}>Quét bằng ứng dụng ngân hàng để chuyển khoản thật.</div>
              </div>
              <button onClick={() => setTopupOpen(false)} aria-label="Đóng" style={{ border:0, background:'#f1f5f9', width:32, height:32, borderRadius:9, cursor:'pointer', fontSize:18 }}>×</button>
            </div>

            <label style={{ display:'block', fontSize:12, fontWeight:800, color:'#475569', marginBottom:7 }}>Số tiền nạp</label>
            <select value={topupAmount} onChange={e => setTopupAmount(Number(e.target.value))} style={{ width:'100%', padding:'11px 12px', border:'1px solid #cbd5e1', borderRadius:10, fontFamily:'inherit', marginBottom:16 }}>
              {[100000, 200000, 500000, 1000000, 2000000].map(amount => <option key={amount} value={amount}>{amount.toLocaleString('vi-VN')} VND</option>)}
            </select>

            {bankConfigured ? (
              <>
                <div style={{ textAlign:'center', border:'1px solid #e2e8f0', borderRadius:16, padding:14, background:'#f8fafc' }}>
                  <img src={qrImageUrl} alt="Mã VietQR chuyển khoản ngân hàng" style={{ display:'block', width:'100%', maxWidth:310, margin:'0 auto', borderRadius:10 }} />
                </div>
                <div style={{ marginTop:14, display:'grid', gap:7, fontSize:13, color:'#334155' }}>
                  <div><strong>Chủ tài khoản:</strong> {bankAccountName}</div>
                  <div><strong>Số tài khoản:</strong> {bankAccountNo}</div>
                  <div><strong>Số tiền:</strong> {topupAmount.toLocaleString('vi-VN')} VND</div>
                  <div><strong>Nội dung:</strong> <span style={{ color:'#4f46e5', fontWeight:800 }}>{paymentReference}</span></div>
                </div>
                <button onClick={handleTransferSubmitted} disabled={topupLoading} style={{ width:'100%', marginTop:18, padding:'12px 16px', border:0, borderRadius:11, background:'#059669', color:'#fff', fontWeight:800, cursor:topupLoading?'wait':'pointer' }}>
                  {topupLoading ? 'Đang ghi nhận...' : 'Tôi đã chuyển khoản'}
                </button>
                <div style={{ marginTop:10, fontSize:11.5, lineHeight:1.5, color:'#64748b', textAlign:'center' }}>Không đổi số tiền hoặc nội dung chuyển khoản. Ví chỉ được cộng sau khi giao dịch được xác nhận.</div>
              </>
            ) : (
              <div style={{ padding:16, borderRadius:12, background:'#fff7ed', border:'1px solid #fed7aa', color:'#9a3412', fontSize:13, lineHeight:1.6 }}>
                Chưa cấu hình tài khoản nhận tiền. Hãy thêm <code>VITE_PAYMENT_BANK_ID</code>, <code>VITE_PAYMENT_ACCOUNT_NO</code> và <code>VITE_PAYMENT_ACCOUNT_NAME</code> vào file <code>.env</code>, sau đó chạy lại frontend.
              </div>
            )}
          </div>
        </div>
      )}

      {zaloPayOpen && zaloPayData && (
        <div onClick={() => !zaloPayLoading && setZaloPayOpen(false)} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(15,23,42,0.75)', display:'grid', placeItems:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'min(460px, 100%)', maxHeight:'92vh', overflowY:'auto', background:'#fff', borderRadius:24, padding:26, boxShadow:'0 24px 70px rgba(0,104,255,0.25)', border:'1.5px solid #0068ff' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'start', marginBottom:18 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:'#0068ff', display:'flex', alignItems:'center', gap:8 }}>
                  💙 Thanh toán Ví ZaloPay (Sandbox)
                </div>
                <div style={{ fontSize:12.5, color:'#64748b', marginTop:4 }}>Cổng thanh toán ZaloPay Sandbox cho môi trường Localhost.</div>
              </div>
              <button onClick={() => setZaloPayOpen(false)} aria-label="Đóng" style={{ border:0, background:'#f1f5f9', width:32, height:32, borderRadius:9, cursor:'pointer', fontSize:18 }}>×</button>
            </div>

            <div style={{ textAlign:'center', border:'1.5px solid #0068ff22', borderRadius:18, padding:16, background:'linear-gradient(135deg, #f0f7ff, #e6f0ff)', marginBottom:16 }}>
              <div style={{ fontSize:12, color:'#0068ff', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em' }}>MÃ QR ZALOPAY SANDBOX</div>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(zaloPayData.orderUrl || zaloPayData.qrCodeText)}`} 
                alt="ZaloPay QR Sandbox" 
                style={{ display:'block', width:200, height:200, margin:'12px auto', borderRadius:12, border:'3px solid #0068ff', boxShadow:'0 8px 20px rgba(0,104,255,0.15)' }} 
              />
              <div style={{ fontSize:22, fontWeight:900, color:'#0068ff' }}>
                {(zaloPayData.amount || 200000).toLocaleString('vi-VN')} VND
              </div>
              <div style={{ fontSize:11.5, color:'#64748b', marginTop:4 }}>
                Mã đơn: <strong style={{ color:'#1e293b' }}>{zaloPayData.appTransId}</strong> · AppID: <strong>2553</strong>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <a 
                href={zaloPayData.orderUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  width:'100%', boxSizing:'border-box', padding:'12px 16px', borderRadius:12,
                  background:'linear-gradient(135deg, #0068ff, #0044bb)', color:'#fff', textAlign:'center',
                  fontWeight:800, textDecoration:'none', fontSize:13.5, boxShadow:'0 4px 14px rgba(0,104,255,0.3)'
                }}
              >
                🚀 Mở trang ZaloPay Gateway (Cổng chính thức)
              </a>

              <button 
                onClick={handleConfirmZaloPaySuccess} 
                disabled={zaloPayLoading}
                style={{
                  width:'100%', padding:'12px 16px', border:0, borderRadius:12,
                  background:'linear-gradient(135deg, #10b981, #059669)', color:'#fff',
                  fontWeight:800, cursor:zaloPayLoading?'wait':'pointer', fontSize:13.5,
                  boxShadow:'0 4px 14px rgba(16,185,129,0.3)'
                }}
              >
                {zaloPayLoading ? 'Đang xử lý...' : '✅ Xác nhận đã quét mã / Thanh toán Sandbox'}
              </button>
            </div>

            <div style={{ marginTop:12, fontSize:11.5, lineHeight:1.5, color:'#64748b', textAlign:'center' }}>
              Môi trường thử nghiệm Sandbox (AppID: 2553, Key1: PcY4iZIKFC...). Tiền được cộng tự động ngay sau khi xác nhận.
            </div>
          </div>
        </div>
      )}
      {/* Title Header matching ELSA */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Học Ngoại Ngữ cùng LUCY</h1>
        <p style={{ color: '#64748b', fontSize: 15, margin: '0 auto', maxWidth: 650, lineHeight: 1.6 }}>
          Học ngoại ngữ trực tuyến cùng LUCY để rèn luyện các kỹ năng Anh - Trung - Nhật với kho tài liệu học đầy đủ nhất.
        </p>
      </div>

      {/* Wallet / Sandbox Control Panel */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
        borderRadius: 24, padding: '24px 32px', color: '#fff', marginBottom: 36,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20,
        boxShadow: '0 12px 36px rgba(49, 16, 66, 0.15)', border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ví Tiền Thử Nghiệm (Sandbox Wallet)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
            {safeBalance.toLocaleString('vi-VN')} {currency}
          </div>
          <div style={{ fontSize: 12, color: '#a5b4fc', marginTop: 4 }}>Trạng thái tài khoản: <strong style={{ color: '#38bdf8' }}>{subType === 'Free' ? 'Thành viên thường (Free)' : subType}</strong></div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Coupon Input */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '4px 6px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <input 
              type="text" 
              placeholder="Nhập mã giảm giá..."
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: '#fff', fontSize: 13,
                padding: '6px 10px', outline: 'none', width: 170, fontFamily: 'inherit'
              }}
            />
            <button 
              onClick={handleApplyCoupon}
              style={{
                background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
                padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Áp dụng
            </button>
          </div>

          <button 
            onClick={handleTopup} 
            disabled={topupLoading}
            style={{
              padding: '12px 20px', borderRadius: 12,
              background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s',
              boxShadow: '0 4px 14px rgba(16,185,129,0.25)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            Nạp qua VietQR
          </button>

          <button 
            onClick={() => handleOpenZaloPay(200000)} 
            disabled={zaloPayLoading}
            style={{
              padding: '12px 20px', borderRadius: 12,
              background: 'linear-gradient(135deg,#0068ff,#0044bb)', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.15s',
              boxShadow: '0 4px 14px rgba(0,104,255,0.3)', display: 'inline-flex', alignItems: 'center', gap: 6
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            💙 {zaloPayLoading ? 'Đang tạo đơn ZaloPay...' : 'Nạp qua Ví ZaloPay (Sandbox)'}
          </button>
        </div>
      </div>

      {/* 4 Cards Packages Section matching ELSA layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {plans.map((p) => {
          const isActive = subType === p.id;
          const buttonGradient = isActive 
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)';
          
          return (
            <div 
              key={p.id} 
              style={{
                background: '#fff',
                border: isActive ? '3px solid #6366f1' : '1px solid #e2e8f0',
                borderRadius: 24,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive 
                  ? '0 20px 40px rgba(99, 102, 241, 0.18)' 
                  : '0 10px 30px rgba(0,0,0,0.03)'
              }}
              onMouseEnter={e => {
                if(!isActive) {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={e => {
                if(!isActive) {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.03)';
                }
              }}
            >
              {/* Active Badge */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  background: '#6366f1', color: '#fff',
                  fontSize: 9, fontWeight: 900, padding: '5px 12px',
                  borderBottomLeftRadius: 12, letterSpacing: '0.05em'
                }}>ĐANG DÙNG</div>
              )}

              {/* 3D Box Mockup via CSS */}
              <div style={{
                height: 120, width: '100%', borderRadius: 16,
                background: p.accent, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', position: 'relative',
                color: '#fff', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1), 0 8px 18px rgba(0,0,0,0.08)',
                overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 16
              }}>
                <div style={{
                  width: 50, height: 54, background: 'rgba(255,255,255,0.12)',
                  transform: 'rotateX(55deg) rotateY(0deg) rotateZ(-45deg)',
                  transformStyle: 'preserve-3d', position: 'relative',
                  boxShadow: '-8px 8px 16px rgba(0,0,0,0.4)',
                  borderRadius: 4, border: '1.5px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 10, letterSpacing: '0.05em'
                }}>
                  LUCY
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, marginTop: 8, letterSpacing: '0.04em', color: p.isPremium ? '#fbbf24' : '#38bdf8' }}>
                  {p.isPremium ? '💎 PREMIUM' : '⚡ PRO'}
                </div>
                <div style={{ fontSize: 9, opacity: 0.8, fontWeight: 700, letterSpacing: '0.08em', marginTop: 2 }}>
                  {p.isLifetime ? 'LIFETIME' : '1 YEAR'}
                </div>
              </div>

              {/* Package Title */}
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', fontFamily: "'Outfit',sans-serif", textAlign: 'center' }}>
                {p.title}
              </h3>

              {/* Crossed-out original price */}
              <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through', textAlign: 'center', marginTop: 6 }}>
                Giá gốc: {p.originalPrice.toLocaleString()}đ
              </div>

              {/* Current bold red price */}
              <div style={{ fontSize: 20, fontWeight: 900, color: '#dc2626', fontFamily: "'Outfit',sans-serif", margin: '4px 0 12px', textAlign: 'center' }}>
                {p.price.toLocaleString()}đ
              </div>

              {/* Coupon discount text */}
              {p.couponText && !couponApplied && (
                <div style={{
                  fontSize: 10.5, color: '#ea580c', background: '#fff7ed',
                  padding: '6px 10px', borderRadius: 8, border: '1px dashed #fdba74',
                  textAlign: 'center', marginBottom: 12, lineHeight: 1.4, fontWeight: 600
                }}>
                  {p.couponText}
                </div>
              )}
              {p.couponText && couponApplied && (
                <div style={{
                  fontSize: 10.5, color: '#16a34a', background: '#f0fdf4',
                  padding: '6px 10px', borderRadius: 8, border: '1px solid #86efac',
                  textAlign: 'center', marginBottom: 12, lineHeight: 1.4, fontWeight: 700
                }}>
                  ✓ Đã giảm giá online thành công!
                </div>
              )}

              <div style={{ height: 1, background: '#f1f5f9', marginBottom: 14 }} />

              {/* Features list */}
              <ul style={{
                listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1,
                display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#475569',
                lineHeight: 1.4
              }}>
                {p.features.map((f, fi) => (
                  <li key={fi} style={{ display: 'flex', gap: 6 }}>
                    <span style={{ color: p.isPremium ? '#8b5cf6' : '#0284c7', fontWeight: 'bold' }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Buy Button */}
              <button 
                onClick={() => handleSubscribe(p.id, p.price)}
                style={{
                  padding: '12px 0', width: '100%', borderRadius: 12,
                  background: buttonGradient,
                  color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isActive ? 'none' : '0 4px 14px rgba(37,99,235,0.2)'
                }}
                onMouseEnter={e => { if(!isActive) e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { if(!isActive) e.currentTarget.style.transform = '' }}
              >
                {isActive ? '✓ Đang sử dụng' : 'Mua ngay'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Premium Courses Section */}
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 16px' }}>Exclusive Premium Courses</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
        {(Array.isArray(items) && items.length > 0 ? items : [
          { title: "Advanced Business English", langCode: "GB", accent: "blue" },
          { title: "JLPT N5 Prep Course", langCode: "JP", accent: "pink" },
          { title: "HSK 1 Complete Pack", langCode: "CN", accent: "red" },
          { title: "Conversational English Master", langCode: "GB", accent: "indigo" }
        ]).map((item, idx) => {
          const isUnlocked = (unlockedCourses || []).includes(item?.title) || subType !== 'Free';
          const flag = { GB: '🇬🇧', CN: '🇨🇳', JP: '🇯🇵' }[item?.langCode] || item?.langCode || '💎';
          const accentColor = item?.accent === 'blue' ? '#3b82f6' : (item?.accent === 'red' ? '#ef4444' : '#ec4899');
          
          return (
            <div key={idx} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
              padding: 20, transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              borderTop: `4px solid ${accentColor}`
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)' }}
            >
              {/* Premium Badge */}
              <div style={{
                position: 'absolute', top: 0, right: 0, 
                background: isUnlocked ? '#10b981' : '#fbbf24', 
                color: '#fff', fontSize: 8.5, fontWeight: 900, padding: '4px 10px', 
                borderBottomLeftRadius: 10, letterSpacing: '0.05em'
              }}>
                {isUnlocked ? 'UNLOCKED' : 'LOCKED 🔒'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{flag}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{item.langCode} Course</span>
              </div>

              <h3 style={{ 
                fontWeight: 800, fontSize: 14.5, color: '#0f172a', margin: '0 0 14px', 
                fontFamily: "'Outfit',sans-serif", flex: 1, lineHeight: 1.4
              }}>{item.title}</h3>

              <button 
                onClick={() => handleUnlockCourse(item)}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10,
                  background: isUnlocked ? '#f0fdf4' : '#0f172a',
                  color: isUnlocked ? '#10b981' : '#fff',
                  border: isUnlocked ? '1.5px solid #bbf7d0' : 'none',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                {isUnlocked ? '▶ Learn Now' : `Unlock Course (49,000 VND)`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Gifts View
function GiftsView({ xp, onRedeem }) {
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadGifts() {
      try {
        const res = await fetch(`${API_BASE}/api/engagement/gifts`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setGifts(data)
      } catch (err) {
        console.warn('Failed to fetch gifts, using local fallback:', err.message)
        setGifts([
          { name: "Lucy Premium T-Shirt", xp: 500, desc: "Premium cotton t-shirt with Lucy branding", iconCode: "tshirt" },
          { name: "Double XP Card (24h)", xp: 200, desc: "Gain double XP for all lessons for 24 hours", iconCode: "double_xp" },
          { name: "Agora VIP Pass", xp: 800, desc: "Unlock priority slot in Agora live room discussions", iconCode: "vip_pass" }
        ])
      } finally {
        setLoading(false)
      }
    }
    loadGifts()
  }, [])

  const handleRedeem = (gift) => {
    if (xp < gift.xp) {
      alert(`You need ${gift.xp} XP to redeem this gift. Currently you only have ${xp} XP.`);
      return;
    }
    const ok = window.confirm(`Are you sure you want to redeem ${gift.xp} XP for "${gift.name}"?`);
    if (ok) {
      onRedeem(gift.xp, gift.name);
    }
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
      <div style={{ width: 30, height: 30, border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
      <div>Loading gifts...</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
      <div style={{ fontSize: 14, marginBottom: 10 }}>Warning: {error}</div>
    </div>
  )

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Gifts & Rewards Store</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px' }}>Redeem your hard-earned XP for virtual badges, passes and physical merch</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {gifts.map((g, idx) => (
          <div key={idx} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
            padding: '20px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#4b5563', marginBottom: 12, textAlign: 'center', background: '#f3f4f6', padding: '6px', borderRadius: 8 }}>{{ tshirt: 'T-Shirt', double_xp: 'Double XP', vip_pass: 'VIP Pass' }[g.iconCode] || g.iconCode || 'Gift'}</div>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: '0 0 4px', fontFamily: "'Outfit',sans-serif" }}>{g.name}</h3>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, flex: 1 }}>{g.desc}</div>
            <button onClick={() => handleRedeem(g)} style={{
              width: '100%', padding: '10px 0', borderRadius: 10,
              background: xp >= g.xp ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : '#cbd5e1',
              color: '#fff', border: 'none',
              fontSize: 12.5, fontWeight: 700, cursor: xp >= g.xp ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}>Redeem for {g.xp} XP</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Progress View
function ProgressView({ xp, streak, completed }) {
  const level = getLevel(xp)
  const levelInfo = xpToNextLevel(xp)
  const total = Object.values(completed).flat().length
  const totalLessons = Object.values(LESSONS).flat().length

  const badges = [
    { icon:'[Goal]', name:'Beginner Star',  desc:'Complete the first lesson',  unlocked: total >= 1 },
    { icon:'[Fire]', name:'3-Day Streak',   desc:'Study 3 consecutive days',    unlocked: streak >= 3 },
    { icon:'[Star]', name:'5 Lessons',      desc:'Complete 5 lessons',          unlocked: total >= 5 },
    { icon:'[World]', name:'Polyglot',        desc:'Learn 3 different languages', unlocked: Object.keys(completed).filter(l => (completed[l]?.length||0) > 0).length >= 3 },
    { icon:'[Trophy]', name:'10 Lessons',     desc:'Complete 10 lessons',         unlocked: total >= 10 },
    { icon:'[Diamond]', name:'Expert Mode',    desc:'Reach Level 3',               unlocked: level >= 3 },
  ]

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Learning Progress</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 22px' }}>Track your language learning journey</p>

      {/* XP Card */}
      <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 16, padding: '24px 28px', color: '#fff', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Current Level</div>
            <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>Level {level} - {getLevelName(level)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Outfit',sans-serif" }}>XP: {xp}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Total XP</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', borderRadius: 4, background: '#fff', width: `${levelInfo.pct}%`, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {levelInfo.toNext > 0 ? `Need ${levelInfo.toNext} XP more to reach Level ${level + 1}` : 'You have reached the max level!'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label:'Lessons Completed', value:`${total}/${totalLessons}`, icon:'[Lessons]', color:'#3b82f6' },
          { label:'Daily Streak',     value:`${streak} days`,           icon:'[Streak]', color:'#f59e0b' },
          { label:'Badges Unlocked',   value:`${badges.filter(b=>b.unlocked).length}/${badges.length}`, icon:'[Badges]', color:'#8b5cf6' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px', textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Outfit',sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-language progress */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>Progress by Language</div>
        {Object.entries(LANG).map(([k, c]) => {
          const done = completed[k]?.length || 0
          const tot  = LESSONS[k].length
          const pct  = Math.round((done / tot) * 100)
          return (
            <div key={k} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.flag} {c.name}</span>
                <span style={{ color: '#64748b' }}>{done}/{tot} lessons · <strong style={{ color: c.primary }}>{pct}%</strong></span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: c.gradient, width: `${pct}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Badges */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>Achievements & Badges</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {badges.map((b, i) => (
            <div key={i} style={{
              padding: '16px', borderRadius: 12, textAlign: 'center',
              background: b.unlocked ? '#f0fdf4' : '#f8fafc',
              border: `1.5px solid ${b.unlocked ? '#6ee7b7' : '#e2e8f0'}`,
              opacity: b.unlocked ? 1 : 0.5,
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 28, marginBottom: 6, filter: b.unlocked ? 'none' : 'grayscale(1)' }}>{b.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: b.unlocked ? '#065f46' : '#94a3b8' }}>{b.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Profile View
function ProfileView({ user, xp, streak, completed, onLogout }) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const doChangePass = async (e) => {
    e.preventDefault();
    if (!oldPass || !newPass) return alert('Please enter all fields');
    try {
      const res = await fetch(`${API_BASE}/api/users/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, oldPassword: oldPass, newPassword: newPass })
      });
      if (res.ok) {
        alert('Password changed successfully!');
        setOldPass(''); setNewPass(''); setIsChangingPass(false);
      } else {
        const data = await res.json();
        alert('Error: ' + data.error);
      }
    } catch(err) {
      alert('Server connection error');
    }
  };

  const total = Object.values(completed).flat().length
  const level = getLevel(xp)
  const roleLabel = { admin: '👨‍🏫 Admin', student: '🎓 Student', influencer: '👑 Influencer' }

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 20px' }}>User Profile 👤</h1>

      <div style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0 }}>🎓</div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}>{user.name}</div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{roleLabel[user.roleId] || roleLabel[user.role] || '🎓 Student'}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Level {level} · ⚡ {xp} XP · 🔥 {streak} day streak</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        {[
          ['Total XP', `⚡ ${xp}`, '#6366f1'],
          ['Current Level', `Level ${level} — ${getLevelName(level)}`, '#3b82f6'],
          ['Streak', `🔥 ${streak} consecutive days`, '#f59e0b'],
          ['Lessons Completed', `✅ ${total} lessons`, '#10b981'],
        ].map(([k, v, c]) => (
          <div key={k} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{k}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14 }}>Progress by Language</div>
        {Object.entries(LANG).map(([k, c]) => {
          const done = completed[k]?.length || 0
          const tot = LESSONS[k].length
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 22, width: 28 }}>{c.flag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
                  <span style={{ color: '#64748b' }}>{done}/{tot}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: c.gradient, width: `${Math.round((done / tot) * 100)}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>🔒 Account Security</div>
          <button onClick={() => setIsChangingPass(!isChangingPass)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Change Password</button>
        </div>
        
        {isChangingPass && (
          <form onSubmit={doChangePass} style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Old Password</div>
              <input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Enter current password..." />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>New Password</div>
              <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Enter new password..." />
            </div>
            <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>Save Password</button>
          </form>
        )}
      </div>

      <button onClick={onLogout} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none',
        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 4px 16px rgba(239,68,68,0.4)', transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = '' }}
      >🚪 Logout</button>
    </div>
  )
}

// AI Coach View
function CoachView({ user }) {
  const [coachData, setCoachData] = useState(null);
  const [loadingCoach, setLoadingCoach] = useState(true);
  const [errorCoach, setErrorCoach] = useState(null);

  // Mentor feedback state
  const [answerText, setAnswerText] = useState('');
  const [lessonCode, setLessonCode] = useState('EN_1');
  const [feedbackResult, setFeedbackResult] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState(null);

  useEffect(() => {
    fetchCoachData();
  }, []);

  const fetchCoachData = async () => {
    setLoadingCoach(true);
    setErrorCoach(null);
    try {
      const res = await fetch(`${API_BASE}/api/agent/coach?userId=${user.id || 1}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCoachData(data);
    } catch (err) {
      setErrorCoach('Failed to load AI Coach plan: ' + err.message);
      setCoachData({
        coachName: "LISA AI Coach (Offline)",
        nextLesson: { level: 2, topic: "Introducing Yourself" },
        riskFlags: ["low_speaking_practice"],
        recommendedActions: ["Join LIVE Room English Beginner", "Practice Vocab Level 2"]
      });
    } finally {
      setLoadingCoach(false);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setLoadingFeedback(true);
    setErrorFeedback(null);
    setFeedbackResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/agent/mentor-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || 1,
          answerText: answerText.trim(),
          lessonCode: lessonCode.trim()
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFeedbackResult(data);
    } catch (err) {
      setErrorFeedback('Failed to submit response: ' + err.message);
      setFeedbackResult({
        feedback: "[Offline Fallback] Good job! Try structuring your sentence with more descriptive elements.",
        corrections: "None",
        speakingTips: "Ensure correct placement of subject-verb agreement.",
        confidenceScore: 85
      });
    } finally {
      setLoadingFeedback(false);
    }
  };

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px', maxWidth: 1000 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 16px' }}>🤖 LISA AI Learning Coach</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Coach Plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>📋 Personalized Plan</h2>
            
            {loadingCoach ? (
              <div style={{ color: '#64748b', fontSize: 13 }}>Loading coach plan...</div>
            ) : errorCoach ? (
              <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{errorCoach}</div>
            ) : null}

            {coachData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Assigned Coach</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{coachData.coachName}</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Next Objective</div>
                  <div style={{ fontSize: 13, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <strong>Level {coachData.nextLesson?.level}</strong>: {coachData.nextLesson?.topic}
                  </div>
                </div>

                {coachData.riskFlags?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Risk Alerts</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {coachData.riskFlags.map((flag, idx) => (
                        <span key={idx} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          ⚠️ {flag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 11, color: '#0f766e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Recommended Actions</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#334155' }}>
                    {coachData.recommendedActions?.map((act, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Mentor Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>🎙️ Practice & AI Feedback</h2>
            
            <form onSubmit={submitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Lesson Code</label>
                  <select value={lessonCode} onChange={e=>setLessonCode(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
                    <option value="EN_1">English 1</option>
                    <option value="ZH_2">Chinese 2</option>
                    <option value="JA_3">Japanese 3</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Your Response</label>
                  <input type="text" value={answerText} onChange={e=>setAnswerText(e.target.value)} placeholder="Type what you want to say..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>
              </div>

              <button type="submit" disabled={loadingFeedback || !answerText.trim()} style={{
                background: loadingFeedback || !answerText.trim() ? '#cbd5e1' : '#4f46e5',
                color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
              }}>
                {loadingFeedback ? 'Analyzing...' : 'Get AI Feedback'}
              </button>
            </form>

            {errorFeedback && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>{errorFeedback}</div>}

            {feedbackResult && (
              <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>AI Analysis</span>
                  <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    Score: {feedbackResult.confidenceScore}%
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#334155', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong>Feedback</strong>: {feedbackResult.feedback}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  <strong>Corrections</strong>: {feedbackResult.corrections}
                </div>
                <div style={{ fontSize: 12, color: '#0891b2' }}>
                  <strong>Speaking Tip</strong>: {feedbackResult.speakingTips}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI Templates View ────────────────────────────────────────────────────────
function AITemplatesView() {
  const templates = [
    { id: 1, name: 'Vocabulary Builder', desc: 'Generate vocabulary lists for any topic and level', icon: '📝', color: '#3b82f6',
      prompt: 'Create a vocabulary list of 10 words about {topic} for {level} level learners in {language}.' },
    { id: 2, name: 'Grammar Explainer', desc: 'Get clear grammar explanations with examples', icon: '✏️', color: '#10b981',
      prompt: 'Explain the grammar rule "{rule}" in {language} with 3 example sentences for {level} learners.' },
    { id: 3, name: 'Conversation Starter', desc: 'Generate dialogue scripts for speaking practice', icon: '💬', color: '#f59e0b',
      prompt: 'Write a short 6-line dialogue about {topic} in {language} for {level} level practice.' },
    { id: 4, name: 'Story Generator', desc: 'Create short stories using target vocabulary', icon: '📖', color: '#8b5cf6',
      prompt: 'Write a 100-word story in {language} using these words: {words}. Target level: {level}.' },
    { id: 5, name: 'Error Correction', desc: 'Analyze and correct common mistakes', icon: '🔍', color: '#ef4444',
      prompt: 'Find and correct errors in this {language} text: "{text}". Explain each correction.' },
    { id: 6, name: 'Cultural Context', desc: 'Learn language through cultural insights', icon: '🌍', color: '#06b6d4',
      prompt: 'Explain the cultural context behind the phrase "{phrase}" in {language}.' },
  ]

  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = (prompt) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>AI Templates</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px' }}>Ready-made AI prompts to accelerate your learning</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {templates.map(t => (
          <div key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)}
            style={{
              background: '#fff', border: `1.5px solid ${selected?.id === t.id ? t.color : '#e2e8f0'}`,
              borderRadius: 16, padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: selected?.id === t.id ? `0 4px 16px ${t.color}22` : 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${t.color}22` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = selected?.id === t.id ? `0 4px 16px ${t.color}22` : '' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{t.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{t.desc}</div>
              </div>
            </div>
            {selected?.id === t.id && (
              <div className="fade-up" style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Prompt Template</div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#334155', lineHeight: 1.6, fontFamily: 'monospace' }}>
                  {t.prompt}
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleCopy(t.prompt) }} style={{
                  marginTop: 10, padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: copied ? '#10b981' : t.color, color: '#fff', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
                }}>{copied ? '✅ Copied!' : '📋 Copy Prompt'}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AI Questions View ────────────────────────────────────────────────────────
function AIQuestionsView() {
  const [lang, setLang] = useState('English')
  const [level, setLevel] = useState('Beginner')
  const [count, setCount] = useState(3)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setQuestions([])
    setAnswers({})
    setShowResults(false)
    try {
      const res = await fetch(`${API_BASE}/api/ai/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, level, topic: 'General', count })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setQuestions(data)
    } catch (err) {
      setError('Failed to generate questions: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (qIdx, option) => {
    if (showResults) return
    setAnswers(prev => ({ ...prev, [qIdx]: option }))
  }

  const handleSubmit = () => {
    setShowResults(true)
  }

  const score = questions.length > 0 ? questions.filter((q, i) => answers[i] === q.answer).length : 0

  return (
    <div className="fade-up" style={{ padding: '28px 28px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>AI Quiz Generator</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px' }}>Generate practice questions to test your knowledge</p>

      {/* Controls */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Language</label>
            <select value={lang} onChange={e => setLang(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', background: '#f8fafc' }}>
              <option value="English">🇬🇧 English</option>
              <option value="Chinese">🇨🇳 Chinese</option>
              <option value="Japanese">🇯🇵 Japanese</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Level</label>
            <select value={level} onChange={e => setLevel(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', background: '#f8fafc' }}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Questions</label>
            <select value={count} onChange={e => setCount(parseInt(e.target.value))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', background: '#f8fafc' }}>
              {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={loading} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: loading ? '#cbd5e1' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
          }}>{loading ? '⏳ Generating...' : '🧠 Generate'}</button>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#991b1b' }}>⚠️ {error}</div>}

      {/* Questions */}
      {questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q, qi) => (
            <div key={qi} className="fade-up" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{qi + 1}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{q.question}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === opt
                  const isCorrect = showResults && opt === q.answer
                  const isWrong = showResults && isSelected && opt !== q.answer
                  return (
                    <button key={oi} onClick={() => handleAnswer(qi, opt)} style={{
                      padding: '10px 14px', borderRadius: 10, textAlign: 'left', fontSize: 13, fontFamily: 'inherit',
                      background: isCorrect ? '#f0fdf4' : isWrong ? '#fef2f2' : isSelected ? '#eff6ff' : '#f8fafc',
                      border: `1.5px solid ${isCorrect ? '#6ee7b7' : isWrong ? '#fca5a5' : isSelected ? '#93c5fd' : '#e2e8f0'}`,
                      color: isCorrect ? '#065f46' : isWrong ? '#991b1b' : '#334155',
                      fontWeight: isSelected ? 600 : 400, cursor: showResults ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      {isCorrect && '✅ '}{isWrong && '❌ '}{opt}
                    </button>
                  )
                })}
              </div>
              {showResults && (
                <div className="fade-up" style={{ marginTop: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#0c4a6e' }}>
                  💡 <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}

          {!showResults ? (
            <button onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length} style={{
              padding: '14px 0', borderRadius: 12, border: 'none',
              background: Object.keys(answers).length < questions.length ? '#cbd5e1' : 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: Object.keys(answers).length < questions.length ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', boxShadow: Object.keys(answers).length < questions.length ? 'none' : '0 4px 16px rgba(16,185,129,0.4)',
              transition: 'all 0.2s',
            }}>📊 Submit Answers ({Object.keys(answers).length}/{questions.length})</button>
          ) : (
            <div className="fade-up" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 16, padding: '24px 28px', color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}>{score}/{questions.length}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                {score === questions.length ? '🎉 Perfect Score!' : score >= questions.length / 2 ? '👏 Good Job!' : '💪 Keep Practicing!'}
              </div>
              <button onClick={() => { setQuestions([]); setAnswers({}); setShowResults(false) }} style={{
                marginTop: 14, padding: '10px 24px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
              }}>🔄 Try Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const EN_RICH_DATA = {
  "SAYING WHO I AM": {
    vocab: "• full name (n): tên đầy đủ\n  Example: My full name is John Doe.\n• nickname (n): biệt danh\n  Example: My nickname is Johnny.\n• student (n): học sinh, sinh viên\n  Example: I am a university student.\n• worker (n): người đi làm\n  Example: He is an office worker.",
    grammar: "Subject + be + Noun/Adjective\n(Dùng để giới thiệu tên, tuổi, nghề nghiệp hoặc quốc tịch)\nExample 1: I am a student. (Tôi là học sinh)\nExample 2: She is from Vietnam. (Cô ấy đến từ Việt Nam)",
    question: "Translate to English: 'Tên đầy đủ của tôi là Dũng và tôi là học sinh.'",
    answer: "My full name is Dung and I am a student."
  },
  "COUNTRIES & LANGUAGES": {
    vocab: "• country (n): quốc gia\n  Example: Vietnam is a beautiful country.\n• native language (n): ngôn ngữ mẹ đẻ\n  Example: Vietnamese is my native language.\n• bilingual (adj): song ngữ\n  Example: She is bilingual in English and Chinese.\n• foreign (adj): nước ngoài\n  Example: I love learning foreign languages.",
    grammar: "Subject + speak(s) + Language(s)\n(Dùng để diễn đạt ngôn ngữ mà ai đó nói được)\nExample 1: I speak Vietnamese and English. (Tôi nói tiếng Việt và tiếng Anh)\nExample 2: He speaks Japanese fluently. (Anh ấy nói tiếng Nhật trôi chảy)",
    question: "Translate to English: 'Tôi nói tiếng Anh và tôi muốn học tiếng Nhật.'",
    answer: "I speak English and I want to learn Japanese."
  },
  "GREETINGS & POLITENESS": {
    vocab: "• greet (v): chào hỏi\n  Example: He greeted me with a warm smile.\n• polite (adj): lịch sự\n  Example: It is polite to say thank you.\n• apologize (v): xin lỗi\n  Example: I apologize for being late.\n• pleasure (n): niềm vinh hạnh\n  Example: It's a pleasure to meet you.",
    grammar: "Nice to meet you! / It's a pleasure to meet you.\n(Mẫu câu lịch sự dùng khi lần đầu gặp mặt ai đó)\nExample: Hello, I am Peter. Nice to meet you! (Xin chào, tôi là Peter. Rất vui được gặp bạn!)",
    question: "Complete the dialogue: 'Thank you so much for your help!' -> 'You are ________.'",
    answer: "welcome"
  },
  "AGE & FAMILY": {
    vocab: "• sibling (n): anh chị em ruột\n  Example: Do you have any siblings?\n• parent (n): cha mẹ\n  Example: My parents live in Hanoi.\n• nuclear family (n): gia đình hạt nhân (cha mẹ và con cái)\n  Example: We live in a nuclear family.\n• relative (n): họ hàng\n  Example: All my relatives came to the party.",
    grammar: "Subject + have/has + family members\n(Dùng để giới thiệu về thành viên trong gia đình hoặc sở hữu)\nExample 1: I have two older brothers. (Tôi có hai anh trai)\nExample 2: She has a big family. (Cô ấy có một gia đình lớn)",
    question: "Translate to English: 'Tôi 20 tuổi và tôi có một người em gái.'",
    answer: "I am 20 years old and I have a younger sister."
  },
  "MY HOME": {
    vocab: "• apartment (n): căn hộ chung cư\n  Example: I live in a quiet apartment.\n• spacious (adj): rộng rãi\n  Example: The living room is very spacious.\n• neighborhood (n): khu dân cư, vùng lân cận\n  Example: We live in a safe neighborhood.\n• cozy (adj): ấm cúng\n  Example: My bedroom is small but cozy.",
    grammar: "There is / There are + Noun + Location\n(Dùng để miêu tả có những gì trong ngôi nhà)\nExample 1: There is a TV in the living room. (Có một chiếc TV ở phòng khách)\nExample 2: There are three bedrooms in my house. (Có ba phòng ngủ trong nhà tôi)",
    question: "Translate to English: 'Có một chiếc giường ấm cúng trong phòng ngủ của tôi.'",
    answer: "There is a cozy bed in my bedroom."
  },
  "DAILY ROUTINE": {
    vocab: "• wake up (v): thức dậy (mở mắt)\n  Example: I usually wake up at 6 AM.\n• get dressed (v): mặc quần áo\n  Example: I get dressed before having breakfast.\n• commute (v): đi làm/đi học (di chuyển)\n  Example: He commutes to work by bus.\n• stay up late (v): thức khuya\n  Example: Don't stay up late, it's bad for your health.",
    grammar: "Subject + Simple Present Verb (+ Time / Frequency)\n(Dùng để tả thói quen hoặc lịch trình hàng ngày)\nExample 1: I go to bed at 10 PM. (Tôi đi ngủ lúc 10 giờ tối)\nExample 2: She always drinks tea in the morning. (Cô ấy luôn uống trà vào buổi sáng)",
    question: "Translate to English: 'Tôi thường đi học bằng xe đạp lúc 7 giờ sáng.'",
    answer: "I usually go to school by bicycle at 7 AM."
  },
  "FOOD & DRINKS": {
    vocab: "• delicious (adj): thơm ngon\n  Example: This beef noodle soup is delicious.\n• beverage (n): đồ uống\n  Example: Water is the healthiest beverage.\n• vegetarian (n/adj): người ăn chay / chay\n  Example: She decided to become a vegetarian.\n• ingredient (n): nguyên liệu nấu ăn\n  Example: Fresh ingredients make good food.",
    grammar: "Subject + prefer(s) + Noun A + to + Noun B\n(Dùng để diễn tả thích cái gì hơn cái gì)\nExample 1: I prefer tea to coffee. (Tôi thích trà hơn cá phê)\nExample 2: He prefers fish to meat. (Anh ấy thích cá hơn thịt)",
    question: "Translate to English: 'Tôi thích ăn trái cây hơn đồ ngọt.'",
    answer: "I prefer eating fruits to sweets."
  },
  "FREE TIME & HOBBIES": {
    vocab: "• leisure time (n): thời gian rảnh rỗi\n  Example: What do you do in your leisure time?\n• instrument (n): nhạc cụ\n  Example: I am learning to play a musical instrument.\n• outdoor (adj): ngoài trời\n  Example: Football is an outdoor sport.\n• relax (v): thư giãn\n  Example: Reading books helps me relax.",
    grammar: "Subject + enjoy(s)/like(s) + Verb-ing\n(Dùng để nói về sở thích cá nhân)\nExample 1: I enjoy playing the guitar. (Tôi thích chơi đàn guitar)\nExample 2: She likes listening to pop music. (Cô ấy thích nghe nhạc pop)",
    question: "Translate to English: 'Trong thời gian rảnh, tôi thích đọc sách tiếng Anh.'",
    answer: "In my free time, I like reading English books."
  },
  "PLACES AROUND ME": {
    vocab: "• grocery store (n): cửa hàng tạp hóa\n  Example: I buy fresh vegetables at the grocery store.\n• convenience (n): sự tiện lợi\n  Example: The supermarket is built for convenience.\n• local park (n): công viên địa phương\n  Example: We jog in the local park every weekend.\n• pharmacy (n): hiệu thuốc\n  Example: I need to buy medicine at the pharmacy.",
    grammar: "Location A + is next to / opposite / near + Location B\n(Dùng để chỉ vị trí các địa điểm xung quanh)\nExample 1: The cafe is opposite the park. (Quán cà phê đối diện công viên)\nExample 2: The grocery store is near my house. (Cửa hàng tạp hóa ở gần nhà tôi)",
    question: "Translate to English: 'Hiệu thuốc nằm đối diện siêu thị.'",
    answer: "The pharmacy is opposite the supermarket."
  },
  "YESTERDAY": {
    vocab: "• yesterday (adv): ngày hôm qua\n  Example: I visited my grandparents yesterday.\n• spent time (v): dành thời gian\n  Example: I spent time cleaning my room.\n• fatigue (n): sự mệt mỏi\n  Example: I felt fatigue after a long workday.\n• productive (adj): năng suất, hiệu quả\n  Example: Yesterday was a very productive day.",
    grammar: "Subject + Simple Past Verb (V2 / V-ed)\n(Dùng để diễn tả hành động đã xảy ra và chấm dứt trong quá khứ)\nExample 1: I watched a movie yesterday. (Hôm qua tôi đã xem một bộ phim)\nExample 2: She went to the market this morning. (Sáng nay cô ấy đã đi chợ)",
    question: "Translate to English: 'Hôm qua tôi đã học tiếng Anh trong hai giờ.'",
    answer: "Yesterday I studied English for two hours."
  }
};

const JA_RICH_DATA = {
  "自己紹介": {
    vocab: "• 自己紹介 (じこしょうかい): Tự giới thiệu bản thân\n• 学生 (がくせい): Học sinh, sinh viên\n• 社会人 (しゃかいじん): Người đã đi làm\n• 出身 (しゅっしん): Xuất thân, quê quán",
    grammar: "Noun + です / Noun + でわありません\n(Cấu trúc khẳng định và phủ định cơ bản để giới thiệu)\nExample 1: 私は学生です。 (Tôi là học sinh)\nExample 2: 私は社会人ではありません。 (Tôi không phải là người đi làm)",
    question: "Dịch sang tiếng Nhật: 'Tôi là người đi làm.'",
    answer: "私は社会人です。"
  },
  "国と言語": {
    vocab: "• 国 (くに): Quốc gia, đất nước\n• 言語 (げんご): Ngôn ngữ\n• 日本語 (にほんご): Tiếng Nhật\n• 英語 (えいご): Tiếng Anh",
    grammar: "Language + が話せます / 話せません\n(Cấu trúc nói về khả năng ngoại ngữ)\nExample 1: 私は日本語が話せます。 (Tôi có thể nói tiếng Nhật)\nExample 2: 英語が話せません。 (Tôi không thể nói tiếng Anh)",
    question: "Dịch sang tiếng Nhật: 'Tôi nói được tiếng Nhật và tiếng Anh.'",
    answer: "私は日本語と英語が話せます。"
  },
  "挨拶と礼儀": {
    vocab: "• 挨拶 (あいさつ): Chào hỏi\n• ありがとう: Cảm ơn\n• すみません: Xin lỗi / Cho hỏi\n• はじめまして: Rất hân hạnh được gặp bạn",
    grammar: "はじめまして、[Tên] です。よろしくお願いします。\n(Mẫu câu chào hỏi lịch sự khi lần đầu gặp mặt)\nExample: はじめまして、タインです。よろしくお願いします。 (Chào bạn, tôi là Thành. Rất mong được giúp đỡ.)",
    question: "Điền từ thích hợp để nói 'Xin lỗi vì đã đến muộn': '________、遅れました。'",
    answer: "すみません"
  },
  "年齢と家族": {
    vocab: "• 年齢 (ねんれい): Tuổi tác\n• 家族 (かぞく): Gia đình\n• 妹 (いもうと): Em gái\n• 両親 (りょうしん): Bố mẹ",
    grammar: "Noun + がいます / います\n(Cấu trúc nói về sự tồn tại của con người/động vật - có ai đó)\nExample 1: 私には妹がいます。 (Tôi có một em gái)\nExample 2: 家族がハノイにいます。 (Gia đình tôi ở Hà Nội)",
    question: "Dịch sang tiếng Nhật: 'Tôi có bố mẹ và em gái.'",
    answer: "私には両親と妹がいます。"
  },
  "私の家": {
    vocab: "• アパート: Căn hộ chung cư\n• 部屋 (へや): Căn phòng\n• 静か (しずか): Yên tĩnh\n• 広い (ひろい): Rộng rãi",
    grammar: "Location + に + Noun + があります\n(Cấu trúc mô tả đồ vật ở đâu đó)\nExample 1: 部屋にベッドがあります。 (Có chiếc giường trong phòng)\nExample 2: 家の近くに公園があります。 (Có công viên ở gần nhà tôi)",
    question: "Dịch sang tiếng Nhật: 'Có một chiếc TV ở phòng khách.'",
    answer: "居間にテレビがあります。"
  },
  "毎日の習慣": {
    vocab: "• 起きる (おきる): Thức dậy\n• 朝ご飯 (あさごはん): Bữa sáng\n• 学校 (がっこう): Trường học\n• 寝る (ねる): Đi ngủ",
    grammar: "Time + に + Verb ます\n(Cấu trúc diễn tả hành động làm vào lúc mấy giờ)\nExample 1: 6時に起きます。 (Tôi thức dậy lúc 6 giờ)\nExample 2: 10時に寝ます。 (Tôi đi ngủ lúc 10 giờ)",
    question: "Dịch sang tiếng Nhật: 'Tôi ăn sáng lúc 7 giờ.'",
    answer: "7時に朝ご飯を食べます。"
  }
};

const ZH_RICH_DATA = {
  "介绍": {
    vocab: "• 你 (nǐ): Bạn, Anh, Chị\n• 叫 (jiào): Gọi là, tên là\n• 什么 (shénme): Cái gì\n• 名字 (míngzi): Tên\n• 我 (wǒ): Tôi, Tớ",
    grammar: "Chủ ngữ + 叫 + Tên\n(Cấu trúc dùng để giới thiệu tên của mình hoặc hỏi tên người khác)\nExample 1: 你叫什么名字？ (Bạn tên là gì?)\nExample 2: 我叫陈中。 (Tôi tên là Trần Trung.)",
    question: "Translate to Chinese: 'Tôi tên là Dũng.'",
    answer: "我叫勇。"
  },
  "国籍与语言": {
    vocab: "• 国籍 (guójí): Quốc tịch\n• 哪 (nǎ): Nào, cái nào\n• 国 (guó): Nước, quốc gia\n• 人 (rén): Người\n• 汉语 (Hànyǔ): Tiếng Trung",
    grammar: "Chủ ngữ + 是 + 哪国人？\n(Cấu trúc hỏi quốc tịch của ai đó)\nExample 1: 你是哪国人？ (Bạn là người nước nào?)\nExample 2: 我是越南人。 (Tôi là người Việt Nam.)",
    question: "Translate to Chinese: 'Bạn là người nước nào?'",
    answer: "你是哪国人？"
  },
  "问候": {
    vocab: "• 你好 (nǐ hǎo): Xin chào\n• 谢谢 (xièxie): Cảm ơn\n• 再见 (zàijiàn): Tạm biệt\n• 对不起 (duìbùqǐ): Xin lỗi",
    grammar: "你好 (Nǐ hǎo) / 您好 (Nín hǎo)\n(Mẫu câu chào hỏi thông dụng nhất trong tiếng Trung)\nExample: 老师，您好！ (Em chào thầy/cô ạ!)",
    question: "Complete the sentence to say 'Thank you': '________大家！'",
    answer: "谢谢"
  }
};

function enrichLesson(title, langCode, rawVocab, rawGrammar) {
  const cleanTitle = (title || "").trim().toUpperCase().replace(/LEVEL\s+\d+\s*[-–－:]\s*/g, "");
  
  const maps = {
    LISA: EN_RICH_DATA,
    JA: JA_RICH_DATA,
    ZH: ZH_RICH_DATA
  };
  
  const currentMap = maps[langCode] || {};
  
  let found = null;
  for (const key of Object.keys(currentMap)) {
    if (cleanTitle.includes(key.toUpperCase()) || key.toUpperCase().includes(cleanTitle)) {
      found = currentMap[key];
      break;
    }
  }
  
  if (found) {
    return {
      vocab: found.vocab,
      grammar: found.grammar,
      question: found.question,
      answer: found.answer
    };
  }
  
  // Rule-based enrichment fallback
  if (langCode === 'LISA' || langCode === 'JA') {
    const lines = (rawVocab || "").split("\n").map(s => s.trim()).filter(s => s);
    
    let formattedVocab = "";
    if (lines.length > 0) {
      formattedVocab = lines.map(line => {
        const clean = line.replace(/^\d+[:：\.\-\s]*/g, "").trim();
        return `• ${clean}\n  Example sentence with: ${clean}`;
      }).join("\n");
    } else {
      formattedVocab = rawVocab || "• Lesson vocabulary to study.";
    }

    let generatedGrammar = "";
    let cleanT = cleanTitle.toLowerCase();
    if (cleanT.includes("routine") || cleanT.includes("daily") || cleanT.includes("week")) {
      generatedGrammar = "Subject + Simple Present Verb + time/frequency\n(Diễn tả thói quen hàng ngày)\nExample: I usually exercise in the morning. (Tôi thường tập thể dục vào buổi sáng)";
    } else if (cleanT.includes("food") || cleanT.includes("drink") || cleanT.includes("eat")) {
      generatedGrammar = "Subject + like/prefer + Food/Drink\n(Bày tỏ sở thích ăn uống)\nExample: I like drinking hot milk before sleeping. (Tôi thích uống sữa nóng trước khi ngủ)";
    } else if (cleanT.includes("family") || cleanT.includes("home") || cleanT.includes("age")) {
      generatedGrammar = "Subject + have/has + Noun\n(Diễn tả sự sở hữu hoặc giới thiệu mối quan hệ)\nExample: I have a small family with 4 members. (Tôi có một gia đình nhỏ gồm 4 thành viên)";
    } else if (cleanT.includes("yesterday") || cleanT.includes("past") || cleanT.includes("last")) {
      generatedGrammar = "Subject + Simple Past Verb (V2/V-ed)\n(Diễn đạt sự việc đã kết thúc trong quá khứ)\nExample: I cleaned my house yesterday. (Hôm qua tôi đã dọn dẹp nhà cửa)";
    } else if (cleanT.includes("travel") || cleanT.includes("transport") || cleanT.includes("place")) {
      generatedGrammar = "Subject + go to + Location + by + Vehicle\n(Nói về cách thức di chuyển đến một địa điểm)\nExample: We go to school by bus. (Chúng tôi đi học bằng xe buýt)";
    } else {
      generatedGrammar = `Subject + modal verb (can/must/should) + Verb\n(Mẫu câu thông dụng trong chủ đề ${title})\nExample: You should study daily to improve. (Bạn nên học hàng ngày để tiến bộ)`;
    }

    const firstWord = lines.length > 0 ? lines[0].replace(/^\d+[:：\.\-\s]*/g, "").trim() : (title || "Lesson");
    const question = `Dịch hoặc tạo câu hoàn chỉnh sử dụng: "${firstWord}"`;
    const answer = `Create a meaningful sentence with: "${firstWord}"`;

    return {
      vocab: formattedVocab,
      grammar: generatedGrammar,
      question,
      answer
    };
  } else if (langCode === 'ZH') {
    const questionText = rawVocab || "";
    const answerText = rawGrammar || "";
    
    let zhVocab = "";
    if (questionText.includes("名字")) {
      zhVocab = "• 你 (nǐ): Bạn, Anh, Chị\n• 叫 (jiào): Gọi là\n• 什么 (shénme): Cái gì\n• 名字 (míngzi): Tên";
    } else if (questionText.includes("国") || questionText.includes("人")) {
      zhVocab = "• 是 (shì): Là\n• 哪 (nǎ): Nào\n• 国 (guó): Nước, quốc gia\n• 人 (rén): Người";
    } else if (questionText.includes("岁") || questionText.includes("多大")) {
      zhVocab = "• 多大 (duōdà): Bao nhiêu tuổi\n• 岁 (suì): Tuổi\n• 几 (jǐ): Mấy";
    } else {
      zhVocab = `• ${questionText} (Học mẫu câu giao tiếp tiếng Trung)`;
    }

    let zhGrammar = "";
    if (questionText.includes("什么")) {
      zhGrammar = "Chủ ngữ + Verb + 什么 + Noun?\n(Cấu trúc câu hỏi 'cái gì' phổ biến)\nExample: 你吃什么？ (Bạn ăn cái gì?)";
    } else if (questionText.includes("是")) {
      zhGrammar = "Chủ ngữ + 是 + Noun\n(Cấu trúc khẳng định: Ai đó/Cái gì là cái gì)\nExample: 我是学生。 (Tôi là học sinh.)";
    } else {
      zhGrammar = "Chủ ngữ + 怎么样？\n(Hỏi về tính chất, tình trạng của sự việc)\nExample: 今天天气怎么样？ (Thời tiết hôm nay thế nào?)";
    }

    return {
      vocab: zhVocab,
      grammar: zhGrammar,
      question: `Translate to Chinese: "${questionText}"`,
      answer: answerText
    };
  }

  return {
    vocab: rawVocab || "Study vocabulary",
    grammar: rawGrammar || "Practice grammar structure",
    question: "Complete the exercise",
    answer: "Show your answer"
  };
}

// ─── Main UserApp ─────────────────────────────────────────────────────────────
export default function UserApp({ user, onLogout }) {
  const [active,      setActive]      = useState('home')
  const [learnLang,   setLearnLang]   = useState('EN')
  const [learnLesson, setLearnLesson] = useState(null)
  
  const [dataLoaded, setDataLoaded] = useState(false)

  const [xp, setXp] = useState(() => {
    try { return parseInt(localStorage.getItem('lucy_xp') || '0') } catch { return 0 }
  })
  const [streak, setStreak] = useState(() => {
    try { return parseInt(localStorage.getItem('lucy_streak') || '1') } catch { return 1 }
  })
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lucy_completed') || '{"EN":[],"ZH":[],"JA":[]}') }
    catch { return { EN: [], ZH: [], JA: [] } }
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchLang = async (dbLangCode) => {
          const res = await fetch(`${API_BASE}/api/lessons?lang=${dbLangCode}`)
          const data = await res.json()
          const langEmojis = { LISA: '🇬🇧', ZH: '🇨🇳', JA: '🇯🇵' }
          return data.map((l, idx) => {
            // Enrich lesson data using rules or mappings
            const enriched = enrichLesson(l.title, dbLangCode, l.vocab, l.grammar);
            
            const vocabLines = (enriched.vocab || '').split('\n').filter(s => s.trim())
            const firstVocab = vocabLines[0] || l.title || 'Practice'
            const question = enriched.question || l.question || `Translate or explain: "${firstVocab}"`
            const answer = enriched.answer || l.answer || `Practice using: ${firstVocab}`
            const vi = l.vi || l.stage || ''
            
            return {
              id: dbLangCode.toLowerCase() + (idx + 1),
              level: idx + 1,
              title: l.title,
              stage: l.stage,
              vocab: enriched.vocab,
              grammar: enriched.grammar,
              question,
              answer,
              vi,
              emoji: langEmojis[dbLangCode] || '📖'
            }
          })
        }

        const [en, zh, ja] = await Promise.all([
          fetchLang('LISA'), // API dùng LISA cho tiếng Anh
          fetchLang('ZH'),
          fetchLang('JA')
        ])

        LESSONS['EN'] = en
        LESSONS['ZH'] = zh
        LESSONS['JA'] = ja

        // Fetch user progress from backend
        if (user && user.id) {
          try {
            const resProgress = await fetch(`${API_BASE}/api/progress?userId=${user.id}`)
            if (resProgress.ok) {
              const progressData = await resProgress.json()
              setXp(progressData.totalXp)
              localStorage.setItem('lucy_xp', String(progressData.totalXp))

              const newCompleted = { EN: [], ZH: [], JA: [] }
              if (progressData.progressList) {
                progressData.progressList.forEach(item => {
                  const langKey = item.langCode === 'LISA' ? 'EN' : item.langCode;
                  const lessonId = item.langCode.toLowerCase() + item.levelNum;
                  if (newCompleted[langKey]) {
                    newCompleted[langKey].push(lessonId);
                  }
                })
              }
              setCompleted(newCompleted)
              localStorage.setItem('lucy_completed', JSON.stringify(newCompleted))
            }
          } catch (errProgress) {
            console.error("Lỗi khi tải tiến trình từ Backend, sử dụng local storage fallback:", errProgress)
          }
        }

        setDataLoaded(true)
      } catch (e) {
        console.error("Lỗi khi fetch API, Backend có thể chưa bật:", e)
        setDataLoaded(true)
      }
    }
    fetchData()
  }, [user])

  if (!dataLoaded) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#3b82f6', fontSize: 20, fontWeight: 'bold' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '4px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Connecting to server to load lessons...
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const handleComplete = async (lang, lessonId) => {
    if ((completed[lang] || []).includes(lessonId)) return
    const newCompleted = { ...completed, [lang]: [...(completed[lang] || []), lessonId] }
    const newXp = xp + XP_PER_LESSON
    const newStreak = streak + 1
    
    setCompleted(newCompleted)
    setXp(newXp)
    setStreak(newStreak)
    localStorage.setItem('lucy_completed', JSON.stringify(newCompleted))
    localStorage.setItem('lucy_xp', String(newXp))
    localStorage.setItem('lucy_streak', String(newStreak))

    // Sync to Backend
    if (user && user.id) {
      try {
        const levelNum = parseInt(lessonId.replace(/\D+/g, '')) || 1;
        await fetch(`${API_BASE}/api/progress/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            languageCode: lang === 'EN' ? 'LISA' : lang,
            lessonId: lessonId,
            levelNum: levelNum,
            xp: XP_PER_LESSON
          })
        })
      } catch (err) {
        console.error("Failed to sync lesson progress to backend:", err)
      }
    }
  }

  const handleRedeem = async (cost, giftName) => {
    if (user && user.id) {
      try {
        const res = await fetch(`${API_BASE}/api/progress/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            xpDelta: -cost,
            reason: 'redeem_' + giftName.toLowerCase().replace(/\s+/g, '_')
          })
        });
        
        if (res.ok) {
          const newXp = Math.max(0, xp - cost);
          setXp(newXp);
          localStorage.setItem('lucy_xp', String(newXp));
          alert(`Gift ${giftName} redeemed successfully. ${cost} XP deducted.`);
        } else {
          const errData = await res.json();
          alert(`Redeem failed: ${errData.error || 'Unknown server error'}`);
        }
      } catch (err) {
        console.error("Lỗi khi đồng bộ trừ XP lên Server, lưu tạm offline:", err);
        const newXp = Math.max(0, xp - cost);
        setXp(newXp);
        localStorage.setItem('lucy_xp', String(newXp));
        alert(`[Offline Mode] Gift ${giftName} redeemed locally. ${cost} XP deducted.`);
      }
    } else {
      const newXp = Math.max(0, xp - cost);
      setXp(newXp);
      localStorage.setItem('lucy_xp', String(newXp));
      alert(`[Guest Mode] Gift ${giftName} redeemed. ${cost} XP deducted.`);
    }
  }

  const renderView = () => {
    switch (active) {
      case 'home':      return <HomeView user={user} xp={xp} streak={streak} completed={completed} setActive={setActive} setLearnLang={setLearnLang} />
      case 'explore':   return <ExploreView completed={completed} setActive={setActive} setLearnLang={setLearnLang} setLearnLesson={setLearnLesson} />
      case 'learn':     return <LearnView learnLang={learnLang} setLearnLang={setLearnLang} learnLesson={learnLesson} setLearnLesson={setLearnLesson} completed={completed} onComplete={handleComplete} />
      case 'live':      return <LiveView />
      case 'podcasts':  return <PodcastsView />
      case 'premium':   return <PremiumView user={user} setActive={setActive} setLearnLang={setLearnLang} />
      case 'gifts':     return <GiftsView xp={xp} onRedeem={handleRedeem} />
      case 'progress':  return <ProgressView xp={xp} streak={streak} completed={completed} />
      case 'coach':     return <CoachView user={user} />
      case 'templates': return <AITemplatesView />
      case 'questions': return <AIQuestionsView />
      case 'profile':   return <ProfileView user={user} xp={xp} streak={streak} completed={completed} onLogout={onLogout} />
      default:          return <HomeView user={user} xp={xp} streak={streak} completed={completed} setActive={setActive} setLearnLang={setLearnLang} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 14, color: '#0f172a', overflow: 'hidden' }}>
      <Navbar active={active} setActive={setActive} user={user} xp={xp} streak={streak} onLogout={onLogout} />
      <main style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
        <ErrorBoundary>
          {renderView()}
        </ErrorBoundary>
      </main>
    </div>
  )
}
