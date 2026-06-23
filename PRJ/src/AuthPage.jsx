import { useState } from "react";
import { api } from "./apiClient";

/* ── Tier definitions ── */
const TIERS = [
  {
    value: "Anonymous Student",
    label: "LUCY",
    sub: "Học viên ẩn danh",
    icon: "🦊",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.3)",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.3)",
  },
  {
    value: "Teacher",
    label: "LUCY Pro",
    sub: "Mentor / Giảng viên",
    icon: "🎓",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.3)",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.3)",
  },
  {
    value: "Influencer",
    label: "LUCY Super",
    sub: "Content Creator",
    icon: "⭐",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.3)",
  },
];

const DEMO = [
  { email: "student@lucy.edu", name: "Nguyen_An",    role: "Anonymous Student" },
  { email: "teacher@lucy.edu", name: "Mr.John",       role: "Teacher" },
  { email: "creator@lucy.edu", name: "Thao_Reviewer", role: "Influencer" },
];

const IS = { /* input style */
  width: "100%", padding: "12px 16px",
  borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)", color: "#f1f5f9",
  fontSize: 14, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color 0.2s, background 0.2s",
};

export default function AuthPage({ onAuthSuccess }) {
  const [tab, setTab]       = useState("login");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [name, setName]     = useState("");
  const [role, setRole]     = useState("Anonymous Student");
  const [err, setErr]       = useState("");
  const [loading, setLoad]  = useState(false);

  const switchTab = (t) => { setTab(t); setErr(""); };

  const handleDemo = (u) => { setEmail(u.email); setPass("123"); };

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setLoad(true);
    try {
      if (tab === "login") {
        onAuthSuccess(await api.auth.login(email, pass));
      } else {
        if (!name) throw new Error("Vui lòng nhập tên hiển thị!");
        const avatars = ["🦊","🐱","🐼","🦁","🐯","🐨","🐸","🐙","🦄"];
        const avatar  = role === "Anonymous Student"
          ? avatars[Math.floor(Math.random() * avatars.length)] : "👤";
        await api.auth.register({ email, password: pass, name, role, avatar });
        alert("Đăng ký thành công! Hãy đăng nhập.");
        switchTab("login");
      }
    } catch (e) { setErr(e.message); }
    finally { setLoad(false); }
  };

  const activeTier = TIERS.find(t => t.value === role) || TIERS[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .auth-root {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: stretch;
          font-family: 'Inter', sans-serif;
          background: #080b14;
          overflow: hidden;
        }

        /* ── LEFT PANEL ── */
        .auth-left {
          width: 44%;
          flex-shrink: 0;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 52px;
          background: linear-gradient(160deg, #0c0e20 0%, #180b30 55%, #0c1830 100%);
          overflow: hidden;
        }

        /* animated orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: 0.4;
          animation: orbFloat 9s ease-in-out infinite alternate;
        }
        @keyframes orbFloat {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(10px,-20px) scale(1.06); }
        }

        .auth-left-content { position: relative; z-index: 1; width: 100%; max-width: 380px; }

        /* shimmer text */
        .shimmer-text {
          background: linear-gradient(90deg,#60a5fa 0%,#c084fc 50%,#60a5fa 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3.5s linear infinite;
        }
        @keyframes shimmer {
          to { background-position: -200% center; }
        }

        /* grid dot pattern */
        .grid-pattern {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── RIGHT PANEL ── */
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          background: #0d1018;
          overflow-y: auto;
        }

        .auth-form-wrap {
          width: 100%;
          max-width: 420px;
          animation: fadeUp 0.55s ease both;
        }

        /* tab buttons */
        .tab-bar {
          display: flex;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 32px;
          gap: 4px;
        }
        .tab-btn {
          flex: 1; padding: 10px 0; border: none; border-radius: 9px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.2s ease; font-family: inherit;
        }
        .tab-btn.active {
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          color: #fff;
          box-shadow: 0 4px 14px rgba(124,58,237,0.35);
        }
        .tab-btn.inactive {
          background: transparent;
          color: rgba(255,255,255,0.4);
        }
        .tab-btn.inactive:hover { color: rgba(255,255,255,0.7); }

        /* inputs */
        .lucy-inp { transition: border-color 0.2s, background 0.2s; }
        .lucy-inp:focus {
          border-color: rgba(124,58,237,0.6) !important;
          background: rgba(255,255,255,0.08) !important;
          outline: none;
        }
        .lucy-inp::placeholder { color: rgba(255,255,255,0.25); }

        /* tier cards */
        .tier-card {
          flex: 1; padding: 12px 8px; border-radius: 12px;
          cursor: pointer; text-align: center;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .tier-card:hover { transform: translateY(-2px); }

        /* submit */
        .submit-btn {
          width: 100%; padding: 13px; border: none; border-radius: 11px;
          font-size: 15px; font-weight: 800; cursor: pointer;
          transition: all 0.2s ease; font-family: inherit;
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          color: #fff;
          box-shadow: 0 4px 16px rgba(124,58,237,0.28);
          letter-spacing: -0.01em;
        }
        .submit-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(124,58,237,0.38);
        }
        .submit-btn:disabled { background: #374151; box-shadow: none; cursor: not-allowed; }

        /* demo buttons */
        .demo-btn {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 10px 14px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03); cursor: pointer;
          text-align: left; transition: all 0.15s ease;
          font-family: inherit;
        }
        .demo-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
          transform: translateX(3px);
        }

        /* feature pills */
        .pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 16px; border-radius: 30px; font-size: 13px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.65);
          margin: 4px;
        }

        /* field label */
        .field-label {
          display: block; font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.5); letter-spacing: 0.07em;
          text-transform: uppercase; margin-bottom: 7px;
        }
      `}</style>

      <div className="auth-root">

        {/* ══════════ LEFT – BRANDING ══════════ */}
        <div className="auth-left">
          {/* Background elements */}
          <div className="grid-pattern" />
          <div className="orb" style={{ width:340, height:340, top:"-100px", left:"-80px", background:"#3b82f6", animationDelay:"0s" }} />
          <div className="orb" style={{ width:300, height:300, top:"45%", left:"50%", background:"#7c3aed", animationDelay:"2.5s", animationDuration:"11s" }} />
          <div className="orb" style={{ width:220, height:220, bottom:"-60px", left:"-40px", background:"#f59e0b", animationDelay:"5s", animationDuration:"13s" }} />

          <div className="auth-left-content" style={{ animation:"fadeUp 0.9s ease" }}>
            {/* Logo */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:12,
              background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:16, padding:"10px 20px", marginBottom:40, backdropFilter:"blur(10px)",
            }}>
              <div style={{
                width:38, height:38, borderRadius:10,
                background:"linear-gradient(135deg,#2563eb,#7c3aed)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, boxShadow:"0 4px 12px rgba(124,58,237,0.5)",
              }}>🎵</div>
              <span style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.04em" }}
                className="shimmer-text">LUCY</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize:40, fontWeight:900, color:"#fff",
              lineHeight:1.18, letterSpacing:"-0.04em", margin:"0 0 14px",
            }}>
              Học ngôn ngữ<br/>
              <span className="shimmer-text">không giới hạn</span>
            </h1>

            <p style={{
              fontSize:14.5, color:"rgba(255,255,255,0.48)",
              lineHeight:1.75, maxWidth:340, margin:"0 0 40px",
            }}>
              Mạng xã hội âm thanh kết hợp EdTech – kết nối người học qua cơ chế
              ẩn danh, giảm áp lực tâm lý.
            </p>

            {/* Feature pills */}
            <div>
              {[
                { icon:"🌏", text:"Anh · Trung · Nhật" },
                { icon:"🔒", text:"Avatar ẩn danh – Zero pressure" },
                { icon:"🎙", text:"Voice Room real-time" },
              ].map(p => (
                <span key={p.text} className="pill">
                  {p.icon} {p.text}
                </span>
              ))}
            </div>

            {/* Tier showcase */}
            <div style={{ marginTop:40, display:"flex", gap:10 }}>
              {TIERS.map(t => (
                <div key={t.value} style={{
                  flex:1, padding:"12px 8px", borderRadius:12, textAlign:"center",
                  background: t.bg, border:`1px solid ${t.border}`,
                }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{t.icon}</div>
                  <div style={{ fontSize:11, fontWeight:800, color:t.color }}>{t.label}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{t.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════ RIGHT – FORM ══════════ */}
        <div className="auth-right">
          <div className="auth-form-wrap">

            {/* Tab switcher */}
            <div className="tab-bar">
              {[
                { id:"login",    label:"Đăng nhập" },
                { id:"register", label:"Đăng ký" },
              ].map(t => (
                <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : "inactive"}`}
                  onClick={() => switchTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div style={{ marginBottom:28 }}>
              <h2 style={{
                fontSize:26, fontWeight:800, color:"#f1f5f9",
                margin:"0 0 6px", letterSpacing:"-0.03em",
              }}>
                {tab === "login" ? "Chào mừng trở lại 👋" : "Tạo tài khoản mới ✨"}
              </h2>
              <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.38)", margin:0 }}>
                {tab === "login"
                  ? "Đăng nhập để tiếp tục học tập cùng LUCY"
                  : "Chọn phân tầng và điền thông tin bên dưới"}
              </p>
            </div>

            {/* Error banner */}
            {err && (
              <div style={{
                background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.28)",
                borderRadius:10, padding:"10px 14px", marginBottom:22,
                fontSize:13, color:"#fca5a5", display:"flex", gap:8, alignItems:"center",
              }}>
                ⚠️ {err}
              </div>
            )}

            <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* REGISTER ONLY: Tier picker */}
              {tab === "register" && (
                <div>
                  <span className="field-label">Phân tầng tài khoản</span>
                  <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                    {TIERS.map(t => (
                      <button type="button" key={t.value} className="tier-card"
                        onClick={() => setRole(t.value)}
                        style={{
                          background: role === t.value ? t.bg : "rgba(255,255,255,0.03)",
                          border: `2px solid ${role === t.value ? t.color : "rgba(255,255,255,0.07)"}`,
                        }}>
                        <div style={{ fontSize:22, marginBottom:5 }}>{t.icon}</div>
                        <div style={{ fontSize:12, fontWeight:800, color: role === t.value ? t.color : "rgba(255,255,255,0.45)" }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{t.sub}</div>
                      </button>
                    ))}
                  </div>
                  {/* tier description */}
                  <div style={{
                    padding:"9px 14px", borderRadius:9, fontSize:12.5,
                    color:"rgba(255,255,255,0.6)", lineHeight:1.65,
                    background: activeTier.bg, border:`1px solid ${activeTier.border}`,
                  }}>
                    {activeTier.icon}&nbsp;
                    {activeTier.value === "Anonymous Student" && "Tham gia phòng học với Avatar ẩn danh. Không lo áp lực, cứ tự nhiên nói!"}
                    {activeTier.value === "Teacher"           && "Tạo phòng dạy học, ghim tài liệu và điều phối buổi học của bạn."}
                    {activeTier.value === "Influencer"        && "Tạo nội dung premium, Podcast và hệ thống học tập nâng cao."}
                  </div>
                </div>
              )}

              {/* REGISTER: Display name */}
              {tab === "register" && (
                <div>
                  <label className="field-label">Tên hiển thị</label>
                  <input className="lucy-inp" style={IS} type="text" value={name}
                    onChange={e => setName(e.target.value)} required
                    placeholder="Nhập tên của bạn..." />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="field-label">Email</label>
                <input className="lucy-inp" style={IS} type="email" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  placeholder="ten@domain.com" />
              </div>

              {/* Password */}
              <div>
                <label className="field-label">Mật khẩu</label>
                <input className="lucy-inp" style={IS} type="password" value={pass}
                  onChange={e => setPass(e.target.value)} required
                  placeholder="••••••••" />
              </div>

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={loading}
                style={{ marginTop:4 }}>
                {loading ? "⏳ Đang xử lý..." : tab === "login" ? "Đăng nhập →" : "Tạo tài khoản →"}
              </button>
            </form>

            {/* Demo accounts (login only) */}
            {tab === "login" && (
              <div style={{ marginTop:30 }}>
                {/* Divider */}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
                  <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.28)", letterSpacing:"0.07em" }}>
                    DEMO NHANH
                  </span>
                  <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {DEMO.map(u => {
                    const t = TIERS.find(x => x.value === u.role);
                    return (
                      <button key={u.email} type="button" className="demo-btn"
                        onClick={() => handleDemo(u)}>
                        {/* Avatar icon */}
                        <div style={{
                          width:38, height:38, borderRadius:10, flexShrink:0,
                          background: t.bg, border:`1.5px solid ${t.border}`,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
                        }}>{t.icon}</div>

                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13.5, fontWeight:700, color:"#f1f5f9" }}>{u.name}</div>
                          <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.33)" }}>{u.email}</div>
                        </div>

                        <span style={{
                          fontSize:10.5, fontWeight:700, padding:"3px 9px", borderRadius:6,
                          background: t.bg, color: t.color, border:`1px solid ${t.border}`,
                          whiteSpace:"nowrap",
                        }}>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                <p style={{ textAlign:"center", marginTop:14, fontSize:11.5, color:"rgba(255,255,255,0.22)" }}>
                  Mật khẩu demo: <code style={{ color:"rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.06)", padding:"1px 6px", borderRadius:4 }}>123</code>
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
