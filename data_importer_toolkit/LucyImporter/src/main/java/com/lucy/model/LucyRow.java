package com.lucy.model;

/**
 * 1 dòng dữ liệu tương ứng với 1 row trong bảng LucyContents
 */
public class LucyRow {

    private String languageCode;
    private String stage;
    private int levelNum;
    private String levelName;
    private String subLevel;
    private String questionAi;
    private String answer;

    public LucyRow(String languageCode, String stage, int levelNum, String levelName,
                   String subLevel, String questionAi, String answer) {
        this.languageCode = languageCode;
        this.stage        = stage;
        this.levelNum     = levelNum;
        this.levelName    = levelName;
        this.subLevel     = subLevel;
        this.questionAi   = questionAi;
        this.answer       = answer;
    }

    public static LucyRow contentRow(String lang, String stage, int levelNum,
                                      String levelName, String subLevel) {
        return new LucyRow(lang, stage, levelNum, levelName, subLevel, null, null);
    }

    public static LucyRow questionRow(String lang, String stage, int levelNum,
                                       String levelName, String question, String answer) {
        return new LucyRow(lang, stage, levelNum, levelName, null, question, answer);
    }

    public String getLanguageCode() { return languageCode; }
    public String getStage()        { return stage; }
    public int getLevelNum()        { return levelNum; }
    public String getLevelName()    { return levelName; }
    public String getSubLevel()     { return subLevel; }
    public String getQuestionAi()   { return questionAi; }
    public String getAnswer()       { return answer; }

    @Override
    public String toString() {
        return String.format("[%s|%s] Level: %d (%s) | Sub: %s",
                languageCode, stage, levelNum, levelName,
                subLevel != null ? subLevel.substring(0, Math.min(40, subLevel.length())) + "..." : "NULL");
    }
}
