import { useState } from "react";
import {
  BookOpen, Play, FileText, Headphones, Upload, Eye, Zap,
  MessageSquare, Mic, Users, Radio, Pin, PhoneOff, Phone,
  Plus, Star, Volume2, Layers, RefreshCw, Trash2,
  CheckCircle, AlertCircle, Info, ChevronRight, Settings,
  Globe, Lock, Database, Award
} from "lucide-react";

// ─── Design Tokens ───────────────────────────────────────────────
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

// ─── Primitives ──────────────────────────────────────────────────
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

// ─── Sidebar ─────────────────────────────────────────────────────
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
  ];
  return (
    <aside style={{ width: 210, minWidth: 210, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", height: "100vh", overflowY: "auto", flexShrink: 0 }}>
      <div style={{ padding: "16px 16px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🎵</div>
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

// ─── Live Rooms View ──────────────────────────────────────────────
function LiveRoomsView() {
  const [audioConnected, setAudioConnected] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [pinned, setPinned] = useState([]);
  const [ended, setEnded] = useState(false);
  const [topicIdx, setTopicIdx] = useState(-1);

  const topics = ["Topic 1: Introducing Yourself", "Topic 2: Asking for Directions", "Topic 3: Ordering at a Restaurant", "Topic 4: Shopping Phrases", "Topic 5: At the Doctor"];
  const lessons = ["Lesson 1 – Greetings & Farewells", "Lesson 2 – Numbers 1–20", "Lesson 3 – Colors & Shapes", "Lesson 4 – Family Members", "Lesson 5 – Daily Routines"];
  const demoNames = ["Nguyen_An", "Tran_Binh", "Le_Cuong", "Pham_Dung", "Hoang_Thi"];
  const currentTopic = topicIdx >= 0 ? topics[topicIdx] : null;

  const nextTopic = () => setTopicIdx(i => (i + 1) % topics.length);
  const addParticipant = () => {
    const avail = demoNames.filter(n => !participants.find(p => p.name === n));
    if (avail.length) setParticipants(prev => [...prev, { name: avail[0], role: "Student" }]);
  };
  const pinMaterial = () => {
    if (!selectedLesson) return;
    setPinned(prev => [...prev, { lesson: selectedLesson, title: customTitle || selectedLesson, id: Date.now() }]);
    setSelectedLesson(""); setCustomTitle("");
  };

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Room: English Beginner – Daily Conversation</h1>
        <span style={{ padding: "4px 12px", background: C.primary, color: "#fff", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>PRJ301 Demo</span>
      </div>

      {/* Mock Banner */}
      <div style={{ background: C.yellowLight, border: `1px solid ${C.yellowBorder}`, borderRadius: 6, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Info size={14} color={C.yellow} style={{ marginTop: 1, flexShrink: 0 }}/>
        <span style={{ fontSize: 12, color: "#92400e" }}><strong>Mock Room:</strong> This simulates a LUCY live audio room. No real-time audio. State changes via form submissions.</span>
      </div>

      {/* Room Container */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {/* Room Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: C.text }}>English Beginner – Daily Conversation</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge color="#374151" bg="#f3f4f6">EN</Badge>
              <Badge color="#065f46" bg="#d1fae5">⭐ Live</Badge>
              <Badge color="#1e40af" bg={C.primaryLight}><Globe size={10}/> Public</Badge>
            </div>
          </div>
          <Btn onClick={() => setEnded(e => !e)} v={ended ? "outline" : "danger"}>■ {ended ? "Restart Room" : "End Room"}</Btn>
        </div>

        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6, display: "flex", gap: 20 }}>
          <span>👤 Host: <strong style={{ color: C.text }}>SenseiMiko</strong></span>
          <span>📚 Course: <strong style={{ color: C.text }}>English Stage 1</strong></span>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px" }}>Practice everyday English conversation with SenseiMiko</p>

        {ended && (
          <div style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991b1b", display: "flex", gap: 8, alignItems: "center" }}>
            <AlertCircle size={14}/> Room has been ended. All participants have been disconnected.
          </div>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionCard>
              <CardHead accent icon={<Radio size={13}/>} title="Current Lesson (Active Stage)"
                action={<Btn sm onClick={nextTopic}>&raquo; Next Topic</Btn>}
              />
              <div style={{ padding: 14 }}>
                {currentTopic
                  ? <div style={{ background: C.primaryLight, border: `1px solid ${C.primaryBorder}`, borderRadius: 6, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, color: C.light, marginBottom: 3 }}>Active Topic</div>
                      <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{currentTopic}</div>
                    </div>
                  : <p style={{ fontSize: 13, color: C.light, fontStyle: "italic", margin: 0 }}>No active topic selected. Add/select a course chapter to initialize topics.</p>
                }
              </div>
            </SectionCard>

            <SectionCard>
              <CardHead icon={<Users size={13}/>} title={`Participants (${participants.length})`}/>
              <div style={{ padding: "10px 14px" }}>
                <button onClick={addParticipant} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: 13, width: "100%", textAlign: "left" }}>
                  ▶ Direct Add (Host/Admin)
                </button>
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, width: "100%", textAlign: "left" }}>
                  ☐ Request to Join (Visitor Simulation)
                </button>
                {participants.length > 0 && (
                  <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: C.light, textTransform: "uppercase", marginBottom: 6 }}>
                      <span>As User</span><span>Role</span>
                    </div>
                    {participants.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${C.borderLight}`, fontSize: 13 }}>
                        <span>👤 {p.name}</span>
                        <Badge color="#374151" bg="#f3f4f6">{p.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SectionCard>
              <CardHead icon={<Volume2 size={13}/>} title="Real-time Audio (Agora)"
                action={<span style={{ fontSize: 12, fontWeight: 500, color: audioConnected ? C.green : C.red }}>{audioConnected ? "● Connected" : "○ Disconnected"}</span>}
              />
              <div style={{ padding: 14 }}>
                <button onClick={() => setAudioConnected(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: 8, background: audioConnected ? C.redLight : C.greenLight, color: audioConnected ? C.red : C.green, border: `1px solid ${audioConnected ? C.redBorder : C.greenBorder}`, borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  {audioConnected ? <><PhoneOff size={14}/> Disconnect</> : <><Phone size={14}/> Connect</>}
                </button>
                <div style={{ marginTop: 10, fontSize: 12, color: C.light, textAlign: "right" }}>
                  Channel: <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>lucy_room_1</code> | Token API: <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>Mock</code>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <CardHead icon={<Pin size={13}/>} title="Pinned Materials"/>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: selectedLesson ? C.text : C.light, background: "#fff", outline: "none" }}>
                  <option value="">— Select Lesson to Pin —</option>
                  {lessons.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Custom title (optional)" style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }}/>
                <Btn onClick={pinMaterial} disabled={!selectedLesson} fullWidth><Pin size={13}/> Pin Material</Btn>
                {pinned.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.light, textTransform: "uppercase", marginBottom: 6 }}>Pinned ({pinned.length})</div>
                    {pinned.map(m => (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: C.primaryLight, borderRadius: 5, marginBottom: 4, fontSize: 12 }}>
                        <Pin size={11} color={C.primary}/>
                        <span style={{ flex: 1, color: C.text }}>{m.title}</span>
                        <button onClick={() => setPinned(prev => prev.filter(x => x.id !== m.id))} style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Courses View ─────────────────────────────────────────────────
function CoursesView() {
  const courses = [
    { lang: "🇬🇧", name: "English Stage 1", level: "Beginner", lessons: 20, students: 145, status: "active" },
    { lang: "🇬🇧", name: "English Stage 2", level: "Intermediate", lessons: 25, students: 89, status: "active" },
    { lang: "🇬🇧", name: "English Stage 3", level: "Advanced", lessons: 30, students: 43, status: "draft" },
    { lang: "🇨🇳", name: "Chinese Stage 1", level: "Beginner", lessons: 18, students: 67, status: "active" },
    { lang: "🇨🇳", name: "Chinese Stage 2", level: "Intermediate", lessons: 22, students: 31, status: "active" },
    { lang: "🇯🇵", name: "Japanese Stage 1", level: "Beginner", lessons: 20, students: 52, status: "active" },
    { lang: "🇯🇵", name: "Japanese Stage 2", level: "Intermediate", lessons: 24, students: 28, status: "draft" },
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

// ─── Chapters View ────────────────────────────────────────────────
function ChaptersView() {
  const chapters = [
    { course: "English Stage 1", chapter: "Chapter 1: Hello World", topics: 5, complete: true },
    { course: "English Stage 1", chapter: "Chapter 2: My Family", topics: 4, complete: true },
    { course: "English Stage 1", chapter: "Chapter 3: At School", topics: 6, complete: false },
    { course: "English Stage 2", chapter: "Chapter 1: City Life", topics: 5, complete: true },
    { course: "Chinese Stage 1", chapter: "第一章: 你好", topics: 4, complete: true },
    { course: "Japanese Stage 1", chapter: "第1章: はじめまして", topics: 5, complete: false },
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

// ─── Lessons View ─────────────────────────────────────────────────
function LessonsView() {
  const lessons = [
    { id: "EN-L01", title: "Greetings & Farewells", chapter: "Ch.1", lang: "English", duration: "15 min", level: "Beginner" },
    { id: "EN-L02", title: "Numbers 1–20", chapter: "Ch.1", lang: "English", duration: "20 min", level: "Beginner" },
    { id: "EN-L03", title: "Colors & Shapes", chapter: "Ch.2", lang: "English", duration: "18 min", level: "Beginner" },
    { id: "CH-L01", title: "你好 — Saying Hello", chapter: "Ch.1", lang: "Chinese", duration: "15 min", level: "Beginner" },
    { id: "JP-L01", title: "はじめまして — Introductions", chapter: "Ch.1", lang: "Japanese", duration: "15 min", level: "Beginner" },
  ];
  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Lessons</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Individual lesson units (10–20 min segments)</p>
        </div>
        <Btn><Plus size={14}/> New Lesson</Btn>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 80px 90px 80px", padding: "10px 16px", background: "#f9fafb", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted, gap: 12, textTransform: "uppercase" }}>
          <span>ID</span><span>Title</span><span>Chapter</span><span>Language</span><span>Duration</span><span>Level</span>
        </div>
        {lessons.map((l, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 80px 90px 80px", padding: "11px 16px", borderBottom: i < lessons.length - 1 ? `1px solid ${C.borderLight}` : "none", fontSize: 13, alignItems: "center", gap: 12 }}>
            <code style={{ fontSize: 11, background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{l.id}</code>
            <span style={{ fontWeight: 500, color: C.text }}>{l.title}</span>
            <span style={{ color: C.muted }}>{l.chapter}</span>
            <span style={{ color: C.muted }}>{l.lang}</span>
            <span style={{ color: C.muted }}>{l.duration}</span>
            <Badge color="#374151" bg="#f3f4f6" style={{ fontSize: 10 }}>{l.level}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Podcasts View ────────────────────────────────────────────────
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
            <div style={{ width: 48, height: 48, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>🎙️</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{p.lang} • {p.ep} episodes</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.muted }}>👥 {p.subs} subscribers</span>
              <Btn sm v="outline">View</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Premium Content View ─────────────────────────────────────────
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
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Premium • Locked</div>
            </div>
            <Lock size={14} color={C.light}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Import Files View ────────────────────────────────────────────
function ImportFilesView() {
  const [files, setFiles] = useState([
    { name: "LISA_English_Stage1.docx", size: "2.3 MB", status: "success", records: 145, date: "2026-06-14" },
    { name: "LISA_English_Stage2.docx", size: "2.7 MB", status: "success", records: 160, date: "2026-06-14" },
    { name: "LISA_English_Stage3.docx", size: "3.1 MB", status: "processing", records: null, date: "2026-06-15" },
    { name: "Chinese_Stage1_Content.docx", size: "1.8 MB", status: "success", records: 120, date: "2026-06-10" },
    { name: "Chinese_Stage2_Content.docx", size: "2.1 MB", status: "error", records: null, date: "2026-06-10" },
    { name: "Japanese_Stage1_Content.docx", size: "1.9 MB", status: "success", records: 130, date: "2026-06-12" },
    { name: "Japanese_Stage2_Content.docx", size: "2.2 MB", status: "success", records: 142, date: "2026-06-12" },
    { name: "Japanese_Stage3_Content.docx", size: "2.5 MB", status: "pending", records: null, date: "—" },
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
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px" }}>Supports .docx — LISA, Chinese, Japanese content formats (Apache POI parser)</p>
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
            <span style={{ color: C.muted, fontSize: 12 }}>{f.records ? f.records.toLocaleString() : "—"}</span>
            {statusBadge(f.status)}
            <span style={{ color: C.muted, fontSize: 12 }}>{f.date}</span>
            <Btn sm v="outline" onClick={() => reimport(f.name)}><RefreshCw size={11}/> Re-import</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DOCX Preview View ────────────────────────────────────────────
function DocxPreviewView() {
  const [sel, setSel] = useState("LISA_English_Stage1.docx");
  const content = {
    "LISA_English_Stage1.docx": { title: "English Stage 1 — Beginner", lessons: [
      { title: "Lesson 1: Greetings", content: "Hello / Hi / Good morning / Good afternoon / Good evening...", questions: 5 },
      { title: "Lesson 2: Numbers 1–10", content: "One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten", questions: 4 },
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

// ─── Prompt Templates View ────────────────────────────────────────
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

// ─── Generated Questions View (AI-powered) ───────────────────────
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
          <Zap size={15}/> Question Generator — Claude AI
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
              <strong style={{ color: C.text }}>{questions.length} questions</strong> • {lang} • {level} • "{topic}"
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
                    💡 {q.explanation}
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

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("live-rooms");

  const renderView = () => {
    switch (active) {
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
    { course: "English Stage 1", host: "SenseiMiko", start: "09:00", students: 12, status: "live" },
    { course: "Chinese Stage 1", host: "TeacherLi", start: "10:30", students: 8, status: "scheduled" },
    { course: "Japanese Stage 1", host: "Sensei Tanaka", start: "14:00", students: 15, status: "live" },
    { course: "English Stage 2", host: "SenseiMiko", start: "16:00", students: 0, status: "scheduled" },
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
              <div style={{ fontSize: 12, color: C.muted }}>Host: {r.host} • Start: {r.start}</div>
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
