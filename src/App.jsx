import lessonsData from "./lessonsData.json";
import { useState, useEffect, useRef } from "react";
import { api } from "./apiClient";
import {
  BookOpen, Play, FileText, Headphones, Upload, Eye, Zap,
  MessageSquare, Mic, Users, Radio, Pin, PhoneOff, Phone,
  Plus, Star, Volume2, Layers, RefreshCw, Trash2,
  CheckCircle, AlertCircle, Info, ChevronRight, Settings,
  Globe, Lock, Database, Award
} from "lucide-react";

// â”€â”€â”€ Design Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {
  primary: "#2563eb", primaryHover: "#1d4ed8",
  primaryLight: "#eff6ff", primaryBorder: "#bfdbfe",
  bg: "#f8fafc", card: "#ffffff", sidebar: "#ffffff",
  border: "#e5e7eb", borderLight: "#f3f4f6",
  text: "#111827", muted: "#6b7280", light: "#9ca3af",
  red: "#ef4444", redLight: "#fee2e2", redBorder: "#fca5a5",
  green: "#10b981", greenLight: "#d1fae5", greenBorder: "#6ee7b7",
  yellow: "#f59e0b", yellowLight: "#fffbeb", yellowBorder: "#fde68a",
  purple: "#7c3aed", purpleLight: "#ede9fe",
};

// â”€â”€â”€ Primitives â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Badge = ({ children, color = C.primary, bg = C.primaryLight, style }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, color, background: bg, whiteSpace: "nowrap", ...style }}>{children}</span>
);

const Btn = ({ children, onClick, v = "primary", sm, disabled, fullWidth, style = {} }) => {
  const map = {
    primary: [C.primary, "#fff", `1px solid ${C.primary}`],
    secondary: ["#fff", C.text, `1px solid ${C.border}`],
    danger: [C.red, "#fff", `1px solid ${C.red}`],
    outline: ["#fff", C.primary, `1px solid ${C.primary}`],
    success: [C.green, "#fff", `1px solid ${C.green}`],
    ghost: ["transparent", C.muted, "1px solid transparent"],
  };
  const [bg, color, border] = map[v] || map.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: sm ? "4px 10px" : "7px 14px", borderRadius: 6, fontSize: sm ? 12 : 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, background: bg, color, border, width: fullWidth ? "100%" : undefined, transition: "opacity 0.15s", ...style }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={e => (e.currentTarget.style.opacity = disabled ? "0.5" : "1")}
    >{children}</button>
  );
};

const SectionCard = ({ children, style }) => (
  <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", background: C.card, ...style }}>{children}</div>
);

const CardHead = ({ icon, title, action, accent }) => (
  <div style={{ background: accent ? "#f0f9ff" : "#f9fafb", borderBottom: `1px solid ${C.border}`, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: 13, color: accent ? C.primary : C.text }}>{icon}{title}</div>
    {action}
  </div>
);

const statCard = (label, value, color) => (
  <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px" }}>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{label}</div>
  </div>
);

// â”€â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Sidebar({ active, setActive }) {
  const groups = [
    { items: [
      { id: "courses", icon: <BookOpen size={14}/>, label: "Courses" },
      { id: "course-runs", icon: <Play size={14}/>, label: "Course Runs" },
      { id: "chapters", icon: <Layers size={14}/>, label: "Chapters" },
      { id: "lessons", icon: <FileText size={14}/>, label: "Lessons" },
    ]},
    { label: "ROOMS", items: [
      { id: "live-rooms", icon: <Mic size={14}/>, label: "Live Rooms" },
    ]},
    { label: "CONTENT CREATOR", items: [
      { id: "podcasts", icon: <Headphones size={14}/>, label: "Podcasts" },
      { id: "premium-content", icon: <Star size={14}/>, label: "Premium Content" },
    ]},
    { label: "IMPORT", items: [
      { id: "import-files", icon: <Upload size={14}/>, label: "Import Files" },
      { id: "docx-preview", icon: <Eye size={14}/>, label: "DOCX Preview" },
    ]},
    { label: "AI SUPPORT", items: [
      { id: "prompt-templates", icon: <Zap size={14}/>, label: "Prompt Templates" },
      { id: "generated-questions", icon: <MessageSquare size={14}/>, label: "Generated Questions" },
    ]},
    { label: "USER MANAGEMENT", items: [
      { id: "users", icon: <Users size={14}/>, label: "Users List" },
    ]},
  ];
  return (
    <aside style={{ width: 210, minWidth: 210, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", flexShrink: 0 }}>
      <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>ðŸŽµ</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.primary, letterSpacing: "-0.03em" }}>LUCY</div>
          <div style={{ fontSize: 10, color: C.light }}>Language Platform</div>
        </div>
      </div>
      <div style={{ flex: 1, paddingBottom: 8 }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 4 }}>
            {g.label && <div style={{ padding: "9px 16px 3px", fontSize: 9.5, fontWeight: 700, color: C.light, letterSpacing: "0.07em", textTransform: "uppercase" }}>{g.label}</div>}
            {g.items.map(item => {
              const on = active === item.id;
              return (
                <button key={item.id} onClick={() => setActive(item.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 16px 7px 13px", background: on ? C.primaryLight : "transparent", color: on ? C.primary : C.muted, border: "none", borderLeft: on ? `3px solid ${C.primary}` : "3px solid transparent", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: on ? 600 : 400 }}>
                  {item.icon}{item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 0 12px" }}>
        <div style={{ padding: "4px 16px 2px", fontSize: 9.5, fontWeight: 700, color: C.light, textTransform: "uppercase", letterSpacing: "0.07em" }}>ADMIN</div>
        <a href="#" style={{ display: "block", padding: "5px 16px", fontSize: 12, color: C.muted, textDecoration: "none" }}>localhost:8081/podcasts</a>
      </div>
    </aside>
  );
}

// --- Agora Config -------------------------------------------------------
const AGORA_APP_ID  = "ca82570aa4a3464aadca4e28ee1d73b9";
const AGORA_CHANNEL = "lucy_room_1";
// Temp token (valid ~24h). Replace via Agora Console > Generate Temp Token
const AGORA_TEMP_TOKEN = "006ca82570aa4a3464aadca4e28ee1d73b9IACc5s3b/IwXIquJv0NUyYgLxo3PXKy0esWGIFIZ5GaFrJrnejAAAAAAIgCzgFZ7Vp06agQAAQBWnTpqAgBWnTpqAwBWnTpqBABWnTpq";

// --- Live Rooms View -------------------------------------------------------
function LiveRoomsView() {
  const [uid]         = useState(() => Math.floor(Math.random() * 99999) + 1);
  const [joining,  setJoining]  = useState(false);
  const [joined,   setJoined]   = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [error,    setError]    = useState(null);

  const clientRef  = useRef(null);
  const micRef     = useRef(null);

  // Lesson / topic UI
  const [topicIdx,       setTopicIdx]       = useState(-1);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [customTitle,    setCustomTitle]    = useState("");
  const [pinned,         setPinned]         = useState([]);

  const topics  = ["Topic 1: Introducing Yourself","Topic 2: Asking for Directions","Topic 3: Ordering at a Restaurant","Topic 4: Shopping Phrases","Topic 5: At the Doctor"];
  const lessons = ["Lesson 1 - Greetings & Farewells","Lesson 2 - Numbers 1-20","Lesson 3 - Colors & Shapes","Lesson 4 - Family Members","Lesson 5 - Daily Routines"];
  const currentTopic = topicIdx >= 0 ? topics[topicIdx] : null;
  const nextTopic    = () => setTopicIdx(i => (i + 1) % topics.length);
  const pinMaterial  = () => {
    if (!selectedLesson) return;
    setPinned(p => [...p, { id: Date.now(), title: customTitle || selectedLesson }]);
    setSelectedLesson(""); setCustomTitle("");
  };

  // Init Agora client once
  useEffect(() => {
    if (typeof AgoraRTC === "undefined") {
      setError("Agora SDK chưa load. Kiểm tra kết nối internet.");
      return;
    }
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "audio") {
        user.audioTrack.play();
        setRemoteUsers(prev => prev.find(u => u.uid === user.uid) ? prev : [...prev, { uid: user.uid }]);
      }
    });
    client.on("user-unpublished", user => setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid)));
    client.on("user-left",       user => setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid)));
    clientRef.current = client;
    return () => { doLeave(); };
  }, []);

  const doLeave = async () => {
    if (micRef.current)    { micRef.current.stop(); micRef.current.close(); micRef.current = null; }
    if (clientRef.current && joined) await clientRef.current.leave();
    setJoined(false); setRemoteUsers([]); setMuted(false);
  };

  const doJoin = async () => {
    setJoining(true); setError(null);
    try {
      await clientRef.current.join(AGORA_APP_ID, AGORA_CHANNEL, AGORA_TEMP_TOKEN, uid);
      const mic = await AgoraRTC.createMicrophoneAudioTrack();
      micRef.current = mic;
      await clientRef.current.publish([mic]);
      setJoined(true);
    } catch (e) {
      setError("Join thất bại: " + e.message);
    } finally { setJoining(false); }
  };

  const doToggleMute = async () => {
    if (micRef.current) { await micRef.current.setMuted(!muted); setMuted(m => !m); }
  };

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:700, color:C.text, margin:"0 0 4px" }}>Room: English Beginner – Daily Conversation</h1>
          <div style={{ display:"flex", gap:6 }}>
            <Badge color="#374151" bg="#f3f4f6">EN</Badge>
            <Badge color={joined?"#065f46":"#374151"} bg={joined?"#d1fae5":"#f3f4f6"}>{joined?"🔴 LIVE":"⬤ Offline"}</Badge>
            <Badge color="#1e40af" bg={C.primaryLight}><Globe size={10}/> Public</Badge>
          </div>
        </div>
        {joined && <Btn onClick={doLeave} v="danger">Leave Room</Btn>}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:C.redLight, border:`1px solid ${C.redBorder}`, borderRadius:6, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#991b1b", display:"flex", gap:8, alignItems:"center" }}>
          <AlertCircle size={14}/> {error}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

        {/* LEFT */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Agora Voice Card */}
          <SectionCard>
            <CardHead accent icon={<Volume2 size={13}/>} title="Voice Chat (Agora RTC)"
              action={
                joined
                  ? <span style={{ fontSize:12, fontWeight:600, color:C.green }}>● LIVE – {remoteUsers.length + 1} người</span>
                  : <span style={{ fontSize:12, color:C.muted }}>Chưa kết nối</span>
              }
            />
            <div style={{ padding:16 }}>
              <div style={{ fontSize:12, color:C.muted, marginBottom:12, display:"flex", gap:16 }}>
                <span>Channel: <code style={{ background:"#f3f4f6", padding:"1px 6px", borderRadius:3 }}>{AGORA_CHANNEL}</code></span>
                <span>UID: <code style={{ background:"#f3f4f6", padding:"1px 6px", borderRadius:3 }}>{uid}</code></span>
              </div>

              {!joined ? (
                <button onClick={doJoin} disabled={joining}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"12px 0",
                    background: joining ? "#9ca3af" : "linear-gradient(135deg,#2563eb,#7c3aed)",
                    color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:700,
                    cursor: joining ? "not-allowed" : "pointer" }}>
                  {joining
                    ? <><RefreshCw size={15} style={{ animation:"spin 1s linear infinite" }}/> Đang kết nối...</>
                    : <><Phone size={15}/> Tham gia Voice Chat</>}
                </button>
              ) : (
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={doToggleMute}
                    style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px 0",
                      background: muted ? C.redLight : C.greenLight,
                      color: muted ? C.red : C.green,
                      border:`1px solid ${muted ? C.redBorder : C.greenBorder}`,
                      borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    <Mic size={14}/> {muted ? "Bật mic" : "Tắt mic"}
                  </button>
                  <button onClick={doLeave}
                    style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px 0",
                      background:C.redLight, color:C.red, border:`1px solid ${C.redBorder}`,
                      borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    <PhoneOff size={14}/> Rời phòng
                  </button>
                </div>
              )}

              {/* Remote users list */}
              {joined && (
                <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.light, textTransform:"uppercase", marginBottom:8 }}>Trong phòng</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", background:C.greenLight, borderRadius:6, marginBottom:4, fontSize:13 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:C.green, display:"inline-block", flexShrink:0 }}/>
                    <span style={{ fontWeight:600 }}>Bạn</span>
                    {muted && <Badge color="#991b1b" bg={C.redLight}>Muted</Badge>}
                  </div>
                  {remoteUsers.map(u => (
                    <div key={u.uid} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", background:C.primaryLight, borderRadius:6, marginBottom:4, fontSize:13 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:C.primary, display:"inline-block", flexShrink:0 }}/>
                      <span>User #{u.uid}</span>
                      <Badge color="#065f46" bg="#d1fae5">Đang nói</Badge>
                    </div>
                  ))}
                  {remoteUsers.length === 0 && <p style={{ fontSize:12, color:C.light, fontStyle:"italic", margin:0 }}>Chờ người khác vào phòng...</p>}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Current topic */}
          <SectionCard>
            <CardHead icon={<Radio size={13}/>} title="Bài học đang học" action={<Btn sm onClick={nextTopic}>&raquo; Tiếp theo</Btn>}/>
            <div style={{ padding:14 }}>
              {currentTopic
                ? <div style={{ background:C.primaryLight, border:`1px solid ${C.primaryBorder}`, borderRadius:6, padding:"10px 14px" }}>
                    <div style={{ fontSize:11, color:C.light, marginBottom:3 }}>Chủ đề</div>
                    <div style={{ fontWeight:600, color:C.text, fontSize:13 }}>{currentTopic}</div>
                  </div>
                : <p style={{ fontSize:13, color:C.light, fontStyle:"italic", margin:0 }}>Bấm Tiếp theo để bắt đầu.</p>
              }
            </div>
          </SectionCard>
        </div>

        {/* RIGHT */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Room info */}
          <SectionCard>
            <CardHead icon={<Info size={13}/>} title="Thông tin phòng"/>
            <div style={{ padding:14 }}>
              {[
                ["Host",    "Mr.John"],
                ["Khoá học","English Stage 1"],
                ["App ID",  AGORA_APP_ID.slice(0,8)+"..."],
                ["Token",   "Temp (24h)"],
                ["Channel", AGORA_CHANNEL],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"6px 0", borderBottom:`1px solid ${C.borderLight}` }}>
                  <span style={{ color:C.muted }}>{k}</span>
                  <span style={{ fontWeight:500, color:C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Pinned materials */}
          <SectionCard>
            <CardHead icon={<Pin size={13}/>} title="Tài liệu ghim"/>
            <div style={{ padding:14, display:"flex", flexDirection:"column", gap:8 }}>
              <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)}
                style={{ width:"100%", padding:"7px 10px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:13, background:"#fff", outline:"none" }}>
                <option value="">-- Chọn bài học --</option>
                {lessons.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                placeholder="Tiêu đề tuỳ chỉnh (không bắt buộc)"
                style={{ width:"100%", padding:"7px 10px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:13, outline:"none", boxSizing:"border-box" }}
              />
              <Btn onClick={pinMaterial} disabled={!selectedLesson} fullWidth><Pin size={13}/> Ghim tài liệu</Btn>
              {pinned.map(m => (
                <div key={m.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:C.primaryLight, borderRadius:5, fontSize:12 }}>
                  <Pin size={11} color={C.primary}/>
                  <span style={{ flex:1 }}>{m.title}</span>
                  <button onClick={() => setPinned(p => p.filter(x => x.id !== m.id))}
                    style={{ background:"none", border:"none", cursor:"pointer", color:C.light, fontSize:15, padding:0 }}>x</button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}


// â”€â”€â”€ Courses View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CoursesView() {
  const courses = [
    { lang: "ðŸ‡¬ðŸ‡§", name: "English Stage 1", level: "Beginner", lessons: 20, students: 145, status: "active" },
    { lang: "ðŸ‡¬ðŸ‡§", name: "English Stage 2", level: "Intermediate", lessons: 25, students: 89, status: "active" },
    { lang: "ðŸ‡¬ðŸ‡§", name: "English Stage 3", level: "Advanced", lessons: 30, students: 43, status: "draft" },
    { lang: "ðŸ‡¨ðŸ‡³", name: "Chinese Stage 1", level: "Beginner", lessons: 18, students: 67, status: "active" },
    { lang: "ðŸ‡¨ðŸ‡³", name: "Chinese Stage 2", level: "Intermediate", lessons: 22, students: 31, status: "active" },
    { lang: "ðŸ‡¯ðŸ‡µ", name: "Japanese Stage 1", level: "Beginner", lessons: 20, students: 52, status: "active" },
    { lang: "ðŸ‡¯ðŸ‡µ", name: "Japanese Stage 2", level: "Intermediate", lessons: 24, students: 28, status: "draft" },
  ];
  const active = courses.filter(c => c.status === "active");
  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Courses</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Language learning courses across 3 languages and 100 levels</p>
        </div>
        <Btn><Plus size={14}/> New Course</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {statCard("Total Courses", courses.length, C.primary)}
        {statCard("Active", active.length, C.green)}
        {statCard("Total Lessons", courses.reduce((a, c) => a + c.lessons, 0), C.purple)}
        {statCard("Students Enrolled", courses.reduce((a, c) => a + c.students, 0), C.yellow)}
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 120px 70px 80px 80px", padding: "10px 16px", background: "#f9fafb", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted, gap: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <span>#</span><span>Course</span><span>Level</span><span>Lessons</span><span>Students</span><span>Status</span>
        </div>
        {courses.map((c, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr 120px 70px 80px 80px", padding: "11px 16px", borderBottom: i < courses.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13, alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>{c.lang}</span>
            <span style={{ fontWeight: 500, color: C.text }}>{c.name}</span>
            <Badge color="#374151" bg="#f3f4f6">{c.level}</Badge>
            <span style={{ color: C.muted }}>{c.lessons}</span>
            <span style={{ color: C.muted }}>{c.students}</span>
            <Badge color={c.status === "active" ? "#065f46" : "#92400e"} bg={c.status === "active" ? "#d1fae5" : "#fef3c7"}>{c.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————
function ChaptersView() {
  const chapters = [
    { course: "English Stage 1", chapter: "Chapter 1: Hello World", topics: 5, complete: true },
    { course: "English Stage 1", chapter: "Chapter 2: My Family", topics: 4, complete: true },
    { course: "English Stage 1", chapter: "Chapter 3: At School", topics: 6, complete: false },
    { course: "English Stage 2", chapter: "Chapter 1: City Life", topics: 5, complete: true },
    { course: "Chinese Stage 1", chapter: "Chapter 1: Ni Hao", topics: 4, complete: true },
    { course: "Japanese Stage 1", chapter: "Chapter 1: Hajimemashite", topics: 5, complete: false },
  ];
  return (
    <div style={{ padding: "20px 24px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Chapters</h1>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>Chapter structure across all courses</p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        {chapters.map((ch, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: i < chapters.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {ch.complete ? <CheckCircle size={15} color={C.green}/> : <div style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid ${C.border}` }}/>}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{ch.chapter}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{ch.course} • {ch.topics} topics</div>
              </div>
            </div>
            <ChevronRight size={14} color={C.light}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Lessons View -------------------------------------------------
function LessonsView() {
  const [tab, setTab] = useState("EN");
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId(prev => prev === id ? null : id);

  const filtered = lessonsData[tab] || [];
  const stageColors = { "Sơ cấp": { bg: "#eff6ff", color: "#2563eb" }, "Trung cấp": { bg: "#f0fdf4", color: "#16a34a" }, "Cao cấp": { bg: "#fdf4ff", color: "#9333ea" } };

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Lessons</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>LUCY Course Content - English: {(lessonsData?.EN?.length || 0)} | Chinese: {(lessonsData?.ZH?.length || 0)} | Japanese: {(lessonsData?.JA?.length || 0)}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn v={tab === "EN" ? "primary" : "outline"} onClick={() => { setTab("EN"); setOpenId(null); }}>English ({(lessonsData?.EN?.length || 0)})</Btn>
          <Btn v={tab === "ZH" ? "primary" : "outline"} onClick={() => { setTab("ZH"); setOpenId(null); }}>Chinese ({(lessonsData?.ZH?.length || 0)})</Btn>
          <Btn v={tab === "JA" ? "primary" : "outline"} onClick={() => { setTab("JA"); setOpenId(null); }}>Japanese ({(lessonsData?.JA?.length || 0)})</Btn>
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        {filtered.map((l, i) => {
          const isOpen = openId === l.level;
          const sc = stageColors[l.stage] || { bg: "#f9fafb", color: C.muted };
          return (
            <div key={l.level}>
              <div
                onClick={() => toggle(l.level)}
                style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer", background: isOpen ? "#f0f9ff" : (i % 2 === 0 ? "#fff" : "#fafafa"), transition: "background 0.15s" }}
              >
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: isOpen ? C.primary : "#e5e7eb", color: isOpen ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginRight: 12 }}>{l.level}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{l.title}</div>
                </div>
                <Badge color={sc.color} bg={sc.bg} style={{ marginRight: 12 }}>{l.stage}</Badge>
                <span style={{ color: C.muted, fontSize: 13, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>›</span>
              </div>
              {isOpen && (
                <div style={{ padding: "16px 20px 20px 56px", background: "#f8fbff", borderBottom: `1px solid ${C.border}` }}>
                  {tab === 'ZH' ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(l.qa || []).map((qa, idx) => (
                          <div key={idx} style={{ background: "#fff", padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 4 }}>Q: {qa.q}</div>
                            <div style={{ fontSize: 13, color: "#16a34a" }}>A: {qa.a}</div>
                          </div>
                        ))}
                     </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginBottom: 6, textTransform: "uppercase" }}>Vocabulary</div>
                        <div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-line" }}>{l.vocab}</div>
                      </div>
                      <div style={{ background: "#eff6ff", padding: "10px 14px", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginBottom: 6, textTransform: "uppercase" }}>Grammar</div>
                        <div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-line" }}>{l.grammar}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function PodcastsView() {
  const pods = [
    { title: "Daily English Tips", ep: 12, lang: "English", subs: 234 },
    { title: "Chinese for Beginners", ep: 8, lang: "Chinese", subs: 145 },
    { title: "Japanese Daily Phrases", ep: 15, lang: "Japanese", subs: 178 },
  ];
  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Podcasts</h1>
        <Btn><Plus size={14}/> New Podcast</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {pods.map((p, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>ðŸŽ™ï¸</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{p.lang} â€¢ {p.ep} episodes</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.muted }}>ðŸ‘¥ {p.subs} subscribers</span>
              <Btn sm v="outline">View</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€â”€ Premium Content View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PremiumContentView() {
  return (
    <div style={{ padding: "20px 24px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Premium Content</h1>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>Exclusive content for premium subscribers</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {["Advanced Business English", "JLPT N5 Prep Course", "HSK 1 Complete Pack", "Conversational English Masterclass"].map((t, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: C.yellowLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star size={20} color={C.yellow}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{t}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Premium â€¢ Locked</div>
            </div>
            <Lock size={14} color={C.light}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€â”€ Import Files View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ImportFilesView() {
  const [files, setFiles] = useState([
    { name: "LISA_English_Stage1.docx", size: "2.3 MB", status: "success", records: 145, date: "2026-06-14" },
    { name: "LISA_English_Stage2.docx", size: "2.7 MB", status: "success", records: 160, date: "2026-06-14" },
    { name: "LISA_English_Stage3.docx", size: "3.1 MB", status: "processing", records: null, date: "2026-06-15" },
    { name: "Chinese_Stage1_Content.docx", size: "1.8 MB", status: "success", records: 120, date: "2026-06-10" },
    { name: "Chinese_Stage2_Content.docx", size: "2.1 MB", status: "error", records: null, date: "2026-06-10" },
    { name: "Japanese_Stage1_Content.docx", size: "1.9 MB", status: "success", records: 130, date: "2026-06-12" },
    { name: "Japanese_Stage2_Content.docx", size: "2.2 MB", status: "success", records: 142, date: "2026-06-12" },
    { name: "Japanese_Stage3_Content.docx", size: "2.5 MB", status: "pending", records: null, date: "â€”" },
  ]);
  const [drag, setDrag] = useState(false);

  const reimport = (name) => {
    setFiles(prev => prev.map(f => f.name === name ? { ...f, status: "processing", records: null } : f));
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.name === name ? { ...f, status: "success", records: Math.floor(Math.random() * 60) + 100 } : f));
    }, 1800);
  };

  const statusBadge = s => ({
    success: <Badge color="#065f46" bg="#d1fae5">success</Badge>,
    error: <Badge color="#991b1b" bg={C.redLight}>error</Badge>,
    processing: <Badge color="#92400e" bg={C.yellowLight}>processing</Badge>,
    pending: <Badge color={C.muted} bg="#f3f4f6">pending</Badge>,
  }[s]);

  const statusIcon = s => ({
    success: <CheckCircle size={14} color={C.green}/>,
    error: <AlertCircle size={14} color={C.red}/>,
    processing: <RefreshCw size={14} color={C.yellow} style={{ animation: "spin 1s linear infinite" }}/>,
    pending: <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.border}` }}/>,
  }[s]);

  return (
    <div style={{ padding: "20px 24px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Import Files</h1>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>Upload DOCX files (LISA / Chinese / Japanese content) to digitize into the database using Apache POI</p>

      {/* Upload Zone */}
      <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); }}
        style={{ border: `2px dashed ${drag ? C.primary : C.border}`, borderRadius: 10, padding: "32px 24px", textAlign: "center", background: drag ? C.primaryLight : "#fafafa", marginBottom: 20, transition: "all 0.2s", cursor: "pointer" }}>
        <Upload size={28} color={drag ? C.primary : C.light} style={{ margin: "0 auto 10px", display: "block" }}/>
        <div style={{ fontSize: 15, fontWeight: 600, color: drag ? C.primary : C.text, marginBottom: 4 }}>
          {drag ? "Drop files here" : "Drag & Drop DOCX files here"}
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px" }}>Supports .docx â€” LISA, Chinese, Japanese content formats (Apache POI parser)</p>
        <Btn v="outline">Browse Files</Btn>
      </div>

      {/* Files Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Imported Files ({files.length})</span>
          <span style={{ fontSize: 12, color: C.muted }}>{files.filter(f => f.status === "success").length} / {files.length} completed</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 100px 90px 110px", padding: "9px 16px", background: "#f9fafb", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted, gap: 12, textTransform: "uppercase" }}>
          <span>File</span><span>Size</span><span>Records</span><span>Status</span><span>Date</span><span>Actions</span>
        </div>
        {files.map((f, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 100px 90px 110px", padding: "11px 16px", borderBottom: i < files.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13, alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {statusIcon(f.status)}
              <span style={{ fontWeight: 500, color: C.text, fontSize: 12 }}>{f.name}</span>
            </div>
            <span style={{ color: C.muted, fontSize: 12 }}>{f.size}</span>
            <span style={{ color: C.muted, fontSize: 12 }}>{f.records ? f.records.toLocaleString() : "â€”"}</span>
            {statusBadge(f.status)}
            <span style={{ color: C.muted, fontSize: 12 }}>{f.date}</span>
            <Btn sm v="outline" onClick={() => reimport(f.name)}><RefreshCw size={11}/> Re-import</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€â”€ DOCX Preview View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DocxPreviewView() {
  const [sel, setSel] = useState("LISA_English_Stage1.docx");
  const content = {
    "LISA_English_Stage1.docx": { title: "English Stage 1 â€” Beginner", lessons: [
      { title: "Lesson 1: Greetings", content: "Hello / Hi / Good morning / Good afternoon / Good evening...", questions: 5 },
      { title: "Lesson 2: Numbers 1â€“10", content: "One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten", questions: 4 },
    ]},
  };
  const preview = content[sel] || content["LISA_English_Stage1.docx"];
  return (
    <div style={{ padding: "20px 24px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>DOCX Preview</h1>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px" }}>Preview imported content before pushing to database</p>
      <select value={sel} onChange={e => setSel(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: "#fff", marginBottom: 16, outline: "none" }}>
        {["LISA_English_Stage1.docx", "Chinese_Stage1_Content.docx", "Japanese_Stage1_Content.docx"].map(f => <option key={f}>{f}</option>)}
      </select>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: "#f0f9ff", borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14, color: C.primary, display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={14}/> {preview.title}
        </div>
        {preview.lessons.map((l, i) => (
          <div key={i} style={{ padding: "14px 16px", borderBottom: `1px solid ${C.borderLight}` }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 6 }}>{l.title}</div>
            <div style={{ fontSize: 12, color: C.muted, background: "#f9fafb", padding: "8px 12px", borderRadius: 5, marginBottom: 8, fontFamily: "monospace" }}>{l.content}</div>
            <Badge color="#5b21b6" bg="#ede9fe">{l.questions} AI questions</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€â”€ Prompt Templates View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PromptTemplatesView() {
  const [templates, setTemplates] = useState([
    { id: 1, name: "Generate MCQ Questions", cat: "Assessment", model: "claude-sonnet-4-6", tokens: 800, active: true },
    { id: 2, name: "Summarize Lesson Topic", cat: "Content", model: "claude-sonnet-4-6", tokens: 400, active: true },
    { id: 3, name: "Create Dialog Practice", cat: "Speaking", model: "claude-sonnet-4-6", tokens: 600, active: true },
    { id: 4, name: "Vocabulary Flashcards", cat: "Vocabulary", model: "claude-haiku-4-5-20251001", tokens: 300, active: false },
    { id: 5, name: "Grammar Explanation", cat: "Grammar", model: "claude-sonnet-4-6", tokens: 500, active: true },
    { id: 6, name: "Pronunciation Guide", cat: "Speaking", model: "claude-sonnet-4-6", tokens: 350, active: false },
  ]);
  const toggle = id => setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Prompt Templates</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Configure AI prompts for automated content generation via Claude API</p>
        </div>
        <Btn><Plus size={14}/> New Template</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {templates.map(t => (
          <div key={t.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 6 }}>{t.name}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge color="#5b21b6" bg="#ede9fe">{t.cat}</Badge>
                  <Badge color="#374151" bg="#f3f4f6" style={{ fontSize: 10 }}>{t.model}</Badge>
                </div>
              </div>
              <button onClick={() => toggle(t.id)} style={{ width: 38, height: 22, borderRadius: 11, background: t.active ? C.primary : "#d1d5db", border: "none", cursor: "pointer", position: "relative", flexShrink: 0 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: t.active ? 19 : 3, transition: "left 0.2s" }}/>
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, display: "flex", gap: 16 }}>
              <span>Max tokens: <strong style={{ color: C.text }}>{t.tokens}</strong></span>
              <span>Status: <strong style={{ color: t.active ? C.green : C.muted }}>{t.active ? "Active" : "Inactive"}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€â”€ Generated Questions View (AI-powered) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GeneratedQuestionsView() {
  const [lang, setLang] = useState("English");
  const [level, setLevel] = useState("Beginner");
  const [topic, setTopic] = useState("Daily Greetings and Introductions");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState({});

  const generate = async () => {
    setLoading(true); setError(null); setQuestions(null); setSelected({});
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: `Generate exactly ${count} multiple-choice questions for ${lang} language learners at ${level} level on the topic: "${topic}".

Return ONLY a valid JSON array with no markdown or explanation:
[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A) ...","explanation":"Brief tip"}]` }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setQuestions(JSON.parse(clean));
    } catch (err) {
      setError("Failed to generate questions. Check your API connection and try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Generated Questions</h1>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>AI-powered MCQ generation using Claude API for language learning assessments</p>

      {/* Config Card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, color: C.primary, marginBottom: 16 }}>
          <Zap size={15}/> Question Generator â€” Claude AI
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[["Language", lang, setLang, ["English", "Chinese", "Japanese"]],
            ["Level", level, setLevel, ["Beginner", "Intermediate", "Advanced"]],
          ].map(([label, val, fn, opts]) => (
            <div key={label}>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: "block", marginBottom: 4 }}>{label}</label>
              <select value={val} onChange={e => fn(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: "#fff", outline: "none" }}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: "block", marginBottom: 4 }}>Questions: {count}</label>
            <input type="range" min={2} max={8} step={1} value={count} onChange={e => setCount(+e.target.value)} style={{ width: "100%", marginTop: 6 }}/>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: "block", marginBottom: 4 }}>Topic / Lesson Title</label>
          <input value={topic} onChange={e => setTopic(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }}/>
        </div>
        <Btn onClick={generate} disabled={loading || !topic.trim()}>
          {loading ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }}/> : <Zap size={14}/>}
          {loading ? "Generating with Claude AI..." : "Generate Questions"}
        </Btn>
      </div>

      {error && (
        <div style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "12px 16px", display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
          <AlertCircle size={15} color={C.red}/>
          <span style={{ fontSize: 13, color: "#991b1b" }}>{error}</span>
        </div>
      )}

      {loading && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 40, textAlign: "center" }}>
          <RefreshCw size={24} color={C.primary} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }}/>
          <div style={{ fontSize: 14, color: C.muted }}>Generating {count} {level} {lang} questions on "{topic}"...</div>
        </div>
      )}

      {questions && !loading && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: C.muted }}>
              <strong style={{ color: C.text }}>{questions.length} questions</strong> â€¢ {lang} â€¢ {level} â€¢ "{topic}"
            </div>
            <Btn sm v="outline" onClick={() => { setQuestions(null); setSelected({}); }}>Clear</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q, qi) => (
              <div key={qi} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>
                  Q{qi + 1}. {q.question}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {q.options?.map((opt, oi) => {
                    const isAnswer = opt === q.answer;
                    const isSelected = selected[qi] === oi;
                    const showResult = selected[qi] !== undefined;
                    return (
                      <button key={oi} onClick={() => setSelected(s => ({ ...s, [qi]: oi }))}
                        style={{ padding: "9px 12px", borderRadius: 6, fontSize: 13, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                          border: `1px solid ${showResult && isAnswer ? C.greenBorder : showResult && isSelected && !isAnswer ? C.redBorder : C.border}`,
                          background: showResult && isAnswer ? C.greenLight : showResult && isSelected && !isAnswer ? C.redLight : isSelected ? C.primaryLight : "#fafafa",
                          color: showResult && isAnswer ? "#065f46" : showResult && isSelected && !isAnswer ? "#991b1b" : C.text,
                        }}>
                        {showResult && isAnswer && <CheckCircle size={13} color={C.green} style={{ flexShrink: 0 }}/>}
                        {showResult && isSelected && !isAnswer && <AlertCircle size={13} color={C.red} style={{ flexShrink: 0 }}/>}
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {selected[qi] !== undefined && q.explanation && (
                  <div style={{ fontSize: 12, color: C.muted, background: "#f0f9ff", padding: "8px 12px", borderRadius: 5, borderLeft: `3px solid ${C.primary}` }}>
                    ðŸ’¡ {q.explanation}
                  </div>
                )}
                {selected[qi] === undefined && (
                  <div style={{ fontSize: 11, color: C.light, fontStyle: "italic" }}>Click an option to check your answer</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Main App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function App() {
  const [active, setActive] = useState("live-rooms");

  const renderView = () => {
    switch (active) {
      case "users": return <UsersView/>;
      case "courses": return <CoursesView/>;
      case "course-runs": return <CourseRunsView/>;
      case "chapters": return <ChaptersView/>;
      case "lessons": return <LessonsView/>;
      case "live-rooms": return <LiveRoomsView/>;
      case "podcasts": return <PodcastsView/>;
      case "premium-content": return <PremiumContentView/>;
      case "import-files": return <ImportFilesView/>;
      case "docx-preview": return <DocxPreviewView/>;
      case "prompt-templates": return <PromptTemplatesView/>;
      case "generated-questions": return <GeneratedQuestionsView/>;
      default: return <LiveRoomsView/>;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: 14, color: C.text, overflow: "hidden" }}>
      <Sidebar active={active} setActive={setActive}/>
      <main style={{ flex: 1, overflowY: "auto", background: C.bg }}>
        {renderView()}
      </main>
    </div>
  );
}

function CourseRunsView() {
  const runs = [
    { course: "English Stage 1", host: "Mr.John", start: "09:00", students: 12, status: "live" },
    { course: "Chinese Stage 1", host: "TeacherLi", start: "10:30", students: 8, status: "scheduled" },
    { course: "Japanese Stage 1", host: "Sensei Tanaka", start: "14:00", students: 15, status: "live" },
    { course: "English Stage 2", host: "Mr.John", start: "16:00", students: 0, status: "scheduled" },
  ];
  return (
    <div style={{ padding: "20px 24px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Course Runs</h1>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>Active and scheduled live course sessions</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {runs.map((r, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${r.status === "live" ? C.greenBorder : C.border}`, borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.status === "live" ? C.green : C.light, flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{r.course}</div>
              <div style={{ fontSize: 12, color: C.muted }}>Host: {r.host} â€¢ Start: {r.start}</div>
            </div>
            <Badge color={r.status === "live" ? "#065f46" : "#374151"} bg={r.status === "live" ? "#d1fae5" : "#f3f4f6"}>{r.status}</Badge>
            <span style={{ fontSize: 12, color: C.muted }}>{r.students} students</span>
            <Btn sm v={r.status === "live" ? "primary" : "secondary"}>{r.status === "live" ? "Join" : "Schedule"}</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Users View -------------------------------------------------------------
function UsersView() {
  const [users, setUsers] = useState([
    { id: 1, name: "Nguyen_An", email: "an@lucy.edu", phone: "0901234567", role: "Anonymous Student", active: true },
    { id: 2, name: "Mr.John", email: "john@lucy.edu", phone: "0912345678", role: "Teacher", active: true },
    { id: 3, name: "Thao_Reviewer", email: "thao@lucy.edu", phone: "0923456789", role: "Influencer", active: false },
  ]);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("Anonymous Student");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newName) return;
    
    if (editingId) {
      setUsers(users.map(u => u.id === editingId ? { ...u, name: newName, email: newEmail, phone: newPhone, role: newRole } : u));
      setEditingId(null);
    } else {
      setUsers([...users, { id: Date.now(), name: newName, email: newEmail, phone: newPhone, role: newRole, active: true }]);
    }
    setNewName(""); setNewEmail(""); setNewPhone(""); setNewRole("Anonymous Student");
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setNewName(u.name);
    setNewEmail(u.email || "");
    setNewPhone(u.phone || "");
    setNewRole(u.role);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName(""); setNewEmail(""); setNewPhone(""); setNewRole("Anonymous Student");
  };

  const deleteUser = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>User Management</h1>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>Quản lý danh sách người dùng LUCY (Học viên ẩn danh, Giảng viên, Influencer)</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: 20 }}>
        {/* Form Add / Edit */}
        <SectionCard style={{ alignSelf: "start" }}>
          <CardHead icon={editingId ? <Settings size={13}/> : <Plus size={13}/>} title={editingId ? "Sửa Người dùng" : "Thêm Người dùng mới"}/>
          <form onSubmit={handleSubmit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4, display: "block" }}>Tên người dùng (*)</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nhập tên..." required style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4, display: "block" }}>Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Nhập email..." style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4, display: "block" }}>Số điện thoại</label>
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Nhập SĐT..." style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4, display: "block" }}>Vai trò (Role)</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                <option value="Anonymous Student">Học viên ẩn danh</option>
                <option value="Teacher">Giảng viên (Teacher)</option>
                <option value="Influencer">Người ảnh hưởng (Influencer)</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Btn type="submit" fullWidth>{editingId ? "Cập nhật" : "Thêm mới"}</Btn>
              {editingId && <Btn type="button" v="secondary" onClick={cancelEdit}>Hủy</Btn>}
            </div>
          </form>
        </SectionCard>

        {/* List Users */}
        <SectionCard>
          <CardHead icon={<Users size={13}/>} title={`Danh sách người dùng (${users.length})`}/>
          <div style={{ padding: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.borderLight}`, textAlign: "left" }}>
                  <th style={{ padding: "8px 0", color: C.muted, fontWeight: 600 }}>Tên</th>
                  <th style={{ padding: "8px 0", color: C.muted, fontWeight: 600 }}>Liên hệ</th>
                  <th style={{ padding: "8px 0", color: C.muted, fontWeight: 600 }}>Vai trò</th>
                  <th style={{ padding: "8px 0", color: C.muted, fontWeight: 600 }}>Trạng thái</th>
                  <th style={{ padding: "8px 0", textAlign: "right", color: C.muted, fontWeight: 600 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: "10px 0", fontWeight: 500, color: C.text }}>{u.name}</td>
                    <td style={{ padding: "10px 0", color: C.muted, fontSize: 12 }}>
                      <div>{u.email || <i style={{color: '#ccc'}}>Chưa có email</i>}</div>
                      <div>{u.phone || <i style={{color: '#ccc'}}>Chưa có SĐT</i>}</div>
                    </td>
                    <td style={{ padding: "10px 0" }}>
                      <Badge bg={u.role === "Teacher" ? C.purpleLight : u.role === "Influencer" ? C.yellowLight : C.primaryLight} color={u.role === "Teacher" ? C.purple : u.role === "Influencer" ? "#b45309" : C.primary}>
                        {u.role}
                      </Badge>
                    </td>
                    <td style={{ padding: "10px 0" }}>
                      {u.active ? <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={12}/> Active</span> : <span style={{ color: C.muted, display: "flex", alignItems: "center", gap: 4 }}><AlertCircle size={12}/> Inactive</span>}
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right" }}>
                      <button type="button" onClick={() => startEdit(u)} style={{ background: "none", border: "none", color: C.primary, cursor: "pointer", padding: 4, marginRight: 8 }}><Settings size={14}/></button>
                      <button type="button" onClick={() => deleteUser(u.id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", padding: 4 }}><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px 0", color: C.muted }}>Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
