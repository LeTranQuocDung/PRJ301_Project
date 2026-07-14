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
import java.io.BufferedReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(urlPatterns = {
    "/api/import/history",
    "/api/import/reprocess"
})
public class ImportServlet extends HttpServlet {

    private Gson gson;
    private static final List<Map<String, Object>> importHistory = new ArrayList<>();
    private static final Map<String, Integer> fileRecordsMap = new HashMap<>();

    static {
        // Seed 8 docx files representing LISA English stage 1-3, Chinese stage 1-2, Japanese stage 1-3
        addHistoryItem("LISA_English_Stage1.docx", "142 KB", 20, "success", "2026-07-10", "English", "Stage 1");
        addHistoryItem("LISA_English_Stage2.docx", "156 KB", 25, "success", "2026-07-11", "English", "Stage 2");
        addHistoryItem("LISA_English_Stage3.docx", "168 KB", 30, "success", "2026-07-12", "English", "Stage 3");
        addHistoryItem("Chinese_Stage1_Content.docx", "118 KB", 18, "success", "2026-07-13", "Chinese", "Stage 1");
        addHistoryItem("Chinese_Stage2_Content.docx", "128 KB", 22, "success", "2026-07-13", "Chinese", "Stage 2");
        addHistoryItem("Japanese_Stage1_Content.docx", "124 KB", 20, "success", "2026-07-14", "Japanese", "Stage 1");
        addHistoryItem("Japanese_Stage2_Content.docx", "132 KB", 24, "success", "2026-07-14", "Japanese", "Stage 2");
        addHistoryItem("Japanese_Stage3_Content.docx", "140 KB", 28, "success", "2026-07-14", "Japanese", "Stage 3");
    }

    private static void addHistoryItem(String name, String size, int records, String status, String date, String language, String stage) {
        Map<String, Object> item = new HashMap<>();
        item.put("name", name);
        item.put("size", size);
        item.put("records", records);
        item.put("status", status);
        item.put("date", date);
        item.put("language", language);
        item.put("stage", stage);
        importHistory.add(item);
        fileRecordsMap.put(name, records);
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

        if (path.contains("history")) {
            resp.getWriter().write(gson.toJson(importHistory));
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

        if (path.contains("reprocess")) {
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

            String fileName = json.has("fileName") ? json.get("fileName").getAsString().trim() : "";
            if (fileName.isEmpty()) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing required field: fileName");
                return;
            }

            if (!fileRecordsMap.containsKey(fileName)) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Unknown file name: " + fileName);
                return;
            }

            int records = fileRecordsMap.get(fileName);

            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("records", records);

            resp.getWriter().write(gson.toJson(result));
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    private void sendError(HttpServletResponse resp, int status, String msg) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"error\":\"" + msg + "\"}");
    }
}
