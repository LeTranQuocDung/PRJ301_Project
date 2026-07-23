package com.lucy.extractor;

import com.lucy.model.LucyRow;
import org.apache.poi.xwpf.usermodel.*;

import java.io.File;
import java.io.FileInputStream;
import java.util.*;
import java.util.regex.*;

/**
 * Bóc tách file Word TIẾNG NHẬT (Japanese)
 *
 * File có 2 loại dòng heading:
 *
 *  A) Individual level (có nội dung riêng):
 *     🔹 レベル1 – 自己紹介    → level 1
 *     - 学生／社会人
 *     - 自分について
 *
 *  B) Group range (nhiều level dùng chung bullet):
 *     🔵 レベル11–15：機能的コミュニケーション
 *     - 買い物
 *     - 外食
 *     - 交通
 *     - 天気と服装
 *     - 週末
 *     → Expand thành level 11=買い物, 12=外食, 13=交通, 14=天気と服装, 15=週末
 *
 * Ưu tiên: individual level thắng group (nếu level đã có individual thì bỏ group)
 */
public class JapaneseExtractor {

    // Single level: "レベル1 – 自己紹介" (title bắt đầu bằng non-digit)
    private static final Pattern SINGLE_PAT = Pattern.compile(
        "レベル\\s*(\\d+)\\s*[–－\\-]\\s*([^\\d–－\\-].+)"
    );

    // Range: "レベル11–15：..." hoặc "レベル11-15..."
    private static final Pattern RANGE_PAT = Pattern.compile(
        "レベル\\s*(\\d+)\\s*[–－\\-]\\s*(\\d+)[：:\\s]*(.*)"
    );

    // Emoji/ký hiệu đầu dòng
    private static final Pattern EMOJI_PAT = Pattern.compile(
        "^[\\uD83C-\\uDBFF\\uDC00-\\uDFFF\\u25A0-\\u25FF\\u2600-\\u26FF\\s]+"
    );

    public List<LucyRow> extract(File file, String langCode) throws Exception {
        // Dùng Map để dedup: level_number → row
        // individual level sẽ override group-expanded
        Map<Integer, LucyRow>  realMap  = new LinkedHashMap<>();
        Map<Integer, LucyRow>  groupMap = new LinkedHashMap<>();

        // Trạng thái parse
        int    currentLevel = -1;
        String levelTitle   = "";
        StringBuilder contentBuf = new StringBuilder();

        // Group range đang xử lý
        int      groupFrom    = -1;
        int      groupTo      = -1;
        String   groupTitle   = "";
        List<String> groupBullets = new ArrayList<>();
        boolean inGroup = false;

        try (FileInputStream fis = new FileInputStream(file);
             XWPFDocument doc    = new XWPFDocument(fis)) {

            for (XWPFParagraph para : doc.getParagraphs()) {
                String text = para.getText().trim();
                if (text.isEmpty()) continue;

                boolean bold    = isBold(para) || isHeading(para);
                String  cleaned = removeEmoji(text);

                // ── Kiểm tra range TRƯỚC (ưu tiên cao hơn single) ──
                if (bold) {
                    Matcher mRange = RANGE_PAT.matcher(cleaned);
                    if (mRange.find()) {
                        // Flush single level trước đó
                        flushSingle(currentLevel, levelTitle, langCode,
                                    contentBuf, realMap);
                        currentLevel = -1; contentBuf = new StringBuilder();

                        // Flush group trước đó
                        flushGroup(groupFrom, groupTo, groupTitle,
                                   groupBullets, langCode, groupMap);

                        groupFrom   = Integer.parseInt(mRange.group(1));
                        groupTo     = Integer.parseInt(mRange.group(2));
                        groupTitle  = mRange.group(3).trim();
                        groupBullets = new ArrayList<>();
                        inGroup     = true;
                        continue;
                    }
                }

                // ── Single level ──
                if (bold) {
                    Matcher mSingle = SINGLE_PAT.matcher(cleaned);
                    if (mSingle.find()) {
                        // Flush single level trước
                        flushSingle(currentLevel, levelTitle, langCode,
                                    contentBuf, realMap);
                        // Flush group trước (vì gặp individual rồi)
                        flushGroup(groupFrom, groupTo, groupTitle,
                                   groupBullets, langCode, groupMap);
                        groupFrom = -1; inGroup = false;

                        currentLevel = Integer.parseInt(mSingle.group(1));
                        levelTitle   = mSingle.group(2).trim();
                        contentBuf   = new StringBuilder();
                        continue;
                    }
                }

                // ── Nội dung (bullet) ──
                if (inGroup && groupFrom > 0) {
                    // Bullet thuộc group range
                    String bullet = text.replaceAll("^[-・•\\s]+", "").trim();
                    if (!bullet.isEmpty()) groupBullets.add(bullet);
                } else if (currentLevel > 0) {
                    // Nội dung thuộc individual level
                    contentBuf.append(text).append("\n");
                }
            }

            // Flush cuối
            flushSingle(currentLevel, levelTitle, langCode, contentBuf, realMap);
            flushGroup(groupFrom, groupTo, groupTitle, groupBullets, langCode, groupMap);
        }

        // Merge: individual (realMap) thắng group (groupMap)
        Map<Integer, LucyRow> merged = new LinkedHashMap<>(groupMap);
        merged.putAll(realMap);  // realMap ghi đè groupMap

        // Sắp xếp theo level number
        List<Integer> sortedKeys = new ArrayList<>(merged.keySet());
        Collections.sort(sortedKeys);
        List<LucyRow> result = new ArrayList<>();
        for (int k : sortedKeys) result.add(merged.get(k));

        System.out.printf("  [JA]   %s → %d levels (real=%d, group=%d)%n",
            file.getName(), result.size(), realMap.size(), groupMap.size());
        return result;
    }

    /** Lưu individual level vào map */
    private void flushSingle(int level, String title, String lang,
                              StringBuilder buf, Map<Integer, LucyRow> map) {
        if (level <= 0) return;
        map.put(level, LucyRow.contentRow(
            lang, stageOf(level), level, title, buf.toString().trim()
        ));
    }

    /** Expand group range thành từng level riêng */
    private void flushGroup(int from, int to, String groupTitle,
                             List<String> bullets, String lang,
                             Map<Integer, LucyRow> map) {
        if (from <= 0 || to <= 0) return;
        int count = to - from + 1;
        for (int i = 0; i < count; i++) {
            int levelNum = from + i;
            // Tiêu đề level = bullet[i] nếu có, không thì dùng groupTitle
            String title = (i < bullets.size())
                ? bullets.get(i)
                : groupTitle + " (" + levelNum + ")";
            // Nội dung = tất cả bullets của group
            String content = String.join("\n", bullets);
            map.put(levelNum, LucyRow.contentRow(
                lang, stageOf(levelNum), levelNum, title, content
            ));
        }
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
