package com.lucy.room;

import com.lucy.avatar.AvatarPersona;
import com.lucy.avatar.AvatarPersonaManager;
import com.lucy.config.AppConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ============================================================
 * ROOM MANAGER — Quản lý phòng học Lucy Live
 * ============================================================
 */
public class RoomManager {

    private static final Logger log = LoggerFactory.getLogger(RoomManager.class);
    private static final RoomManager INSTANCE = new RoomManager();
    public static RoomManager getInstance() { return INSTANCE; }

    private final ConcurrentHashMap<String, LiveRoom> rooms = new ConcurrentHashMap<>();

    private RoomManager() {}

    // ── Inner Room class ───────────────────────────────────

    public static class LiveRoom {
        public String roomId;
        public String title;
        public String language;
        public String status;       // "waiting" | "live" | "ended"
        public String hostSessionId;
        public String hostAvatarId;
        public int    maxParticipants;
        public boolean isRecording;
        public String recordingResourceId;
        public String recordingSid;
        public long   createdAt;
        public long   startedAt;
        public long   endedAt;
        public Long   stageDurationMs;

        // sessionId → persona
        public final Map<String, AvatarPersona> participants = new ConcurrentHashMap<>();
        // chat log (ẩn danh)
        public final List<ChatEntry> chatHistory = Collections.synchronizedList(new ArrayList<>());
    }

    public static class ChatEntry {
        public String id;
        public String avatarId;
        public String personaName;
        public String identityColor;
        public String avatarEmoji;
        public String message;
        public long   timestamp;
    }

    // ── Public API ─────────────────────────────────────────

    public LiveRoom createRoom(String roomId, String title, String language,
                               int maxParticipants, Long stageDurationMs) {
        if (rooms.containsKey(roomId)) throw new IllegalStateException("Room đã tồn tại: " + roomId);

        LiveRoom room = new LiveRoom();
        room.roomId          = roomId;
        room.title           = title != null ? title : "Lucy Live " + roomId;
        room.language        = language != null ? language : "LISA";
        room.status          = "waiting";
        room.maxParticipants = maxParticipants > 0 ? maxParticipants : AppConfig.MAX_PARTICIPANTS;
        room.stageDurationMs = stageDurationMs;
        room.isRecording     = false;
        room.createdAt       = System.currentTimeMillis();

        rooms.put(roomId, room);
        log.info("[RoomManager] Phòng tạo: {} ({})", roomId, room.language);
        return room;
    }

    public LiveRoom getRoom(String roomId) { return rooms.get(roomId); }

    public List<LiveRoom> listRooms() {
        List<LiveRoom> list = new ArrayList<>();
        for (LiveRoom r : rooms.values()) {
            if (!"ended".equals(r.status)) list.add(r);
        }
        return list;
    }

    /** Join phòng → trả về Persona */
    public AvatarPersona joinRoom(String roomId, String sessionId, boolean isHost, String role) {
        LiveRoom room = rooms.get(roomId);
        if (room == null)            throw new IllegalArgumentException("Phòng không tồn tại: " + roomId);
        if ("ended".equals(room.status)) throw new IllegalStateException("Phòng đã kết thúc");
        if (room.participants.size() >= room.maxParticipants)
            throw new IllegalStateException("Phòng đã đầy");

        String resolvedRole = isHost ? "super" : (role != null ? role : "member");
        String langCode = "LISA".equals(room.language) ? "EN" : room.language;

        AvatarPersona persona = AvatarPersonaManager.getInstance()
            .assign(sessionId, roomId, resolvedRole, langCode);
        room.participants.put(sessionId, persona);

        if (room.hostSessionId == null && (isHost || "super".equals(resolvedRole))) {
            room.hostSessionId = sessionId;
            room.hostAvatarId  = persona.getAvatarId();
        }

        log.info("[RoomManager] {} ({}) join room {} — tổng: {}",
            persona.getPersonaName(), resolvedRole, roomId, room.participants.size());
        return persona;
    }

    /** Rời phòng → trả về avatarId của host mới nếu host thay đổi */
    public String leaveRoom(String roomId, String sessionId) {
        LiveRoom room = rooms.get(roomId);
        if (room == null) return null;

        room.participants.remove(sessionId);
        AvatarPersonaManager.getInstance().release(sessionId, roomId);

        String newHostAvatarId = null;

        // Host rời → chuyển quyền
        if (sessionId.equals(room.hostSessionId) && !room.participants.isEmpty()) {
            Map.Entry<String, AvatarPersona> next = room.participants.entrySet().iterator().next();
            room.hostSessionId = next.getKey();
            room.hostAvatarId  = next.getValue().getAvatarId();
            newHostAvatarId    = next.getValue().getAvatarId();
            log.info("[RoomManager] Host mới: {}", next.getValue().getPersonaName());
        }

        if (room.participants.isEmpty()) closeRoom(roomId);

        return newHostAvatarId;
    }

    public AvatarPersona toggleMute(String roomId, String sessionId) {
        LiveRoom room = rooms.get(roomId);
        if (room == null) return null;
        AvatarPersona p = room.participants.get(sessionId);
        if (p == null) return null;
        return AvatarPersonaManager.getInstance().updateState(sessionId, roomId, !p.isMuted(), null);
    }

    public AvatarPersona toggleHandRaise(String roomId, String sessionId) {
        LiveRoom room = rooms.get(roomId);
        if (room == null) return null;
        AvatarPersona p = room.participants.get(sessionId);
        if (p == null) return null;
        return AvatarPersonaManager.getInstance().updateState(sessionId, roomId, null, !p.isHandRaised());
    }

    public List<AvatarPersona> muteAll(String roomId, String requestorSessionId) {
        LiveRoom room = rooms.get(roomId);
        if (room == null) return null;
        if (!requestorSessionId.equals(room.hostSessionId))
            throw new SecurityException("Chỉ Host mới có quyền mute all");
        for (Map.Entry<String, AvatarPersona> e : room.participants.entrySet()) {
            if (!e.getKey().equals(requestorSessionId)) {
                AvatarPersonaManager.getInstance().updateState(e.getKey(), roomId, true, null);
            }
        }
        return AvatarPersonaManager.getInstance().getPublicList(roomId);
    }

    public ChatEntry addChat(String roomId, String sessionId, String message) {
        LiveRoom room = rooms.get(roomId);
        if (room == null) return null;
        AvatarPersona p = room.participants.get(sessionId);
        if (p == null) return null;

        ChatEntry entry = new ChatEntry();
        entry.id            = UUID.randomUUID().toString().replace("-","").substring(0,12);
        entry.avatarId      = p.getAvatarId();
        entry.personaName   = p.getPersonaName();
        entry.identityColor = p.getIdentityColor();
        entry.avatarEmoji   = p.getAvatarEmoji();
        entry.message       = message;
        entry.timestamp     = System.currentTimeMillis();

        room.chatHistory.add(entry);
        if (room.chatHistory.size() > 500) room.chatHistory.remove(0);
        return entry;
    }

    public LiveRoom startLive(String roomId, String sessionId) {
        LiveRoom room = rooms.get(roomId);
        if (room == null) throw new IllegalArgumentException("Phòng không tồn tại");
        if (!sessionId.equals(room.hostSessionId)) throw new SecurityException("Chỉ Host mới có quyền Start Live");
        room.status    = "live";
        room.startedAt = System.currentTimeMillis();
        log.info("[RoomManager] Room {} — LIVE!", roomId);
        return room;
    }

    public LiveRoom endLive(String roomId, String sessionId) {
        LiveRoom room = rooms.get(roomId);
        if (room == null) return null;
        if (!sessionId.equals(room.hostSessionId)) throw new SecurityException("Chỉ Host mới có quyền End Live");
        room.status  = "ended";
        room.endedAt = System.currentTimeMillis();
        StageEngine.getInstance().destroyRoom(roomId);
        log.info("[RoomManager] Room {} — KẾT THÚC", roomId);
        return room;
    }

    public void setRecordingState(String roomId, boolean recording, String resourceId, String sid) {
        LiveRoom room = rooms.get(roomId);
        if (room == null) return;
        room.isRecording          = recording;
        room.recordingResourceId  = resourceId;
        room.recordingSid         = sid;
    }

    public boolean isHost(String roomId, String sessionId) {
        LiveRoom room = rooms.get(roomId);
        return room != null && sessionId.equals(room.hostSessionId);
    }

    private void closeRoom(String roomId) {
        rooms.remove(roomId);
        AvatarPersonaManager.getInstance().releaseRoom(roomId);
        StageEngine.getInstance().destroyRoom(roomId);
        log.info("[RoomManager] Room {} đã dọn dẹp", roomId);
    }
}
