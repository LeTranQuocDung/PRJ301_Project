import { useEffect, useRef, useState, useCallback } from 'react'
import { AlertCircle, Check, Copy, MessageSquare, Mic, PhoneOff, Pin, Send, Square, Users, Volume2, Hand, Gift, Sparkles, ChevronRight, Clock, Layers } from 'lucide-react'
import { agoraService } from './services/agoraClient'

const API_BASE = import.meta.env.VITE_LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI'
const TOKEN_BASE = import.meta.env.VITE_AGORA_TOKEN_BASE || 'http://localhost:3000'
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || ''

// ─── Avatar Persona Generator ────────────────────────────────────────────────
const AVATAR_ANIMALS = ['🦊','🐋','🦁','🐯','🦋','🐧','🦄','🐉','🦅','🦓','🐺','🦝','🦚','🐙','🦈']
const AVATAR_COLORS  = ['Amber','Azure','Coral','Ember','Forest','Golden','Indigo','Jade','Lunar','Nova','Onyx','Pearl','Ruby','Sage','Teal']

function generatePersona(seed) {
  const h = Math.abs([...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 7))
  const animal = AVATAR_ANIMALS[h % AVATAR_ANIMALS.length]
  const color  = AVATAR_COLORS[(h >> 4) % AVATAR_COLORS.length]
  return `LUCY-${animal} ${color}`
}

// ─── Virtual Gift types ───────────────────────────────────────────────────────
const GIFTS = [
  { id:'star',    emoji:'⭐', label:'Star',    color:'#f59e0b' },
  { id:'diamond', emoji:'💎', label:'Diamond', color:'#06b6d4' },
  { id:'fire',    emoji:'🔥', label:'Fire',    color:'#ef4444' },
  { id:'party',   emoji:'🎉', label:'Party',   color:'#8b5cf6' },
  { id:'heart',   emoji:'❤️', label:'Love',    color:'#ec4899' },
]

const randomRoomId = () => Math.random().toString(36).slice(2, 8).toUpperCase()

// ─── Sub-level calculation helpers ───────────────────────────────────────────
function computeSubLevels(durationMin, subLevelDuration) {
  const count = Math.floor(durationMin / subLevelDuration)
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    label: `Chặng ${i + 1}`,
    startMin: i * subLevelDuration,
    endMin: (i + 1) * subLevelDuration,
  }))
}

function getElapsedMin(startedAt) {
  if (!startedAt) return 0
  const diff = Date.now() - new Date(startedAt).getTime()
  return diff / 60000
}

function getCurrentSubLevel(subLevels, elapsedMin) {
  for (let i = subLevels.length - 1; i >= 0; i--) {
    if (elapsedMin >= subLevels[i].startMin) return i
  }
  return 0
}

const STAGE_LABELS = {
  beginner:     { label: 'Sơ cấp',   color: '#10b981', bg: '#ecfdf5', emoji: '🌱' },
  intermediate: { label: 'Trung cấp', color: '#f59e0b', bg: '#fffbeb', emoji: '🌿' },
  advanced:     { label: 'Cao cấp',  color: '#6366f1', bg: '#eef2ff', emoji: '🌳' },
}

export default function LiveRoomView({ canRecord = false, userRole = 'lucy', userName = '' }) {
  const [roomInput, setRoomInput] = useState('')
  const [newRoomPublic, setNewRoomPublic] = useState(true)
  const [newRoomStage, setNewRoomStage] = useState('beginner')
  const [newRoomDuration, setNewRoomDuration] = useState(60)
  const [newRoomSubLevel, setNewRoomSubLevel] = useState(15)
  const [publicRooms, setPublicRooms] = useState([])
  const [room, setRoom] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(false)
  const [remotes, setRemotes] = useState([])
  const [message, setMessage] = useState('')
  const [lessons, setLessons] = useState([])
  const [lessonId, setLessonId] = useState('')
  const [copied, setCopied] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordBusy, setRecordBusy] = useState(false)

  // Avatar Persona — derive from userName prop or random seed
  const [persona] = useState(() => {
    if (userRole === 'lucy') {
      const seed = userName || `anon-${Math.random().toString(36).slice(2, 8)}`
      return generatePersona(seed)
    }
    return userName || `User-${Math.floor(Math.random() * 9000 + 1000)}`
  })
  const [uid] = useState(() => Math.floor(Math.random() * 90000 + 10000))
  const name = persona // use persona as display name in room

  const messagesEnd = useRef(null)
  const recorderRef = useRef(null)
  const recordStreamRef = useRef(null)
  const chunksRef = useRef([])
  const recordStartedRef = useRef(null)
  const recordSessionRef = useRef(null)

  // ─── Raise Hand ────────────────────────────────────────────────────────────
  const [handRaised, setHandRaised] = useState(false)

  // ─── Gift animation ─────────────────────────────────────────────────────────
  const [floatingGifts, setFloatingGifts] = useState([])
  const [showGiftPicker, setShowGiftPicker] = useState(false)

  // ─── AI Suggestions ─────────────────────────────────────────────────────────
  const [aiQuestions, setAiQuestions] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // ─── Countdown timer state ──────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0)   // minutes elapsed

  // ─── Schedules ─────────────────────────────────────────────────────────────
  const [schedules, setSchedules] = useState(() => {
    try {
      const stored = localStorage.getItem('lucy_scheduled_rooms')
      if (stored) return JSON.parse(stored)
    } catch {}
    return [
      { id: 1, topic: 'English Speaking Practice - Stage 1', time: new Date(Date.now() + 24*3600*1000).toISOString().slice(0, 16), lang: 'EN', mentor: 'Sarah Jenkins' },
      { id: 2, topic: 'Chinese Tones & Pinyin Drill', time: new Date(Date.now() + 48*3600*1000).toISOString().slice(0, 16), lang: 'ZH', mentor: 'Mr. Wang' }
    ]
  })
  const [schedTopic, setSchedTopic] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [schedLang, setSchedLang] = useState('EN')

  useEffect(() => { localStorage.setItem('lucy_scheduled_rooms', JSON.stringify(schedules)) }, [schedules])

  const handleScheduleRoom = (e) => {
    e.preventDefault()
    if (!schedTopic.trim() || !schedTime) return
    setSchedules(prev => [...prev, { id: Date.now(), topic: schedTopic.trim(), time: schedTime, lang: schedLang, mentor: canRecord ? 'Mentor' : 'Host' }])
    setSchedTopic(''); setSchedTime('')
  }
  const handleDeleteSchedule = (id) => {
    if (!window.confirm('Delete this scheduled room?')) return
    setSchedules(prev => prev.filter(x => x.id !== id))
  }

  // ─── API helper ─────────────────────────────────────────────────────────────
  const request = async (path, options) => {
    const res = await fetch(`${API_BASE}${path}`, options)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/lessons`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setLessons(Array.isArray(data) ? data : []))
      .catch(() => setLessons([]))
    return () => {
      agoraService.leaveRoom().catch(() => {})
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      recordStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Poll room state every second
  useEffect(() => {
    if (!room?.id) return
    const timer = setInterval(async () => {
      try {
        const latest = await request(`/api/rooms/${room.id}`)
        setRoom(latest)
        if (latest.startedAt) setElapsed(getElapsedMin(latest.startedAt))
        // Sync our hand state
        const myHand = (latest.raisedHands || []).some(h => h.name === name)
        setHandRaised(myHand)
        // Show incoming gifts as floating animations
        const newGifts = (latest.recentGifts || []).filter(g => g.from !== name)
        setFloatingGifts(prev => {
          const existIds = new Set(prev.map(g => g.id))
          const incoming = newGifts.filter(g => !existIds.has(g.id)).slice(-3)
          return [...prev, ...incoming].slice(-6)
        })
      } catch (e) {
        if (e.message === 'Room not found') {
          await agoraService.leaveRoom().catch(() => {})
          setRoom(null); setRemotes([]); setError('The room was closed because the room owner left.')
        }
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [room?.id, name])

  // Expire floating gifts after 3.5s
  useEffect(() => {
    if (floatingGifts.length === 0) return
    const t = setTimeout(() => setFloatingGifts([]), 3500)
    return () => clearTimeout(t)
  }, [floatingGifts])

  // Page hide / leave beacon
  useEffect(() => {
    if (!room?.id) return
    const leaveUrl = `${API_BASE}/api/rooms/${room.id}/leave`
    const leavePayload = JSON.stringify({ name })
    const handlePageHide = () => {
      if (navigator.sendBeacon) navigator.sendBeacon(leaveUrl, new Blob([leavePayload], { type:'application/json; charset=UTF-8' }))
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      fetch(leaveUrl, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body:leavePayload, keepalive:true }).catch(() => {})
      agoraService.leaveRoom().catch(() => {})
    }
  }, [room?.id, name])

  // Poll public rooms
  useEffect(() => {
    if (room) return
    let active = true
    const load = () => request('/api/rooms')
      .then(data => { if (active) setPublicRooms(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) setPublicRooms([]) })
    load()
    const timer = setInterval(load, 2000)
    return () => { active = false; clearInterval(timer) }
  }, [room?.id])

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior:'smooth' }) }, [room?.messages?.length])

  // ─── Audio ──────────────────────────────────────────────────────────────────
  const connectAudio = async roomId => {
    await agoraService.init(APP_ID)
    agoraService.onUserPublished(user => setRemotes(old => old.some(x => x.uid === user.uid) ? old : [...old, { uid:user.uid }]))
    agoraService.onUserUnpublished(user => setRemotes(old => old.filter(x => x.uid !== user.uid)))
    if (!APP_ID) return
    const tokenRes = await fetch(`${TOKEN_BASE}/api/agora/token?channelName=${roomId}&uid=${uid}`)
    const tokenData = await tokenRes.json()
    if (!tokenData.token) throw new Error('Agora token is unavailable')
    await agoraService.joinRoom(APP_ID, roomId, tokenData.token, uid)
    await agoraService.publishAudio()
  }

  // ─── Room actions ────────────────────────────────────────────────────────────
  const enterRoom = async (roomId, create) => {
    const cleanId = roomId.trim().toUpperCase()
    if (cleanId.length < 4) { setError('Room ID must contain at least 4 characters'); return }
    setBusy(true); setError('')
    try {
      const body = create
        ? { roomId: cleanId, name, isPublic: newRoomPublic, stage: newRoomStage, durationMin: newRoomDuration, subLevelDuration: newRoomSubLevel }
        : { name }
      const state = create
        ? await request('/api/rooms', { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify(body) })
        : await request(`/api/rooms/${cleanId}/join`, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify(body) })
      setRoom(state)
      await connectAudio(cleanId)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const createRoom = () => enterRoom(randomRoomId(), true)

  const leaveRoom = async () => {
    try { await request(`/api/rooms/${room.id}/leave`, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify({ name }) }) } catch {}
    await agoraService.leaveRoom()
    setRoom(null); setRemotes([]); setMuted(false); setHandRaised(false); setAiQuestions([])
  }

  const sendMessage = async e => {
    e.preventDefault()
    const text = message.trim()
    if (!text) return
    setMessage('')
    try {
      const latest = await request(`/api/rooms/${room.id}/message`, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify({ name, text }) })
      setRoom(latest)
    } catch (e) { setError(e.message) }
  }

  const pinLesson = async () => {
    const lesson = lessons.find(item => String(item.id) === String(lessonId))
    if (!lesson) return
    const latest = await request(`/api/rooms/${room.id}/pin`, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify({ name, lesson }) })
    setRoom(latest)
  }

  const unpinLesson = async () => {
    const latest = await request(`/api/rooms/${room.id}/unpin`, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify({ name }) })
    setRoom(latest)
  }

  const togglePrivacy = async () => {
    try {
      const latest = await request(`/api/rooms/${room.id}/privacy`, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify({ name, isPublic: !room.isPublic }) })
      setRoom(latest)
    } catch (e) { setError(e.message) }
  }

  const copyRoomId = async () => {
    try { await navigator.clipboard.writeText(room.id); setCopied(true); setTimeout(() => setCopied(false), 1800) }
    catch { setError('Could not copy the room ID') }
  }

  // ─── Raise Hand ─────────────────────────────────────────────────────────────
  const toggleHand = async () => {
    try {
      const latest = await request(`/api/rooms/${room.id}/raise-hand`, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify({ name }) })
      setRoom(latest)
      setHandRaised(!handRaised)
    } catch (e) { setError(e.message) }
  }

  const clearHands = async () => {
    try {
      const latest = await request(`/api/rooms/${room.id}/clear-hands`, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify({ name }) })
      setRoom(latest)
    } catch (e) { setError(e.message) }
  }

  // ─── Virtual Gift ────────────────────────────────────────────────────────────
  const sendGift = async (giftType) => {
    setShowGiftPicker(false)
    try {
      await request(`/api/rooms/${room.id}/gift`, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body: JSON.stringify({ name, giftType }) })
      // Show local animation too
      setFloatingGifts(prev => [...prev, { id: Date.now(), from: name, giftType, own: true }].slice(-6))
    } catch (e) { setError(e.message) }
  }

  // ─── AI Discussion Suggestions ───────────────────────────────────────────────
  const fetchAiSuggestions = async () => {
    setAiLoading(true); setAiError(''); setAiQuestions([])
    try {
      const pl = {
        lessonTitle: room.pinnedLesson?.title || '',
        lessonContent: room.pinnedLesson?.vocab || room.pinnedLesson?.stage || '',
        stage: room.stage || 'beginner',
        language: room.pinnedLesson?.langCode || 'EN',
      }
      const res = await fetch(`${API_BASE}/api/agent/suggest-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pl),
      })
      const data = await res.json()
      if (Array.isArray(data.questions) && data.questions.length) {
        setAiQuestions(data.questions)
      } else {
        setAiError('No questions returned. Check your API key or try again.')
      }
    } catch {
      setAiError('Could not reach AI service. Using offline suggestions.')
    }
    setAiLoading(false)
  }

  // ─── Recording ───────────────────────────────────────────────────────────────
  const toggleRecording = async () => {
    setRecordBusy(true); setError('')
    if (!recording) {
      try {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Browser recording is not supported')
        const stream = await navigator.mediaDevices.getUserMedia({ audio:true })
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
        const recorder = new MediaRecorder(stream, { mimeType })
        chunksRef.current = []
        recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data) }
        recorder.start(1000)
        recorderRef.current = recorder
        recordStreamRef.current = stream
        const sessionData = await request('/api/podcasts/record/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roomId:room.id, creatorId:1, title:`Live Room ${room.id}` }) })
        recordStartedRef.current = Date.now()
        recordSessionRef.current = sessionData.sessionId
        setRecording(true)
      } catch (e) {
        recorderRef.current?.stop()
        recordStreamRef.current?.getTracks().forEach(t => t.stop())
        setError(`Could not start recording: ${e.message}`)
      }
    } else {
      try {
        const recorder = recorderRef.current
        const blob = await new Promise(resolve => {
          recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }))
          recorder.stop()
        })
        recordStreamRef.current?.getTracks().forEach(t => t.stop())
        await request('/api/podcasts/record/stop', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId: recordSessionRef.current }) })
        const seconds = Math.max(1, Math.round((Date.now() - recordStartedRef.current) / 1000))
        const form = new FormData()
        form.append('audio', blob, `room-${room.id}-${Date.now()}.webm`)
        form.append('title', `Live Room ${room.id}`)
        form.append('roomId', room.id)
        form.append('duration', `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`)
        const upload = await fetch(`${API_BASE}/api/podcasts/record/upload`, { method:'POST', body: form })
        if (!upload.ok) {
          const err = await upload.json().catch(() => ({}))
          throw new Error(err.error || `Upload failed (HTTP ${upload.status})`)
        }
        setRecording(false); recorderRef.current = null; recordStreamRef.current = null; recordSessionRef.current = null
      } catch (e) { setError(`Could not save recording: ${e.message}`) }
    }
    setRecordBusy(false)
  }

  // ─── Lobby Screen ────────────────────────────────────────────────────────────
  if (!room) return (
    <div className="fade-up" style={{ padding: 28, maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 5px', fontSize: 24, color: '#0f172a', fontFamily:"'Outfit',sans-serif", fontWeight: 800 }}>Live Audio Rooms</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 13.5 }}>Join active rooms or schedule future collaborative voice sessions.</p>
        {userRole === 'lucy' && (
          <div style={{ marginTop: 10, display:'inline-flex', alignItems:'center', gap:8, padding:'6px 12px', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:20, fontSize:12, color:'#4338ca', fontWeight:700 }}>
            🎭 You appear as: <strong>{name}</strong> (anonymous persona)
          </div>
        )}
      </div>

      {error && <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c', display:'flex', gap:6, alignItems:'center', fontSize:13 }}><AlertCircle size={14}/> {error}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:20 }}>

        {/* Left: Create/Join + Public Rooms */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Create Room */}
            <div style={{ padding:22, border:'1px solid #e2e8f0', borderRadius:16, background:'#fff', boxShadow:'0 4px 12px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin:'0 0 12px', fontSize:15, fontWeight:800, color:'#1e293b' }}>🎙️ Create Room</h3>

              {/* Public / Private */}
              <div style={{ display:'flex', gap:7, marginBottom:10 }}>
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setNewRoomPublic(v)}
                    style={{ flex:1, padding:'7px 6px', border:`1.5px solid ${newRoomPublic===v?'#6366f1':'#e2e8f0'}`, borderRadius:8, background:newRoomPublic===v?'#eef2ff':'#fff', color:newRoomPublic===v?'#4338ca':'#64748b', fontWeight:700, cursor:'pointer', fontSize:12 }}>
                    {v ? 'Public' : 'Private'}
                  </button>
                ))}
              </div>

              {/* Stage Selector */}
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', marginBottom:4 }}>CẤPĐỘ</label>
              <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                {Object.entries(STAGE_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => setNewRoomStage(k)}
                    style={{ flex:1, padding:'6px 4px', border:`1.5px solid ${newRoomStage===k?v.color:'#e2e8f0'}`, borderRadius:8, background:newRoomStage===k?v.bg:'#fff', color:newRoomStage===k?v.color:'#64748b', fontWeight:700, cursor:'pointer', fontSize:10.5, display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                    <span>{v.emoji}</span><span>{v.label}</span>
                  </button>
                ))}
              </div>

              {/* Duration */}
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', marginBottom:4 }}>THỜI LƯỢNG</label>
              <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                {[60, 90, 120].map(d => (
                  <button key={d} onClick={() => setNewRoomDuration(d)}
                    style={{ flex:1, padding:'6px 4px', border:`1.5px solid ${newRoomDuration===d?'#6366f1':'#e2e8f0'}`, borderRadius:8, background:newRoomDuration===d?'#eef2ff':'#fff', color:newRoomDuration===d?'#4338ca':'#64748b', fontWeight:700, cursor:'pointer', fontSize:11 }}>
                    {d} phút
                  </button>
                ))}
              </div>

              {/* Sub-level */}
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', marginBottom:4 }}>MỖI CHẶNG</label>
              <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                {[10, 15, 20].map(d => (
                  <button key={d} onClick={() => setNewRoomSubLevel(d)}
                    style={{ flex:1, padding:'6px 4px', border:`1.5px solid ${newRoomSubLevel===d?'#6366f1':'#e2e8f0'}`, borderRadius:8, background:newRoomSubLevel===d?'#eef2ff':'#fff', color:newRoomSubLevel===d?'#4338ca':'#64748b', fontWeight:700, cursor:'pointer', fontSize:11 }}>
                    {d} phút
                  </button>
                ))}
              </div>

              <button disabled={busy} onClick={createRoom} style={primaryButton}>{busy ? 'Creating...' : 'Create Room'}</button>
            </div>

            {/* Join by ID */}
            <div style={{ padding:22, border:'1px solid #e2e8f0', borderRadius:16, background:'#fff', boxShadow:'0 4px 12px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin:'0 0 12px', fontSize:15, fontWeight:800, color:'#1e293b' }}>🔑 Join by Room ID</h3>
              <input value={roomInput} onChange={e => setRoomInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && enterRoom(roomInput, false)}
                placeholder="Enter room ID..." maxLength={12}
                style={{ width:'100%', boxSizing:'border-box', padding:11, border:'1px solid #cbd5e1', borderRadius:9, marginBottom:10, textTransform:'uppercase', fontSize:13 }}/>
              <button disabled={busy} onClick={() => enterRoom(roomInput, false)} style={primaryButton}>{busy ? 'Connecting...' : 'Join Room'}</button>
            </div>
          </div>

          {/* Active Rooms */}
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, margin:'0 0 6px', color:'#0f172a' }}>🟢 Active Voice Rooms</h2>
            <p style={{ margin:'0 0 12px', fontSize:12.5, color:'#64748b' }}>Connect directly to any open public session.</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
              {publicRooms.map(pr => {
                const stageInfo = STAGE_LABELS[pr.stage] || STAGE_LABELS.beginner
                return (
                  <div key={pr.id} style={{ padding:14, border:'1px solid #e2e8f0', borderRadius:12, background:'#fff', boxShadow:'0 2px 6px rgba(0,0,0,0.01)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:6 }}>
                      <div style={{ fontWeight:800, color:'#4f46e5', fontSize:14 }}>{pr.id}</div>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:stageInfo.bg, color:stageInfo.color }}>{stageInfo.emoji} {stageInfo.label}</span>
                    </div>
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>Host: {pr.creator} · {pr.memberCount || 0} online · {pr.durationMin || 60}phút</div>
                    <button disabled={busy} onClick={() => enterRoom(pr.id, false)} style={{ ...smallButton, color:'#4f46e5', fontWeight:800, width:'100%' }}>Join</button>
                  </div>
                )
              })}
              {publicRooms.length === 0 && (
                <div style={{ gridColumn:'1/-1', padding:24, textAlign:'center', border:'1px dashed #cbd5e1', borderRadius:12, color:'#94a3b8', fontSize:13 }}>
                  No active public rooms right now. Create one to get started!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Schedules */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ padding:22, border:'1px solid #e2e8f0', borderRadius:16, background:'#fff', boxShadow:'0 4px 12px rgba(0,0,0,0.01)' }}>
            <h3 style={{ margin:'0 0 6px', fontSize:15, fontWeight:800, color:'#1e293b' }}>📅 Scheduled Live Rooms</h3>
            <p style={{ margin:'0 0 16px', color:'#64748b', fontSize:12 }}>Check upcoming speaker events and practice sessions.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:300, overflowY:'auto' }}>
              {schedules.map(sched => (
                <div key={sched.id} style={{ padding:12, border:'1px solid #f1f5f9', borderRadius:10, background:'#f8fafc', position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:6 }}>
                    <span style={{ fontSize:11, fontWeight:800, background:sched.lang==='EN'?'#eff6ff':(sched.lang==='ZH'?'#fef2f2':'#fdf2f8'), color:sched.lang==='EN'?'#2563eb':(sched.lang==='ZH'?'#dc2626':'#db2777'), padding:'2px 8px', borderRadius:20 }}>
                      {sched.lang==='EN'?'🇬🇧 English':(sched.lang==='ZH'?'🇨🇳 Chinese':'🇯🇵 Japanese')}
                    </span>
                    <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{sched.time.replace('T',' ')}</span>
                  </div>
                  <div style={{ fontWeight:700, fontSize:13, color:'#1e293b', paddingRight:24 }}>{sched.topic}</div>
                  <div style={{ fontSize:11.5, color:'#64748b', marginTop:4 }}>Host: {sched.mentor}</div>
                  {canRecord && (
                    <button onClick={() => handleDeleteSchedule(sched.id)}
                      style={{ position:'absolute', right:10, bottom:10, background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', padding:4 }}>🗑️</button>
                  )}
                </div>
              ))}
              {schedules.length === 0 && (
                <div style={{ padding:24, textAlign:'center', border:'1px dashed #cbd5e1', borderRadius:10, color:'#94a3b8', fontSize:12.5 }}>No sessions scheduled yet.</div>
              )}
            </div>
          </div>

          {canRecord && (
            <div style={{ padding:22, border:'1.5px solid #818cf8', borderRadius:16, background:'#fff', boxShadow:'0 4px 12px rgba(129,140,248,0.1)' }}>
              <h3 style={{ margin:'0 0 12px', fontSize:15, fontWeight:800, color:'#1e293b', display:'flex', alignItems:'center', gap:6 }}>🕒 Schedule New Session</h3>
              <form onSubmit={handleScheduleRoom} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'#475569', marginBottom:4 }}>TOPIC NAME</label>
                  <input type="text" value={schedTopic} onChange={e => setSchedTopic(e.target.value)} placeholder="e.g. Daily English Conversations..."
                    style={{ width:'100%', boxSizing:'border-box', padding:9, borderRadius:8, border:'1px solid #cbd5e1', fontSize:13 }} required/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'#475569', marginBottom:4 }}>DATE & TIME</label>
                    <input type="datetime-local" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                      style={{ width:'100%', boxSizing:'border-box', padding:8, borderRadius:8, border:'1px solid #cbd5e1', fontSize:12.5 }} required/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'#475569', marginBottom:4 }}>LANGUAGE</label>
                    <select value={schedLang} onChange={e => setSchedLang(e.target.value)}
                      style={{ width:'100%', boxSizing:'border-box', padding:8, borderRadius:8, border:'1px solid #cbd5e1', fontSize:12.5, background:'#fff' }}>
                      <option value="EN">English</option>
                      <option value="ZH">Chinese</option>
                      <option value="JA">Japanese</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={!schedTopic.trim() || !schedTime} style={{ ...primaryButton, padding:'10px 0', fontSize:13 }}>Schedule Event</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ─── In-Room Screen ───────────────────────────────────────────────────────────
  const subLevels = computeSubLevels(room.durationMin || 60, room.subLevelDuration || 15)
  const currentSubIdx = getCurrentSubLevel(subLevels, elapsed)
  const currentSub = subLevels[currentSubIdx] || subLevels[0]
  const progressPct = currentSub
    ? Math.min(100, ((elapsed - currentSub.startMin) / (room.subLevelDuration || 15)) * 100)
    : 0
  const remainingMin = currentSub ? Math.max(0, currentSub.endMin - elapsed) : 0
  const stageInfo = STAGE_LABELS[room.stage] || STAGE_LABELS.beginner
  const isRoomOwner = room.creator === name
  const raisedHandsList = room.raisedHands || []

  return (
    <div className="fade-up" style={{ padding:28, maxWidth:1200 }}>

      {/* Floating Gift Animations */}
      {floatingGifts.length > 0 && (
        <div style={{ position:'fixed', bottom:80, right:30, zIndex:9999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
          {floatingGifts.map((g, i) => (
            <div key={g.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'rgba(255,255,255,0.95)', backdropFilter:'blur(8px)', borderRadius:30, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', animation:`giftFloat 3.5s ease forwards`, fontSize:14, fontWeight:700, color:'#1e293b', opacity:1 }}>
              <span style={{ fontSize:22 }}>{g.giftType}</span>
              <span style={{ fontSize:12, color:'#64748b' }}>{g.own ? 'You sent' : `${g.from} sent`}</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
            <h1 style={{ margin:0, fontSize:21, fontWeight:800 }}>Live Room</h1>
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:stageInfo.bg, color:stageInfo.color }}>{stageInfo.emoji} {stageInfo.label}</span>
            {userRole === 'lucy' && (
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'#eef2ff', color:'#6366f1', fontWeight:700 }}>🎭 {name}</span>
            )}
          </div>
          <div style={{ color:'#64748b', fontSize:12 }}>Room ID: <strong style={{ color:'#4f46e5' }}>{room.id}</strong> · {room.isPublic?'Public':'Private'} · {room.durationMin||60} phút session</div>
        </div>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
          {canRecord && <button disabled={recordBusy} onClick={toggleRecording} style={{...smallButton,color:recording?'#fff':'#dc2626',background:recording?'#dc2626':'#fef2f2',borderColor:'#fecaca'}}>{recording?<Square size={13} fill="currentColor"/>:<span style={{width:9,height:9,borderRadius:'50%',background:'#dc2626'}}/>}{recordBusy?'Processing...':recording?'Stop Record':'Start Record'}</button>}
          {isRoomOwner && <button onClick={togglePrivacy} style={{...smallButton,color:room.isPublic?'#15803d':'#7c3aed',background:room.isPublic?'#f0fdf4':'#f5f3ff'}}>{room.isPublic?'Public':'Private'}</button>}
          <button onClick={copyRoomId} style={{...smallButton,color:copied?'#15803d':'#475569',background:copied?'#f0fdf4':'#fff',borderColor:copied?'#bbf7d0':'#e2e8f0',minWidth:90}}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?'Copied!':'Copy ID'}</button>
          <button onClick={leaveRoom} style={{...smallButton,color:'#dc2626',background:'#fef2f2'}}><PhoneOff size={14}/> Leave</button>
        </div>
      </div>

      {error && <div style={{ marginBottom:14, padding:10, borderRadius:9, background:'#fef2f2', color:'#b91c1c' }}>{error}</div>}

      {/* Sub-level Progress Bar */}
      <div style={{ marginBottom:16, padding:'12px 16px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'#6366f1', fontWeight:800, fontSize:13, minWidth:80 }}>
          <Layers size={14}/> {currentSub?.label || 'Chặng 1'}
        </div>
        <div style={{ flex:1, height:8, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
          <div style={{ width:`${progressPct}%`, height:'100%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:999, transition:'width 1s linear' }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, color:'#64748b', fontSize:12, fontWeight:600, minWidth:80 }}>
          <Clock size={13}/> {Math.floor(remainingMin)}:{String(Math.round((remainingMin % 1) * 60)).padStart(2,'0')} còn lại
        </div>
        <div style={{ fontSize:11, color:'#94a3b8' }}>{currentSubIdx+1}/{subLevels.length} chặng</div>
      </div>

      {/* Main 3-column grid */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 280px 280px', gap:14 }}>

        {/* Col 1: Voice + Lesson + AI Suggestions (owner only) */}
        <div style={{ display:'grid', gap:14, alignContent:'start' }}>

          {/* Voice Panel */}
          <Panel title="Voice Room" icon={<Volume2 size={15}/>}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:13, color:'#64748b' }}><Users size={14}/> {room.members.length} connected · {remotes.length} remote</span>
              <button onClick={async()=>setMuted(await agoraService.toggleMute())} style={{...smallButton,color:muted?'#dc2626':'#16a34a'}}><Mic size={14}/> {muted?'Unmute':'Mute'}</button>
            </div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {room.members.map(member => (
                <span key={member} style={{ padding:'6px 9px', borderRadius:12, background:member===name?'#eef2ff':'#f1f5f9', fontSize:11.5, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                  {userRole === 'lucy' && member.startsWith('LUCY-') ? '🎭 ' : ''}{member}
                  {member===room.creator && <small style={{ marginLeft:3,color:'#4f46e5',fontWeight:800 }}>Owner</small>}
                  {(room.raisedHands||[]).some(h=>h.name===member) && <span title="Hand raised" style={{ color:'#f59e0b' }}>🙋</span>}
                </span>
              ))}
            </div>
          </Panel>

          {/* Pinned Lesson */}
          <Panel title="Pinned Lesson" icon={<Pin size={15}/>}>
            {room.pinnedLesson
              ? <div style={{ padding:14, borderRadius:11, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                  <div style={{ fontWeight:800 }}>{room.pinnedLesson.title || `Lesson ${room.pinnedLesson.levelNum || room.pinnedLesson.id}`}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:5 }}>{room.pinnedLesson.vocab || room.pinnedLesson.stage || 'Shared lesson material'}</div>
                  {isRoomOwner && <button onClick={unpinLesson} style={{...smallButton,marginTop:10}}>Unpin</button>}
                </div>
              : <div style={{ color:'#94a3b8', fontSize:13 }}>No lesson is pinned.</div>}
            {isRoomOwner && (
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <select value={lessonId} onChange={e => setLessonId(e.target.value)} style={{ flex:1, padding:9, border:'1px solid #cbd5e1', borderRadius:8 }}>
                  <option value="">Select lesson</option>
                  {lessons.map(item => <option key={item.id} value={item.id}>{item.title || `${item.langCode} - Level ${item.levelNum}`}</option>)}
                </select>
                <button disabled={!lessonId} onClick={pinLesson} style={smallButton}>Pin</button>
              </div>
            )}
          </Panel>

          {/* AI Discussion Suggestions — only for room owner (pro/super) */}
          {isRoomOwner && (
            <Panel title="AI Discussion Suggestions" icon={<Sparkles size={15}/>}>
              <p style={{ margin:'0 0 10px', fontSize:12, color:'#64748b' }}>
                Gemini sẽ sinh câu hỏi thảo luận dựa trên bài học đang pin và cấp độ phòng.
              </p>
              <button onClick={fetchAiSuggestions} disabled={aiLoading} style={{ ...primaryButton, marginBottom:12, fontSize:13 }}>
                {aiLoading ? '✨ Đang sinh câu hỏi...' : '✨ Lấy gợi ý AI'}
              </button>
              {aiError && <div style={{ color:'#b91c1c', fontSize:12, marginBottom:8 }}>{aiError}</div>}
              {aiQuestions.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {aiQuestions.map((q, i) => (
                    <div key={i} style={{ padding:'9px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'start', gap:8 }}>
                      <div style={{ fontSize:12.5, color:'#1e293b', lineHeight:1.5 }}>
                        <strong style={{ color:'#6366f1' }}>Q{i+1}.</strong> {q}
                      </div>
                      <button onClick={() => { setMessage(q); }} title="Send to chat"
                        style={{ ...smallButton, padding:'3px 7px', fontSize:11, flexShrink:0 }}>
                        <Send size={11}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </div>

        {/* Col 2: Raise Hand + Gift picker */}
        <div style={{ display:'grid', gap:14, alignContent:'start' }}>

          {/* Raise Hand Panel */}
          <Panel title="Raise Hand" icon={<Hand size={15}/>}>
            {/* My hand toggle — lucy users */}
            {userRole === 'lucy' && (
              <div style={{ marginBottom:14 }}>
                <button onClick={toggleHand}
                  style={{ ...primaryButton, background:handRaised?'linear-gradient(135deg,#f59e0b,#ef4444)':'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize:14 }}>
                  {handRaised ? '✋ Hạ tay' : '🙋 Giơ tay phát biểu'}
                </button>
                {handRaised && <div style={{ marginTop:8, fontSize:12, color:'#f59e0b', fontWeight:700, textAlign:'center' }}>Mentor đang thấy tay của bạn!</div>}
              </div>
            )}

            {/* Hands queue — visible to owner */}
            {isRoomOwner && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontWeight:700, fontSize:12, color:'#475569' }}>🙋 {raisedHandsList.length} người giơ tay</span>
                  {raisedHandsList.length > 0 && (
                    <button onClick={clearHands} style={{ ...smallButton, fontSize:11, padding:'4px 8px', color:'#dc2626' }}>Xóa tất cả</button>
                  )}
                </div>
                {raisedHandsList.length === 0
                  ? <div style={{ color:'#94a3b8', fontSize:12, textAlign:'center', padding:'12px 0' }}>Chưa có ai giơ tay</div>
                  : raisedHandsList.map((h, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:9, background:i===0?'#fef3c7':'#f8fafc', border:`1px solid ${i===0?'#fde68a':'#e2e8f0'}`, marginBottom:6 }}>
                        <span style={{ fontWeight:800, color:i===0?'#92400e':'#475569', fontSize:12 }}>#{i+1}</span>
                        <span style={{ flex:1, fontSize:12.5, fontWeight:700 }}>{h.name}</span>
                        {i === 0 && <span style={{ fontSize:10, color:'#d97706', fontWeight:700 }}>▶ Gọi</span>}
                      </div>
                    ))
                }
              </div>
            )}

            {/* Pro/super: also show raise hand button */}
            {!isRoomOwner && userRole !== 'lucy' && (
              <button onClick={toggleHand}
                style={{ ...primaryButton, background:handRaised?'linear-gradient(135deg,#f59e0b,#ef4444)':'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize:13 }}>
                {handRaised ? '✋ Hạ tay' : '🙋 Giơ tay'}
              </button>
            )}
          </Panel>

          {/* Virtual Gift Panel */}
          <Panel title="Virtual Gifts" icon={<Gift size={15}/>}>
            <p style={{ margin:'0 0 10px', fontSize:12, color:'#64748b' }}>
              {isRoomOwner ? 'Xem quà được tặng từ học viên.' : 'Tặng quà để khen ngợi Mentor!'}
            </p>
            {!isRoomOwner && (
              <div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                  {GIFTS.map(g => (
                    <button key={g.id} onClick={() => sendGift(g.emoji)}
                      style={{ flex:1, minWidth:44, padding:'10px 6px', border:`1.5px solid ${g.color}22`, borderRadius:12, background:`${g.color}11`, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, transition:'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.background=`${g.color}22` }}
                      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.background=`${g.color}11` }}>
                      <span style={{ fontSize:22 }}>{g.emoji}</span>
                      <span style={{ fontSize:9.5, color:g.color, fontWeight:700 }}>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent gifts feed */}
            <div style={{ maxHeight:120, overflowY:'auto', display:'flex', flexDirection:'column', gap:5 }}>
              {(room.recentGifts || []).slice(-6).reverse().map((g, i) => (
                <div key={g.id || i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#64748b' }}>
                  <span style={{ fontSize:18 }}>{g.giftType}</span>
                  <span><strong style={{ color:'#1e293b' }}>{g.from}</strong> sent a gift</span>
                </div>
              ))}
              {(room.recentGifts || []).length === 0 && (
                <div style={{ color:'#94a3b8', fontSize:12, textAlign:'center', padding:'8px 0' }}>Chưa có quà nào</div>
              )}
            </div>
          </Panel>
        </div>

        {/* Col 3: Chat */}
        <Panel title="Room Chat" icon={<MessageSquare size={15}/>} bodyStyle={{ display:'flex', flexDirection:'column', height:520 }}>
          <div style={{ flex:1, overflowY:'auto', display:'grid', alignContent:'start', gap:9, paddingRight:4 }}>
            {room.messages.length === 0 && <div style={{ color:'#94a3b8', textAlign:'center', marginTop:70, fontSize:13 }}>No messages yet. Say hello!</div>}
            {room.messages.map(item => (
              <div key={item.id} style={{ justifySelf:item.name===name?'end':'start', maxWidth:'82%' }}>
                <div style={{ color:'#64748b', fontSize:10.5, margin:'0 4px 3px' }}>{item.name}</div>
                <div style={{ padding:'9px 11px', borderRadius:12, background:item.name===name?'#4f46e5':'#f1f5f9', color:item.name===name?'#fff':'#0f172a', fontSize:13, overflowWrap:'anywhere' }}>
                  {item.text}
                </div>
              </div>
            ))}
            <div ref={messagesEnd}/>
          </div>
          <form onSubmit={sendMessage} style={{ display:'flex', gap:8, borderTop:'1px solid #e2e8f0', paddingTop:12 }}>
            <input value={message} onChange={e => setMessage(e.target.value)} maxLength={500} placeholder="Type a message..."
              style={{ flex:1, padding:10, border:'1px solid #cbd5e1', borderRadius:9 }}/>
            <button style={{...primaryButton,width:42,padding:0}}><Send size={15}/></button>
          </form>
        </Panel>
      </div>

      {/* CSS keyframe for gift float animation */}
      <style>{`
        @keyframes giftFloat {
          0%   { opacity:0; transform:translateY(20px) scale(0.8); }
          15%  { opacity:1; transform:translateY(0) scale(1); }
          80%  { opacity:1; transform:translateY(-10px) scale(1); }
          100% { opacity:0; transform:translateY(-30px) scale(0.9); }
        }
      `}</style>
    </div>
  )
}

function Panel({ title, icon, children, bodyStyle }) {
  return (
    <section style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:15, overflow:'hidden' }}>
      <header style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 15px', borderBottom:'1px solid #e2e8f0', fontWeight:800, fontSize:13, color:'#4f46e5' }}>
        {icon}{title}
      </header>
      <div style={{ padding:15, ...bodyStyle }}>{children}</div>
    </section>
  )
}

const primaryButton = { width:'100%', border:0, borderRadius:9, padding:'11px 13px', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontWeight:750, cursor:'pointer' }
const smallButton = { border:'1px solid #e2e8f0', borderRadius:8, padding:'7px 10px', background:'#fff', color:'#475569', fontWeight:700, cursor:'pointer', display:'inline-flex', gap:6, alignItems:'center', justifyContent:'center' }
