package com.lucy.controller;

import com.google.gson.GsonBuilder;
import com.google.gson.Gson;
import com.lucy.model.Lesson;
import com.lucy.service.ContentService;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet("/api/lessons")
public class ContentServlet extends HttpServlet {

    private ContentService service;

    @Override
    public void init() throws ServletException {
        service = new ContentService();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        // Cho phép gọi CORS từ React (http://localhost:5173)
        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
        
        String lang = req.getParameter("lang");
        if (lang == null || lang.trim().isEmpty()) {
            lang = "EN"; // default to English
        }

        List<Lesson> lessons = service.getByLanguage(lang.toUpperCase());

        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String json = gson.toJson(lessons);

        resp.getWriter().write(json);
    }
}
