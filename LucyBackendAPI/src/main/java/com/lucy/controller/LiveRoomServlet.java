package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.lucy.util.CorsUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@WebServlet(urlPatterns = { "/api/rooms", "/api/rooms/*" })
public class LiveRoomServlet extends HttpServlet {
    private Gson gson;
    private static final Map<String, RoomState> rooms = new ConcurrentHashMap<>();

    private static class RoomState {
        String id;
        String creator;
        String createdAt;
        boolean isPublic;
        Set<String> members = ConcurrentHashMap.newKeySet();
        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> pinnedLesson;
    }

    @Override
    public void init() throws ServletException {
        gson = new GsonBuilder().setPrettyPrinting().create();
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        prepare(resp);
        String roomId = roomId(req);
        if (roomId.isEmpty()) {
            List<Map<String, Object>> publicRooms = new ArrayList<>();
            boolean includePrivate = "true".equalsIgnoreCase(req.getParameter("admin"));
            for (RoomState candidate : rooms.values()) {
                if (candidate.isPublic || includePrivate) {
                    Map<String, Object> summary = new LinkedHashMap<>();
                    summary.put("id", candidate.id);
                    summary.put("creator", candidate.creator);
                    summary.put("memberCount", candidate.members.size());
                    summary.put("isPublic", candidate.isPublic);
                    summary.put("createdAt", candidate.createdAt);
                    publicRooms.add(summary);
                }
            }
            resp.getWriter().write(gson.toJson(publicRooms));
            return;
        }
        RoomState room = rooms.get(roomId);
        if (room == null) {
            error(resp, HttpServletResponse.SC_NOT_FOUND, "Room not found");
            return;
        }
        resp.getWriter().write(gson.toJson(view(room)));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // JSON payloads may contain Vietnamese, Chinese, and Japanese text.
        // Set the request encoding before getReader() so Tomcat never falls
        // back to ISO-8859-1 for chat messages or pinned lesson content.
        req.setCharacterEncoding("UTF-8");
        prepare(resp);
        JsonObject body;
        try {
            body = gson.fromJson(req.getReader(), JsonObject.class);
            if (body == null)
                body = new JsonObject();
        } catch (Exception ex) {
            error(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid JSON body");
            return;
        }
        String path = req.getPathInfo() == null ? "" : req.getPathInfo();
        if (path.isEmpty() || "/".equals(path)) {
            createRoom(body, resp);
            return;
        }
        String roomId = roomId(req);
        RoomState room = rooms.get(roomId);
        if (room == null) {
            error(resp, HttpServletResponse.SC_NOT_FOUND, "Room not found");
            return;
        }
        String action = path.substring(path.lastIndexOf('/') + 1);
        String name = text(body, "name");
        switch (action) {
            case "join":
                if (name.isEmpty()) {
                    error(resp, 400, "name is required");
                    return;
                }
                room.members.add(name);
                break;
            case "leave":
                if (room.creator.equals(name)) {
                    rooms.remove(room.id);
                    resp.getWriter().write("{\"closed\":true}");
                    return;
                }
                room.members.remove(name);
                break;
            case "message":
                addMessage(room, name, text(body, "text"), resp);
                if (resp.getStatus() >= 400)
                    return;
                break;
            case "pin":
                if (!room.creator.equals(name)) {
                    error(resp, 403, "Only the room owner can pin lessons");
                    return;
                }
                if (!body.has("lesson")) {
                    error(resp, 400, "lesson is required");
                    return;
                }
                room.pinnedLesson = gson.fromJson(body.get("lesson"),
                        new com.google.gson.reflect.TypeToken<Map<String, Object>>() {
                        }.getType());
                break;
            case "unpin":
                if (!room.creator.equals(name)) {
                    error(resp, 403, "Only the room owner can unpin lessons");
                    return;
                }
                room.pinnedLesson = null;
                break;
            case "privacy":
                if (!room.creator.equals(name)) {
                    error(resp, 403, "Only the room owner can change room privacy");
                    return;
                }
                if (!body.has("isPublic")) {
                    error(resp, 400, "isPublic is required");
                    return;
                }
                room.isPublic = body.get("isPublic").getAsBoolean();
                break;
            default:
                error(resp, HttpServletResponse.SC_NOT_FOUND, "Room action not found");
                return;
        }
        resp.getWriter().write(gson.toJson(view(room)));
    }

    private void createRoom(JsonObject body, HttpServletResponse resp) throws IOException {
        String id = text(body, "roomId").toUpperCase().replaceAll("[^A-Z0-9]", "");
        String creator = text(body, "name");
        if (id.length() < 4 || creator.isEmpty()) {
            error(resp, 400, "roomId (at least 4 characters) and name are required");
            return;
        }
        if (rooms.containsKey(id)) {
            error(resp, 409, "Room ID already exists");
            return;
        }
        RoomState room = new RoomState();
        room.id = id;
        room.creator = creator;
        room.createdAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        room.isPublic = !body.has("isPublic") || body.get("isPublic").getAsBoolean();
        room.members.add(creator);
        rooms.put(id, room);
        resp.setStatus(HttpServletResponse.SC_CREATED);
        resp.getWriter().write(gson.toJson(view(room)));
    }

    private void addMessage(RoomState room, String name, String message, HttpServletResponse resp) throws IOException {
        if (name.isEmpty() || message.isEmpty()) {
            error(resp, 400, "name and text are required");
            return;
        }
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", System.nanoTime());
        item.put("name", name);
        item.put("text", message.substring(0, Math.min(message.length(), 500)));
        item.put("sentAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        synchronized (room.messages) {
            room.messages.add(item);
            if (room.messages.size() > 200)
                room.messages.remove(0);
        }
    }

    private Map<String, Object> view(RoomState room) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", room.id);
        result.put("creator", room.creator);
        result.put("createdAt", room.createdAt);
        result.put("isPublic", room.isPublic);
        result.put("members", new ArrayList<>(room.members));
        synchronized (room.messages) {
            result.put("messages", new ArrayList<>(room.messages));
        }
        result.put("pinnedLesson", room.pinnedLesson);
        return result;
    }

    private String roomId(HttpServletRequest req) {
        String path = req.getPathInfo();
        if (path == null)
            return "";
        String[] parts = path.split("/");
        return parts.length > 1 ? parts[1].toUpperCase() : "";
    }

    private String text(JsonObject body, String key) {
        return body.has(key) && !body.get(key).isJsonNull() ? body.get(key).getAsString().trim() : "";
    }

    private void prepare(HttpServletResponse resp) {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");
    }

    private void error(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        JsonObject result = new JsonObject();
        result.addProperty("error", message);
        resp.getWriter().write(gson.toJson(result));
    }
}
