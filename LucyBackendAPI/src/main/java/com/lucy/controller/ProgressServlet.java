package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.lucy.dao.UserProgressDAO;
import com.lucy.model.UserProgress;
import com.lucy.util.CorsUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.List;

@WebServlet(urlPatterns = {
    "/api/progress", 
    "/api/progress/complete", 
    "/api/progress/redeem"
})
public class ProgressServlet extends HttpServlet {

    private UserProgressDAO dao;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        dao = new UserProgressDAO();
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

        String userIdParam = req.getParameter("userId");
        if (userIdParam == null || userIdParam.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Parameter userId is required\"}");
            return;
        }

        try {
            int userId = Integer.parseInt(userIdParam.trim());
            int totalXp = dao.getUserXp(userId);
            List<UserProgress> progressList = dao.getProgressByUserId(userId);

            JsonObject responseJson = new JsonObject();
            responseJson.addProperty("totalXp", totalXp);
            responseJson.add("progressList", gson.toJsonTree(progressList));

            resp.getWriter().write(gson.toJson(responseJson));
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid userId format\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Internal server error occurred\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");

        String path = req.getServletPath();
        if (path == null) path = "";

        if (path.contains("redeem")) {
            handleRedeem(req, resp);
        } else {
            handleCompleteProgress(req, resp);
        }
    }

    private void handleRedeem(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = req.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            if (sb.length() == 0) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Empty request body\"}");
                return;
            }

            JsonObject json = JsonParser.parseString(sb.toString()).getAsJsonObject();
            
            if (!json.has("userId") || !json.has("xpDelta") || !json.has("reason")) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Missing required fields: userId, xpDelta, reason\"}");
                return;
            }

            int userId = json.get("userId").getAsInt();
            int xpDelta = json.get("xpDelta").getAsInt();
            String reason = json.get("reason").getAsString().trim();

            if (userId <= 0 || xpDelta == 0 || reason.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Invalid field values\"}");
                return;
            }

            boolean success = dao.adjustUserXp(userId, xpDelta);

            if (success) {
                resp.getWriter().write("{\"success\":true,\"message\":\"Redemption successful\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Insufficient XP balance or user not found\"}");
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Failed to process redemption request\"}");
        }
    }

    private void handleCompleteProgress(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = req.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            if (sb.length() == 0) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Empty request body\"}");
                return;
            }

            JsonObject json = JsonParser.parseString(sb.toString()).getAsJsonObject();
            
            if (!json.has("userId") || !json.has("languageCode") || !json.has("levelNum")) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Missing required fields: userId, languageCode, levelNum\"}");
                return;
            }

            int userId = json.get("userId").getAsInt();
            String languageCode = json.get("languageCode").getAsString().trim();
            int levelNum = json.get("levelNum").getAsInt();
            int xp = json.has("xp") ? json.get("xp").getAsInt() : 0;

            // Normalize language code
            if ("EN".equalsIgnoreCase(languageCode) || "ENGLISH".equalsIgnoreCase(languageCode)) {
                languageCode = "LISA";
            } else {
                languageCode = languageCode.toUpperCase();
            }

            if (userId <= 0 || languageCode.isEmpty() || levelNum <= 0) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Invalid field values\"}");
                return;
            }

            boolean success = dao.saveProgress(userId, languageCode, levelNum, xp);

            if (success) {
                resp.getWriter().write("{\"success\":true,\"message\":\"Progress saved and XP updated\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                resp.getWriter().write("{\"error\":\"Failed to save progress to database\"}");
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Failed to parse request JSON\"}");
        }
    }
}
