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
    private String llmEndpoint;
    private String llmModel;

    @Override
    public void init() throws ServletException {
        gson = new GsonBuilder().setPrettyPrinting().create();
        
        geminiApiKey = System.getenv("GEMINI_API_KEY");
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            geminiApiKey = System.getProperty("GEMINI_API_KEY", "");
        }
        
        llmEndpoint = System.getenv("LUCY_LLM_ENDPOINT");
        if (llmEndpoint == null || llmEndpoint.trim().isEmpty()) {
            llmEndpoint = System.getProperty("LUCY_LLM_ENDPOINT", "https://rtrung-suc-vat.abc-tunnel.us/v1");
        }
        
        llmModel = System.getenv("LUCY_LLM_MODEL");
        if (llmModel == null || llmModel.trim().isEmpty()) {
            llmModel = System.getProperty("LUCY_LLM_MODEL", "all");
        }
    }

    private String cleanJsonString(String raw) {
        if (raw == null) return null;
        String clean = raw.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }

    private String callLLM(String systemPrompt, String userPrompt) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return null;
        }
        try {
            String cleanEndpoint = llmEndpoint.trim();
            if (!cleanEndpoint.endsWith("/")) {
                cleanEndpoint += "/";
            }
            java.net.URL url = new java.net.URL(cleanEndpoint + "chat/completions");
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + geminiApiKey);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            conn.setDoOutput(true);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(15000);

            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("model", llmModel);
            
            com.google.gson.JsonArray messages = new com.google.gson.JsonArray();
            
            JsonObject sysMsg = new JsonObject();
            sysMsg.addProperty("role", "system");
            sysMsg.addProperty("content", systemPrompt);
            messages.add(sysMsg);
            
            JsonObject usrMsg = new JsonObject();
            usrMsg.addProperty("role", "user");
            usrMsg.addProperty("content", userPrompt);
            messages.add(usrMsg);
            
            requestBody.add("messages", messages);

            try (java.io.OutputStream os = conn.getOutputStream()) {
                byte[] input = requestBody.toString().getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) {
                try (java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(conn.getInputStream(), "utf-8"))) {
                    java.util.List<String> lines = new java.util.ArrayList<>();
                    String line;
                    boolean isSSE = false;
                    while ((line = br.readLine()) != null) {
                        String trimmed = line.trim();
                        if (!trimmed.isEmpty()) {
                            lines.add(trimmed);
                            if (trimmed.startsWith("data:")) {
                                isSSE = true;
                            }
                        }
                    }

                    if (isSSE) {
                        StringBuilder fullContent = new StringBuilder();
                        for (String l : lines) {
                            if (l.startsWith("data:")) {
                                String payload = l.substring(5).trim();
                                if (payload.equals("[DONE]")) {
                                    break;
                                }
                                try {
                                    JsonObject chunk = com.google.gson.JsonParser.parseString(payload).getAsJsonObject();
                                    if (chunk.has("choices")) {
                                        com.google.gson.JsonArray choices = chunk.getAsJsonArray("choices");
                                        if (choices.size() > 0) {
                                            JsonObject choice = choices.get(0).getAsJsonObject();
                                            if (choice.has("delta")) {
                                                JsonObject delta = choice.getAsJsonObject("delta");
                                                if (delta.has("content")) {
                                                    fullContent.append(delta.get("content").getAsString());
                                                }
                                            } else if (choice.has("message")) {
                                                JsonObject message = choice.getAsJsonObject("message");
                                                if (message.has("content")) {
                                                    fullContent.append(message.get("content").getAsString());
                                                }
                                            }
                                        }
                                    }
                                } catch (Exception e) {
                                    // Ignore malformed chunk
                                }
                            }
                        }
                        return fullContent.toString();
                    } else {
                        StringBuilder responseSB = new StringBuilder();
                        for (String l : lines) {
                            responseSB.append(l);
                        }
                        JsonObject responseJson = com.google.gson.JsonParser.parseString(responseSB.toString()).getAsJsonObject();
                        return responseJson.getAsJsonArray("choices")
                                .get(0).getAsJsonObject()
                                .getAsJsonObject("message")
                                .get("content").getAsString();
                    }
                }
            } else {
                System.err.println("LLM call failed with HTTP code: " + code);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
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

            // Call LLM for coaching plan
            String sysPrompt = "You are the LISA AI Learning Coach. Analyze the student's status and output a JSON object containing: \"coachName\" (string, e.g. \"LISA AI Coach\"), \"nextLesson\" (object with \"level\" integer and \"topic\" string), \"riskFlags\" (array of strings, e.g. [\"low_speaking_practice\"]), and \"recommendedActions\" (array of strings). Return ONLY the raw JSON object, without markdown formatting or code blocks.";
            String userPrompt = "Generate a custom learning plan for student ID: " + userId;
            String llmResult = callLLM(sysPrompt, userPrompt);
            
            JsonObject resultJson = null;
            if (llmResult != null) {
                try {
                    resultJson = com.google.gson.JsonParser.parseString(cleanJsonString(llmResult)).getAsJsonObject();
                } catch (Exception e) {
                    System.err.println("Failed to parse LLM coach output: " + e.getMessage());
                }
            }

            if (resultJson != null) {
                resultJson.addProperty("userId", userId);
                resultJson.addProperty("apiKeyConfigured", true);
                resp.getWriter().write(gson.toJson(resultJson));
            } else {
                // Fallback to deterministic coaching plan if API fails or is not configured
                Map<String, Object> coachData = new HashMap<>();
                coachData.put("userId", userId);
                coachData.put("coachName", "LISA AI Coach (Fallback)");
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
            }

        } else if (path.contains("admin-insights")) {
            // Call LLM for admin insights
            String sysPrompt = "You are the LISA Admin Insights Agent. Analyze system data and output a JSON object containing: \"activeClassrooms\" (integer), \"contentHealth\" (string, e.g. \"95%\"), \"weakAreas\" (array of strings), \"riskAlerts\" (array of strings), and \"recommendedActions\" (array of strings). Return ONLY the raw JSON object, without markdown formatting or code blocks.";
            String userPrompt = "Generate administrative insights.";
            String llmResult = callLLM(sysPrompt, userPrompt);
            
            JsonObject resultJson = null;
            if (llmResult != null) {
                try {
                    resultJson = com.google.gson.JsonParser.parseString(cleanJsonString(llmResult)).getAsJsonObject();
                } catch (Exception e) {
                    System.err.println("Failed to parse LLM admin insights output: " + e.getMessage());
                }
            }

            if (resultJson != null) {
                resultJson.addProperty("apiKeyConfigured", true);
                resp.getWriter().write(gson.toJson(resultJson));
            } else {
                // Return deterministic admin insights fallback
                Map<String, Object> insights = new HashMap<>();
                insights.put("activeClassrooms", 5);
                insights.put("contentHealth", "92% (Fallback)");
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

            // Call LLM for dynamic AI mentor feedback
            String sysPrompt = "You are the LISA AI Mentor. Analyze the student's answer text for the lesson and provide feedback. Output a JSON object containing: \"feedback\" (string, short general feedback), \"corrections\" (string, any grammatical corrections or \"None\"), \"speakingTips\" (string, pronunciation or speaking tips), and \"confidenceScore\" (integer between 0 and 100). Return ONLY the raw JSON object, without markdown formatting or code blocks.";
            String userPrompt = "Lesson Code: " + lessonCode + ". Student Answer: \"" + answerText + "\".";
            String llmResult = callLLM(sysPrompt, userPrompt);
            
            JsonObject resultJson = null;
            if (llmResult != null) {
                try {
                    resultJson = com.google.gson.JsonParser.parseString(cleanJsonString(llmResult)).getAsJsonObject();
                } catch (Exception e) {
                    System.err.println("Failed to parse LLM feedback output: " + e.getMessage());
                }
            }

            if (resultJson != null) {
                resultJson.addProperty("userId", userId);
                resultJson.addProperty("lessonCode", lessonCode);
                resultJson.addProperty("apiKeyConfigured", true);
                resp.getWriter().write(gson.toJson(resultJson));
            } else {
                // Fallback to deterministic AI mentor feedback
                Map<String, Object> feedbackData = new HashMap<>();
                feedbackData.put("userId", userId);
                feedbackData.put("lessonCode", lessonCode);
                feedbackData.put("apiKeyConfigured", !geminiApiKey.isEmpty());
                feedbackData.put("feedback", "Excellent response! Consider using 'Good morning' in formal contexts. (Fallback)");
                feedbackData.put("corrections", "None");
                feedbackData.put("speakingTips", "Focus on the rising intonation at the end of questions.");
                feedbackData.put("confidenceScore", 88);

                resp.getWriter().write(gson.toJson(feedbackData));
            }
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
