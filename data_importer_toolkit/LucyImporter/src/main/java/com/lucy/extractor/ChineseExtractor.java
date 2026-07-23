package com.lucy.extractor;

import com.lucy.model.LucyRow;
import org.apache.poi.xwpf.usermodel.*;

import java.io.File;
import java.io.FileInputStream;
import java.util.*;
import java.util.regex.*;

/**
 * Bóc tách file Word TIẾNG TRUNG (Chinese)
 *
 * Cấu trúc file:
 * 1. 介绍 ← bold + số + dấu chấm → level mới
 * Q1: 你叫什么名字？ ← bold, bắt đầu bằng Q → câu hỏi
 * 👉 我叫... ← bắt đầu bằng 👉/→ → đáp án
 * Q2: ...
 * 👉 ...
 *
 * Kết quả: 1 LucyRow / câu hỏi
 */
public class ChineseExtractor {

    // "1. 介绍" hoặc "31. 我的学习计划"
    private static final Pattern LEVEL_PAT = Pattern.compile(
            "^(\\d+)[.．]\\s*(.*)");

    // "Q1: ...", "Q1：...", "Q：..."
    private static final Pattern QUESTION_PAT = Pattern.compile(
            "^Q\\s*\\d*\\s*[:：]\\s*(.+)", Pattern.CASE_INSENSITIVE);

    // "👉 ...", "→ ...", "➡ ..."
    private static final Pattern ANSWER_PAT = Pattern.compile(
            "^[👉➡→✅▶◆]\\s*(.+)");

    // Pinyin thuần (chỉ latin + dấu thanh → bỏ qua)
    private static final Pattern PINYIN_PAT = Pattern.compile(
            "^[a-záéíóúāēīōūǎěǐǒǔǘ][a-záéíóúāēīōūǎěǐǒǔǘ\\s\\d]*$",
            Pattern.CASE_INSENSITIVE);

    public List<LucyRow> extract(File file, String langCode) throws Exception {
        List<LucyRow> rows = new ArrayList<>();

        try (FileInputStream fis = new FileInputStream(file);
                XWPFDocument doc = new XWPFDocument(fis)) {

            int currentLevel = -1;
            String levelTitle = "";
            String currentQ = null; // câu hỏi đang chờ đáp án

            for (XWPFParagraph para : doc.getParagraphs()) {
                String text = para.getText().trim();
                if (text.isEmpty())
                    continue;

                boolean bold = isBold(para) || isHeading(para);

                // ── Level mới ──────────────────────────────────
                Matcher mLevel = LEVEL_PAT.matcher(text);
                if (mLevel.find()) {
                    // Flush câu hỏi chưa có đáp án
                    if (currentQ != null) {
                        rows.add(LucyRow.questionRow(
                                langCode, stageOf(currentLevel),
                                currentLevel, levelTitle, currentQ, ""));
                        currentQ = null;
                    }
                    currentLevel = Integer.parseInt(mLevel.group(1));
                    levelTitle = mLevel.group(2).trim();
                    continue;
                }

                if (currentLevel < 0)
                    continue;

                if (levelTitle.isEmpty() && !ANSWER_PAT.matcher(text).find() && !PINYIN_PAT.matcher(text).matches()) {
                    levelTitle = text;
                    continue;
                }

                // ── Câu hỏi ────────────────────────────────────
                Matcher mQ = QUESTION_PAT.matcher(text);
                boolean isQuestionText = mQ.find() || text.contains("？") || text.contains("?");
                if (isQuestionText && !ANSWER_PAT.matcher(text).find() && !PINYIN_PAT.matcher(text).matches()) {
                    // Flush câu hỏi trước (nếu chưa có đáp án)
                    if (currentQ != null) {
                        rows.add(LucyRow.questionRow(
                                langCode, stageOf(currentLevel),
                                currentLevel, levelTitle, currentQ, ""));
                    }
                    String qStr = text;
                    Matcher mClean = QUESTION_PAT.matcher(text);
                    if (mClean.find()) {
                        qStr = mClean.group(1).trim();
                    }
                    currentQ = qStr;
                    continue;
                }

                // ── Đáp án ─────────────────────────────────────
                Matcher mA = ANSWER_PAT.matcher(text);
                if (mA.find() && currentQ != null) {
                    rows.add(LucyRow.questionRow(
                            langCode, stageOf(currentLevel),
                            currentLevel, levelTitle, currentQ, mA.group(1).trim()));
                    currentQ = null;
                    continue;
                }

                // Bỏ qua pinyin
                if (PINYIN_PAT.matcher(text).matches() && text.length() < 80)
                    continue;
            }

            // Flush câu hỏi cuối
            if (currentQ != null) {
                rows.add(LucyRow.questionRow(
                        langCode, stageOf(currentLevel),
                        currentLevel, levelTitle, currentQ, ""));
            }
        }

        System.out.printf("  [ZH]   %s → %d rows (Q&A)%n",
                file.getName(), rows.size());
        return rows;
    }

    private String stageOf(int n) {
        if (n <= 33)
            return "Sơ cấp";
        if (n <= 66)
            return "Trung cấp";
        return "Cao cấp";
    }

    private boolean isBold(XWPFParagraph p) {
        for (XWPFRun r : p.getRuns())
            if (Boolean.TRUE.equals(r.isBold()))
                return true;
        return false;
    }

    private boolean isHeading(XWPFParagraph p) {
        String s = p.getStyleID();
        return s != null && s.toLowerCase().startsWith("heading");
    }
}
