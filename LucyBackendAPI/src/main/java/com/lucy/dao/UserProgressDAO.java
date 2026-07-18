package com.lucy.dao;

import com.lucy.model.UserProgress;
import com.lucy.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserProgressDAO {

    public int getUserXp(int userId) {
        String sql = "SELECT total_xp FROM Users WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("total_xp");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public List<UserProgress> getProgressByUserId(int userId) {
        List<UserProgress> list = new ArrayList<>();
        String sql = "SELECT * FROM UserProgress WHERE user_id = ? ORDER BY completed_at DESC";
        
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    UserProgress up = new UserProgress();
                    up.setId(rs.getInt("id"));
                    up.setUserId(rs.getInt("user_id"));
                    up.setLangCode(rs.getString("lang_code"));
                    up.setLevelNum(rs.getInt("level_num"));
                    up.setCompletedAt(rs.getTimestamp("completed_at"));
                    list.add(up);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean saveProgress(int userId, String langCode, int levelNum, int xp) {
        Connection conn = null;
        PreparedStatement checkPs = null;
        PreparedStatement insertPs = null;
        PreparedStatement updateXpPs = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            // 1. Check if progress already exists
            String checkSql = "SELECT id FROM UserProgress WHERE user_id = ? AND lang_code = ? AND level_num = ?";
            checkPs = conn.prepareStatement(checkSql);
            checkPs.setInt(1, userId);
            checkPs.setString(2, langCode);
            checkPs.setInt(3, levelNum);
            rs = checkPs.executeQuery();

            boolean exists = rs.next();

            // 2. If not exists, insert it
            if (!exists) {
                String insertSql = "INSERT INTO UserProgress (user_id, lang_code, level_num) VALUES (?, ?, ?)";
                insertPs = conn.prepareStatement(insertSql);
                insertPs.setInt(1, userId);
                insertPs.setString(2, langCode);
                insertPs.setInt(3, levelNum);
                insertPs.executeUpdate();
            }

            // 3. Update User XP
            if (xp > 0) {
                String updateXpSql = "UPDATE Users SET total_xp = total_xp + ? WHERE id = ?";
                updateXpPs = conn.prepareStatement(updateXpSql);
                updateXpPs.setInt(1, xp);
                updateXpPs.setInt(2, userId);
                updateXpPs.executeUpdate();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            e.printStackTrace();
            return false;
        } finally {
            try {
                if (rs != null) rs.close();
                if (checkPs != null) checkPs.close();
                if (insertPs != null) insertPs.close();
                if (updateXpPs != null) updateXpPs.close();
                if (conn != null) {
                    conn.setAutoCommit(true);
                    DBConnection.close(conn);
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    public boolean adjustUserXp(int userId, int delta) {
        Connection conn = null;
        PreparedStatement selectPs = null;
        PreparedStatement updatePs = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            // 1. Get current XP
            String selectSql = "SELECT total_xp FROM Users WHERE id = ?";
            selectPs = conn.prepareStatement(selectSql);
            selectPs.setInt(1, userId);
            rs = selectPs.executeQuery();

            if (!rs.next()) {
                conn.rollback();
                return false;
            }

            int currentXp = rs.getInt("total_xp");

            // 2. Validate balance if delta is negative
            if (delta < 0 && (currentXp + delta < 0)) {
                conn.rollback();
                return false;
            }

            // 3. Update XP
            String updateSql = "UPDATE Users SET total_xp = total_xp + ? WHERE id = ?";
            updatePs = conn.prepareStatement(updateSql);
            updatePs.setInt(1, delta);
            updatePs.setInt(2, userId);
            updatePs.executeUpdate();

            conn.commit();
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ex) {
                    ex.printStackTrace();
                }
            }
            e.printStackTrace();
            return false;
        } finally {
            try {
                if (rs != null) rs.close();
                if (selectPs != null) selectPs.close();
                if (updatePs != null) updatePs.close();
                if (conn != null) {
                    conn.setAutoCommit(true);
                    DBConnection.close(conn);
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
