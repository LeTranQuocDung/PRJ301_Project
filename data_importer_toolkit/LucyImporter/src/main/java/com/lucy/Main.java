package com.lucy;

import com.lucy.dao.LucyDAO;
import com.lucy.extractor.ChineseExtractor;
import com.lucy.extractor.EnglishExtractor;
import com.lucy.extractor.JapaneseExtractor;
import com.lucy.model.LucyRow;
import com.lucy.util.DBConnection;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class Main {

    // =====================================================
    //  QUÉT TỰ ĐỘNG THƯ MỤC CHỨA FILE WORD
    // =====================================================
    private static final String WORD_FOLDER = "../raw_word_files/";

    // =====================================================
    //  TEN 8 FILE WORD
    // =====================================================
        // =====================================================
    //  QUÉT TỰ ĐỘNG THƯ MỤC CHỨA FILE WORD
    // =====================================================
    private static List<String[]> scanWordFiles() {
        List<String[]> files = new ArrayList<>();
        File folder = new File(WORD_FOLDER);
        if (folder.exists() && folder.isDirectory()) {
            for (File file : folder.listFiles()) {
                if (file.isFile() && file.getName().endsWith(".docx") && !file.getName().startsWith("~$")) {
                    String name = file.getName().toLowerCase();
                    // Skip the reviewed files if they contain "reviewed"
                    if (name.contains("reviewed")) continue;
                    
                    if (name.startsWith("eng")) {
                        files.add(new String[]{file.getName(), "english", "LISA"});
                    } else if (name.startsWith("chinese")) {
                        files.add(new String[]{file.getName(), "chinese", "ZH"});
                    } else if (name.startsWith("janpanes") || name.startsWith("japan")) {
                        files.add(new String[]{file.getName(), "japanese", "JA"});
                    }
                }
            }
        }
        return files;
    }

    // true  = xoa du lieu cu truoc khi import
    // false = giu du lieu cu, chi them moi
    private static final boolean CLEAR_BEFORE_IMPORT = true;

    public static void main(String[] args) throws Exception {
        System.out.println("======================================");
        System.out.println("      LUCY Word Importer              ");
        System.out.println("======================================");
        System.out.println();

        // Buoc 1: Test ket noi DB
        System.out.println("[1] Kiem tra ket noi LUCY_DB...");
        try {
            DBConnection.getConnection().close();
            System.out.println("    OK - Ket noi thanh cong!\n");
        } catch (Exception e) {
            System.out.println("    FAIL - Loi: " + e.getMessage());
            System.out.println("    -> Sua lai DBConnection.java (HOST/USER/PASSWORD)");
            return;
        }

        // Buoc 2: Xoa du lieu cu
        LucyDAO dao = new LucyDAO();
        if (CLEAR_BEFORE_IMPORT) {
            System.out.println("[2] Xoa du lieu cu trong LucyContents...");
            dao.clearTable();
            System.out.println();
        }

        // Buoc 3: Boc tach tung file Word
        System.out.println("[3] Boc tach 8 file Word...");
        System.out.println("    Thu muc: " + WORD_FOLDER);
        System.out.println();

        EnglishExtractor  engExt = new EnglishExtractor();
        ChineseExtractor  zhExt  = new ChineseExtractor();
        JapaneseExtractor jaExt  = new JapaneseExtractor();

        List<LucyRow> allRows = new ArrayList<>();
        int filesOk   = 0;
        int filesSkip = 0;

        for (String[] entry : scanWordFiles()) {
            String fileName = entry[0];
            String type     = entry[1];
            String lang     = entry[2];
            File   file     = new File(WORD_FOLDER + fileName);

            if (!file.exists()) {
                System.out.println("    SKIP: " + fileName + " (khong tim thay)");
                filesSkip++;
                continue;
            }

            try {
                List<LucyRow> rows;
                switch (type) {
                    case "english":  rows = engExt.extract(file, lang); break;
                    case "chinese":  rows = zhExt.extract(file, lang);  break;
                    case "japanese": rows = jaExt.extract(file, lang);  break;
                    default: continue;
                }
                allRows.addAll(rows);
                filesOk++;
            } catch (Exception e) {
                System.out.println("    ERROR " + fileName + ": " + e.getMessage());
            }
        }

        System.out.println();
        System.out.println("    Tong rows boc tach: " + allRows.size());
        long lisa = allRows.stream().filter(r -> "LISA".equals(r.getLanguageCode())).count();
        long zh   = allRows.stream().filter(r -> "ZH".equals(r.getLanguageCode())).count();
        long ja   = allRows.stream().filter(r -> "JA".equals(r.getLanguageCode())).count();
        System.out.println("    LISA: " + lisa + " | ZH: " + zh + " | JA: " + ja);

        if (allRows.isEmpty()) {
            System.out.println("ERROR: Khong co du lieu. Kiem tra lai duong dan file.");
            return;
        }

        // Sort allRows by languageCode and levelNum so insertion order matches progression
        allRows.sort((r1, r2) -> {
            int cmpLang = r1.getLanguageCode().compareTo(r2.getLanguageCode());
            if (cmpLang != 0) return cmpLang;
            return Integer.compare(r1.getLevelNum(), r2.getLevelNum());
        });

        // Buoc 4: Insert vao DB
        System.out.println("\n[4] Insert vao LucyContents...");
        try {
            int inserted = dao.insertBatch(allRows);
            System.out.println();
            System.out.println("======================================");
            System.out.println("  IMPORT XONG: " + inserted + " dong");
            System.out.println("  Files OK: " + filesOk + " | Skip: " + filesSkip);
            System.out.println("======================================");

            int total = dao.countRows();
            System.out.println("\nTong so Bai hoc (Levels) hien co: " + total + " bai");

        } catch (Exception e) {
            System.out.println("ERROR insert: " + e.getMessage());
            e.printStackTrace();
        }
    }
}