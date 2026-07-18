package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.lucy.util.CorsUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.Part;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@WebServlet(urlPatterns = {
    "/api/podcasts/recordings",
    "/api/podcasts/record/upload",
    "/api/podcasts/record/audio",
    "/api/podcasts/record/visibility",
    "/api/podcasts/record/start",
    "/api/podcasts/record/stop"
})
@MultipartConfig(maxFileSize = 26214400, maxRequestSize = 27262976)
public class PodcastServlet extends HttpServlet {

    private Gson gson;
    private static final List<Map<String, Object>> recordings = new ArrayList<>();
    private static final Map<String, Map<String, Object>> activeSessions = new HashMap<>();
    private static final Map<String, byte[]> recordingAudio = new ConcurrentHashMap<>();
    private static final Map<String, String> recordingContentTypes = new ConcurrentHashMap<>();

    static {
        // Seed default recordings
        addRecording("Introduction to IELTS Speaking", "English", "12:34", "Mr. John", false, "completed");
        addRecording("Daily Life in Tokyo Chat", "Japanese", "18:45", "Sensei Tanaka", true, "completed");
        addRecording("HSK 3 Listening Practice", "Chinese", "15:20", "Teacher Li", false, "completed");
    }

    private static void addRecording(String title, String language, String duration, String creator, boolean premium, String status) {
        Map<String, Object> rec = new HashMap<>();
        rec.put("id", "REC_" + System.nanoTime());
        rec.put("title", title);
        rec.put("language", language);
        rec.put("duration", duration);
        rec.put("creator", creator);
        rec.put("premium", premium);
        rec.put("status", status);
        rec.put("createdAt", LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        recordings.add(rec);
    }

    @Override
    public void init() throws ServletException {
        gson = new GsonBuilder().setPrettyPrinting().create();
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");

        String path = req.getServletPath();
        if (path == null) path = "";

        if (path.contains("audio")) {
            String id = req.getParameter("id");
            byte[] audio = recordingAudio.get(id);
            if (audio == null) {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Audio recording not found");
                return;
            }
            resp.setContentType(recordingContentTypes.getOrDefault(id, "audio/webm"));
            resp.setContentLength(audio.length);
            resp.setHeader("Cache-Control", "no-store");
            resp.getOutputStream().write(audio);
        } else if (path.contains("recordings")) {
            if ("true".equalsIgnoreCase(req.getParameter("public"))) {
                List<Map<String, Object>> published = new ArrayList<>();
                for (Map<String, Object> recording : recordings) {
                    if (Boolean.TRUE.equals(recording.get("visible")) && recording.get("audioUrl") != null) published.add(recording);
                }
                resp.getWriter().write(gson.toJson(published));
            } else {
                resp.getWriter().write(gson.toJson(recordings));
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");

        String path = req.getServletPath();
        if (path == null) path = "";

        if (path.contains("upload")) {
            handleUpload(req, resp);
            return;
        }

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        } catch (Exception e) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid request body");
            return;
        }

        if (sb.length() == 0) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Empty request body");
            return;
        }

        JsonObject json;
        try {
            json = gson.fromJson(sb.toString(), JsonObject.class);
        } catch (Exception e) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid JSON format");
            return;
        }

        if (path.contains("visibility")) {
            String recordingId = json.has("recordingId") ? json.get("recordingId").getAsString().trim() : "";
            boolean visible = json.has("visible") && json.get("visible").getAsBoolean();
            Map<String, Object> target = null;
            for (Map<String, Object> recording : recordings) {
                if (recordingId.equals(recording.get("id"))) { target = recording; break; }
            }
            if (target == null || target.get("audioUrl") == null) {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Recorded audio not found");
                return;
            }
            target.put("visible", visible);
            resp.getWriter().write(gson.toJson(target));
            return;
        }

        if (path.contains("start")) {
            String roomId = json.has("roomId") ? json.get("roomId").getAsString().trim() : "";
            int creatorId = json.has("creatorId") ? json.get("creatorId").getAsInt() : 0;
            String title = json.has("title") ? json.get("title").getAsString().trim() : "";

            if (roomId.isEmpty() || creatorId <= 0 || title.isEmpty()) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Validation failed: roomId, creatorId > 0, title are required");
                return;
            }

            String sessionId = "SESS_" + System.currentTimeMillis();
            Map<String, Object> session = new HashMap<>();
            session.put("sessionId", sessionId);
            session.put("roomId", roomId);
            session.put("creatorId", creatorId);
            session.put("title", title);
            session.put("status", "recording");
            session.put("startedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            activeSessions.put(sessionId, session);
            resp.getWriter().write(gson.toJson(session));

        } else if (path.contains("stop")) {
            String sessionId = json.has("sessionId") ? json.get("sessionId").getAsString().trim() : "";

            if (sessionId.isEmpty()) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Validation failed: sessionId is required");
                return;
            }

            if (!activeSessions.containsKey(sessionId)) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Session not found or already stopped");
                return;
            }

            Map<String, Object> session = activeSessions.remove(sessionId);
            Map<String, Object> result = new HashMap<>();
            result.put("sessionId", sessionId);
            result.put("status", "stopped");
            result.put("title", session.get("title"));

            resp.getWriter().write(gson.toJson(result));
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    private void handleUpload(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        Part audioPart = req.getPart("audio");
        if (audioPart == null || audioPart.getSize() == 0) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "audio file is required");
            return;
        }

        String title = req.getParameter("title");
        String roomId = req.getParameter("roomId");
        String duration = req.getParameter("duration");
        String recId = "REC_" + System.nanoTime();
        byte[] bytes;
        try (InputStream input = audioPart.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            bytes = output.toByteArray();
        }
        recordingAudio.put(recId, bytes);
        recordingContentTypes.put(recId, audioPart.getContentType() == null ? "audio/webm" : audioPart.getContentType());

        Map<String, Object> rec = new HashMap<>();
        rec.put("id", recId);
        rec.put("title", title == null || title.trim().isEmpty() ? "Live Room Recording" : title);
        rec.put("roomId", roomId == null ? "" : roomId);
        rec.put("language", "English");
        rec.put("duration", duration == null ? "00:00" : duration);
        rec.put("creator", "Admin");
        rec.put("premium", false);
        rec.put("status", "completed");
        rec.put("visible", true);
        rec.put("size", bytes.length);
        rec.put("audioUrl", "/api/podcasts/record/audio?id=" + recId);
        rec.put("createdAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        recordings.add(rec);
        resp.getWriter().write(gson.toJson(rec));
    }

    private void sendError(HttpServletResponse resp, int status, String msg) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"error\":\"" + msg + "\"}");
    }
}
