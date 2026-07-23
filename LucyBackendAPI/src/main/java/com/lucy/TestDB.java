package com.lucy;

import com.lucy.dao.LucyDAO;
import com.lucy.model.Lesson;
import java.util.List;

public class TestDB {
    public static void main(String[] args) {
        LucyDAO dao = new LucyDAO();
        List<Lesson> lessons = dao.getLessonsByLang("LISA");
        System.out.println("LISA lessons count: " + lessons.size());
        
        List<Lesson> all = dao.getAllLessons();
        System.out.println("ALL lessons count: " + all.size());
    }
}
