package com.lucy.extractor;

import com.lucy.model.LucyRow;
import org.apache.poi.xwpf.usermodel.*;

import java.io.File;
import java.io.FileInputStream;
import java.util.*;
import java.util.regex.*;

/**
 * Bóc tách file Word TIẾNG ANH (LISA)
 *
 * Cấu trúc file:
 *   🔵 LEVEL 1 – SAYING WHO I AM   ← heading/bold → đánh dấu level mới
 *   Sub-level 1: My name            ← sub-title
 *   - My full name                  ← bullet content
 *   - My nickname
 *   Sub-level 2: Where I'm from
 *   ...
 *
 * Kết quả: 1 LucyRow / level, sub_level chứa toàn bộ nội dung
 */
public class EnglishExtractor {

    // Khớp "LEVEL 6 – DAILY ROUTINE" (title phải bắt đầu bằng chữ, không phải số)
    // → Bỏ qua group header như "LEVEL 1–5: SURVIVAL SPEAKING"
    private static final Pattern LEVEL_PAT = Pattern.compile(
        "LEVEL\\s+(\\d+)\\s*[–\\-]\\s*([A-Za-z].+)", Pattern.CASE_INSENSITIVE
    );

    // Emoji / ký hiệu đầu dòng
    private static final Pattern EMOJI_PAT = Pattern.compile(
        "^[\\uD83C-\\uDBFF\\uDC00-\\uDFFF\\u25A0-\\u25FF\\u2600-\\u26FF\\s]+"
    );

    public List<LucyRow> extract(File file, String langCode) throws Exception {
        List<LucyRow> rows = new ArrayList<>();

        try (FileInputStream fis = new FileInputStream(file);
             XWPFDocument doc    = new XWPFDocument(fis)) {

            int    currentLevel = -1;
            String levelTitle   = "";
            StringBuilder contentBuf = new StringBuilder();

            for (XWPFParagraph para : doc.getParagraphs()) {
                String text = para.getText().trim();
                if (text.isEmpty()) continue;

                boolean bold    = isBold(para);
                boolean heading = isHeading(para);

                // Thử match LEVEL X – TITLE
                String cleaned = removeEmoji(text);
                Matcher m = LEVEL_PAT.matcher(cleaned);

                if ((bold || heading) && m.find()) {
                    // Lưu level trước đó
                    if (currentLevel > 0) {
                        rows.add(LucyRow.contentRow(
                            langCode,
                            stageOf(currentLevel),
                            levelTitle,
                            contentBuf.toString().trim()
                        ));
                    }
                    // Bắt đầu level mới
                    currentLevel = Integer.parseInt(m.group(1));
                    levelTitle   = m.group(2).trim();
                    contentBuf   = new StringBuilder();

                } else if (currentLevel > 0) {
                    // Tích lũy nội dung
                    contentBuf.append(text).append("\n");
                }
            }

            // Flush level cuối
            if (currentLevel > 0) {
                rows.add(LucyRow.contentRow(
                    langCode, stageOf(currentLevel),
                    levelTitle, contentBuf.toString().trim()
                ));
            }
        }

        System.out.printf("  [LISA] %s → %d levels%n",
            file.getName(), rows.size());
        return rows;
    }

    private String stageOf(int n) {
        if (n <= 33)  return "Sơ cấp";
        if (n <= 66)  return "Trung cấp";
        return "Cao cấp";
    }

    private boolean isBold(XWPFParagraph p) {
        for (XWPFRun r : p.getRuns())
            if (Boolean.TRUE.equals(r.isBold())) return true;
        return false;
    }

    private boolean isHeading(XWPFParagraph p) {
        String s = p.getStyleID();
        return s != null && s.toLowerCase().startsWith("heading");
    }

    private String removeEmoji(String text) {
        return EMOJI_PAT.matcher(text).replaceFirst("").trim();
    }
}
