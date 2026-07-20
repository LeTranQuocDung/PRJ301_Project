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
        geminiApiKey = loadApiKey();
        
        llmEndpoint = System.getenv("LUCY_LLM_ENDPOINT");
        if (llmEndpoint == null || llmEndpoint.trim().isEmpty()) {
            llmEndpoint = System.getProperty("LUCY_LLM_ENDPOINT", "https://generativelanguage.googleapis.com/v1beta");
        }
        
        llmModel = System.getenv("LUCY_LLM_MODEL");
        if (llmModel == null || llmModel.trim().isEmpty()) {
            llmModel = System.getProperty("LUCY_LLM_MODEL", "gemini-2.5-flash");
        }
    }

    private String loadApiKey() {
        String key = System.getenv("GEMINI_API_KEY");
        if (key == null || key.trim().isEmpty()) {
            key = System.getProperty("GEMINI_API_KEY");
        }
        if (key == null || key.trim().isEmpty()) {
            try {
                java.io.File envFile = new java.io.File("../.env");
                if (!envFile.exists()) envFile = new java.io.File(".env");
                if (envFile.exists()) {
                    try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(envFile))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (line.trim().startsWith("GEMINI_API_KEY=")) {
                                key = line.trim().substring("GEMINI_API_KEY=".length()).trim();
                                break;
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return key != null ? key.trim() : "";
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
            // Support direct official Google Gemini API if key starts with AIzaSy or AQ.
            if (geminiApiKey.trim().startsWith("AIzaSy") || geminiApiKey.trim().startsWith("AQ.")) {
                java.net.URL url = new java.net.URL("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey.trim());
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(15000);

                JsonObject requestBody = new JsonObject();

                // Set system instructions
                JsonObject systemInstruction = new JsonObject();
                com.google.gson.JsonArray sysParts = new com.google.gson.JsonArray();
                JsonObject sysPartObj = new JsonObject();
                sysPartObj.addProperty("text", systemPrompt);
                sysParts.add(sysPartObj);
                systemInstruction.add("parts", sysParts);
                requestBody.add("systemInstruction", systemInstruction);

                // Set contents
                com.google.gson.JsonArray contents = new com.google.gson.JsonArray();
                JsonObject userContentObj = new JsonObject();
                userContentObj.addProperty("role", "user");
                com.google.gson.JsonArray userParts = new com.google.gson.JsonArray();
                JsonObject userPartObj = new JsonObject();
                userPartObj.addProperty("text", userPrompt);
                userParts.add(userPartObj);
                userContentObj.add("parts", userParts);
                contents.add(userContentObj);
                requestBody.add("contents", contents);

                // Generation config for JSON output
                JsonObject generationConfig = new JsonObject();
                generationConfig.addProperty("responseMimeType", "application/json");
                generationConfig.addProperty("temperature", 0.9);
                requestBody.add("generationConfig", generationConfig);

                try (java.io.OutputStream os = conn.getOutputStream()) {
                    byte[] input = requestBody.toString().getBytes("utf-8");
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    try (java.io.BufferedReader br = new java.io.BufferedReader(
                            new java.io.InputStreamReader(conn.getInputStream(), "utf-8"))) {
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = br.readLine()) != null) {
                            sb.append(line);
                        }
                        JsonObject responseJson = com.google.gson.JsonParser.parseString(sb.toString()).getAsJsonObject();
                        return responseJson.getAsJsonArray("candidates")
                                .get(0).getAsJsonObject()
                                .getAsJsonObject("content")
                                .getAsJsonArray("parts")
                                .get(0).getAsJsonObject()
                                .get("text").getAsString();
                    }
                } else {
                    System.err.println("Gemini API call returned code: " + code);
                }
                return null;
            }

            // OpenAI compatible endpoint proxy
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
            requestBody.addProperty("temperature", 0.9);
            
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
            System.err.println("LLM connection error: " + e.getMessage());
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
            double randomSeed = Math.random();
            String sysPrompt = "You are the LISA AI Learning Coach. Analyze the student's status and output a JSON object containing: \"coachName\" (string, e.g. \"LISA AI Coach\"), \"nextLesson\" (object with \"level\" integer and \"topic\" string), \"riskFlags\" (array of strings, e.g. [\"low_speaking_practice\"]), and \"recommendedActions\" (array of strings). Return ONLY the raw JSON object, without markdown formatting or code blocks.";
            String userPrompt = "Generate a custom learning plan for student ID: " + userId + ". Random seed: " + randomSeed + ". Make sure the recommended actions and next lesson topic are varied, realistic and personalized.";
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
                // Dynamic personalized fallback coach data
                Map<String, Object> coachData = generateSmartCoachPlan(userId);
                resp.getWriter().write(gson.toJson(coachData));
            }

        } else if (path.contains("admin-insights")) {
            // Call LLM for admin insights
            double randomSeed2 = Math.random();
            String sysPrompt = "You are the LISA Admin Insights Agent. Analyze system data and output a JSON object containing: \"activeClassrooms\" (integer), \"contentHealth\" (string, e.g. \"95%\"), \"weakAreas\" (array of strings), \"riskAlerts\" (array of strings), and \"recommendedActions\" (array of strings). Return ONLY the raw JSON object, without markdown formatting or code blocks.";
            String userPrompt = "Generate administrative insights. Random seed: " + randomSeed2;
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
                // Return dynamic admin insights fallback
                Map<String, Object> insights = new HashMap<>();
                insights.put("activeClassrooms", 8);
                insights.put("contentHealth", "96%");
                insights.put("apiKeyConfigured", !geminiApiKey.isEmpty());
                
                List<String> weakAreas = new ArrayList<>();
                weakAreas.add("Chinese Level 3 Tones");
                weakAreas.add("Japanese Keigo Formats");
                insights.put("weakAreas", weakAreas);

                List<String> riskAlerts = new ArrayList<>();
                riskAlerts.add("2 students inactive for > 7 days");
                riskAlerts.add("Speech practice completion rate below 60% in Stage 2");
                insights.put("riskAlerts", riskAlerts);

                List<String> recommendedActions = new ArrayList<>();
                recommendedActions.add("Schedule live audio room workshop for Beginner students");
                recommendedActions.add("Send push notifications to inactive learners");
                recommendedActions.add("Review Level 3 Chinese audio pronunciation materials");
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
                // Smart dynamic AI mentor feedback engine
                Map<String, Object> feedbackData = generateSmartMentorFeedback(userId, lessonCode, answerText);
                resp.getWriter().write(gson.toJson(feedbackData));
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    private Map<String, Object> generateSmartCoachPlan(int userId) {
        Map<String, Object> coachData = new HashMap<>();
        coachData.put("userId", userId);
        coachData.put("coachName", "LISA AI Coach");
        coachData.put("apiKeyConfigured", !geminiApiKey.isEmpty());

        String[] topics = {
            "Daily Routine & Time Expressions",
            "Introducing Yourself & Professional Background",
            "Expressing Preferences & Ordering Food",
            "Past Experiences & Storytelling",
            "Making Future Plans & Appointments"
        };
        int topicIdx = Math.abs(userId * 17) % topics.length;

        Map<String, Object> nextLesson = new HashMap<>();
        nextLesson.put("level", (topicIdx % 3) + 1);
        nextLesson.put("topic", topics[topicIdx]);
        coachData.put("nextLesson", nextLesson);

        List<String> riskFlags = new ArrayList<>();
        if (userId % 2 == 0) {
            riskFlags.add("speaking_pronunciation_check");
            riskFlags.add("infrequent_live_room_participation");
        } else {
            riskFlags.add("grammar_tense_consistency");
        }
        coachData.put("riskFlags", riskFlags);

        List<String> recommendedActions = new ArrayList<>();
        recommendedActions.add("Practice " + topics[topicIdx] + " with AI Coach");
        recommendedActions.add("Join Voice Room: Live Practice");
        recommendedActions.add("Complete 1 interactive Quiz on AI Questions tab");
        coachData.put("recommendedActions", recommendedActions);

        return coachData;
    }

    private Map<String, Object> generateSmartMentorFeedback(int userId, String lessonCode, String answerText) {
        Map<String, Object> feedbackData = new HashMap<>();
        feedbackData.put("userId", userId);
        feedbackData.put("lessonCode", lessonCode);
        feedbackData.put("apiKeyConfigured", !geminiApiKey.isEmpty());

        String lower = answerText.toLowerCase();
        String feedback = "";
        String corrections = "None";
        String speakingTips = "";
        int score = 85;

        String langName = "English";
        if (lessonCode.startsWith("ZH")) langName = "Chinese";
        if (lessonCode.startsWith("JA")) langName = "Japanese";

        // Analyze sentence length & content intelligently
        int wordCount = answerText.trim().split("\\s+").length;

        if (wordCount < 3) {
            feedback = "Short response! While clear, try expanding into a full sentence to practice conversational fluency.";
            corrections = "Try extending to a full phrase, e.g.: '" + answerText + ", nice to meet you!'";
            speakingTips = "Maintain clear, steady intonation when stating key words.";
            score = 72;
        } else if (lower.contains("yesterday") && (lower.contains(" go ") || lower.contains(" is ") || lower.contains(" am "))) {
            feedback = "Good effort! Remember to use simple past tense verbs when talking about past events ('yesterday').";
            corrections = lower.replace("go", "went").replace(" is ", " was ").replace(" am ", " was ");
            corrections = "Change present tense verb to past form: '" + corrections + "'";
            speakingTips = "Stress the past verb to emphasize completed actions.";
            score = 78;
        } else if (lower.contains(" i is ") || lower.contains(" he go ") || lower.contains(" she go ")) {
            feedback = "Notice the subject-verb agreement in your sentence.";
            corrections = lower.replace(" i is ", " I am ").replace(" he go ", " he goes ").replace(" she go ", " she goes ");
            corrections = "Correct subject-verb agreement: '" + corrections + "'";
            speakingTips = "Keep your voice natural and articulate verb endings clearly.";
            score = 80;
        } else {
            feedback = "Great job! Your sentence is grammatically clear and effectively communicates your idea in " + langName + ".";
            corrections = "None";
            speakingTips = "Focus on natural pauses between thought groups to sound more fluent.";
            score = Math.min(98, 85 + (wordCount * 2));
        }

        feedbackData.put("feedback", feedback);
        feedbackData.put("corrections", corrections);
        feedbackData.put("speakingTips", speakingTips);
        feedbackData.put("confidenceScore", score);

        return feedbackData;
    }

    private void sendError(HttpServletResponse resp, int status, String msg) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"error\":\"" + msg + "\"}");
    }
}

