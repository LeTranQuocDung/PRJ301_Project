package com.lucy;

import com.lucy.util.DBConnection;
import java.sql.*;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class JSONExporter {
    
    // Class to represent Q&A item for Chinese
    public static class QA {
        public String q;
        public String a;
        public QA(String q, String a) {
            this.q = q;
            this.a = a;
        }
    }

    // Class to represent a Chinese level group
    public static class ChineseLevel {
        public int level;
        public String title;
        public String stage;
        public List<QA> qa = new ArrayList<>();
    }

    public static void main(String[] args) {
        String outputPath = "lessonsData.json";
        if (args != null && args.length > 0 && args[0] != null && !args[0].trim().isEmpty()) {
            outputPath = args[0].trim();
        }

        try (Connection conn = DBConnection.getConnection();
             PrintWriter out = new PrintWriter(new java.io.OutputStreamWriter(
                     new java.io.FileOutputStream(outputPath), java.nio.charset.StandardCharsets.UTF_8))) {

            out.println("{");

            // 1. Export English (LISA) -> JSON key "EN"
            out.println("  \"EN\": [");
            exportStandardLanguage(conn, out, "LISA");
            out.println("  ],");

            // 2. Export Chinese (ZH) -> JSON key "ZH"
            out.println("  \"ZH\": [");
            exportChinese(conn, out);
            out.println("  ],");

            // 3. Export Japanese (JA) -> JSON key "JA"
            out.println("  \"JA\": [");
            exportStandardLanguage(conn, out, "JA");
            out.println("  ]");

            out.println("}");
            System.out.println("Exported lessonsData.json successfully to: " + outputPath);

        } catch (Exception e) {
            System.err.println("Error exporting JSON: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void exportStandardLanguage(Connection conn, PrintWriter out, String dbLangCode) throws SQLException {
        String sql = "SELECT level_num, title, stage, vocab, grammar FROM Lessons WHERE lang_code = ? ORDER BY level_num";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, dbLangCode);
            try (ResultSet rs = ps.executeQuery()) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) {
                        out.println(",");
                    }
                    first = false;
                    
                    int level = rs.getInt("level_num");
                    String title = escapeJson(rs.getString("title"));
                    String stage = escapeJson(rs.getString("stage"));
                    String vocab = escapeJson(rs.getString("vocab"));
                    String grammar = escapeJson(rs.getString("grammar"));

                    out.print("    { \"level\": " + level + 
                              ", \"title\": \"" + title + 
                              "\", \"stage\": \"" + stage + 
                              "\", \"vocab\": \"" + vocab + 
                              "\", \"grammar\": \"" + grammar + "\" }");
                }
                out.println();
            }
        }
    }

    private static void exportChinese(Connection conn, PrintWriter out) throws SQLException {
        String sql = "SELECT level_num, title, stage, vocab, grammar FROM Lessons WHERE lang_code = 'ZH' ORDER BY level_num, id";
        Map<Integer, ChineseLevel> levelsMap = new LinkedHashMap<>();
        
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                int levelNum = rs.getInt("level_num");
                String title = rs.getString("title");
                String stage = rs.getString("stage");
                String question = rs.getString("vocab");
                String answer = rs.getString("grammar");
                
                ChineseLevel lvl = levelsMap.get(levelNum);
                if (lvl == null) {
                    lvl = new ChineseLevel();
                    lvl.level = levelNum;
                    lvl.title = title;
                    lvl.stage = stage;
                    levelsMap.put(levelNum, lvl);
                }
                
                if (question != null && !question.trim().isEmpty()) {
                    lvl.qa.add(new QA(question, answer != null ? answer : ""));
                }
            }
        }

        boolean firstLevel = true;
        for (ChineseLevel lvl : levelsMap.values()) {
            if (!firstLevel) {
                out.println(",");
            }
            firstLevel = false;

            String escapedTitle = escapeJson(lvl.title);
            String escapedStage = escapeJson(lvl.stage);
            
            out.print("    { \"level\": " + lvl.level + 
                      ", \"title\": \"" + escapedTitle + 
                      "\", \"stage\": \"" + escapedStage + 
                      "\", \"vocab\": \"\", \"grammar\": \"\", \"qa\": [");
            
            boolean firstQA = true;
            for (QA qa : lvl.qa) {
                if (!firstQA) {
                    out.print(",");
                }
                firstQA = false;
                
                String q = escapeJson(qa.q);
                String a = escapeJson(qa.a);
                out.print("{\"q\":\"" + q + "\", \"a\":\"" + a + "\"}");
            }
            out.print("] }");
        }
        out.println();
    }

    private static String escapeJson(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "")
                    .replace("\t", "\\t");
    }
}
