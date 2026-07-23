package com.lucy.dao;

import com.lucy.model.LucyRow;
import com.lucy.util.DBConnection;

import java.sql.*;
import java.util.List;

public class LucyDAO {

    private static final String INSERT_SQL
            = "INSERT INTO Lessons (lang_code, level_num, title, stage, vocab, grammar) "
            + "VALUES (?, ?, ?, ?, ?, ?)";

    public int insertBatch(List<LucyRow> rows) throws SQLException {
        if (rows == null || rows.isEmpty()) return 0;
        Connection conn = null;
        int totalInserted = 0;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {
                for (LucyRow row : rows) {
                    ps.setString(1, row.getLanguageCode());
                    int levelNum = row.getLevelNum() > 0 ? row.getLevelNum() : extractLevelNum(row.getLevelName());
                    ps.setInt(2, levelNum);
                    ps.setString(3, row.getLevelName());
                    ps.setString(4, row.getStage());
                    
                    String vocab = row.getSubLevel();
                    if (vocab == null || vocab.trim().isEmpty()) {
                        vocab = row.getQuestionAi();
                    }
                    ps.setString(5, vocab != null ? vocab : "");
                    
                    ps.setString(6, row.getAnswer() != null ? row.getAnswer() : "");
                    ps.addBatch();
                }
                int[] results = ps.executeBatch();
                for (int r : results) {
                    if (r > 0) totalInserted += r;
                }
            }
            conn.commit();
        } catch (SQLException e) {
            if (conn != null) conn.rollback();
            throw e;
        } finally {
            if (conn != null) {
                conn.setAutoCommit(true);
                DBConnection.close(conn);
            }
        }
        return totalInserted;
    }
    
    private int extractLevelNum(String levelName) {
        if (levelName == null) return 0;
        String digits = levelName.replaceAll("\\D+", "");
        try {
            return digits.isEmpty() ? 0 : Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    public void clearTable() {
        try (Connection conn = DBConnection.getConnection()) {
            try (PreparedStatement ps1 = conn.prepareStatement("DELETE FROM LessonSegments");
                 PreparedStatement ps2 = conn.prepareStatement("DELETE FROM Questions");
                 PreparedStatement ps3 = conn.prepareStatement("DELETE FROM Lessons")) {
                ps1.executeUpdate();
                ps2.executeUpdate();
                ps3.executeUpdate();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public int countRows() {
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM Lessons");
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }
}
