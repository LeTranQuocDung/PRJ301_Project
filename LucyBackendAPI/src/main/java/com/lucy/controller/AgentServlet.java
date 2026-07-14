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
    "/api/agent/coach",
    "/api/agent/mentor-feedback",
    "/api/agent/admin-insights"
})
public class AgentServlet extends HttpServlet {

    private Gson gson;
    private String geminiApiKey;

    @Override
    public void init() throws ServletException {
        gson = new GsonBuilder().setPrettyPrinting().create();
        geminiApiKey = System.getenv("GEMINI_API_KEY");
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            geminiApiKey = "";
        }
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

        if (path.contains("coach")) {
            String userIdStr = req.getParameter("userId");
            int userId = 0;
            try {
                if (userIdStr != null) {
                    userId = Integer.parseInt(userIdStr);
                }
            } catch (NumberFormatException e) {
                // Ignore
            }

            if (userId <= 0) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Validation failed: userId must be a positive integer");
                return;
            }

            // Return deterministic coaching plan
            Map<String, Object> coachData = new HashMap<>();
            coachData.put("userId", userId);
            coachData.put("coachName", "LISA AI Coach");
            coachData.put("apiKeyConfigured", !geminiApiKey.isEmpty());
            
            Map<String, Object> nextLesson = new HashMap<>();
            nextLesson.put("level", 2);
            nextLesson.put("topic", "Introducing Yourself");
            coachData.put("nextLesson", nextLesson);

            List<String> riskFlags = new ArrayList<>();
            riskFlags.add("low_speaking_practice");
            coachData.put("riskFlags", riskFlags);

            List<String> recommendedActions = new ArrayList<>();
            recommendedActions.add("Join LIVE Room English Beginner");
            recommendedActions.add("Practice Vocab Level 2");
            coachData.put("recommendedActions", recommendedActions);

            resp.getWriter().write(gson.toJson(coachData));

        } else if (path.contains("admin-insights")) {
            // Return deterministic admin insights
            Map<String, Object> insights = new HashMap<>();
            insights.put("activeClassrooms", 5);
            insights.put("contentHealth", "92%");
            insights.put("apiKeyConfigured", !geminiApiKey.isEmpty());
            
            List<String> weakAreas = new ArrayList<>();
            weakAreas.add("Chinese Level 3 Tones");
            insights.put("weakAreas", weakAreas);

            List<String> riskAlerts = new ArrayList<>();
            riskAlerts.add("2 students inactive for > 7 days");
            insights.put("riskAlerts", riskAlerts);

            List<String> recommendedActions = new ArrayList<>();
            recommendedActions.add("Reprocess curriculum import data_importer_toolkit/LucyImporter");
            recommendedActions.add("Send push notifications to inactive learners");
            insights.put("recommendedActions", recommendedActions);

            resp.getWriter().write(gson.toJson(insights));
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

        if (path.contains("mentor-feedback")) {
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

            if (!json.has("userId") || !json.has("answerText") || !json.has("lessonCode")) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Validation failed: userId, answerText, and lessonCode are required");
                return;
            }

            int userId = json.get("userId").getAsInt();
            String answerText = json.get("answerText").getAsString().trim();
            String lessonCode = json.get("lessonCode").getAsString().trim();

            if (userId <= 0 || answerText.isEmpty() || lessonCode.isEmpty()) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Validation failed: userId must be positive, answerText and lessonCode must not be empty");
                return;
            }

            // Return deterministic AI mentor feedback
            Map<String, Object> feedbackData = new HashMap<>();
            feedbackData.put("userId", userId);
            feedbackData.put("lessonCode", lessonCode);
            feedbackData.put("apiKeyConfigured", !geminiApiKey.isEmpty());
            feedbackData.put("feedback", "Excellent response! Consider using 'Good morning' in formal contexts.");
            feedbackData.put("corrections", "None");
            feedbackData.put("speakingTips", "Focus on the rising intonation at the end of questions.");
            feedbackData.put("confidenceScore", 88);

            resp.getWriter().write(gson.toJson(feedbackData));
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
