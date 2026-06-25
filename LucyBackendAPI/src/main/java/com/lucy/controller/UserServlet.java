package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.lucy.dao.UserDAO;
import com.lucy.model.User;
import com.lucy.util.PasswordUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.List;

@WebServlet("/api/users/*")
public class UserServlet extends HttpServlet {

    private UserDAO userDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        userDAO = new UserDAO();
        gson = new Gson();
    }

    private void setCorsHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        String pathInfo = req.getPathInfo();

        if (pathInfo == null || pathInfo.equals("/")) {
            // GET /api/users - List all users
            List<User> users = userDAO.getAllUsers();
            // Don't send password hashes to frontend
            for (User u : users) { u.setPasswordHash(null); }
            resp.getWriter().write(gson.toJson(users));
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        String pathInfo = req.getPathInfo();
        
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        
        if (sb.length() == 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        JsonObject json = gson.fromJson(sb.toString(), JsonObject.class);

        if ("/register".equals(pathInfo)) {
            handleRegister(json, resp);
        } else if ("/login".equals(pathInfo)) {
            handleLogin(json, resp);
        } else if ("/change-password".equals(pathInfo)) {
            handleChangePassword(json, resp);
        } else if ("/admin/reset-password".equals(pathInfo)) {
            handleAdminResetPassword(json, resp);
        } else if ("/admin/create-user".equals(pathInfo)) {
            handleAdminCreateUser(json, resp);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    private void handleRegister(JsonObject json, HttpServletResponse resp) throws IOException {
        String username = json.has("username") ? json.get("username").getAsString() : "";
        String email = json.has("email") ? json.get("email").getAsString() : "";
        String password = json.has("password") ? json.get("password").getAsString() : "";
        
        if (username.isEmpty() || email.isEmpty() || password.isEmpty()) {
            sendError(resp, 400, "Missing required fields");
            return;
        }
        
        if (userDAO.getUserByEmail(email) != null || userDAO.getUserByUsername(username) != null) {
            sendError(resp, 400, "Username or email already exists");
            return;
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(PasswordUtil.hashPassword(password));
        user.setDisplayName(json.has("displayName") ? json.get("displayName").getAsString() : username);
        user.setAvatarUrl(json.has("avatarUrl") ? json.get("avatarUrl").getAsString() : "");
        user.setRole("student"); // FORCE role to student for public registration

        if (userDAO.insertUser(user)) {
            User created = userDAO.getUserByEmail(email);
            created.setPasswordHash(null);
            resp.getWriter().write(gson.toJson(created));
        } else {
            sendError(resp, 500, "Failed to create user");
        }
    }

    private void handleLogin(JsonObject json, HttpServletResponse resp) throws IOException {
        String identifier = json.has("email") ? json.get("email").getAsString() : "";
        String password = json.has("password") ? json.get("password").getAsString() : "";
        
        User user = userDAO.getUserByEmail(identifier);
        if (user == null) {
            user = userDAO.getUserByUsername(identifier);
        }
        
        if (user == null) {
            sendError(resp, 401, "Invalid email/username or password");
            return;
        }
        
        if (!PasswordUtil.checkPassword(password, user.getPasswordHash())) {
            sendError(resp, 401, "Invalid email/username or password");
            return;
        }
        
        user.setPasswordHash(null);
        resp.getWriter().write(gson.toJson(user));
    }

    private void handleChangePassword(JsonObject json, HttpServletResponse resp) throws IOException {
        int userId = json.has("userId") ? json.get("userId").getAsInt() : 0;
        String oldPass = json.has("oldPassword") ? json.get("oldPassword").getAsString() : "";
        String newPass = json.has("newPassword") ? json.get("newPassword").getAsString() : "";
        
        // Need to fetch user to verify old password
        // Since we don't have session based auth in this simple app, we trust the userId 
        // provided but we MUST verify old password
        // Actually we need to get user by ID. Let's add that to DAO later or just verify email.
        String email = json.has("email") ? json.get("email").getAsString() : "";
        User user = userDAO.getUserByEmail(email);
        
        if (user == null || user.getId() != userId) {
            sendError(resp, 400, "Invalid user");
            return;
        }
        
        if (!PasswordUtil.checkPassword(oldPass, user.getPasswordHash())) {
            sendError(resp, 401, "Incorrect old password");
            return;
        }
        
        if (userDAO.updatePassword(userId, PasswordUtil.hashPassword(newPass))) {
            resp.getWriter().write("{\"status\":\"success\"}");
        } else {
            sendError(resp, 500, "Failed to update password");
        }
    }

    private void handleAdminResetPassword(JsonObject json, HttpServletResponse resp) throws IOException {
        int userId = json.has("userId") ? json.get("userId").getAsInt() : 0;
        // Default password as requested by user
        String defaultPass = "123456"; 
        
        if (userId <= 0) {
            sendError(resp, 400, "Missing user ID");
            return;
        }
        
        if (userDAO.updatePassword(userId, PasswordUtil.hashPassword(defaultPass))) {
            resp.getWriter().write("{\"status\":\"success\",\"message\":\"Password reset to 123456\"}");
        } else {
            sendError(resp, 500, "Failed to reset password");
        }
    }

    private void handleAdminCreateUser(JsonObject json, HttpServletResponse resp) throws IOException {
        String username = json.has("username") ? json.get("username").getAsString() : "";
        String email = json.has("email") ? json.get("email").getAsString() : "";
        String password = json.has("password") ? json.get("password").getAsString() : "123456"; // Default pass
        String role = json.has("role") ? json.get("role").getAsString() : "student";
        
        if (username.isEmpty() || email.isEmpty()) {
            sendError(resp, 400, "Missing required fields");
            return;
        }
        
        if (userDAO.getUserByEmail(email) != null || userDAO.getUserByUsername(username) != null) {
            sendError(resp, 400, "Username or email already exists");
            return;
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(PasswordUtil.hashPassword(password));
        user.setDisplayName(json.has("displayName") ? json.get("displayName").getAsString() : username);
        user.setAvatarUrl(json.has("avatarUrl") ? json.get("avatarUrl").getAsString() : "");
        user.setRole(role); // Allow admin to set role

        if (userDAO.insertUser(user)) {
            User created = userDAO.getUserByEmail(email);
            created.setPasswordHash(null);
            resp.getWriter().write(gson.toJson(created));
        } else {
            sendError(resp, 500, "Failed to create user");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        if (path == null) {
            sendError(resp, 400, "Invalid action");
            return;
        }

        try {
            JsonObject json = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int userId = json.get("id").getAsInt();

            if (path.equals("/admin/update-role")) {
                String newRole = json.get("role").getAsString();
                boolean success = userDAO.updateUserRole(userId, newRole);
                if (success) {
                    resp.getWriter().write("{\"status\":\"success\"}");
                } else {
                    sendError(resp, 500, "Failed to update role");
                }
            } else {
                sendError(resp, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendError(resp, 400, "Invalid request format");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String idParam = req.getParameter("id");
        if (idParam == null) {
            sendError(resp, 400, "Missing user id");
            return;
        }

        try {
            int userId = Integer.parseInt(idParam);
            boolean success = userDAO.deleteUser(userId);
            if (success) {
                resp.getWriter().write("{\"status\":\"success\"}");
            } else {
                sendError(resp, 500, "Failed to delete user");
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendError(resp, 400, "Invalid user id");
        }
    }

    private void sendError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
