package com.lucy;

import com.lucy.util.DBConnection;
import java.sql.*;
import java.io.FileWriter;
import java.io.PrintWriter;

public class JSONExporter {
    public static void main(String[] args) {
        String outputPath = "lessonsData.json";
        if (args != null && args.length > 0 && args[0] != null && !args[0].trim().isEmpty()) {
            outputPath = args[0].trim();
        }
        
        try (Connection conn = DBConnection.getConnection();
             Statement stmt = conn.createStatement();
             PrintWriter out = new PrintWriter(new java.io.OutputStreamWriter(
                     new java.io.FileOutputStream(outputPath), java.nio.charset.StandardCharsets.UTF_8))) {
             
            out.println("{");
            
            String[] langs = {"EN", "ZH", "JA"};
            int[] langIds = {1, 2, 3};
            
            for (int i = 0; i < langs.length; i++) {
                String code = langs[i];
                int langId = langIds[i];
                out.println("  \"" + code + "\": [");
                
                String sql = "SELECT l.level_number, l.title, s.name as stage_name " +
                             "FROM Levels l JOIN Stages s ON l.stage_id = s.id " +
                             "WHERE l.language_id = " + langId + " " +
                             "ORDER BY l.level_number";
                
                ResultSet rs = stmt.executeQuery(sql);
                boolean firstL = true;
                while (rs.next()) {
                    if (!firstL) out.println(",");
                    firstL = false;
                    int level = rs.getInt("level_number");
                    String title = rs.getString("title").replace("\"", "\\\"");
                    String stage = rs.getString("stage_name");
                    
                    out.print("    { \"level\": " + level + ", \"title\": \"" + title + "\", \"stage\": \"" + stage + "\", ");
                    
                    // fetch content
                    Statement stmt2 = conn.createStatement();
                    if (langId == 2) {
                        // Chinese has QA
                        String sql2 = "SELECT question_text, answer_text FROM Questions WHERE level_id = (SELECT id FROM Levels WHERE language_id=" + langId + " AND level_number=" + level + ") ORDER BY order_index";
                        ResultSet rs2 = stmt2.executeQuery(sql2);
                        out.print("\"vocab\": \"\", \"grammar\": \"\", \"qa\": [");
                        boolean firstQ = true;
                        while(rs2.next()) {
                            if (!firstQ) out.print(",");
                            firstQ = false;
                            out.print("{\"q\":\"" + rs2.getString("question_text").replace("\"", "\\\"").replace("\n", "\\n") + "\", \"a\":\"" + rs2.getString("answer_text").replace("\"", "\\\"").replace("\n", "\\n") + "\"}");
                        }
                        out.print("]");
                        rs2.close();
                    } else {
                        // EN/JA
                        String sql2 = "SELECT sub_level_name, content FROM LevelContents WHERE level_id = (SELECT id FROM Levels WHERE language_id=" + langId + " AND level_number=" + level + ") ORDER BY order_index";
                        ResultSet rs2 = stmt2.executeQuery(sql2);
                        String vocab = "";
                        String grammar = "";
                        while(rs2.next()) {
                            String sub = rs2.getString("sub_level_name");
                            String c = rs2.getString("content").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
                            if (sub.equalsIgnoreCase("Vocabulary")) vocab = c;
                            else if (sub.equalsIgnoreCase("Grammar")) grammar = c;
                            else vocab += "\\n" + c; // fallback
                        }
                        out.print("\"vocab\": \"" + vocab + "\", \"grammar\": \"" + grammar + "\"");
                        rs2.close();
                    }
                    stmt2.close();
                    out.print(" }");
                }
                rs.close();
                out.println();
                if (i < langs.length - 1) out.println("  ],");
                else out.println("  ]");
            }
            out.println("}");
            System.out.println("Exported lessonsData.json!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
