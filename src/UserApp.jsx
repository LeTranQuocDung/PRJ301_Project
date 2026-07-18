import { useState, useEffect, useRef } from 'react'
import { agoraService } from './services/agoraClient'
import { LayoutDashboard, BookOpen, FileText, TrendingUp, Mic, Zap, MessageSquare, Users, Volume2, Radio, Phone, PhoneOff, AlertCircle, Bot } from 'lucide-react'

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
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.08em', fontWeight: 600, marginTop: 4 }}>STUDENT PORTAL</div>
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
  
  // Audio Player state
  const [activePod, setActivePod] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [timeStr, setTimeStr] = useState("00:00 / 00:00")
  const audioRef = useRef(null)

  // Map language to mock audio URL
  const getAudioUrl = (lang) => {
    if (lang === 'Chinese') return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
    if (lang === 'Japanese') return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }

  useEffect(() => {
    async function loadPods() {
      try {
        const res = await fetch(`${API_BASE}/api/engagement/podcasts`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setPods(data)
      } catch (err) {
        setError('Failed to load podcasts. Please try again.')
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
    if (activePod && activePod.title === p.title) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play().catch(e => console.warn(e))
        setIsPlaying(true)
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      const newAudio = new Audio(getAudioUrl(p.lang))
      audioRef.current = newAudio
      setActivePod(p)
      setIsPlaying(true)
      setProgress(0)

      newAudio.addEventListener('timeupdate', () => {
        if (!audioRef.current) return;
        const cur = newAudio.currentTime
        const dur = newAudio.duration || 0
        if (dur > 0) {
          setProgress((cur / dur) * 100)
          setTimeStr(`${formatTime(cur)} / ${formatTime(dur)}`)
        }
      })

      newAudio.addEventListener('ended', () => {
        setIsPlaying(false)
        setProgress(0)
      })

      newAudio.play().catch(e => {
        console.warn("Failed to play audio:", e)
        // Auto fallback if soundhelix is blocked or rate limited
        setIsPlaying(true)
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
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>{(p.episodes || p.ep) || 10} episodes - {p.subs || 100} subscribers</div>
            <button 
              onClick={() => handlePlayPod(p)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: activePod?.title === p.title && isPlaying 
                  ? 'linear-gradient(135deg,#ef4444,#f59e0b)' 
                  : 'linear-gradient(135deg,#4f46e5,#7c3aed)', 
                color: '#fff', border: 'none',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
            >
              {activePod?.title === p.title && isPlaying ? '⏸ Pause Podcast' : '▶ Listen Now'}
            </button>
          </div>
        ))}
      </div>

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
              audioRef.current.currentTime = clickPercent * audioRef.current.duration;
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
function PremiumView({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [balance, setBalance] = useState(0)
  const [currency, setCurrency] = useState('VND')
  const [topupLoading, setTopupLoading] = useState(false)

  useEffect(() => {
    async function loadPremium() {
      try {
        const res = await fetch(`${API_BASE}/api/engagement/premium`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setItems(data)
      } catch (err) {
        setError('Failed to load Premium benefits.')
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
          setBalance(data.balance)
          setCurrency(data.currency || 'VND')
        }
      } catch (err) {
        console.error("Failed to load wallet balance:", err)
      }
    }
    loadBalance()
  }, [user])

  const handleTopup = async () => {
    setTopupLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 1,
          amount: 100000,
          method: 'demo_vnpay_sandbox'
        })
      })
      if (res.ok) {
        const data = await res.json()
        setBalance(data.newBalance)
        alert(`Sandbox Top-up successful! New Balance: ${data.newBalance} ${currency}`)
      } else {
        alert("Top-up failed")
      }
    } catch (err) {
      alert("Top-up request connection error")
    } finally {
      setTopupLoading(false)
    }
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
      <div style={{ width: 30, height: 30, border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
      <div>Loading Premium perks...</div>
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
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit',sans-serif", margin: '0 0 4px' }}>Lucy Premium</h1>
      <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px' }}>Unlock exclusive advanced courses and features</p>

      {/* Wallet Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Wallet Balance</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit',sans-serif", marginTop: 4 }}>
            {balance.toLocaleString()} {currency}
          </div>
        </div>
        <button onClick={handleTopup} disabled={topupLoading} style={{
          padding: '10px 18px', borderRadius: 10,
          background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
        }}>
          {topupLoading ? 'Processing...' : 'Sandbox Top Up (+100k)'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
            padding: '20px', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, background: '#f59e0b', color: '#fff', fontSize: 9, fontWeight: 800, padding: '4px 10px', borderBottomLeftRadius: 10, letterSpacing: '0.05em' }}>PREMIUM</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>{{ GB: 'GB', CN: 'CN', JP: 'JP' }[item.langCode] || item.langCode || 'Premium'}</div>
            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 14px', fontFamily: "'Outfit',sans-serif", paddingRight: 40 }}>{item.title}</h3>
            <button style={{
              width: '100%', padding: '10px 0', borderRadius: 10,
              background: '#0f172a', color: '#fff', border: 'none',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}>Unlock Plan</button>
          </div>
        ))}
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
        setError('Failed to load gift items.')
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
            // Generate question/answer from vocab content if not provided
            const vocabLines = (l.vocab || '').split('\n').filter(s => s.trim())
            const firstVocab = vocabLines[0] || l.title || 'Practice'
            const question = l.question || `Translate or explain: "${firstVocab}"`
            const answer = l.answer || (l.grammar ? l.grammar.split('\n')[0] : `Practice using: ${firstVocab}`)
            const vi = l.vi || l.stage || ''
            return {
              id: dbLangCode.toLowerCase() + (idx + 1),
              level: idx + 1,
              title: l.title,
              stage: l.stage,
              vocab: l.vocab,
              grammar: l.grammar || 'Review the vocabulary and create your own sentences.',
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
      case 'premium':   return <PremiumView user={user} />
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
        {renderView()}
      </main>
    </div>
  )
}
