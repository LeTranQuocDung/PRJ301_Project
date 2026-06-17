package com.lucy.service;

import com.lucy.dao.LucyDAO;
import com.lucy.model.LucyRow;
import com.lucy.room.StageEngine.StageItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Load danh sách Stage/Level cho StageEngine.
 * Dùng LẠI LucyDAO gốc của LucyBackendAPI — KHÔNG viết SQL riêng,
 * để đảm bảo đồng bộ tuyệt đối với phần Import/Backend đã có sẵn.
 */
public class LucyContentService {

    private static final Logger log = LoggerFactory.getLogger(LucyContentService.class);
    private static final LucyContentService INSTANCE = new LucyContentService();
    public static LucyContentService getInstance() { return INSTANCE; }

    private final LucyDAO dao = new LucyDAO();

    private LucyContentService() {}

    /**
     * Lấy danh sách Stage theo ngôn ngữ — gọi thẳng LucyDAO.findByLanguage()
     * @param language  "LISA" | "ZH" | "JA" (phải khớp đúng giá trị trong cột language_code)
     */
    public List<StageItem> getStagesByLanguage(String language) {
        List<LucyRow> rows = dao.findByLanguage(language);

        if (rows == null || rows.isEmpty()) {
            log.warn("[ContentService] Không có data cho language={} — dùng demo stages", language);
            return demoStages(language);
        }

        // Deduplicate theo levelName, giữ thứ tự xuất hiện
        Set<String> seen = new LinkedHashSet<>();
        List<StageItem> result = new ArrayList<>();
        for (LucyRow row : rows) {
            if (row.getLevelName() == null || seen.contains(row.getLevelName())) continue;
            seen.add(row.getLevelName());

            StageItem item = new StageItem();
            item.levelName    = row.getLevelName();
            item.stage        = row.getStage();
            item.languageCode = row.getLanguageCode();
            item.subLevel     = row.getSubLevel();
            item.questionAi   = row.getQuestionAi();
            item.answer       = row.getAnswer();
            result.add(item);
        }

        log.info("[ContentService] Loaded {} stages cho language={}", result.size(), language);
        return result.isEmpty() ? demoStages(language) : result;
    }

    private List<StageItem> demoStages(String language) {
        String[] names = {"Intro", "Warm Up", "Main Topic", "Q&A", "Wrap Up"};
        List<StageItem> list = new ArrayList<>();
        for (String n : names) {
            StageItem s = new StageItem();
            s.levelName    = n;
            s.stage        = "Demo";
            s.languageCode = language;
            s.subLevel     = "Nội dung demo — chưa có data thật trong DB cho ngôn ngữ này.";
            list.add(s);
        }
        return list;
    }
}
