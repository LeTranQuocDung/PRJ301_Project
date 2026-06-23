import { useState, useEffect, useRef } from "react";
import {
  Volume2, Phone, RefreshCw, Mic, PhoneOff, Info, Radio,
  Pin, Globe, MessageSquare, Users, AlertCircle, ChevronLeft,
  CheckCircle, Clock, Hand
} from "lucide-react";
import { Btn, CardHead, SectionCard, Badge, C, AGORA_APP_ID, AGORA_CHANNEL, AGORA_TEMP_TOKEN } from "./App";
import { api } from "./apiClient";

/* ─── Tiny helpers ─── */
const InfoRow = ({ label, value }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "7px 0", borderBottom: `1px solid ${C.borderLight}`, fontSize: 13
  }}>
    <span style={{ color: C.muted }}>{label}</span>
    <span style={{ fontWeight: 600, color: C.text }}>{value}</span>
  </div>
);

const UserChip = ({ avatar, name, badge, badgeColor, badgeBg }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 12px", borderRadius: 8,
    background: badgeBg || "#f8fafc",
    border: `1px solid ${C.border}`,
    marginBottom: 6, fontSize: 13
  }}>
    <span style={{ fontSize: 18 }}>{avatar}</span>
    <span style={{ flex: 1, fontWeight: 500, color: C.text }}>{name}</span>
    {badge && <Badge color={badgeColor} bg={badgeBg}>{badge}</Badge>}
  </div>
);

export default function InRoomView({ roomId, currentUser, onLeave }) {
  const [room, setRoom] = useState(null);
  const [uid] = useState(() => Math.floor(Math.random() * 99999) + 1);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);
  const micRef = useRef(null);

  const [topicIdx, setTopicIdx] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [pinned, setPinned] = useState([]);

  const [handRaiseStatus, setHandRaiseStatus] = useState("");
  const [handRaiseQueue, setHandRaiseQueue] = useState([]);

  const topics = [
    "Topic 1: Introducing Yourself",
    "Topic 2: Asking for Directions",
    "Topic 3: Ordering at a Restaurant",
    "Topic 4: Shopping Phrases",
    "Topic 5: At the Doctor"
  ];

  const lessons = [
    "Lesson 1 - Greetings & Farewells",
    "Lesson 2 - Numbers 1-20",
    "Lesson 3 - Colors & Shapes",
    "Lesson 4 - Family Members",
    "Lesson 5 - Daily Routines"
  ];

  const currentTopic = topicIdx >= 0 ? topics[topicIdx] : null;
  const nextTopic = () => setTopicIdx(i => (i + 1) % topics.length);

  const pinMaterial = async () => {
    if (!selectedLesson) return;
    const title = customTitle || selectedLesson;
    try {
      const newPin = await api.rooms.pin(roomId, { title });
      setPinned(p => [...p, newPin]);
      setSelectedLesson("");
      setCustomTitle("");
    } catch (err) { console.error(err); }
  };

  const unpinMaterial = async (pinId) => {
    try {
      await api.rooms.unpin(roomId, pinId);
      setPinned(p => p.filter(x => x.id !== pinId));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const roomData = await api.rooms.get(roomId);
        setRoom(roomData);
        if (roomData) {
          setPinned(roomData.pinned || []);
          await api.rooms.join(roomId, currentUser.name);
        }
      } catch (err) { console.error(err); }
    };
    loadRoom();
    return () => { api.rooms.leave(roomId, currentUser.name); };
  }, [roomId]);

  useEffect(() => {
    if (typeof AgoraRTC === "undefined") {
      setError("Agora SDK chưa load. Kiểm tra kết nối internet.");
      return;
    }
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    client.on("user-published", async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack.play();
          setRemoteUsers(prev => prev.find(u => u.uid === user.uid) ? prev : [...prev, { uid: user.uid }]);
        }
      } catch (e) { console.error("Agora subscribe error", e); }
    });
    client.on("user-unpublished", user => setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid)));
    client.on("user-left", user => setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid)));
    clientRef.current = client;
    return () => { doLeave(); };
  }, []);

  const doLeave = async () => {
    if (micRef.current) { micRef.current.stop(); micRef.current.close(); micRef.current = null; }
    if (clientRef.current && joined) { await clientRef.current.leave(); }
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
      setError("Join voice thất bại: " + e.message);
    } finally { setJoining(false); }
  };

  const doToggleMute = async () => {
    if (micRef.current) { await micRef.current.setMuted(!muted); setMuted(m => !m); }
  };

  const handleEndRoom = async () => {
    if (window.confirm("Bạn có chắc chắn muốn kết thúc phòng này?")) {
      await doLeave(); await api.rooms.end(roomId); onLeave();
    }
  };

  const toggleHandRaise = () => {
    if (handRaiseStatus === "") {
      setHandRaiseStatus("waiting");
      setHandRaiseQueue(q => [...q, {
        id: `hr-${Date.now()}`, name: currentUser.name,
        avatar: currentUser.avatar || "🦊",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        role: currentUser.role, status: "waiting"
      }]);
    } else {
      setHandRaiseStatus("");
      setHandRaiseQueue(q => q.filter(x => x.name !== currentUser.name));
    }
  };

  const isHost = currentUser.role === "Teacher" || currentUser.role === "Influencer";

  const simulateHandRaise = () => {
    const names = ["Linh_Gia", "Hai_Dang", "Minh_Quan", "Phuong_Nhi", "Tuan_Anh"];
    const avatars = ["🦁", "🐙", "🐱", "🐨", "🐸"];
    const name = names[Math.floor(Math.random() * names.length)];
    if (handRaiseQueue.some(x => x.name === name)) return;
    setHandRaiseQueue(q => [...q, {
      id: `sim-${Date.now()}`, name,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      role: "Anonymous Student", status: "waiting"
    }]);
  };

  const allowSpeak = (id) => {
    setHandRaiseQueue(q => q.map(x => x.id === id ? { ...x, status: "speaking" } : x));
    const req = handRaiseQueue.find(x => x.id === id);
    if (req && req.name === currentUser.name) setHandRaiseStatus("speaking");
  };

  const lowerHand = (id) => {
    const req = handRaiseQueue.find(x => x.id === id);
    if (req && req.name === currentUser.name) setHandRaiseStatus("");
    setHandRaiseQueue(q => q.filter(x => x.id !== id));
  };

  if (!room) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          <p style={{ color: C.muted, fontSize: 14 }}>Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1280, margin: "0 auto" }}>

      {/* ── TOP HEADER BAR ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${C.border}`
      }}>
        {/* Left: back + title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={onLeave} style={{
            background: "none", border: "none", color: C.primary, fontWeight: 600,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
            padding: 0, fontSize: 13
          }}>
            <ChevronLeft size={15} /> Quay lại danh sách phòng
          </button>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>
              {room.title}
            </h1>
            <span style={{ fontSize: 12, color: C.muted }}>#{room.id}</span>
          </div>
          {/* Badges row */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Badge color="#374151" bg="#f3f4f6">{room.language}</Badge>
            <Badge color="#1e40af" bg={C.primaryLight}>
              <Globe size={10} style={{ marginRight: 2 }} />{room.visibility}
            </Badge>
            <Badge color="#5b21b6" bg="#ede9fe">{room.stage}</Badge>
            <Badge
              color={joined ? "#065f46" : "#6b7280"}
              bg={joined ? "#d1fae5" : "#f3f4f6"}
            >
              {joined ? "🔴 LIVE" : "⬤ Offline"}
            </Badge>
          </div>
        </div>

        {/* Right: host info + action */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <div style={{ fontSize: 12, color: C.muted }}>
            Host: <span style={{ fontWeight: 600, color: C.text }}>{room.host}</span>
          </div>
          {isHost ? (
            <Btn onClick={handleEndRoom} v="danger">Kết thúc phòng</Btn>
          ) : (
            <Btn onClick={onLeave} v="secondary">Rời phòng</Btn>
          )}
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div style={{
          background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 8,
          padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991b1b",
          display: "flex", gap: 8, alignItems: "center"
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── 3-COLUMN GRID  (left 1.05fr | center 1.5fr | right 1fr) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 1.5fr 1fr",
        gap: 16,
        alignItems: "start"
      }}>

        {/* ════════════════════════════════════
            COLUMN 1 – Voice Chat + Room Info
        ════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Voice Chat Card */}
          <SectionCard>
            <CardHead accent icon={<Volume2 size={13} />} title="Voice Chat (Agora RTC)"
              action={
                joined
                  ? <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>● LIVE · {remoteUsers.length + 1} online</span>
                  : <span style={{ fontSize: 12, color: C.muted }}>Chưa kết nối</span>
              }
            />
            <div style={{ padding: "14px 16px" }}>
              {/* Channel / UID meta */}
              <div style={{
                display: "flex", gap: 8, flexWrap: "wrap",
                marginBottom: 14, padding: "8px 10px",
                background: "#f8fafc", borderRadius: 6, fontSize: 12, color: C.muted
              }}>
                <span>Channel: <code style={{ background: "#e5e7eb", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>{AGORA_CHANNEL}</code></span>
                <span>UID: <code style={{ background: "#e5e7eb", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>{uid}</code></span>
              </div>

              {/* Join / Controls */}
              {!joined ? (
                <button onClick={doJoin} disabled={joining}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "11px 0",
                    background: joining ? "#9ca3af" : "linear-gradient(135deg,#2563eb,#7c3aed)",
                    color: "#fff", border: "none", borderRadius: 8,
                    fontSize: 14, fontWeight: 700,
                    cursor: joining ? "not-allowed" : "pointer",
                    boxShadow: joining ? "none" : "0 4px 12px rgba(37,99,235,0.25)"
                  }}>
                  {joining
                    ? <><RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> Đang kết nối...</>
                    : <><Phone size={15} /> Tham gia Voice Chat</>}
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={doToggleMute}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 6, padding: "9px 0",
                      background: muted ? C.redLight : C.greenLight,
                      color: muted ? C.red : C.green,
                      border: `1px solid ${muted ? C.redBorder : C.greenBorder}`,
                      borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer"
                    }}>
                    <Mic size={13} /> {muted ? "Bật mic" : "Tắt mic"}
                  </button>
                  <button onClick={doLeave}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 6, padding: "9px 0",
                      background: C.redLight, color: C.red, border: `1px solid ${C.redBorder}`,
                      borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer"
                    }}>
                    <PhoneOff size={13} /> Tắt Voice
                  </button>
                </div>
              )}

              {/* Online users list */}
              {joined && (
                <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: C.light,
                    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8
                  }}>Danh sách Micro</div>

                  <UserChip
                    avatar={currentUser.avatar || "👤"}
                    name={`Bạn (${currentUser.name})`}
                    badge={muted ? "Muted" : "🎙 Đang nói"}
                    badgeColor={muted ? "#991b1b" : "#065f46"}
                    badgeBg={muted ? C.redLight : "#d1fae5"}
                  />

                  {remoteUsers.map(u => (
                    <UserChip
                      key={u.uid}
                      avatar="👤"
                      name={`User #${u.uid}`}
                      badge="🎙 Nói"
                      badgeColor="#065f46"
                      badgeBg="#d1fae5"
                    />
                  ))}

                  {handRaiseQueue.filter(x => x.status === "speaking" && x.name !== currentUser.name).map(x => (
                    <UserChip
                      key={x.id}
                      avatar={x.avatar}
                      name={`${x.name} (Học viên)`}
                      badge="🎙 Phát biểu"
                      badgeColor={C.purple}
                      badgeBg={C.purpleLight}
                    />
                  ))}

                  {remoteUsers.length === 0 && handRaiseQueue.filter(x => x.status === "speaking").length === 0 && (
                    <p style={{ fontSize: 12, color: C.light, fontStyle: "italic", margin: "4px 0 0" }}>
                      Chưa có người nói khác...
                    </p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Room Info Card */}
          <SectionCard>
            <CardHead icon={<Info size={13} />} title="Thông tin phòng" />
            <div style={{ padding: "10px 16px 14px" }}>
              {[
                ["Host", room.host],
                ["Khoá học", room.course],
                ["Ngôn ngữ", room.language],
                ["Cấp độ", room.stage],
                ["Trạng thái", room.visibility],
              ].map(([k, v]) => <InfoRow key={k} label={k} value={v} />)}
            </div>
          </SectionCard>
        </div>

        {/* ════════════════════════════════════
            COLUMN 2 – Lesson Materials (WIDER)
        ════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Current Topic */}
          <SectionCard>
            <CardHead
              icon={<Radio size={13} />}
              title="Bài học đang học"
              action={isHost && (
                <Btn sm onClick={nextTopic}>» Chủ đề tiếp theo</Btn>
              )}
            />
            <div style={{ padding: "14px 16px" }}>
              {currentTopic ? (
                <div style={{
                  background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
                  border: `1px solid ${C.primaryBorder}`,
                  borderRadius: 10, padding: "14px 18px"
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: C.primary,
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6
                  }}>Chủ đề đàm thoại hiện tại</div>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{currentTopic}</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
                    Chủ đề {topicIdx + 1}/{topics.length}
                  </div>
                  {/* Progress bar */}
                  <div style={{ marginTop: 10, height: 4, background: "#e0e7ff", borderRadius: 2 }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      background: "linear-gradient(90deg, #2563eb, #7c3aed)",
                      width: `${((topicIdx + 1) / topics.length) * 100}%`,
                      transition: "width 0.4s ease"
                    }} />
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: C.light, fontStyle: "italic", margin: 0 }}>
                  Chưa bắt đầu bài học.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Pinned Materials */}
          <SectionCard>
            <CardHead icon={<Pin size={13} />} title="Tài liệu ghim (LMS Slide)" />
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Host: pin controls */}
              {isHost && (
                <div style={{
                  background: "#f8fafc", borderRadius: 8, border: `1px solid ${C.border}`,
                  padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 2 }}>
                    Ghim tài liệu mới
                  </div>
                  <select
                    value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 6,
                      border: `1px solid ${C.border}`, fontSize: 13, background: "#fff",
                      outline: "none", color: C.text
                    }}>
                    <option value="">-- Chọn bài học --</option>
                    {lessons.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input
                    value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                    placeholder="Tiêu đề tuỳ chỉnh (không bắt buộc)"
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 6,
                      border: `1px solid ${C.border}`, fontSize: 13, outline: "none",
                      boxSizing: "border-box", color: C.text
                    }}
                  />
                  <Btn onClick={pinMaterial} disabled={!selectedLesson} fullWidth>
                    <Pin size={13} /> Ghim tài liệu
                  </Btn>
                </div>
              )}

              {/* Pinned list */}
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: C.light,
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8
                }}>
                  Đã ghim ({pinned.length})
                </div>
                {pinned.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: "20px 0",
                    border: `1.5px dashed ${C.border}`, borderRadius: 8
                  }}>
                    <Pin size={20} color={C.light} style={{ marginBottom: 6 }} />
                    <p style={{ fontSize: 12, color: C.light, margin: 0 }}>Chưa ghim tài liệu nào.</p>
                  </div>
                ) : (
                  pinned.map(m => (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", background: C.primaryLight,
                      border: `1px solid ${C.primaryBorder}`, borderRadius: 7,
                      fontSize: 13, marginBottom: 6
                    }}>
                      <Pin size={12} color={C.primary} />
                      <span style={{ flex: 1, fontWeight: 500, color: C.text }}>{m.title}</span>
                      {isHost && (
                        <button onClick={() => unpinMaterial(m.id)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: C.red, fontSize: 16, lineHeight: 1, padding: "0 2px"
                          }}>×</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ════════════════════════════════════
            COLUMN 3 – Hand Raise & Interaction
        ════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Student: hand raise button */}
          {!isHost && (
            <SectionCard>
              <CardHead icon={<Hand size={13} />} title="Giơ tay phát biểu" />
              <div style={{ padding: "16px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                  Bấm nút bên dưới để đăng ký phát biểu với Mentor trong phòng.
                </p>

                {handRaiseStatus === "" && (
                  <button onClick={toggleHandRaise}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "11px 22px", borderRadius: 30,
                      background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                      color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                      cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                      width: "100%", justifyContent: "center"
                    }}>
                    ✋ Giơ tay phát biểu
                  </button>
                )}

                {handRaiseStatus === "waiting" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 16px", borderRadius: 8,
                      background: C.yellowLight, border: `1px solid ${C.yellowBorder}`,
                      width: "100%", justifyContent: "center"
                    }}>
                      <Clock size={14} color={C.yellow} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.yellow }}>
                        Đang chờ Mentor duyệt...
                      </span>
                    </div>
                    <button onClick={toggleHandRaise}
                      style={{
                        background: "none", border: `1px solid ${C.border}`,
                        color: C.muted, borderRadius: 6, padding: "6px 14px",
                        fontSize: 12, cursor: "pointer"
                      }}>
                      Huỷ đăng ký
                    </button>
                  </div>
                )}

                {handRaiseStatus === "speaking" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 16px", borderRadius: 8,
                      background: "#d1fae5", border: `1px solid ${C.greenBorder}`,
                      width: "100%", justifyContent: "center"
                    }}>
                      <CheckCircle size={14} color={C.green} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
                        🎙 Bạn đang được phát biểu!
                      </span>
                    </div>
                    <button onClick={toggleHandRaise}
                      style={{
                        background: C.redLight, border: `1px solid ${C.redBorder}`,
                        color: C.red, borderRadius: 6, padding: "7px 16px",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%"
                      }}>
                      Kết thúc phát biểu
                    </button>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Hand raise queue (host & student both see) */}
          <SectionCard>
            <CardHead
              icon={<Users size={13} />}
              title={`Hàng chờ giơ tay (${handRaiseQueue.length})`}
              action={isHost && (
                <Btn sm v="outline" onClick={simulateHandRaise}>+ Giả lập</Btn>
              )}
            />
            <div style={{ padding: "14px 16px" }}>
              {isHost && (
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
                  Duyệt hoặc hạ tay học viên bên dưới:
                </div>
              )}

              {handRaiseQueue.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "20px 0",
                  border: `1.5px dashed ${C.border}`, borderRadius: 8
                }}>
                  <Users size={20} color={C.light} style={{ marginBottom: 6 }} />
                  <p style={{ fontSize: 12, color: C.light, margin: 0 }}>Chưa có yêu cầu nào.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {handRaiseQueue.map(req => (
                    <div key={req.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px",
                      background: req.status === "speaking" ? "#d1fae5" : "#f8fafc",
                      border: `1px solid ${req.status === "speaking" ? C.greenBorder : C.border}`,
                      borderRadius: 8
                    }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{req.avatar}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {req.name}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {req.time} · {req.role}
                        </div>
                      </div>
                      {isHost ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                          {req.status !== "speaking" && (
                            <button onClick={() => allowSpeak(req.id)}
                              style={{
                                border: "none", background: C.green, color: "#fff",
                                borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer"
                              }}>Duyệt</button>
                          )}
                          <button onClick={() => lowerHand(req.id)}
                            style={{
                              border: "none", background: C.redLight, color: C.red,
                              borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer"
                            }}>Hạ tay</button>
                        </div>
                      ) : (
                        <Badge
                          color={req.status === "speaking" ? C.green : C.yellow}
                          bg={req.status === "speaking" ? "#d1fae5" : C.yellowLight}
                        >
                          {req.status === "speaking" ? "Đang nói" : "Đang chờ"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

        </div>
        {/* ── end grid ── */}
      </div>
    </div>
  );
}
