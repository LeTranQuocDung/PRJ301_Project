package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.lucy.dao.UserDAO;
import com.lucy.model.User;
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
import java.util.concurrent.CopyOnWriteArrayList;

@WebServlet(urlPatterns = {
    "/api/teacher/classrooms",
    "/api/teacher/materials"
})
public class TeacherServlet extends HttpServlet {

    private Gson gson;
    private static final List<Map<String, Object>> materialsList = new CopyOnWriteArrayList<>();

    static {
        Map<String, Object> m1 = new HashMap<>();
        m1.put("subject", "English Communication");
        List<String> lessons1 = new ArrayList<>();
        lessons1.add("Lesson 1: Greetings & Introductions");
        lessons1.add("Lesson 2: Daily Routines");
        lessons1.add("Lesson 3: Ordering Food");
        m1.put("lessons", lessons1);
        materialsList.add(m1);

        Map<String, Object> m2 = new HashMap<>();
        m2.put("subject", "Fundamental Grammar");
        List<String> lessons2 = new ArrayList<>();
        lessons2.add("Lesson 1: Present Simple Tense");
        lessons2.add("Lesson 2: Past Simple Tense");
        m2.put("lessons", lessons2);
        materialsList.add(m2);
    }

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

        if (path.contains("classrooms")) {
            handleGetClassrooms(resp);
        } else if (path.contains("materials")) {
            handleGetMaterials(resp);
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

        if (path.contains("materials")) {
            handleAddMaterial(req, resp);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");

        String path = req.getServletPath();
        if (path == null) path = "";

        if (path.contains("materials")) {
            handleDeleteMaterial(req, resp);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    private void handleGetClassrooms(HttpServletResponse resp) throws IOException {
        UserDAO dao = new UserDAO();
        List<User> allUsers = dao.getAllUsers();
        
        Map<String, Object> data = new HashMap<>();
        data.put("className", "Lucy Global Language School - English Classroom");
        
        List<Map<String, Object>> students = new ArrayList<>();
        int activeCount = 0;
        for (User u : allUsers) {
            if ("lucy".equalsIgnoreCase(u.getRole()) || "student".equalsIgnoreCase(u.getRole())) {
                Map<String, Object> s = new HashMap<>();
                s.put("name", u.getDisplayName() != null ? u.getDisplayName() : u.getUsername());
                s.put("email", u.getEmail());
                s.put("progress", u.getTotalXp() + " XP");
                s.put("status", u.isActive() ? "Active" : "Inactive");
                students.add(s);
                activeCount++;
            }
        }
        
        // Fallback seed if no database students registered yet
        if (students.isEmpty()) {
            Map<String, Object> s1 = new HashMap<>();
            s1.put("name", "Nguyen Van A");
            s1.put("email", "student@lucy.edu");
            s1.put("progress", "150 XP");
            s1.put("status", "Active");
            students.add(s1);
            activeCount = 1;
        }
        
        data.put("totalStudents", activeCount);
        data.put("students", students);
        resp.getWriter().write(gson.toJson(data));
    }

    private void handleGetMaterials(HttpServletResponse resp) throws IOException {
        resp.getWriter().write(gson.toJson(materialsList));
    }

    @SuppressWarnings("unchecked")
    private void handleAddMaterial(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonObject json = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            String subject = json.has("subject") ? json.get("subject").getAsString().trim() : "";
            String lessonName = json.has("lessonName") ? json.get("lessonName").getAsString().trim() : "";

            if (subject.isEmpty() || lessonName.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Subject and lessonName are required\"}");
                return;
            }

            boolean found = false;
            for (Map<String, Object> material : materialsList) {
                if (subject.equalsIgnoreCase((String) material.get("subject"))) {
                    List<String> lessons = (List<String>) material.get("lessons");
                    if (lessons != null) {
                        lessons.add(lessonName);
                    }
                    found = true;
                    break;
                }
            }

            if (!found) {
                Map<String, Object> newMat = new HashMap<>();
                newMat.put("subject", subject);
                List<String> lessons = new ArrayList<>();
                lessons.add(lessonName);
                newMat.put("lessons", lessons);
                materialsList.add(newMat);
            }

            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().write(gson.toJson(materialsList));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid request format: " + e.getMessage() + "\"}");
        }
    }

    @SuppressWarnings("unchecked")
    private void handleDeleteMaterial(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String subject = req.getParameter("subject");
        String lesson = req.getParameter("lesson");

        if (subject == null || lesson == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Missing subject or lesson parameter\"}");
            return;
        }

        materialsList.removeIf(material -> {
            if (subject.equalsIgnoreCase((String) material.get("subject"))) {
                List<String> lessons = (List<String>) material.get("lessons");
                if (lessons != null) {
                    lessons.remove(lesson);
                    return lessons.isEmpty();
                }
            }
            return false;
        });

        resp.setStatus(HttpServletResponse.SC_OK);
        resp.getWriter().write(gson.toJson(materialsList));
    }
}
