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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@WebServlet(urlPatterns = {
    "/api/engagement/podcasts",
    "/api/engagement/podcasts/visibility",
    "/api/engagement/premium",
    "/api/engagement/gifts"
})
public class EngagementServlet extends HttpServlet {

    private Gson gson;
    private static final Set<String> hiddenEpisodeIds = ConcurrentHashMap.newKeySet();

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

        if (path.contains("podcasts")) {
            handleGetPodcasts(req, resp);
        } else if (path.contains("premium")) {
            handleGetPremium(resp);
        } else if (path.contains("gifts")) {
            handleGetGifts(resp);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    private void handleGetPodcasts(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<Map<String, Object>> list = new ArrayList<>();

        Map<String, Object> p1 = new HashMap<>();
        p1.put("title", "English for Beginners");
        p1.put("episodeCount", 12);
        p1.put("lang", "English");
        p1.put("subs", 234);
        p1.put("accent", "blue");
        p1.put("flagCode", "GB");
        p1.put("description", "Elementary English listening practice from the British Council.");
        p1.put("source", "British Council LearnEnglish");
        p1.put("sourceUrl", "https://learnenglish.britishcouncil.org/general-english/audio-series/podcasts");
        p1.put("audioUrl", "https://learnenglish.britishcouncil.org/sites/podcasts/files/podcast/elementary-podcasts-s01-e01.mp3");
        p1.put("episodes", createEpisodes("EN", "English", 12, 1440, (String) p1.get("audioUrl"), (String) p1.get("source"), (String) p1.get("sourceUrl")));
        list.add(p1);

        Map<String, Object> p2 = new HashMap<>();
        p2.put("title", "Chinese for Beginners");
        p2.put("episodeCount", 8);
        p2.put("lang", "Chinese");
        p2.put("subs", 145);
        p2.put("accent", "red");
        p2.put("flagCode", "CN");
        p2.put("description", "EP14: Learn practical Chinese for banking, rules and financial safety.");
        p2.put("source", "Castbox - 中文加油站");
        p2.put("sourceUrl", "https://castbox.fm/episode/EP14%3AHSK-1-3-%E8%AF%BB%E6%87%82%E4%B8%AD%E5%9B%BD%E4%BA%BA%E7%9A%84%E2%80%9C%E8%A7%84%E7%9F%A9%E2%80%9D%E4%B8%8E%E2%80%9C%E5%AE%89%E5%85%A8%E6%84%9F%E2%80%9D-Understand-the-%22rules%22-and-%22sense-of-security%22-of-Chinese-people-%7C-Chinese-Learning-%7C-Beginner-Friendly-%7C-Chinese-Daily-Conversations-%7C-%E8%BD%BB%E6%9D%BE%E5%AD%A6%E4%B8%AD%E6%96%87-%7C-%E6%97%A5%E5%B8%B8%E5%AF%B9%E8%AF%9D-%7C-%E4%B8%AD%E6%96%87%E5%90%AC%E5%8A%9B-%7C-%E4%B8%AD%E6%96%87%E6%92%AD%E5%AE%A2-%7C-%E4%B8%AD%E5%9B%BD%E6%96%87%E5%8C%96-id7170737-id969352815?country=us");
        p2.put("audioUrl", "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2026-6-17/5c05ce5e-5ad2-81f7-d3b6-bbe9aabfbfb2.mp3");
        p2.put("episodes", createEpisodes("ZH", "Chinese", 8, 772, (String) p2.get("audioUrl"), (String) p2.get("source"), (String) p2.get("sourceUrl")));
        list.add(p2);

        Map<String, Object> p3 = new HashMap<>();
        p3.put("title", "Japanese for Beginners");
        p3.put("episodeCount", 15);
        p3.put("lang", "Japanese");
        p3.put("subs", 178);
        p3.put("accent", "pink");
        p3.put("flagCode", "JP");
        p3.put("description", "Podcast 52: practical Japanese for dealing with a cold in Japan.");
        p3.put("source", "Learn Japanese Pod");
        p3.put("sourceUrl", "https://podcast.learnjapanesepod.com/");
        p3.put("audioUrl", "https://podcast.learnjapanesepod.com/podcasts/podcast_52_lesson.mp3");
        p3.put("episodes", createEpisodes("JA", "Japanese", 15, 1326, (String) p3.get("audioUrl"), (String) p3.get("source"), (String) p3.get("sourceUrl")));
        list.add(p3);

        boolean adminView = "true".equalsIgnoreCase(req.getParameter("admin"));
        if (!adminView) {
            for (Map<String, Object> podcast : list) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> episodes = (List<Map<String, Object>>) podcast.get("episodes");
                episodes.removeIf(episode -> hiddenEpisodeIds.contains((String) episode.get("id")));
                podcast.put("episodeCount", episodes.size());
            }
        }
        resp.getWriter().write(gson.toJson(list));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");
        if (!req.getServletPath().contains("visibility")) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
            return;
        }
        JsonObject body;
        try {
            body = gson.fromJson(req.getReader(), JsonObject.class);
        } catch (Exception ex) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid JSON body\"}");
            return;
        }
        String episodeId = body != null && body.has("episodeId") ? body.get("episodeId").getAsString().trim() : "";
        boolean visible = body != null && body.has("visible") && body.get("visible").getAsBoolean();
        if (episodeId.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"episodeId is required\"}");
            return;
        }
        if (visible) hiddenEpisodeIds.remove(episodeId); else hiddenEpisodeIds.add(episodeId);
        JsonObject result = new JsonObject();
        result.addProperty("episodeId", episodeId);
        result.addProperty("visible", visible);
        resp.getWriter().write(gson.toJson(result));
    }

    private List<Map<String, Object>> createEpisodes(String prefix, String language, int count, int totalSeconds,
            String audioUrl, String source, String sourceUrl) {
        String[] categories = {"Conversations", "Lessons", "News"};
        String[] englishTopics = {
            "Meet the Hosts and Angelina Jolie",
            "Why Zara Admires Angelina Jolie",
            "Quiz Time: Things in a Kitchen",
            "Our Man in New York: Central Park",
            "Should Celebrities Support Charities?",
            "Public Opinions on Celebrity Charity",
            "Carolina Arrives at UK Immigration",
            "Immigration Questions and Gordon's Joke",
            "Grammar Lesson: Future Plans with Going To",
            "Formal Plans and Evening Greetings",
            "Building Vocabulary with Word Families",
            "Useful Expressions: Dear and It Depends"
        };
        String[] chineseTopics = {
            "初到中国：去银行前的准备",
            "手机支付与现金使用习惯",
            "护照、取号与排队规矩",
            "开户、手机银行与取款",
            "柜台取钱与外币兑换",
            "手机转账与安全意识",
            "银行办事与中国人的规矩",
            "银行核心词汇与求助技巧"
        };
        String[] japaneseTopics = {
            "風邪の会話と新年のあいさつ",
            "寒い天気と風邪の話",
            "顔色が悪いね：基本会話",
            "体がだるい・頭が痛い",
            "熱・くしゃみ・風邪の表現",
            "薬を飲んで休んでね",
            "風邪をひいた：基本単語",
            "鼻づまりと鼻水の表現",
            "咳と体のだるさ",
            "関節痛・頭痛・寒気",
            "風邪をひく時の話",
            "薬と健康管理",
            "休養と辛いカレー",
            "日本のカレーと伝統的な治療法",
            "大根・はちみつ・レモンとまとめ"
        };
        String[] topics = prefix.equals("ZH") ? chineseTopics : prefix.equals("JA") ? japaneseTopics : englishTopics;
        String[] englishCategories = {"Conversations", "Conversations", "Lessons", "News", "Conversations", "Conversations",
            "Conversations", "Conversations", "Lessons", "Lessons", "Lessons", "Lessons"};
        String[] japaneseCategories = {"Conversations", "Conversations", "Conversations", "Lessons", "Lessons",
            "Lessons", "Lessons", "Lessons", "Lessons", "Lessons", "Conversations", "Conversations",
            "Conversations", "Conversations", "Lessons"};
        String[] chineseCategories = {"Conversations", "Lessons", "Lessons", "Conversations",
            "Conversations", "Lessons", "News", "Lessons"};
        List<Map<String, Object>> episodes = new ArrayList<>();
        int segmentSeconds = Math.max(1, totalSeconds / count);
        for (int i = 1; i <= count; i++) {
            String category = prefix.equals("EN") ? englishCategories[i - 1]
                : prefix.equals("JA") ? japaneseCategories[i - 1]
                : prefix.equals("ZH") ? chineseCategories[i - 1]
                : categories[(i - 1) % categories.length];
            Map<String, Object> episode = new HashMap<>();
            episode.put("id", prefix + "-EP-" + i);
            episode.put("number", i);
            episode.put("title", topics[(i - 1) % topics.length]);
            episode.put("category", category);
            episode.put("language", language);
            int startAt = (i - 1) * segmentSeconds;
            int endAt = i == count ? totalSeconds : i * segmentSeconds;
            episode.put("startAt", startAt);
            episode.put("endAt", endAt);
            episode.put("duration", String.format("%02d:%02d", (endAt - startAt) / 60, (endAt - startAt) % 60));
            episode.put("audioUrl", audioUrl);
            episode.put("source", source);
            episode.put("sourceUrl", sourceUrl);
            episode.put("visible", !hiddenEpisodeIds.contains(prefix + "-EP-" + i));
            episodes.add(episode);
        }
        return episodes;
    }

    private void handleGetPremium(HttpServletResponse resp) throws IOException {
        List<Map<String, Object>> list = new ArrayList<>();

        Map<String, Object> i1 = new HashMap<>();
        i1.put("title", "Advanced Business English");
        i1.put("langCode", "GB");
        i1.put("accent", "blue");
        list.add(i1);

        Map<String, Object> i2 = new HashMap<>();
        i2.put("title", "JLPT N5 Prep Course");
        i2.put("langCode", "JP");
        i2.put("accent", "pink");
        list.add(i2);

        Map<String, Object> i3 = new HashMap<>();
        i3.put("title", "HSK 1 Complete Pack");
        i3.put("langCode", "CN");
        i3.put("accent", "red");
        list.add(i3);

        Map<String, Object> i4 = new HashMap<>();
        i4.put("title", "Conversational English Master");
        i4.put("langCode", "GB");
        i4.put("accent", "indigo");
        list.add(i4);

        resp.getWriter().write(gson.toJson(list));
    }

    private void handleGetGifts(HttpServletResponse resp) throws IOException {
        List<Map<String, Object>> list = new ArrayList<>();

        Map<String, Object> g1 = new HashMap<>();
        g1.put("name", "Lucy Premium T-Shirt");
        g1.put("xp", 500);
        g1.put("desc", "Premium cotton t-shirt with Lucy branding");
        g1.put("iconCode", "tshirt");
        list.add(g1);

        Map<String, Object> g2 = new HashMap<>();
        g2.put("name", "Double XP Card (24h)");
        g2.put("xp", 200);
        g2.put("desc", "Gain double XP for all lessons for 24 hours");
        g2.put("iconCode", "double_xp");
        list.add(g2);

        Map<String, Object> g3 = new HashMap<>();
        g3.put("name", "Agora VIP Pass");
        g3.put("xp", 800);
        g3.put("desc", "Unlock priority slot in Agora live room discussions");
        g3.put("iconCode", "vip_pass");
        list.add(g3);

        resp.getWriter().write(gson.toJson(list));
    }
}
