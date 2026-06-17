package com.lucy.dao;

import com.lucy.model.LucyRow;
import com.lucy.util.DBConnection;

import java.sql.*;
import java.util.List;
import java.util.ArrayList;

/**
 * Thực hiện INSERT dữ liệu vào bảng LucyContents
 */
public class LucyDAO {

    private static final String INSERT_SQL
            = "INSERT INTO LucyContents (language_code, stage, level_name, sub_level, question_ai, answer) "
            + "VALUES (?, ?, ?, ?, ?, ?)";

    /**
     * Insert danh sách rows vào DB, dùng batch để nhanh hơn
     *
     * @return số dòng đã insert thành công
     */
    public int insertBatch(List<LucyRow> rows) throws SQLException {
        if (rows == null || rows.isEmpty()) {
            return 0;
        }

        Connection conn = null;
        int total = 0;

        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {
                int batchCount = 0;

                for (LucyRow row : rows) {
                    ps.setNString(1, row.getLanguageCode());
                    ps.setNString(2, row.getStage());
                    ps.setNString(3, row.getLevelName());

                    // sub_level
                    if (row.getSubLevel() != null) {
                        ps.setNString(4, row.getSubLevel());
                    } else {
                        ps.setNull(4, Types.NVARCHAR);
                    }

                    // question_ai
                    if (row.getQuestionAi() != null) {
                        ps.setNString(5, row.getQuestionAi());
                    } else {
                        ps.setNull(5, Types.NVARCHAR);
                    }

                    // answer
                    if (row.getAnswer() != null) {
                        ps.setNString(6, row.getAnswer());
                    } else {
                        ps.setNull(6, Types.NVARCHAR);
                    }

                    ps.addBatch();
                    batchCount++;

                    // Thực thi mỗi 100 dòng để tránh quá tải bộ nhớ
                    if (batchCount % 100 == 0) {
                        int[] counts = ps.executeBatch();
                        for (int c : counts) {
                            if (c > 0) {
                                total++;
                            }
                        }
                        System.out.printf("  ... đã insert %d dòng%n", total);
                    }
                }

                // Flush phần còn lại
                int[] counts = ps.executeBatch();
                for (int c : counts) {
                    if (c > 0) {
                        total++;
                    }
                }
            }

            conn.commit();

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ignored) {
                }
            }
            throw e;
        } finally {
            DBConnection.close(conn);
        }

        return total;
    }

    /**
     * Xoá toàn bộ dữ liệu cũ trong LucyContents (gọi trước khi re-import)
     */
    public void clearTable() throws SQLException {
        try (Connection conn = DBConnection.getConnection(); Statement st = conn.createStatement()) {
            int deleted = st.executeUpdate("DELETE FROM LucyContents");
            System.out.println("  Đã xoá " + deleted + " dòng cũ trong LucyContents");
        }
    }

    /**
     * Đếm số dòng hiện có trong LucyContents
     */
    public int countRows() throws SQLException {
        try (Connection conn = DBConnection.getConnection(); Statement st = conn.createStatement(); ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM LucyContents")) {
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    /**
     * Lấy toàn bộ dữ liệu từ LucyContents và in ra console
     */
    public void printAllData() throws SQLException {
        String query = "SELECT * FROM LucyContents";
        try (Connection conn = DBConnection.getConnection(); Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(query)) {

            System.out.println("\n--- TOÀN BỘ DỮ LIỆU TRONG LUCYCONTENTS ---");
            int count = 0;
            while (rs.next()) {
                count++;
                String lang = rs.getString("language_code");
                String stage = rs.getString("stage");
                String levelName = rs.getString("level_name");
                String subLevel = rs.getString("sub_level");
                String questionAi = rs.getString("question_ai");
                String answer = rs.getString("answer");

                System.out.printf("Row %d: [%s] | Stage: %s | Level: %s | SubLevel: %s | Q: %s | A: %s%n",
                        count, lang, stage, levelName, subLevel, questionAi, answer);
            }
            System.out.println("------------------------------------------");
            System.out.println("Tổng cộng in ra: " + count + " dòng.\n");
        }
    }

    public List<LucyRow> findAll() {

        List<LucyRow> list = new ArrayList<>();

        String sql = "SELECT * FROM LucyContents";

        try (
                Connection conn = DBConnection.getConnection(); Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {

            while (rs.next()) {

                String lang = rs.getString("language_code");
                String stage = rs.getString("stage");
                String levelName = rs.getString("level_name");
                String subLevel = rs.getString("sub_level");
                String questionAi = rs.getString("question_ai");
                String answer = rs.getString("answer");

                LucyRow row = new LucyRow(lang, stage, levelName,
                        subLevel, questionAi, answer);

                list.add(row);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    public List<LucyRow> findByLanguage(String language) {

        List<LucyRow> list = new ArrayList<>();

        String sql
                = "SELECT * FROM LucyContents WHERE language_code = ?";

        try (
                Connection conn = DBConnection.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, language);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                LucyRow row = new LucyRow(
                        rs.getString("language_code"),
                        rs.getString("stage"),
                        rs.getString("level_name"),
                        rs.getString("sub_level"),
                        rs.getString("question_ai"),
                        rs.getString("answer")
                );

                list.add(row);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    public List<LucyRow> findByStage(String stage) {

        List<LucyRow> list = new ArrayList<>();

        String sql
                = "SELECT * FROM LucyContents WHERE stage = ?";

        try (
                Connection conn = DBConnection.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, stage);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                LucyRow row = new LucyRow(
                        rs.getString("language_code"),
                        rs.getString("stage"),
                        rs.getString("level_name"),
                        rs.getString("sub_level"),
                        rs.getString("question_ai"),
                        rs.getString("answer")
                );

                list.add(row);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    public List<LucyRow> findByLevel(String level) {

        List<LucyRow> list = new ArrayList<>();

        String sql
                = "SELECT * FROM LucyContents WHERE level_name = ?";

        try (
                Connection conn = DBConnection.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, level);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                LucyRow row = new LucyRow(
                        rs.getString("language_code"),
                        rs.getString("stage"),
                        rs.getString("level_name"),
                        rs.getString("sub_level"),
                        rs.getString("question_ai"),
                        rs.getString("answer")
                );

                list.add(row);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }
}
