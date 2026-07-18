package com.lucy.dao;

import com.lucy.model.Lesson;
import com.lucy.util.DBConnection;

import java.sql.*;
import java.util.List;
import java.util.ArrayList;

public class LucyDAO {

    private static final String INSERT_SQL
            = "INSERT INTO Lessons (lang_code, level_num, title, stage, vocab, grammar) "
            + "VALUES (?, ?, ?, ?, ?, ?)";

    private static final String SELECT_BY_LANG_SQL
            = "SELECT * FROM Lessons WHERE lang_code = ? ORDER BY level_num ASC";

    public int insertBatch(List<Lesson> lessons) throws SQLException {
        if (lessons == null || lessons.isEmpty()) {
            return 0;
        }
        Connection conn = null;
        int total = 0;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {
                for (Lesson l : lessons) {
                    ps.setString(1, l.getLangCode());
                    ps.setInt(2, l.getLevelNum());
                    ps.setString(3, l.getTitle());
                    ps.setString(4, l.getStage());
                    ps.setString(5, l.getVocab());
                    ps.setString(6, l.getGrammar());
                    ps.addBatch();
                }
                int[] results = ps.executeBatch();
                for (int r : results) {
                    if (r > 0) total += r;
                }
            }
            conn.commit();
        } catch (SQLException e) {
            if (conn != null) {
                conn.rollback();
            }
            throw e;
        } finally {
            if (conn != null) {
                conn.setAutoCommit(true);
                DBConnection.close(conn);
            }
        }
        return total;
    }

    public List<Lesson> getLessonsByLang(String langCode) {
        List<Lesson> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(SELECT_BY_LANG_SQL)) {
            ps.setString(1, langCode);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Lesson l = new Lesson();
                    l.setId(rs.getInt("id"));
                    l.setLangCode(rs.getString("lang_code"));
                    l.setLevelNum(rs.getInt("level_num"));
                    l.setTitle(rs.getString("title"));
                    l.setStage(rs.getString("stage"));
                    l.setVocab(rs.getString("vocab"));
                    l.setGrammar(rs.getString("grammar"));
                    list.add(l);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Lesson> getAllLessons() {
        List<Lesson> list = new ArrayList<>();
        String sql = "SELECT * FROM Lessons ORDER BY level_num ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Lesson l = new Lesson();
                l.setId(rs.getInt("id"));
                l.setLangCode(rs.getString("lang_code"));
                l.setLevelNum(rs.getInt("level_num"));
                l.setTitle(rs.getString("title"));
                l.setStage(rs.getString("stage"));
                l.setVocab(rs.getString("vocab"));
                l.setGrammar(rs.getString("grammar"));
                list.add(l);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}
