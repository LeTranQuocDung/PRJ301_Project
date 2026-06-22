package com.lucy.model;

/**
 * 1 dòng dữ liệu tương ứng với 1 row trong bảng LucyContents
 *
 * Schema:
 *   id            INT (auto)
 *   language_code NVARCHAR(50)   -- LISA / ZH / JA
 *   stage         NVARCHAR(50)   -- Sơ cấp / Trung cấp / Cao cấp
 *   level_name    NVARCHAR(100)  -- Tên level
 *   sub_level     NVARCHAR(MAX)  -- Nội dung (English/Japanese)
 *   question_ai   NVARCHAR(MAX)  -- Câu hỏi (Chinese)
 *   answer        NVARCHAR(MAX)  -- Đáp án (Chinese)
 */
public class LucyRow {

    private String languageCode;
    private String stage;
    private String levelName;
    private String subLevel;
    private String questionAi;
    private String answer;

    // Constructor đầy đủ
    public LucyRow(String languageCode, String stage, String levelName,
                   String subLevel, String questionAi, String answer) {
        this.languageCode = languageCode;
        this.stage        = stage;
        this.levelName    = levelName;
        this.subLevel     = subLevel;
        this.questionAi   = questionAi;
        this.answer       = answer;
    }

    // Factory: dùng cho English / Japanese (chỉ có sub_level)
    public static LucyRow contentRow(String lang, String stage,
                                      String levelName, String subLevel) {
        return new LucyRow(lang, stage, levelName, subLevel, null, null);
    }

    // Factory: dùng cho Chinese (chỉ có question + answer)
    public static LucyRow questionRow(String lang, String stage,
                                       String levelName, String question, String answer) {
        return new LucyRow(lang, stage, levelName, null, question, answer);
    }

    // Getters
    public String getLanguageCode() { return languageCode; }
    public String getStage()        { return stage; }
    public String getLevelName()    { return levelName; }
    public String getSubLevel()     { return subLevel; }
    public String getQuestionAi()   { return questionAi; }
    public String getAnswer()       { return answer; }

    @Override
    public String toString() {
        return String.format("[%s|%s] Level: %s | Sub: %s | Q: %s",
                languageCode, stage, levelName,
                subLevel   != null ? subLevel.substring(0, Math.min(40, subLevel.length())) + "..." : "NULL",
                questionAi != null ? questionAi.substring(0, Math.min(40, questionAi.length())) + "..." : "NULL");
    }
}
