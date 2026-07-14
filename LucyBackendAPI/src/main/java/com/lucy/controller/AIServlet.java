package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
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
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);

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
            String lang = json.has("lang") ? json.get("lang").getAsString().trim() : "English";
            String level = json.has("level") ? json.get("level").getAsString().trim() : "Beginner";
            String topic = json.has("topic") ? json.get("topic").getAsString().trim() : "General";
            int count = json.has("count") ? json.get("count").getAsInt() : 3;

            if (count <= 0) count = 3;
            if (count > 15) count = 15; // safety limit

            List<Map<String, Object>> questions = generateDeterministicQuestions(lang, level, topic, count);

            resp.getWriter().write(gson.toJson(questions));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Failed to generate questions dynamically\"}");
        }
    }

    private List<Map<String, Object>> generateDeterministicQuestions(String lang, String level, String topic, int count) {
        List<Map<String, Object>> list = new ArrayList<>();

        for (int i = 1; i <= count; i++) {
            Map<String, Object> q = new HashMap<>();
            
            // Generate question details based on index and language
            String questionText;
            List<String> options = new ArrayList<>();
            String answer;
            String explanation;

            if ("Chinese".equalsIgnoreCase(lang) || "ZH".equalsIgnoreCase(lang)) {
                questionText = String.format("What is the Chinese question about '%s' (level: %s) at index %d?", topic, level, i);
                options.add("A) Study vocabulary related to " + topic);
                options.add("B) Practice dialogue about " + topic);
                options.add("C) Read Pinyin related to " + topic);
                options.add("D) All of the above");
                answer = "D) All of the above";
                explanation = "For level " + level + ", studying vocabulary, dialogue, and Pinyin is the most effective way to master the topic: " + topic;
            } else if ("Japanese".equalsIgnoreCase(lang) || "JA".equalsIgnoreCase(lang)) {
                questionText = String.format("What is the Japanese question about '%s' (level: %s) at index %d?", topic, level, i);
                options.add("A) Study vocabulary related to " + topic);
                options.add("B) Practice conversation about " + topic);
                options.add("C) Review Kanji related to " + topic);
                options.add("D) All of the above");
                answer = "D) All of the above";
                explanation = "For level " + level + ", practicing vocabulary, conversation, and Kanji is the best way to master the topic: " + topic;
            } else {
                questionText = String.format("What is the most effective way to learn about '%s' at '%s' level in %s (Question %d)?", topic, level, lang, i);
                options.add("A) Study vocabulary words related to " + topic);
                options.add("B) Practice listening to dialogues about " + topic);
                options.add("C) Write short essays using keywords of " + topic);
                options.add("D) All of the above");
                answer = "D) All of the above";
                explanation = "For " + level + " level, integrating vocabulary study, dialogue listening, and writing practices is the best way to master " + topic + ".";
            }

            q.put("question", questionText);
            q.put("options", options);
            q.put("answer", answer);
            q.put("explanation", explanation);

            list.add(q);
        }

        return list;
    }
}
