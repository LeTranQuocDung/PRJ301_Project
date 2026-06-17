package com.lucy.servlet;

import com.google.gson.*;
import com.lucy.agora.AgoraTokenUtil;
import com.lucy.config.AppConfig;
import com.lucy.recording.AgoraRecordingService;
import com.lucy.room.RoomManager;
import com.lucy.room.RoomManager.LiveRoom;
import com.lucy.room.StageEngine;
import com.lucy.socket.LucyWebSocketServer;
import com.lucy.util.JsonUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.*;
import java.util.*;

/**
 * ============================================================
 * ROOM SERVLET — REST API cho Lucy Live Rooms
 * ============================================================
 * GET    /api/rooms              — Danh sách phòng
 * POST   /api/rooms              — Tạo phòng
 * GET    /api/rooms/{id}         — Chi tiết phòng + stage state
 * GET    /api/rooms/{id}/stage   — Stage state hiện tại
 * POST   /api/agora/token        — Cấp Agora RTC Token
 * GET    /api/rooms/{id}/recording/status — Trạng thái recording
 * GET    /health                 — Health check
 * ============================================================
 */
@WebServlet(urlPatterns = {"/api/rooms", "/api/rooms/*", "/api/agora/token", "/health"})
public class RoomServlet extends HttpServlet {

    private static final Logger log = LoggerFactory.getLogger(RoomServlet.class);
    private final Gson gson = new GsonBuilder().create();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String path = req.getServletPath() + (req.getPathInfo() != null ? req.getPathInfo() : "");

        if ("/health".equals(path)) {
            Map<String, Object> health = new LinkedHashMap<>();
            health.put("status",          "ok");
            health.put("service",         "lucy-realtime-server");
            health.put("timestamp",       new Date().toString());
            health.put("agoraConfigured", !AppConfig.AGORA_APP_ID.startsWith("YOUR"));
            writeJson(resp, 200, health);
            return;
        }

        if ("/api/rooms".equals(path)) {
            List<Map<String, Object>> rooms = new ArrayList<>();
            for (LiveRoom r : RoomManager.getInstance().listRooms())
                rooms.add(JsonUtil.roomToMap(r));
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("rooms", rooms);
            result.put("count", rooms.size());
            writeJson(resp, 200, result);
            return;
        }

        // /api/rooms/{id}
        if (path.startsWith("/api/rooms/")) {
            String[] parts = path.split("/");
            if (parts.length < 4) { writeJson(resp, 400, err("roomId thiếu")); return; }

            String roomId = parts[3];
            LiveRoom room = RoomManager.getInstance().getRoom(roomId);
            if (room == null) { writeJson(resp, 404, err("Phòng không tồn tại")); return; }

            // /api/rooms/{id}/stage
            if (parts.length >= 5 && "stage".equals(parts[4])) {
                Map<String, Object> state = StageEngine.getInstance().getRoomSnapshot(roomId);
                writeJson(resp, 200, state != null ? state : err("Stage chưa init"));
                return;
            }

            // /api/rooms/{id}/recording/status
            if (parts.length >= 6 && "recording".equals(parts[4]) && "status".equals(parts[5])) {
                boolean isRec = AgoraRecordingService.getInstance().isRecording(roomId);
                Map<String, Object> status = new LinkedHashMap<>();
                status.put("isRecording", isRec);
                if (isRec) {
                    try { status.putAll(AgoraRecordingService.getInstance().query(roomId)); }
                    catch (Exception e) { status.put("queryError", e.getMessage()); }
                }
                writeJson(resp, 200, status);
                return;
            }

            // /api/rooms/{id}
            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("room",       JsonUtil.roomToMap(room));
            detail.put("stageState", StageEngine.getInstance().getRoomSnapshot(roomId));
            writeJson(resp, 200, detail);
            return;
        }

        writeJson(resp, 404, err("Endpoint không tồn tại: " + path));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String path = req.getServletPath() + (req.getPathInfo() != null ? req.getPathInfo() : "");

        // POST /api/rooms — tạo phòng
        if ("/api/rooms".equals(path)) {
            JsonObject body = parseBody(req);
            String roomId   = getOrDefault(body, "roomId",
                UUID.randomUUID().toString().replace("-","").substring(0,10).toUpperCase());
            String title    = getOrDefault(body, "title", "Lucy Live " + roomId);
            String language = getOrDefault(body, "language", "LISA");
            int maxPart     = body.has("maxParticipants") ? body.get("maxParticipants").getAsInt() : 100;
            Long stageDurMs = body.has("stageDurationMinutes")
                ? (long)(body.get("stageDurationMinutes").getAsDouble() * 60_000)
                : null;

            try {
                LiveRoom room = RoomManager.getInstance()
                    .createRoom(roomId, title, language, maxPart, stageDurMs);
                LucyWebSocketServer.registerStageCallbacks(roomId);

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("success", true);
                result.put("room",    JsonUtil.roomToMap(room));
                writeJson(resp, 200, result);
            } catch (Exception e) {
                writeJson(resp, 400, err(e.getMessage()));
            }
            return;
        }

        // POST /api/agora/token
        if ("/api/agora/token".equals(path)) {
            JsonObject body    = parseBody(req);
            String channelName = getOrDefault(body, "channelName", null);
            if (channelName == null) { writeJson(resp, 400, err("channelName là bắt buộc")); return; }

            int uid    = body.has("uid") ? body.get("uid").getAsInt() : 0;
            String role = getOrDefault(body, "role", "publisher");
            String token = AgoraTokenUtil.buildToken(channelName, uid, role);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("appId",   AppConfig.AGORA_APP_ID);
            result.put("token",   token);
            result.put("channel", channelName);
            result.put("uid",     uid);
            writeJson(resp, 200, result);
            return;
        }

        writeJson(resp, 404, err("Endpoint không tồn tại"));
    }

    /**
     * PATCH dùng để set custom duration cho Stage.
     * Vì HttpServlet không có doPatch sẵn, ta override service() để bắt method PATCH.
     */
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(req.getMethod())) {
            doPatchCustom(req, resp);
        } else {
            super.service(req, resp);
        }
    }

    protected void doPatchCustom(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String path = req.getServletPath() + (req.getPathInfo() != null ? req.getPathInfo() : "");

        if (path.matches("/api/rooms/[^/]+/stage/duration")) {
            String roomId   = path.split("/")[3];
            JsonObject body = parseBody(req);
            int stageIndex  = body.has("stageIndex") ? body.get("stageIndex").getAsInt() : -1;
            double mins     = body.has("durationMinutes") ? body.get("durationMinutes").getAsDouble() : -1;
            if (stageIndex < 0 || mins < 0) {
                writeJson(resp, 400, err("stageIndex và durationMinutes là bắt buộc")); return;
            }
            StageEngine.getInstance().setCustomDuration(roomId, stageIndex, (long)(mins * 60_000));
            Map<String, Object> ok = new LinkedHashMap<>();
            ok.put("success", true);
            writeJson(resp, 200, ok);
            return;
        }
        writeJson(resp, 404, err("Endpoint không tồn tại"));
    }

    // ── Helpers ────────────────────────────────────────────

    private void writeJson(HttpServletResponse resp, int status, Object data) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.getWriter().write(gson.toJson(data));
    }

    private JsonObject parseBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        String line;
        try (BufferedReader br = req.getReader()) {
            while ((line = br.readLine()) != null) sb.append(line);
        }
        String body = sb.toString().trim();
        return body.isEmpty() ? new JsonObject()
            : JsonParser.parseString(body).getAsJsonObject();
    }

    private String getOrDefault(JsonObject obj, String key, String def) {
        return obj.has(key) && !obj.get(key).isJsonNull()
            ? obj.get(key).getAsString() : def;
    }

    private Map<String, Object> err(String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("error", msg);
        return m;
    }
}
