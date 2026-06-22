-- ============================================================
--  LUCY_DB - Useful Queries (Các truy vấn hữu ích)
-- ============================================================
USE LUCY_DB;
GO

-- ═══════════════════════════════════════════════════════════
--  Q1: Xem tổng quan nội dung theo ngôn ngữ
-- ═══════════════════════════════════════════════════════════
SELECT
    lang.name AS [Ngôn ngữ],
    lang.flag_emoji AS [Flag],
    s.name AS [Stage],
    COUNT(DISTINCT l.id) AS [Số Level],
    (SELECT COUNT(*) FROM LevelContents lc WHERE lc.level_id IN
        (SELECT id FROM Levels WHERE stage_id = s.id)) AS [Content Rows],
    (SELECT COUNT(*) FROM Questions q WHERE q.level_id IN
        (SELECT id FROM Levels WHERE stage_id = s.id)) AS [Questions]
FROM Languages lang
JOIN Stages s ON s.language_id = lang.id
JOIN Levels l ON l.stage_id = s.id
WHERE l.status = 'active'
GROUP BY lang.name, lang.flag_emoji, s.name, s.order_index, s.id
ORDER BY lang.name, s.order_index;
GO

-- ═══════════════════════════════════════════════════════════
--  Q2: Xem chi tiết 1 level cụ thể (ví dụ: English Level 1)
-- ═══════════════════════════════════════════════════════════
SELECT
    l.level_number,
    l.title,
    l.content_type,
    lc.sub_level_name,
    lc.content
FROM Levels l
LEFT JOIN LevelContents lc ON lc.level_id = l.id
WHERE l.language_id = 1  -- English
  AND l.level_number = 1
ORDER BY lc.order_index;
GO

-- ═══════════════════════════════════════════════════════════
--  Q3: Xem Q&A của 1 level Chinese
-- ═══════════════════════════════════════════════════════════
SELECT
    l.level_number,
    l.title,
    q.question_text,
    q.answer_text,
    q.difficulty
FROM Levels l
JOIN Questions q ON q.level_id = l.id
WHERE l.language_id = 2  -- Chinese
  AND l.level_number = 1
ORDER BY q.order_index;
GO

-- ═══════════════════════════════════════════════════════════
--  Q4: Dashboard user progress
-- ═══════════════════════════════════════════════════════════
SELECT
    u.display_name,
    lang.name AS [Language],
    COUNT(CASE WHEN up.status = 'completed' THEN 1 END) AS [Completed],
    COUNT(CASE WHEN up.status = 'in_progress' THEN 1 END) AS [In Progress],
    lang.total_levels AS [Total],
    CAST(COUNT(CASE WHEN up.status = 'completed' THEN 1 END) * 100.0
         / NULLIF(lang.total_levels, 0) AS DECIMAL(5,1)) AS [Progress %],
    ISNULL(SUM(up.time_spent_seconds) / 3600, 0) AS [Hours Spent],
    u.total_xp AS [Total XP]
FROM Users u
JOIN UserLanguages ul ON ul.user_id = u.id
JOIN Languages lang ON lang.id = ul.language_id
LEFT JOIN UserProgress up ON up.user_id = u.id
    AND up.level_id IN (SELECT id FROM Levels WHERE language_id = lang.id)
WHERE u.is_deleted = 0
GROUP BY u.display_name, lang.name, lang.total_levels, u.total_xp
ORDER BY u.display_name, lang.name;
GO

-- ═══════════════════════════════════════════════════════════
--  Q5: Leaderboard - Top 10
-- ═══════════════════════════════════════════════════════════
SELECT TOP 10
    ROW_NUMBER() OVER (ORDER BY u.total_xp DESC) AS [Rank],
    u.display_name,
    u.total_xp AS [XP],
    (SELECT current_streak FROM UserStreaks
     WHERE user_id = u.id
     ORDER BY current_streak DESC
     OFFSET 0 ROWS FETCH FIRST 1 ROW ONLY) AS [Streak 🔥],
    (SELECT COUNT(*) FROM UserAchievements WHERE user_id = u.id) AS [Achievements 🏆]
FROM Users u
WHERE u.is_deleted = 0 AND u.is_active = 1
ORDER BY u.total_xp DESC;
GO

-- ═══════════════════════════════════════════════════════════
--  Q6: Xem data theo format LucyContents cũ (backward compat)
-- ═══════════════════════════════════════════════════════════
SELECT * FROM v_LucyContents
ORDER BY language_code, level_name;
GO
