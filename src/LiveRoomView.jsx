import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, Copy, MessageSquare, Mic, PhoneOff, Pin, Send, Square, Users, Volume2 } from 'lucide-react'
import { agoraService } from './services/agoraClient'

const API_BASE = import.meta.env.VITE_LUCY_API_BASE || 'http://localhost:8080/LucyBackendAPI'
const TOKEN_BASE = import.meta.env.VITE_AGORA_TOKEN_BASE || 'http://localhost:3000'
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || ''

const randomRoomId = () => Math.random().toString(36).slice(2, 8).toUpperCase()

export default function LiveRoomView({ canRecord = false }) {
  const [roomInput, setRoomInput] = useState('')
  const [newRoomPublic, setNewRoomPublic] = useState(true)
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
  const [name] = useState(() => `User-${Math.floor(Math.random() * 9000 + 1000)}`)
  const [uid] = useState(() => Math.floor(Math.random() * 90000 + 10000))
  const messagesEnd = useRef(null)
  const recorderRef = useRef(null)
  const recordStreamRef = useRef(null)
  const chunksRef = useRef([])
  const recordStartedRef = useRef(null)
  const recordSessionRef = useRef(null)

  const request = async (path, options) => {
    const res = await fetch(`${API_BASE}${path}`, options)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/lessons`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setLessons(Array.isArray(data) ? data : []))
      .catch(() => setLessons([]))
    return () => {
      agoraService.leaveRoom().catch(() => {})
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      recordStreamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  useEffect(() => {
    if (!room?.id) return
    const timer = setInterval(async () => {
      try {
        const latest = await request(`/api/rooms/${room.id}`)
        setRoom(latest)
      } catch (e) {
        if (e.message === 'Room not found') {
          await agoraService.leaveRoom().catch(() => {})
          setRoom(null)
          setRemotes([])
          setError('The room was closed because the room owner left.')
        }
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [room?.id])

  useEffect(() => {
    if (!room?.id) return
    const activeRoomId = room.id
    const leaveUrl = `${API_BASE}/api/rooms/${activeRoomId}/leave`
    const leavePayload = JSON.stringify({ name })
    const handlePageHide = () => {
      if (navigator.sendBeacon) navigator.sendBeacon(leaveUrl, new Blob([leavePayload], { type:'text/plain' }))
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      fetch(leaveUrl, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:leavePayload,
        keepalive:true
      }).catch(() => {})
      agoraService.leaveRoom().catch(() => {})
    }
  }, [room?.id, name])

  useEffect(() => {
    if (room) return
    let active = true
    const loadPublicRooms = () => request('/api/rooms')
      .then(data => { if (active) setPublicRooms(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) setPublicRooms([]) })
    loadPublicRooms()
    const timer = setInterval(loadPublicRooms, 2000)
    return () => { active = false; clearInterval(timer) }
  }, [room?.id])

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior:'smooth' }) }, [room?.messages?.length])

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

  const enterRoom = async (roomId, create) => {
    const cleanId = roomId.trim().toUpperCase()
    if (cleanId.length < 4) { setError('Room ID must contain at least 4 characters'); return }
    setBusy(true); setError('')
    try {
      const state = create
        ? await request('/api/rooms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ roomId:cleanId, name, isPublic:newRoomPublic }) })
        : await request(`/api/rooms/${cleanId}/join`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name }) })
      setRoom(state)
      await connectAudio(cleanId)
    } catch (e) {
      setError(e.message)
    } finally { setBusy(false) }
  }

  const createRoom = () => {
    const id = randomRoomId()
    enterRoom(id, true)
  }

  const leaveRoom = async () => {
    try { await request(`/api/rooms/${room.id}/leave`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name }) }) } catch {}
    await agoraService.leaveRoom()
    setRoom(null); setRemotes([]); setMuted(false)
  }

  const sendMessage = async e => {
    e.preventDefault()
    const text = message.trim()
    if (!text) return
    setMessage('')
    try {
      const latest = await request(`/api/rooms/${room.id}/message`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name, text }) })
      setRoom(latest)
    } catch (e) { setError(e.message) }
  }

  const pinLesson = async () => {
    const lesson = lessons.find(item => String(item.id) === String(lessonId))
    if (!lesson) return
    const latest = await request(`/api/rooms/${room.id}/pin`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name, lesson }) })
    setRoom(latest)
  }

  const unpinLesson = async () => {
    const latest = await request(`/api/rooms/${room.id}/unpin`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name }) })
    setRoom(latest)
  }

  const togglePrivacy = async () => {
    try {
      const latest = await request(`/api/rooms/${room.id}/privacy`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name, isPublic:!room.isPublic }) })
      setRoom(latest)
    } catch (e) { setError(e.message) }
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(room.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { setError('Could not copy the room ID') }
  }

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
        const sessionData = await request('/api/podcasts/record/start', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ roomId:room.id, creatorId:1, title:`Live Room ${room.id}` }) })
        recordStartedRef.current = Date.now()
        recordSessionRef.current = sessionData.sessionId
        setRecording(true)
      } catch (e) {
        recorderRef.current?.stop()
        recordStreamRef.current?.getTracks().forEach(track => track.stop())
        setError(`Could not start recording: ${e.message}`)
      }
    } else {
      try {
        const recorder = recorderRef.current
        const blob = await new Promise(resolve => {
          recorder.onstop = () => resolve(new Blob(chunksRef.current, { type:recorder.mimeType || 'audio/webm' }))
          recorder.stop()
        })
        recordStreamRef.current?.getTracks().forEach(track => track.stop())
        await request('/api/podcasts/record/stop', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ sessionId:recordSessionRef.current }) })
        const seconds = Math.max(1, Math.round((Date.now() - recordStartedRef.current) / 1000))
        const form = new FormData()
        form.append('audio', blob, `room-${room.id}-${Date.now()}.webm`)
        form.append('title', `Live Room ${room.id}`)
        form.append('roomId', room.id)
        form.append('duration', `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`)
        const upload = await fetch(`${API_BASE}/api/podcasts/record/upload`, { method:'POST', body:form })
        if (!upload.ok) {
          const uploadError = await upload.json().catch(() => ({}))
          throw new Error(uploadError.error || `Audio upload failed (HTTP ${upload.status})`)
        }
        setRecording(false)
        recorderRef.current = null
        recordStreamRef.current = null
        recordSessionRef.current = null
      } catch (e) { setError(`Could not save recording: ${e.message}`) }
    }
    setRecordBusy(false)
  }

  if (!room) return (
    <div className="fade-up" style={{ padding:28, maxWidth:760 }}>
      <h1 style={{ margin:'0 0 5px', fontSize:24, color:'#0f172a' }}>Live Rooms</h1>
      <p style={{ margin:'0 0 22px', color:'#64748b', fontSize:13.5 }}>Create a room or join in a room.</p>
      {error && <div style={{ marginBottom:14, padding:12, borderRadius:10, background:'#fef2f2', color:'#b91c1c' }}><AlertCircle size={14}/> {error}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ padding:22, border:'1px solid #e2e8f0', borderRadius:16, background:'#fff' }}>
          <h3 style={{ margin:'0 0 8px' }}>Create a room</h3>
          <div style={{ display:'flex', gap:7, marginBottom:11 }}>
            {[true,false].map(value=><button key={String(value)} onClick={()=>setNewRoomPublic(value)} style={{ flex:1,padding:'8px 6px',border:`1px solid ${newRoomPublic===value?'#6366f1':'#e2e8f0'}`,borderRadius:8,background:newRoomPublic===value?'#eef2ff':'#fff',color:newRoomPublic===value?'#4338ca':'#64748b',fontWeight:700,cursor:'pointer' }}>{value?'Public':'Private'}</button>)}
          </div>
          <button disabled={busy} onClick={createRoom} style={primaryButton}>Create Room</button>
        </div>
        <div style={{ padding:22, border:'1px solid #e2e8f0', borderRadius:16, background:'#fff' }}>
          <h3 style={{ margin:'0 0 8px' }}>Join a room</h3>
          <input value={roomInput} onChange={e => setRoomInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && enterRoom(roomInput, false)} placeholder="Enter room ID" maxLength={12} style={{ width:'100%', boxSizing:'border-box', padding:11, border:'1px solid #cbd5e1', borderRadius:9, marginBottom:10, textTransform:'uppercase' }}/>
          <button disabled={busy} onClick={() => enterRoom(roomInput, false)} style={primaryButton}>{busy ? 'Connecting...' : 'Join Room'}</button>
        </div>
      </div>
      <div style={{ marginTop:22 }}>
        <h2 style={{ fontSize:17,margin:'0 0 4px',color:'#0f172a' }}>Public rooms</h2>
        <p style={{ margin:'0 0 12px',fontSize:12.5,color:'#64748b' }}>Join an open room without entering its ID.</p>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10 }}>
          {publicRooms.map(publicRoom=><div key={publicRoom.id} style={{ padding:14,border:'1px solid #e2e8f0',borderRadius:12,background:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10 }}><div><div style={{ fontWeight:800,color:'#0f172a' }}>{publicRoom.id}</div><div style={{ marginTop:4,fontSize:11.5,color:'#64748b' }}>Owner: {publicRoom.creator} · {publicRoom.memberCount||0} joined</div></div><button disabled={busy} onClick={()=>enterRoom(publicRoom.id,false)} style={{...smallButton,color:'#4f46e5'}}>Join</button></div>)}
          {publicRooms.length===0&&<div style={{ gridColumn:'1/-1',padding:24,textAlign:'center',border:'1px dashed #cbd5e1',borderRadius:12,color:'#94a3b8',fontSize:13 }}>No public rooms are open.</div>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fade-up" style={{ padding:28, maxWidth:1100 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div><h1 style={{ margin:0, fontSize:23 }}>Live Room</h1><div style={{ color:'#64748b', fontSize:12, marginTop:5 }}>Room ID: <strong style={{ color:'#4f46e5' }}>{room.id}</strong> · {room.isPublic?'Public':'Private'} · You are {name}</div></div>
        <div style={{ display:'flex', gap:8 }}>
          {canRecord && <button disabled={recordBusy} onClick={toggleRecording} style={{...smallButton,color:recording?'#fff':'#dc2626',background:recording?'#dc2626':'#fef2f2',borderColor:'#fecaca'}}>{recording?<Square size={13} fill="currentColor"/>:<span style={{width:9,height:9,borderRadius:'50%',background:'#dc2626'}}/>}{recordBusy?'Processing...':recording?'Stop Record':'Start Record'}</button>}
          {room.creator===name&&<button onClick={togglePrivacy} style={{...smallButton,color:room.isPublic?'#15803d':'#7c3aed',background:room.isPublic?'#f0fdf4':'#f5f3ff'}}>{room.isPublic?'Public':'Private'}</button>}
          <button onClick={copyRoomId} style={{...smallButton,color:copied?'#15803d':'#475569',background:copied?'#f0fdf4':'#fff',borderColor:copied?'#bbf7d0':'#e2e8f0',minWidth:92}}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?'Copied!':'Copy ID'}</button>
          <button onClick={leaveRoom} style={{...smallButton,color:'#dc2626',background:'#fef2f2'}}><PhoneOff size={14}/> Leave</button>
        </div>
      </div>
      {error && <div style={{ marginBottom:14, padding:10, borderRadius:9, background:'#fef2f2', color:'#b91c1c' }}>{error}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1fr) minmax(330px, .8fr)', gap:16 }}>
        <div style={{ display:'grid', gap:16 }}>
          <Panel title="Voice room" icon={<Volume2 size={15}/>}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}><span style={{ fontSize:13, color:'#64748b' }}><Users size={14}/> {room.members.length} connected · {remotes.length} remote audio</span><button onClick={async()=>setMuted(await agoraService.toggleMute())} style={{...smallButton,color:muted?'#dc2626':'#16a34a'}}><Mic size={14}/> {muted?'Unmute':'Mute'}</button></div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>{room.members.map(member => <span key={member} style={{ padding:'6px 9px', borderRadius:12, background:member===name?'#eef2ff':'#f1f5f9', fontSize:11.5, fontWeight:700 }}>{member}{member===room.creator&&<small style={{ marginLeft:5,color:'#4f46e5',fontWeight:800 }}>Room owner</small>}</span>)}</div>
          </Panel>
          <Panel title="Pinned lesson" icon={<Pin size={15}/>}>
            {room.pinnedLesson ? <div style={{ padding:14, borderRadius:11, background:'#eff6ff', border:'1px solid #bfdbfe' }}><div style={{ fontWeight:800 }}>{room.pinnedLesson.title || `Lesson ${room.pinnedLesson.levelNum || room.pinnedLesson.id}`}</div><div style={{ fontSize:12, color:'#64748b', marginTop:5 }}>{room.pinnedLesson.vocab || room.pinnedLesson.stage || 'Shared lesson material'}</div>{room.creator===name&&<button onClick={unpinLesson} style={{...smallButton,marginTop:10}}>Unpin</button>}</div> : <div style={{ color:'#94a3b8', fontSize:13 }}>No lesson is pinned.</div>}
            {room.creator===name&&<div style={{ display:'flex', gap:8, marginTop:12 }}><select value={lessonId} onChange={e=>setLessonId(e.target.value)} style={{ flex:1, padding:9, border:'1px solid #cbd5e1', borderRadius:8 }}><option value="">Select lesson</option>{lessons.map(item=><option key={item.id} value={item.id}>{item.title || `${item.langCode} - Level ${item.levelNum}`}</option>)}</select><button disabled={!lessonId} onClick={pinLesson} style={smallButton}>Pin lesson</button></div>}
          </Panel>
        </div>
        <Panel title="Room chat" icon={<MessageSquare size={15}/>} bodyStyle={{ display:'flex', flexDirection:'column', height:500 }}>
          <div style={{ flex:1, overflowY:'auto', display:'grid', alignContent:'start', gap:9, paddingRight:4 }}>{room.messages.length===0&&<div style={{ color:'#94a3b8', textAlign:'center', marginTop:70, fontSize:13 }}>No messages yet. Say hello!</div>}{room.messages.map(item=><div key={item.id} style={{ justifySelf:item.name===name?'end':'start', maxWidth:'82%' }}><div style={{ color:'#64748b', fontSize:10.5, margin:'0 4px 3px' }}>{item.name}</div><div style={{ padding:'9px 11px', borderRadius:12, background:item.name===name?'#4f46e5':'#f1f5f9', color:item.name===name?'#fff':'#0f172a', fontSize:13, overflowWrap:'anywhere' }}>{item.text}</div></div>)}<div ref={messagesEnd}/></div>
          <form onSubmit={sendMessage} style={{ display:'flex', gap:8, borderTop:'1px solid #e2e8f0', paddingTop:12 }}><input value={message} onChange={e=>setMessage(e.target.value)} maxLength={500} placeholder="Type a message..." style={{ flex:1, padding:10, border:'1px solid #cbd5e1', borderRadius:9 }}/><button style={{...primaryButton,width:42,padding:0}}><Send size={15}/></button></form>
        </Panel>
      </div>
    </div>
  )
}

function Panel({ title, icon, children, bodyStyle }) {
  return <section style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:15, overflow:'hidden' }}><header style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 15px', borderBottom:'1px solid #e2e8f0', fontWeight:800, fontSize:13, color:'#4f46e5' }}>{icon}{title}</header><div style={{ padding:15, ...bodyStyle }}>{children}</div></section>
}

const primaryButton = { width:'100%', border:0, borderRadius:9, padding:'11px 13px', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontWeight:750, cursor:'pointer' }
const smallButton = { border:'1px solid #e2e8f0', borderRadius:8, padding:'7px 10px', background:'#fff', color:'#475569', fontWeight:700, cursor:'pointer', display:'inline-flex', gap:6, alignItems:'center', justifyContent:'center' }
