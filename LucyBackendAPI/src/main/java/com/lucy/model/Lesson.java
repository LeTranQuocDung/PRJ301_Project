package com.lucy.model;

public class Lesson {
    private int id;
    private String langCode;
    private int levelNum;
    private String title;
    private String stage;
    private String vocab;
    private String grammar;

    public Lesson() {
    }

    public Lesson(String langCode, int levelNum, String title, String stage, String vocab, String grammar) {
        this.langCode = langCode;
        this.levelNum = levelNum;
        this.title = title;
        this.stage = stage;
        this.vocab = vocab;
        this.grammar = grammar;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getLangCode() { return langCode; }
    public void setLangCode(String langCode) { this.langCode = langCode; }
    public int getLevelNum() { return levelNum; }
    public void setLevelNum(int levelNum) { this.levelNum = levelNum; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getVocab() { return vocab; }
    public void setVocab(String vocab) { this.vocab = vocab; }
    public String getGrammar() { return grammar; }
    public void setGrammar(String grammar) { this.grammar = grammar; }
}
