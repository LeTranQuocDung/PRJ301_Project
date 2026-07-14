package com.lucy.model;

import java.sql.Timestamp;

public class UserProgress {
    private int id;
    private int userId;
    private String langCode;
    private int levelNum;
    private Timestamp completedAt;

    public UserProgress() {
    }

    public UserProgress(int userId, String langCode, int levelNum) {
        this.userId = userId;
        this.langCode = langCode;
        this.levelNum = levelNum;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getLangCode() {
        return langCode;
    }

    public void setLangCode(String langCode) {
        this.langCode = langCode;
    }

    public int getLevelNum() {
        return levelNum;
    }

    public void setLevelNum(int levelNum) {
        this.levelNum = levelNum;
    }

    public Timestamp getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Timestamp completedAt) {
        this.completedAt = completedAt;
    }
}
