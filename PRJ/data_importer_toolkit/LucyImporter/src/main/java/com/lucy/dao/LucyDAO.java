package com.lucy.dao;

import com.lucy.model.LucyRow;
import com.lucy.util.DBConnection;

import java.sql.*;
import java.util.List;

/**
 * Thực hiện INSERT dữ liệu vào 3 bảng: Levels, LevelContents, Questions
 */
public class LucyDAO {

    public int insertBatch(List<LucyRow> rows) throws SQLException {
        if (rows == null || rows.isEmpty()) return 0;

        Connection conn = null;
        int totalInserted = 0;

        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            String currentLevelName = null;
            int currentLevelId = -1;
            int orderIndexContent = 1;
            int orderIndexQuestion = 1;
            int levelNumber = 1;
            int currentLangId = -1;

            String insertLevelSql = "INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)";
            String insertContentSql = "INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES (?, ?, ?, ?, ?)";
            String insertQuestionSql = "INSERT INTO Questions (level_id, question_text, answer_text, question_type, difficulty, order_index) VALUES (?, ?, ?, ?, ?, ?)";

            try (PreparedStatement psLevel = conn.prepareStatement(insertLevelSql, Statement.RETURN_GENERATED_KEYS);
                 PreparedStatement psContent = conn.prepareStatement(insertContentSql);
                 PreparedStatement psQuestion = conn.prepareStatement(insertQuestionSql)) {

                for (LucyRow row : rows) {
                    // Xác định Language ID
                    int langId = resolveLanguageId(row.getLanguageCode());
                    int stageId = resolveStageId(langId, row.getStage());

                    // Đặt lại biến đếm bài học nếu chuyển sang ngôn ngữ khác
                    if (langId != currentLangId) {
                        currentLangId = langId;
                        levelNumber = 1;
                    }
                    
                    // Nếu gặp bài học mới (level_name mới) -> Insert bảng Levels
                    if (currentLevelName == null || !currentLevelName.equals(row.getLevelName())) {
                        currentLevelName = row.getLevelName();
                        String contentType = (langId == 2) ? "qa" : "content";
                        
                        psLevel.setInt(1, stageId);
                        psLevel.setInt(2, langId);
                        psLevel.setInt(3, levelNumber);
                        
                        // Lấy max 255 ký tự cho title
                        String title = row.getLevelName() != null ? row.getLevelName().trim() : "Unknown Level";
                        if (title.length() > 255) title = title.substring(0, 255);
                        
                        psLevel.setNString(4, title);
                        psLevel.setNString(5, title); // Tạm lấy tên gốc làm tiếng Việt
                        psLevel.setString(6, contentType);
                        psLevel.setInt(7, levelNumber);
                        
                        psLevel.executeUpdate();
                        
                        // Lấy ID tự tăng vừa tạo
                        try (ResultSet rs = psLevel.getGeneratedKeys()) {
                            if (rs.next()) {
                                currentLevelId = rs.getInt(1);
                                totalInserted++;
                            }
                        }
                        
                        levelNumber++;
                        orderIndexContent = 1;
                        orderIndexQuestion = 1;
                    }

                    // Tùy theo loại data mà Insert vào LevelContents hoặc Questions
                    if (row.getSubLevel() != null) {
                        // Tiếng Anh / Nhật (Lý thuyết)
                        String subLevelName = determineSubLevel(row.getSubLevel());
                        psContent.setInt(1, currentLevelId);
                        psContent.setNString(2, subLevelName);
                        psContent.setNString(3, row.getSubLevel());
                        psContent.setString(4, subLevelName.toLowerCase());
                        psContent.setInt(5, orderIndexContent++);
                        psContent.addBatch();
                    } 
                    else if (row.getQuestionAi() != null) {
                        // Tiếng Trung (Q&A)
                        psQuestion.setInt(1, currentLevelId);
                        psQuestion.setNString(2, row.getQuestionAi());
                        psQuestion.setNString(3, row.getAnswer());
                        psQuestion.setString(4, "open");
                        psQuestion.setInt(5, 1);
                        psQuestion.setInt(6, orderIndexQuestion++);
                        psQuestion.addBatch();
                    }
                    
                    // (Lưu ý: Không addBatch vào 100 dòng như cũ mà batch toàn bộ vì lượng data từ Word không đến mức tràn RAM)
                }

                // Thực thi toàn bộ dữ liệu trong mảng chờ Batch
                int[] cCounts = psContent.executeBatch();
                int[] qCounts = psQuestion.executeBatch();
                
                for (int c : cCounts) if (c > 0) totalInserted++;
                for (int q : qCounts) if (q > 0) totalInserted++;
            }

            conn.commit();

        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignored) {}
            }
            throw e;
        } finally {
            DBConnection.close(conn);
        }

        return totalInserted;
    }

    /**
     * Map mã ngôn ngữ từ file Word sang language_id trong Database
     */
    private int resolveLanguageId(String langCode) {
        if ("LISA".equalsIgnoreCase(langCode) || "english".equalsIgnoreCase(langCode)) return 1; 
        if ("ZH".equalsIgnoreCase(langCode) || "chinese".equalsIgnoreCase(langCode)) return 2;   
        if ("JA".equalsIgnoreCase(langCode) || "japanese".equalsIgnoreCase(langCode)) return 3;  
        return 1;
    }

    /**
     * Map tên Stage từ file Word sang stage_id trong Database (dựa vào ngôn ngữ)
     */
    private int resolveStageId(int langId, String stageStr) {
        int levelOffset = (langId - 1) * 3; 
        if (stageStr != null) {
            if (stageStr.contains("2") || stageStr.contains("31-60")) return levelOffset + 2;
            if (stageStr.contains("3") || stageStr.contains("61-100")) return levelOffset + 3;
        }
        return levelOffset + 1;
    }
    
    /**
     * Đoán tên SubLevel dựa trên chữ cái đầu
     */
    private String determineSubLevel(String subLevelStr) {
        if (subLevelStr == null) return "Content";
        String lower = subLevelStr.toLowerCase();
        if (lower.contains("vocab") || lower.contains("từ vựng")) return "Vocabulary";
        if (lower.contains("gram") || lower.contains("ngữ pháp")) return "Grammar";
        if (lower.contains("practice") || lower.contains("luyện tập")) return "Practice";
        return "Content";
    }

    /**
     * Xoá toàn bộ dữ liệu (của 3 bảng) trước khi Import mới
     */
    public void clearTable() throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             Statement st = conn.createStatement()) {
            st.executeUpdate("DELETE FROM Levels");
            System.out.println("  Đã xoá toàn bộ dữ liệu trong Levels (và tự động xoá LevelContents, Questions nhờ CASCADE).");
        }
    }

    /**
     * Đếm tổng số bài học đã Import
     */
    public int countRows() throws SQLException {
        try (Connection conn = DBConnection.getConnection();
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM Levels")) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }
}
