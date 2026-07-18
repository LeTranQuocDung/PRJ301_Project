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
    "/api/teacher/classrooms",
    "/api/teacher/materials"
})
public class TeacherServlet extends HttpServlet {

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

        if (path.contains("classrooms")) {
            handleGetClassrooms(resp);
        } else if (path.contains("materials")) {
            handleGetMaterials(resp);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    private void handleGetClassrooms(HttpServletResponse resp) throws IOException {
        Map<String, Object> data = new HashMap<>();
        data.put("className", "Lop Tieng Anh Giao Tiep K12");
        data.put("totalStudents", 3);

        List<Map<String, Object>> students = new ArrayList<>();
        
        Map<String, Object> s1 = new HashMap<>();
        s1.put("name", "Nguyen Van A");
        s1.put("email", "nva@gmail.com");
        s1.put("progress", "85%");
        s1.put("status", "Active");
        students.add(s1);

        Map<String, Object> s2 = new HashMap<>();
        s2.put("name", "Tran Thi B");
        s2.put("email", "ttb@gmail.com");
        s2.put("progress", "62%");
        s2.put("status", "Active");
        students.add(s2);

        Map<String, Object> s3 = new HashMap<>();
        s3.put("name", "Le Hoang C");
        s3.put("email", "lhc@gmail.com");
        s3.put("progress", "12%");
        s3.put("status", "Absent");
        students.add(s3);

        data.put("students", students);
        resp.getWriter().write(gson.toJson(data));
    }

    private void handleGetMaterials(HttpServletResponse resp) throws IOException {
        List<Map<String, Object>> list = new ArrayList<>();

        Map<String, Object> m1 = new HashMap<>();
        m1.put("subject", "Tieng Anh Giao Tiep");
        List<String> lessons1 = new ArrayList<>();
        lessons1.add("Bai 1: Greetings & Introductions");
        lessons1.add("Bai 2: Daily Routines");
        lessons1.add("Bai 3: Ordering Food");
        m1.put("lessons", lessons1);
        list.add(m1);

        Map<String, Object> m2 = new HashMap<>();
        m2.put("subject", "Ngu phap Nen tang");
        List<String> lessons2 = new ArrayList<>();
        lessons2.add("Bai 1: Thi Hien tai don");
        lessons2.add("Bai 2: Thi Qua khu don");
        m2.put("lessons", lessons2);
        list.add(m2);

        resp.getWriter().write(gson.toJson(list));
    }
}
