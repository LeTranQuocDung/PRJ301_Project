package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
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

@WebServlet(urlPatterns = {
    "/api/engagement/podcasts",
    "/api/engagement/premium",
    "/api/engagement/gifts"
})
public class EngagementServlet extends HttpServlet {

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
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");

        String path = req.getServletPath();
        if (path == null) path = "";

        if (path.contains("podcasts")) {
            handleGetPodcasts(resp);
        } else if (path.contains("premium")) {
            handleGetPremium(resp);
        } else if (path.contains("gifts")) {
            handleGetGifts(resp);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    private void handleGetPodcasts(HttpServletResponse resp) throws IOException {
        List<Map<String, Object>> list = new ArrayList<>();

        Map<String, Object> p1 = new HashMap<>();
        p1.put("title", "Daily English Tips");
        p1.put("episodes", 12);
        p1.put("lang", "English");
        p1.put("subs", 234);
        p1.put("accent", "blue");
        p1.put("flagCode", "GB");
        list.add(p1);

        Map<String, Object> p2 = new HashMap<>();
        p2.put("title", "Chinese for Beginners");
        p2.put("episodes", 8);
        p2.put("lang", "Chinese");
        p2.put("subs", 145);
        p2.put("accent", "red");
        p2.put("flagCode", "CN");
        list.add(p2);

        Map<String, Object> p3 = new HashMap<>();
        p3.put("title", "Japanese Daily Phrases");
        p3.put("episodes", 15);
        p3.put("lang", "Japanese");
        p3.put("subs", 178);
        p3.put("accent", "pink");
        p3.put("flagCode", "JP");
        list.add(p3);

        resp.getWriter().write(gson.toJson(list));
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
