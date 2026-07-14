package com.lucy.controller;

import com.google.gson.GsonBuilder;
import com.google.gson.Gson;
import com.lucy.model.Lesson;
import com.lucy.service.ContentService;
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

@WebServlet(urlPatterns = {"/api/lessons", "/api/contents"})
public class ContentServlet extends HttpServlet {

    private ContentService service;

    @Override
    public void init() throws ServletException {
        service = new ContentService();
    }

    private String normalizeLang(String lang) {
        if (lang == null || lang.trim().isEmpty()) return null;
        String l = lang.trim().toUpperCase();
        if ("EN".equals(l) || "ENGLISH".equals(l)) return "LISA";
        return l;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        CorsUtil.setCorsHeaders(resp);

        try {
            String path = req.getServletPath();
            if (path == null) {
                path = "";
            }

            if (path.contains("contents")) {
                handleGetContents(req, resp);
            } else {
                handleGetLessons(req, resp);
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Internal server error occurred\"}");
        }
    }

    private void handleGetLessons(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String lang = req.getParameter("lang");
        if (lang == null || lang.trim().isEmpty()) {
            lang = "LISA";
        } else {
            lang = normalizeLang(lang);
        }

        List<Lesson> lessons = service.getByLanguage(lang);
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String json = gson.toJson(lessons);
        resp.getWriter().write(json);
    }

    private void handleGetContents(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String languageParam = req.getParameter("language");
        if (languageParam == null || languageParam.trim().isEmpty()) {
            languageParam = req.getParameter("lang");
        }
        String stageParam = req.getParameter("stage");
        String levelParam = req.getParameter("level");

        String normLang = normalizeLang(languageParam);

        List<Lesson> sourceList;
        if (normLang != null) {
            sourceList = service.getByLanguage(normLang);
        } else {
            sourceList = service.getAll();
        }

        List<Map<String, Object>> responseList = new ArrayList<>();

        for (Lesson l : sourceList) {
            // Filter by stage if provided
            if (stageParam != null && !stageParam.trim().isEmpty()) {
                if (l.getStage() == null || !l.getStage().trim().equalsIgnoreCase(stageParam.trim())) {
                    continue;
                }
            }

            // Filter by level (title) if provided
            if (levelParam != null && !levelParam.trim().isEmpty()) {
                if (l.getTitle() == null || !l.getTitle().trim().equalsIgnoreCase(levelParam.trim())) {
                    continue;
                }
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", l.getId());
            item.put("languageCode", l.getLangCode());
            item.put("stage", l.getStage());
            item.put("levelName", l.getTitle());
            item.put("levelNum", l.getLevelNum());

            if ("ZH".equalsIgnoreCase(l.getLangCode())) {
                item.put("questionAi", l.getVocab() != null ? l.getVocab() : "");
                item.put("answer", l.getGrammar() != null ? l.getGrammar() : "");
            } else {
                item.put("subLevel", l.getVocab() != null ? l.getVocab() : "");
            }

            responseList.add(item);
        }

        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String json = gson.toJson(responseList);
        resp.getWriter().write(json);
    }
}
