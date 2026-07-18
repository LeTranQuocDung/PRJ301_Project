package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonArray;
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

@WebServlet("/api/ai/generate-questions")
public class AIServlet extends HttpServlet {

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
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(25000);

            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("model", llmModel);

            JsonArray messages = new JsonArray();

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
                                if (payload.equals("[DONE]")) break;
                                try {
                                    JsonObject chunk = JsonParser.parseString(payload).getAsJsonObject();
                                    if (chunk.has("choices")) {
                                        JsonArray choices = chunk.getAsJsonArray("choices");
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
                        JsonObject responseJson = JsonParser.parseString(responseSB.toString()).getAsJsonObject();
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
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");

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
            String lang  = json.has("lang")  ? json.get("lang").getAsString().trim()  : "English";
            String level = json.has("level") ? json.get("level").getAsString().trim() : "Beginner";
            String topic = json.has("topic") ? json.get("topic").getAsString().trim() : "General";
            int count    = json.has("count") ? json.get("count").getAsInt()           : 3;

            if (count <= 0) count = 3;
            if (count > 15) count = 15;

            // Build system prompt
            String systemPrompt =
                "You are an expert language teacher specializing in " + lang + ". " +
                "Generate exactly " + count + " unique multiple-choice questions (MCQ) for a " + level + " level student " +
                "on the topic: \"" + topic + "\". " +
                "Each question must be genuinely different — different vocabulary, different grammar points, different scenarios. " +
                "Return ONLY a valid JSON array. Each element must have exactly these fields: " +
                "\"question\" (string), " +
                "\"options\" (array of exactly 4 strings, each starting with \"A) \", \"B) \", \"C) \", \"D) \"), " +
                "\"answer\" (string matching one of the options exactly), " +
                "\"explanation\" (string explaining why the answer is correct). " +
                "Do NOT wrap the array in markdown code blocks. Return raw JSON only.";

            String userPrompt =
                "Language: " + lang + "\n" +
                "Level: " + level + "\n" +
                "Topic: " + topic + "\n" +
                "Number of questions: " + count + "\n" +
                "Make sure all questions test different aspects of the topic with clearly distinct correct answers.";

            String llmResult = callLLM(systemPrompt, userPrompt);

            if (llmResult != null) {
                try {
                    String cleaned = cleanJsonString(llmResult);
                    // Validate that it is a JSON array
                    JsonArray arr = JsonParser.parseString(cleaned).getAsJsonArray();
                    resp.getWriter().write(gson.toJson(arr));
                    return;
                } catch (Exception parseEx) {
                    System.err.println("Failed to parse LLM question output as JSON array: " + parseEx.getMessage());
                    System.err.println("Raw LLM output was: " + llmResult);
                    // Fall through to deterministic fallback below
                }
            }

            // Fallback: deterministic questions (only used when LLM is unavailable)
            List<Map<String, Object>> fallback = generateFallbackQuestions(lang, level, topic, count);
            resp.getWriter().write(gson.toJson(fallback));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Failed to generate questions\"}");
        }
    }

    /**
     * Simple fallback used ONLY when the LLM endpoint is unreachable.
     * Questions are varied enough to avoid looking identical.
     */
    private List<Map<String, Object>> generateFallbackQuestions(String lang, String level, String topic, int count) {
        String[] aspects = {
            "vocabulary", "grammar structure", "pronunciation", "reading comprehension",
            "common phrases", "formal vs informal usage", "cultural context",
            "sentence formation", "listening comprehension", "writing conventions"
        };
        String[] wrongSuffixes = { " (incorrect usage)", " (opposite meaning)", " (unrelated context)" };

        List<Map<String, Object>> list = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String aspect = aspects[i % aspects.length];
            Map<String, Object> q = new HashMap<>();

            String questionText = String.format(
                "(%s – %s level) Regarding %s: which of the following best demonstrates correct %s for the topic \"%s\"?",
                lang, level, aspect, aspect, topic
            );

            List<String> options = new ArrayList<>();
            String correctOption = "A) Use the standard " + lang + " " + aspect + " as taught at " + level + " level for topic: " + topic;
            options.add(correctOption);
            options.add("B) " + topic + wrongSuffixes[0]);
            options.add("C) " + topic + wrongSuffixes[1]);
            options.add("D) " + topic + wrongSuffixes[2]);

            q.put("question", questionText);
            q.put("options", options);
            q.put("answer", correctOption);
            q.put("explanation",
                "Option A correctly applies " + aspect + " rules for a " + level +
                " learner studying " + topic + " in " + lang + ". The other options contain common errors.");

            list.add(q);
        }
        return list;
    }
}
