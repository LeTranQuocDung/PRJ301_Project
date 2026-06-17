package com.lucy.socket;

import com.google.gson.JsonObject;
import com.lucy.agora.AgoraTokenUtil;
import com.lucy.avatar.AvatarPersona;
import com.lucy.avatar.AvatarPersonaManager;
import com.lucy.config.AppConfig;
import com.lucy.recording.AgoraRecordingService;
import com.lucy.room.RoomManager;
import com.lucy.room.RoomManager.ChatEntry;
import com.lucy.room.RoomManager.LiveRoom;
import com.lucy.room.StageEngine;
import com.lucy.room.StageEngine.*;
import com.lucy.service.LucyContentService;
import com.lucy.util.JsonUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ============================================================
 * LUCY WEBSOCKET SERVER
 * ============================================================
 * Endpoint: ws://localhost:8080/LucyRealtimeServer/ws
 *
 * Thay thế Socket.io bằng Java WebSocket API (JSR-356).
 * Tomcat 8.5+ hỗ trợ native — không cần thư viện ngoài.
 *
 * CLIENT → SERVER messages (JSON):
 *   { "event": "room:join",         "data": { roomId, isHost, role } }
 *   { "event": "room:leave",        "data": { roomId } }
 *   { "event": "room:start_live",   "data": { roomId } }
 *   { "event": "room:end_live",     "data": { roomId } }
 *   { "event": "audio:mute_toggle", "data": {} }
 *   { "event": "audio:mute_all",    "data": {} }
 *   { "event": "audio:hand_raise",  "data": {} }
 *   { "event": "stage:next",        "data": {} }
 *   { "event": "stage:prev",        "data": {} }
 *   { "event": "stage:jump",        "data": { targetIndex } }
 *   { "event": "stage:pause_toggle","data": {} }
 *   { "event": "chat:message",      "data": { message } }
 *   { "event": "recording:start",   "data": {} }
 *   { "event": "recording:stop",    "data": {} }
 *
 * SERVER → CLIENT messages (JSON):
 *   room:joined, room:participant_joined, room:participant_left
 *   room:started, room:ended, room:host_changed
 *   audio:state_updated, audio:all_muted
 *   stage:started, stage:changed, stage:tick, stage:paused, stage:resumed, stage:completed
 *   chat:message
 *   recording:started, recording:stopped
 *   error
 * ============================================================
 */
@ServerEndpoint("/ws")
public class LucyWebSocketServer {

    private static final Logger log = LoggerFactory.getLogger(LucyWebSocketServer.class);

    // sessionId → Session (để broadcast theo roomId)
    private static final ConcurrentHashMap<String, Session> ALL_SESSIONS = new ConcurrentHashMap<>();
    // sessionId → roomId
    private static final ConcurrentHashMap<String, String>  SESSION_ROOM  = new ConcurrentHashMap<>();

    // ── Lifecycle ──────────────────────────────────────────

    @OnOpen
    public void onOpen(Session session) {
        ALL_SESSIONS.put(session.getId(), session);
        log.info("[WS] Connected: {}", session.getId());
    }

    @OnClose
    public void onClose(Session session, CloseReason reason) {
        String sessionId = session.getId();
        log.info("[WS] Disconnected: {} ({})", sessionId, reason.getReasonPhrase());

        String roomId = SESSION_ROOM.remove(sessionId);
        if (roomId != null) handleLeave(sessionId, roomId);

        ALL_SESSIONS.remove(sessionId);
    }

    @OnError
    public void onError(Session session, Throwable error) {
        log.error("[WS] Error on {}: {}", session.getId(), error.getMessage());
    }

    // ── Message dispatcher ─────────────────────────────────

    @OnMessage
    public void onMessage(String text, Session session) {
        String sessionId = session.getId();
        try {
            JsonObject msg  = JsonUtil.parse(text);
            String event    = JsonUtil.getString(msg, "event");
            JsonObject data = msg.has("data") && msg.get("data").isJsonObject()
                              ? msg.getAsJsonObject("data") : new JsonObject();

            if (event == null) { sendError(session, "event field bắt buộc"); return; }

            switch (event) {
                case "room:join":         handleJoin(session, data);        break;
                case "room:leave":        handleLeaveEvent(session, data);  break;
                case "room:start_live":   handleStartLive(session, data);   break;
                case "room:end_live":     handleEndLive(session, data);     break;
                case "audio:mute_toggle": handleMuteToggle(session);        break;
                case "audio:mute_all":    handleMuteAll(session);           break;
                case "audio:hand_raise":  handleHandRaise(session);         break;
                case "stage:next":        handleStageNext(session);         break;
                case "stage:prev":        handleStagePrev(session);         break;
                case "stage:jump":        handleStageJump(session, data);   break;
                case "stage:pause_toggle":handleStagePause(session);        break;
                case "chat:message":      handleChat(session, data);        break;
                case "recording:start":   handleRecordingStart(session);    break;
                case "recording:stop":    handleRecordingStop(session);     break;
                default: sendError(session, "Không nhận dạng được event: " + event);
            }
        } catch (Exception e) {
            log.error("[WS] onMessage error: {}", e.getMessage(), e);
            sendError(session, "Lỗi server: " + e.getMessage());
        }
    }

    // ── Event handlers ─────────────────────────────────────

    private void handleJoin(Session session, JsonObject data) {
        String sessionId = session.getId();
        String roomId    = JsonUtil.getString(data, "roomId");
        boolean isHost   = JsonUtil.getBool(data, "isHost", false);
        String role      = JsonUtil.getString(data, "role");

        if (roomId == null) { sendError(session, "roomId là bắt buộc"); return; }

        try {
            AvatarPersona persona = RoomManager.getInstance()
                .joinRoom(roomId, sessionId, isHost, role);

            SESSION_ROOM.put(sessionId, roomId);

            // Agora config
            int uid = Math.abs(sessionId.hashCode() % 65535) + 1;
            Map<String, Object> agoraConfig = new LinkedHashMap<>();
            agoraConfig.put("appId",   AppConfig.AGORA_APP_ID);
            agoraConfig.put("token",   AgoraTokenUtil.buildToken(roomId, uid, isHost ? "publisher" : "publisher"));
            agoraConfig.put("channel", roomId);
            agoraConfig.put("uid",     uid);

            // Participants list
            List<Map<String, Object>> participants =
                JsonUtil.personaListToMap(AvatarPersonaManager.getInstance().getPublicList(roomId));

            // Stage state
            Map<String, Object> stageState = StageEngine.getInstance().getRoomSnapshot(roomId);

            // Trả về cho client vừa join
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("persona",      JsonUtil.personaToMap(persona));
            resp.put("participants", participants);
            resp.put("stageState",   stageState);
            resp.put("agoraConfig",  agoraConfig);
            resp.put("roomInfo",     JsonUtil.roomToMap(RoomManager.getInstance().getRoom(roomId)));
            send(session, JsonUtil.msg("room:joined", resp));

            // Thông báo người khác trong phòng
            Map<String, Object> notif = new LinkedHashMap<>();
            notif.put("persona",          JsonUtil.personaToMap(persona));
            notif.put("participantCount", participants.size());
            broadcastToRoom(roomId, JsonUtil.msg("room:participant_joined", notif), sessionId);

        } catch (Exception e) {
            sendError(session, e.getMessage());
        }
    }

    private void handleLeaveEvent(Session session, JsonObject data) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.remove(sessionId);
        if (roomId == null) roomId = JsonUtil.getString(data, "roomId");
        if (roomId != null) handleLeave(sessionId, roomId);
    }

    private void handleLeave(String sessionId, String roomId) {
        try {
            String newHostAvatarId = RoomManager.getInstance().leaveRoom(roomId, sessionId);
            List<Map<String, Object>> participants =
                JsonUtil.personaListToMap(AvatarPersonaManager.getInstance().getPublicList(roomId));

            Map<String, Object> notif = new LinkedHashMap<>();
            notif.put("sessionId",        sessionId);
            notif.put("participantCount", participants.size());
            notif.put("participants",     participants);
            if (newHostAvatarId != null) notif.put("newHostAvatarId", newHostAvatarId);

            broadcastToRoom(roomId, JsonUtil.msg("room:participant_left", notif), null);

            if (newHostAvatarId != null) {
                Map<String, Object> hostChange = new LinkedHashMap<>();
                hostChange.put("newHostAvatarId", newHostAvatarId);
                broadcastToRoom(roomId, JsonUtil.msg("room:host_changed", hostChange), null);
            }
        } catch (Exception e) {
            log.warn("[WS] handleLeave error: {}", e.getMessage());
        }
    }

    private void handleStartLive(Session session, JsonObject data) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }

        try {
            LiveRoom room = RoomManager.getInstance().startLive(roomId, sessionId);

            // Bắt đầu stage timer
            StageEngine.getInstance().startCurrentStage(roomId);

            broadcastToRoom(roomId, JsonUtil.msg("room:started",
                JsonUtil.roomToMap(room)), null);
        } catch (Exception e) {
            sendError(session, e.getMessage());
        }
    }

    private void handleEndLive(Session session, JsonObject data) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }

        try {
            // Auto stop recording nếu đang ghi
            AgoraRecordingService.PodcastMeta podcastMeta = null;
            if (AgoraRecordingService.getInstance().isRecording(roomId)) {
                try {
                    podcastMeta = AgoraRecordingService.getInstance().stop(roomId);
                    RoomManager.getInstance().setRecordingState(roomId, false, null, null);
                } catch (Exception ex) {
                    log.warn("[WS] Auto stop recording failed: {}", ex.getMessage());
                }
            }

            LiveRoom room = RoomManager.getInstance().endLive(roomId, sessionId);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("roomInfo", JsonUtil.roomToMap(room));
            if (podcastMeta != null) payload.put("podcastMeta", JsonUtil.podcastToMap(podcastMeta));

            broadcastToRoom(roomId, JsonUtil.msg("room:ended", payload), null);
        } catch (Exception e) {
            sendError(session, e.getMessage());
        }
    }

    private void handleMuteToggle(Session session) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }

        AvatarPersona updated = RoomManager.getInstance().toggleMute(roomId, sessionId);
        if (updated != null) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("persona", JsonUtil.personaToMap(updated));
            broadcastToRoom(roomId, JsonUtil.msg("audio:state_updated", p), null);
        }
    }

    private void handleMuteAll(Session session) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }

        try {
            List<AvatarPersona> list = RoomManager.getInstance().muteAll(roomId, sessionId);
            broadcastToRoom(roomId, JsonUtil.msg("audio:all_muted",
                JsonUtil.personaListToMap(list)), null);
        } catch (Exception e) {
            sendError(session, e.getMessage());
        }
    }

    private void handleHandRaise(Session session) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }

        AvatarPersona updated = RoomManager.getInstance().toggleHandRaise(roomId, sessionId);
        if (updated != null) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("persona", JsonUtil.personaToMap(updated));
            broadcastToRoom(roomId, JsonUtil.msg("audio:state_updated", p), null);
        }
    }

    private void handleStageNext(Session session) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }
        if (!RoomManager.getInstance().isHost(roomId, sessionId)) {
            sendError(session, "Chỉ Host mới có quyền chuyển Stage"); return;
        }
        StageEngine.getInstance().nextStage(roomId, sessionId);
    }

    private void handleStagePrev(Session session) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }
        if (!RoomManager.getInstance().isHost(roomId, sessionId)) {
            sendError(session, "Chỉ Host mới có quyền chuyển Stage"); return;
        }
        StageEngine.getInstance().prevStage(roomId, sessionId);
    }

    private void handleStageJump(Session session, JsonObject data) {
        String sessionId  = session.getId();
        String roomId     = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }
        if (!RoomManager.getInstance().isHost(roomId, sessionId)) {
            sendError(session, "Chỉ Host mới có quyền jump Stage"); return;
        }
        int targetIndex = JsonUtil.getInt(data, "targetIndex", -1);
        if (targetIndex < 0) { sendError(session, "targetIndex là bắt buộc"); return; }
        StageEngine.getInstance().jumpToStage(roomId, targetIndex, sessionId);
    }

    private void handleStagePause(Session session) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }
        if (!RoomManager.getInstance().isHost(roomId, sessionId)) {
            sendError(session, "Chỉ Host mới có quyền pause Stage"); return;
        }
        StageEngine.getInstance().togglePause(roomId);
    }

    private void handleChat(Session session, JsonObject data) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }

        String message = JsonUtil.getString(data, "message");
        if (message == null || message.trim().isEmpty()) {
            sendError(session, "Message không được rỗng"); return;
        }
        if (message.length() > 500) {
            sendError(session, "Message quá dài (tối đa 500 ký tự)"); return;
        }

        ChatEntry entry = RoomManager.getInstance().addChat(roomId, sessionId, message.trim());
        if (entry != null) {
            broadcastToRoom(roomId, JsonUtil.msg("chat:message", JsonUtil.chatToMap(entry)), null);
        }
    }

    private void handleRecordingStart(Session session) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }

        if (AgoraRecordingService.getInstance().isRecording(roomId)) {
            sendError(session, "Phòng đang được ghi rồi"); return;
        }

        try {
            String token = AgoraTokenUtil.buildRecordingToken(roomId);
            AgoraRecordingService.RecordingSession rs =
                AgoraRecordingService.getInstance().startRecording(roomId, token);

            RoomManager.getInstance().setRecordingState(roomId, true, rs.resourceId, rs.sid);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("startedAt", rs.startedAt);
            broadcastToRoom(roomId, JsonUtil.msg("recording:started", payload), null);

        } catch (Exception e) {
            log.error("[WS] recording:start error: {}", e.getMessage());
            sendError(session, "Không thể bắt đầu ghi âm: " + e.getMessage());
        }
    }

    private void handleRecordingStop(Session session) {
        String sessionId = session.getId();
        String roomId    = SESSION_ROOM.get(sessionId);
        if (roomId == null) { sendError(session, "Bạn chưa vào phòng nào"); return; }

        if (!AgoraRecordingService.getInstance().isRecording(roomId)) {
            sendError(session, "Phòng không đang ghi"); return;
        }

        try {
            AgoraRecordingService.PodcastMeta meta =
                AgoraRecordingService.getInstance().stop(roomId);
            RoomManager.getInstance().setRecordingState(roomId, false, null, null);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("podcastMeta", JsonUtil.podcastToMap(meta));
            broadcastToRoom(roomId, JsonUtil.msg("recording:stopped", payload), null);

        } catch (Exception e) {
            log.error("[WS] recording:stop error: {}", e.getMessage());
            sendError(session, "Không thể dừng ghi âm: " + e.getMessage());
        }
    }

    // ── Stage Engine Callback Registry ────────────────────
    // Gọi khi tạo phòng để đăng ký callbacks cho StageEngine

    public static void registerStageCallbacks(String roomId) {
        StageEngine engine = StageEngine.getInstance();
        engine.initRoom(roomId,
            RoomManager.getInstance().getRoom(roomId).language,
            LucyContentService.getInstance().getStagesByLanguage(
                RoomManager.getInstance().getRoom(roomId).language),
            RoomManager.getInstance().getRoom(roomId).stageDurationMs != null
                ? RoomManager.getInstance().getRoom(roomId).stageDurationMs
                : AppConfig.DEFAULT_STAGE_DURATION_MINUTES * 60_000L,
            0,
            // onStageStarted
            e -> broadcastToAll(roomId, JsonUtil.msg("stage:started", JsonUtil.stageEventToMap(e))),
            // onStageChanged
            e -> broadcastToAll(roomId, JsonUtil.msg("stage:changed", JsonUtil.stageEventToMap(e))),
            // onTick
            e -> broadcastToAll(roomId, JsonUtil.msg("stage:tick", JsonUtil.tickEventToMap(e))),
            // onPaused
            e -> broadcastToAll(roomId, JsonUtil.msg("stage:paused", JsonUtil.stageEventToMap(e))),
            // onResumed
            e -> broadcastToAll(roomId, JsonUtil.msg("stage:resumed", JsonUtil.stageEventToMap(e))),
            // onAllCompleted
            () -> broadcastToAll(roomId, JsonUtil.msg("stage:completed",
                Collections.singletonMap("roomId", roomId)))
        );
    }

    // ── Broadcast helpers ──────────────────────────────────

    /** Gửi đến tất cả session trong phòng (trừ excludeSessionId nếu khác null) */
    private static void broadcastToRoom(String roomId, String message, String excludeSessionId) {
        LiveRoom room = RoomManager.getInstance().getRoom(roomId);
        if (room == null) return;
        for (String sid : room.participants.keySet()) {
            if (sid.equals(excludeSessionId)) continue;
            Session s = ALL_SESSIONS.get(sid);
            if (s != null && s.isOpen()) send(s, message);
        }
    }

    /** Dùng cho StageEngine callbacks (static context, gửi đến toàn phòng) */
    private static void broadcastToAll(String roomId, String message) {
        broadcastToRoom(roomId, message, null);
    }

    private static void send(Session session, String message) {
        try {
            session.getBasicRemote().sendText(message);
        } catch (IOException e) {
            log.warn("[WS] send failed to {}: {}", session.getId(), e.getMessage());
        }
    }

    private static void sendError(Session session, String errorMsg) {
        send(session, JsonUtil.msg("error", Collections.singletonMap("message", errorMsg)));
    }
}
