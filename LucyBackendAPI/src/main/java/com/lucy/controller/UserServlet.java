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
        com.lucy.util.CorsUtil.setCorsHeaders(resp);
    }

    private boolean isSuper(HttpServletRequest req) {
        String role = req.getHeader("X-LUCY-ROLE");
        if (role == null) return false;
        return "super".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role);
    }

    private String sanitizeAndValidateRole(String role) {
        if (role == null) return "lucy";
        String r = role.trim().toLowerCase();
        if ("super".equals(r) || "pro".equals(r) || "lucy".equals(r)) {
            return r;
        }
        return "lucy";
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");
        String pathInfo = req.getPathInfo();

        if (pathInfo == null || pathInfo.equals("/")) {
            // GET /api/users - List all users (Admin only)
            if (!isSuper(req)) {
                sendError(resp, 403, "Access denied. Super role required.");
                return;
            }
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
        resp.setContentType("application/json;charset=UTF-8");
        req.setCharacterEncoding("UTF-8");
        String pathInfo = req.getPathInfo();
        
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        } catch (Exception e) {
            sendError(resp, 400, "Invalid request body");
            return;
        }
        
        if (sb.length() == 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        JsonObject json;
        try {
            json = gson.fromJson(sb.toString(), JsonObject.class);
        } catch (Exception e) {
            sendError(resp, 400, "Invalid JSON format");
            return;
        }

        if ("/register".equals(pathInfo)) {
            handleRegister(json, resp);
        } else if ("/login".equals(pathInfo)) {
            handleLogin(json, resp);
        } else if ("/change-password".equals(pathInfo)) {
            handleChangePassword(json, resp);
        } else if ("/admin/reset-password".equals(pathInfo)) {
            if (!isSuper(req)) {
                sendError(resp, 403, "Access denied. Super role required.");
                return;
            }
            handleAdminResetPassword(json, resp);
        } else if ("/admin/create-user".equals(pathInfo)) {
            if (!isSuper(req)) {
                sendError(resp, 403, "Access denied. Super role required.");
                return;
            }
            handleAdminCreateUser(json, resp);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    private void handleRegister(JsonObject json, HttpServletResponse resp) throws IOException {
        String username = json.has("username") ? json.get("username").getAsString().trim() : "";
        String email = json.has("email") ? json.get("email").getAsString().trim() : "";
        String password = json.has("password") ? json.get("password").getAsString().trim() : "";
        
        if (username.isEmpty() || email.isEmpty() || password.isEmpty()) {
            sendError(resp, 400, "Missing required fields");
            return;
        }
        
        if (!email.contains("@") || !email.contains(".")) {
            sendError(resp, 400, "Invalid email format");
            return;
        }

        if (password.length() < 6) {
            sendError(resp, 400, "Password must be at least 6 characters");
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
        user.setDisplayName(json.has("displayName") ? json.get("displayName").getAsString().trim() : username);
        user.setAvatarUrl(json.has("avatarUrl") ? json.get("avatarUrl").getAsString().trim() : "");
        user.setRole("lucy"); // FORCE role to lucy (anonymous learner) for public registration

        if (userDAO.insertUser(user, false)) {
            User created = userDAO.getUserByEmail(email);
            if (created != null) {
                created.setPasswordHash(null);
                resp.getWriter().write(gson.toJson(created));
            } else {
                sendError(resp, 500, "Failed to retrieve created user");
            }
        } else {
            sendError(resp, 500, "Failed to create user");
        }
    }

    private void handleLogin(JsonObject json, HttpServletResponse resp) throws IOException {
        String identifier = json.has("email") ? json.get("email").getAsString().trim() : "";
        String password = json.has("password") ? json.get("password").getAsString().trim() : "";
        
        if (identifier.isEmpty() || password.isEmpty()) {
            sendError(resp, 400, "Missing required fields");
            return;
        }

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
        String oldPass = json.has("oldPassword") ? json.get("oldPassword").getAsString().trim() : "";
        String newPass = json.has("newPassword") ? json.get("newPassword").getAsString().trim() : "";
        
        if (userId <= 0 || oldPass.isEmpty() || newPass.isEmpty()) {
            sendError(resp, 400, "Missing required fields");
            return;
        }

        if (newPass.length() < 6) {
            sendError(resp, 400, "New password must be at least 6 characters");
            return;
        }

        String email = json.has("email") ? json.get("email").getAsString().trim() : "";
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
        String newPassword = json.has("newPassword") ? json.get("newPassword").getAsString().trim() : "";
        
        if (userId <= 0) {
            sendError(resp, 400, "Missing user ID");
            return;
        }

        if (newPassword.isEmpty() || newPassword.length() < 6) {
            sendError(resp, 400, "Password must be at least 6 characters");
            return;
        }
        
        if (userDAO.updatePassword(userId, PasswordUtil.hashPassword(newPassword))) {
            resp.getWriter().write("{\"status\":\"success\",\"message\":\"Password reset successfully\"}");
        } else {
            sendError(resp, 500, "Failed to reset password");
        }
    }

    private void handleAdminCreateUser(JsonObject json, HttpServletResponse resp) throws IOException {
        String username = json.has("username") ? json.get("username").getAsString().trim() : "";
        String email = json.has("email") ? json.get("email").getAsString().trim() : "";
        String password = json.has("password") ? json.get("password").getAsString().trim() : "";
        String role = json.has("role") ? json.get("role").getAsString().trim() : "lucy";
        
        if (username.isEmpty() || email.isEmpty()) {
            sendError(resp, 400, "Missing required fields");
            return;
        }

        if (password.isEmpty() || password.length() < 6) {
            sendError(resp, 400, "Password must be at least 6 characters");
            return;
        }

        if (!email.contains("@") || !email.contains(".")) {
            sendError(resp, 400, "Invalid email format");
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
        user.setDisplayName(json.has("displayName") ? json.get("displayName").getAsString().trim() : username);
        user.setAvatarUrl(json.has("avatarUrl") ? json.get("avatarUrl").getAsString().trim() : "");
        user.setRole(sanitizeAndValidateRole(role));

        if (userDAO.insertUser(user, true)) {
            User created = userDAO.getUserByEmail(email);
            if (created != null) {
                created.setPasswordHash(null);
                resp.getWriter().write(gson.toJson(created));
            } else {
                sendError(resp, 500, "Failed to retrieve created user");
            }
        } else {
            sendError(resp, 500, "Failed to create user");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");
        req.setCharacterEncoding("UTF-8");
        String path = req.getPathInfo();
        if (path == null) {
            sendError(resp, 400, "Invalid action");
            return;
        }

        if (path.startsWith("/admin")) {
            if (!isSuper(req)) {
                sendError(resp, 403, "Access denied. Super role required.");
                return;
            }
        }

        try {
            JsonObject json = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int userId = json.get("id").getAsInt();

            if (path.equals("/admin/update-role")) {
                String newRole = json.get("role").getAsString().trim();
                newRole = sanitizeAndValidateRole(newRole);
                boolean success = userDAO.updateUserRole(userId, newRole);
                if (success) {
                    resp.getWriter().write("{\"status\":\"success\"}");
                } else {
                    sendError(resp, 500, "Failed to update role");
                }
            } else if (path.equals("/admin/approve-user")) {
                boolean success = userDAO.approveUser(userId);
                if (success) {
                    resp.getWriter().write("{\"status\":\"success\"}");
                } else {
                    sendError(resp, 500, "Failed to approve user");
                }
            } else {
                sendError(resp, 404, "Endpoint not found");
            }
        } catch (Exception e) {
            sendError(resp, 400, "Invalid request format");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");
        if (!isSuper(req)) {
            sendError(resp, 403, "Access denied. Super role required.");
            return;
        }

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
            sendError(resp, 400, "Invalid user id");
        }
    }

    private void sendError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
