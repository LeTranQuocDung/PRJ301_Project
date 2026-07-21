package com.lucy.dao;

import com.lucy.model.User;
import com.lucy.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class UserDAO {

    private static final List<User> memoryUsers = new CopyOnWriteArrayList<>();
    static {
        memoryUsers.add(new User(1, "admin", "admin@lucy.edu.vn", "hash", "System Admin", "", "admin", 1000, true));
        memoryUsers.add(new User(2, "teacher1", "teacher@lucy.edu.vn", "hash", "Sarah Jenkins", "", "teacher", 500, true));
        memoryUsers.add(new User(3, "student1", "student1@gmail.com", "hash", "Nguyen Van A", "", "student", 120, true));
    }

    public User getUserByEmail(String email) {
        String sql = "SELECT * FROM Users WHERE email = ? AND is_deleted = 0";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return extractUser(rs);
                }
            }
        } catch (SQLException e) {
            for (User u : memoryUsers) {
                if (u.getEmail().equalsIgnoreCase(email)) return u;
            }
        }
        return null;
    }

    public User getUserByUsername(String username) {
        String sql = "SELECT * FROM Users WHERE username = ? AND is_deleted = 0";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return extractUser(rs);
                }
            }
        } catch (SQLException e) {
            for (User u : memoryUsers) {
                if (u.getUsername().equalsIgnoreCase(username)) return u;
            }
        }
        return null;
    }

    public boolean insertUser(User user) {
        String sql = "INSERT INTO Users (username, email, password_hash, display_name, avatar_url, role, total_xp, is_active, is_deleted) " +
                     "VALUES (?, ?, ?, ?, ?, ?, 0, 1, 0)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPasswordHash());
            ps.setString(4, user.getDisplayName());
            ps.setString(5, user.getAvatarUrl());
            ps.setString(6, user.getRole());
            if (ps.executeUpdate() > 0) {
                return true;
            }
        } catch (SQLException e) {
            System.err.println("DB Connection issue, inserting into memory list fallback: " + e.getMessage());
        }

        user.setId(memoryUsers.size() + 1);
        memoryUsers.add(0, user);
        return true;
    }

    public boolean updateUserRole(int userId, String newRole) {
        String sql = "UPDATE Users SET role = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newRole);
            ps.setInt(2, userId);
            if (ps.executeUpdate() > 0) return true;
        } catch (SQLException e) {
            // Fallback
        }
        for (User u : memoryUsers) {
            if (u.getId() == userId) {
                u.setRole(newRole);
                return true;
            }
        }
        return false;
    }

    public boolean deleteUser(int userId) {
        String sql = "UPDATE Users SET is_deleted = 1, is_active = 0 WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            if (ps.executeUpdate() > 0) return true;
        } catch (SQLException e) {
            // Fallback
        }
        memoryUsers.removeIf(u -> u.getId() == userId);
        return true;
    }

    public boolean updatePassword(int userId, String newPasswordHash) {
        String sql = "UPDATE Users SET password_hash = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newPasswordHash);
            ps.setInt(2, userId);
            if (ps.executeUpdate() > 0) return true;
        } catch (SQLException e) {
            // Fallback
        }
        for (User u : memoryUsers) {
            if (u.getId() == userId) {
                u.setPasswordHash(newPasswordHash);
                return true;
            }
        }
        return false;
    }

    public List<User> getAllUsers() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT * FROM Users WHERE is_deleted = 0 ORDER BY id DESC";
        try (Connection conn = DBConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(extractUser(rs));
            }
            if (!list.isEmpty()) return list;
        } catch (SQLException e) {
            // Fallback
        }
        return new ArrayList<>(memoryUsers);
    }

    private User extractUser(ResultSet rs) throws SQLException {
        return new User(
            rs.getInt("id"),
            rs.getString("username"),
            rs.getString("email"),
            rs.getString("password_hash"),
            rs.getString("display_name"),
            rs.getString("avatar_url"),
            rs.getString("role"),
            rs.getInt("total_xp"),
            rs.getBoolean("is_active")
        );
    }
}
