package com.lucy.service;

import com.lucy.dao.LucyDAO;
import com.lucy.model.Lesson;

import java.util.List;

public class ContentService {

    private LucyDAO dao;

    public ContentService() {
        dao = new LucyDAO();
    }

    public List<Lesson> getByLanguage(String langCode) {
        return dao.getLessonsByLang(langCode);
    }
}
