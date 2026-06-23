import { useState } from "react";
import { Plus } from "lucide-react";
import { Btn, CardHead, C } from "./App";

export default function CreateRoomModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("English Stage 1");
  const [language, setLanguage] = useState("EN");
  const [stage, setStage] = useState("Sơ cấp");
  const [visibility, setVisibility] = useState("Public");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return setError("Vui lòng điền tên phòng!");
    setError("");
    setSubmitting(true);
    try {
      await onCreate({ title, description, course, language, stage, visibility });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 460, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", overflow: "hidden", animation: "modalOpen 0.2s ease-out" }}>
        <CardHead icon={<Plus size={14} />} title="Tạo phòng Live học tập mới" action={<button onClick={onClose} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: C.muted }}>×</button>} />
        
        <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <div style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, padding: 10, borderRadius: 6, fontSize: 13, color: C.red }}>{error}</div>}
          
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Tên phòng (*)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ví dụ: Luyện phát âm IPA cơ bản..." style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Mô tả phòng</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Nhập mục tiêu buổi học..." rows={2} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", fontFamily: "sans-serif", boxSizing: "border-box", resize: "none" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Ngôn ngữ</label>
              <select value={language} onChange={e => {
                setLanguage(e.target.value);
                if (e.target.value === 'EN') setCourse('English Stage 1');
                else if (e.target.value === 'ZH') setCourse('Chinese Stage 1');
                else if (e.target.value === 'JA') setCourse('Japanese Stage 1');
              }} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none" }}>
                <option value="EN">English</option>
                <option value="ZH">Chinese</option>
                <option value="JA">Japanese</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Khoá học</label>
              <select value={course} onChange={e => setCourse(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none" }}>
                {language === 'EN' && (
                  <>
                    <option value="English Stage 1">English Stage 1</option>
                    <option value="English Stage 2">English Stage 2</option>
                    <option value="English Stage 3">English Stage 3</option>
                  </>
                )}
                {language === 'ZH' && (
                  <>
                    <option value="Chinese Stage 1">Chinese Stage 1</option>
                    <option value="Chinese Stage 2">Chinese Stage 2</option>
                  </>
                )}
                {language === 'JA' && (
                  <>
                    <option value="Japanese Stage 1">Japanese Stage 1</option>
                    <option value="Japanese Stage 2">Japanese Stage 2</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Cấp độ (Stage)</label>
              <select value={stage} onChange={e => setStage(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none" }}>
                <option value="Sơ cấp">Sơ cấp</option>
                <option value="Trung cấp">Trung cấp</option>
                <option value="Cao cấp">Cao cấp</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Trạng thái hiển thị</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: "none" }}>
                <option value="Public">Công khai (Public)</option>
                <option value="Private">Riêng tư (Mã mời)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10, justifyContent: "flex-end" }}>
            <Btn type="button" v="secondary" onClick={onClose}>Huỷ</Btn>
            <Btn type="submit" disabled={submitting}>{submitting ? "Đang tạo..." : "Tạo phòng"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}
