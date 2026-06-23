import { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Btn, CardHead, SectionCard, Badge, C } from "./App";
import { api } from "./apiClient";
import CreateRoomModal from "./CreateRoomModal";

export default function LiveRoomsView({ currentUser, onJoinRoom }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const list = await api.rooms.list();
      setRooms(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (roomData) => {
    try {
      await api.rooms.create({
        ...roomData,
        host: currentUser.name,
        hostRole: currentUser.role
      });
      setShowCreate(false);
      fetchRooms();
    } catch (err) {
      alert("Lỗi khi tạo phòng: " + err.message);
    }
  };

  const isProOrSuper = currentUser.role === "Teacher" || currentUser.role === "Influencer";
  const languageFlag = (lang) => ({ EN: "🇬🇧", ZH: "🇨🇳", JA: "🇯🇵" }[lang] || "🌐");

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Live Rooms</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Tham gia các phòng đàm thoại trực tuyến bằng âm thanh theo cấp độ</p>
        </div>
        {isProOrSuper && (
          <Btn onClick={() => setShowCreate(true)}><Plus size={14}/> Tạo phòng mới</Btn>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <RefreshCw size={24} color={C.primary} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }}/>
          <div style={{ color: C.muted, fontSize: 13 }}>Đang tải danh sách phòng...</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {rooms.map(room => (
            <SectionCard key={room.id} style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <div>
                <CardHead
                  icon={<span style={{ fontSize: 18 }}>{languageFlag(room.language)}</span>}
                  title={room.title}
                  action={<Badge color={C.green} bg={C.greenLight}>🔴 LIVE</Badge>}
                />
                <div style={{ padding: 14 }}>
                  <p style={{ fontSize: 13, color: C.muted, margin: "0 0 12px", lineHeight: "1.4" }}>{room.description || "Không có mô tả."}</p>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    <Badge color="#374151" bg="#f3f4f6">{room.stage}</Badge>
                    <Badge color={C.primary} bg={C.primaryLight}>{room.course}</Badge>
                    <Badge color="#6b7280" bg="#f3f4f6">{room.visibility}</Badge>
                  </div>
                </div>
              </div>

              <div style={{ padding: 14, borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Host: {room.host}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>👥 {room.participantsCount} đang học</div>
                </div>
                <Btn sm onClick={() => onJoinRoom(room.id)}>Vào phòng</Btn>
              </div>
            </SectionCard>
          ))}
          {rooms.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: C.light }}>
              Chưa có phòng Live nào. {isProOrSuper ? "Hãy tạo phòng đầu tiên của bạn!" : "Đang chờ Mentor mở phòng..."}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreateRoom} />
      )}
    </div>
  );
}
