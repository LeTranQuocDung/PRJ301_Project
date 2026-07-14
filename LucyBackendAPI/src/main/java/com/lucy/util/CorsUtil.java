package com.lucy.util;

import javax.servlet.http.HttpServletResponse;

public class CorsUtil {
    public static void setCorsHeaders(HttpServletResponse resp) {
        String allowedOrigin = System.getenv("LUCY_ALLOWED_ORIGIN");
        if (allowedOrigin == null) {
            allowedOrigin = System.getProperty("LUCY_ALLOWED_ORIGIN");
        }
        if (allowedOrigin == null) {
            allowedOrigin = "http://localhost:5173";
        }
        resp.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, X-LUCY-ROLE");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
    }
}
