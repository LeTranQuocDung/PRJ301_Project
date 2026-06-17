package com.lucy.util;

import com.google.gson.*;
import com.lucy.avatar.AvatarPersona;
import com.lucy.recording.AgoraRecordingService.PodcastMeta;
import com.lucy.room.RoomManager.ChatEntry;
import com.lucy.room.RoomManager.LiveRoom;
import com.lucy.room.StageEngine.*;

import java.util.*;

/**
 * Helper chuyển đổi các model sang JSON string để gửi qua WebSocket.
 */
public class JsonUtil {

    private static final Gson GSON = new GsonBuilder().create();

    /** Tạo message JSON chuẩn để gửi qua WS */
    public static String msg(String event, Object data) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("event", event);
        map.put("data",  data);
        return GSON.toJson(map);
    }

    /** Parse JSON string nhận từ WS client */
    public static JsonObject parse(String json) {
        return JsonParser.parseString(json).getAsJsonObject();
    }

    public static String getString(JsonObject obj, String key) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsString() : null;
    }

    public static boolean getBool(JsonObject obj, String key, boolean def) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsBoolean() : def;
    }

    public static int getInt(JsonObject obj, String key, int def) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsInt() : def;
    }

    /** Persona → Map (không có sessionId) */
    public static Map<String, Object> personaToMap(AvatarPersona p) {
        if (p == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("avatarId",      p.getAvatarId());
        m.put("personaName",   p.getPersonaName());
        m.put("avatarEmoji",   p.getAvatarEmoji());
        m.put("identityColor", p.getIdentityColor());
        m.put("role",          p.getRole());
        m.put("isMuted",       p.isMuted());
        m.put("isHandRaised",  p.isHandRaised());
        m.put("joinedAt",      p.getJoinedAt());
        m.put("roomId",        p.getRoomId());
        return m;
    }

    public static List<Map<String, Object>> personaListToMap(List<AvatarPersona> list) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (AvatarPersona p : list) result.add(personaToMap(p));
        return result;
    }

    /** Room → Map (public info) */
    public static Map<String, Object> roomToMap(LiveRoom r) {
        if (r == null) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("roomId",           r.roomId);
        m.put("title",            r.title);
        m.put("language",         r.language);
        m.put("status",           r.status);
        m.put("participantCount", r.participants.size());
        m.put("maxParticipants",  r.maxParticipants);
        m.put("isRecording",      r.isRecording);
        m.put("createdAt",        r.createdAt);
        m.put("startedAt",        r.startedAt);
        m.put("hostAvatarId",     r.hostAvatarId);
        return m;
    }

    /** StageEvent → Map */
    public static Map<String, Object> stageEventToMap(StageEvent e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("roomId",      e.roomId);
        m.put("stageIndex",  e.stageIndex);
        m.put("totalStages", e.totalStages);
        m.put("durationMs",  e.durationMs);
        m.put("remainingMs", e.remainingMs);
        m.put("reason",      e.reason);
        if (e.stage != null) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("levelName",    e.stage.levelName);
            s.put("stage",        e.stage.stage);
            s.put("languageCode", e.stage.languageCode);
            s.put("subLevel",     e.stage.subLevel);
            s.put("questionAi",   e.stage.questionAi);
            s.put("answer",       e.stage.answer);
            m.put("stage", s);
        }
        return m;
    }

    /** TickEvent → Map */
    public static Map<String, Object> tickEventToMap(TickEvent e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("roomId",      e.roomId);
        m.put("stageIndex",  e.stageIndex);
        m.put("remainingMs", e.remainingMs);
        m.put("durationMs",  e.durationMs);
        m.put("progress",    e.progress);
        return m;
    }

    /** ChatEntry → Map */
    public static Map<String, Object> chatToMap(ChatEntry c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            c.id);
        m.put("avatarId",      c.avatarId);
        m.put("personaName",   c.personaName);
        m.put("identityColor", c.identityColor);
        m.put("avatarEmoji",   c.avatarEmoji);
        m.put("message",       c.message);
        m.put("timestamp",     c.timestamp);
        return m;
    }

    /** PodcastMeta → Map */
    public static Map<String, Object> podcastToMap(PodcastMeta p) {
        return GSON.fromJson(GSON.toJson(p), Map.class);
    }

    public static String toJson(Object obj) {
        return GSON.toJson(obj);
    }
}
