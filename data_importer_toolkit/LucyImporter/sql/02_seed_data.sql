-- ============================================================
--  LUCY_DB - Seed Data (Dữ liệu khởi tạo)
-- ============================================================
USE LUCY_DB;
GO

-- ═══════════════════════════════════════════════════════════
--  1. LANGUAGES
-- ═══════════════════════════════════════════════════════════
SET IDENTITY_INSERT Languages ON;

MERGE INTO Languages AS target
USING (VALUES
    (1, N'EN',  N'LISA', N'English',  N'Tiếng Anh',   N'🇬🇧', 60),
    (2, N'ZH',  N'ZH',   N'中文',     N'Tiếng Trung',  N'🇨🇳', 60),
    (3, N'JA',  N'JA',   N'日本語',   N'Tiếng Nhật',   N'🇯🇵', 100)
) AS source (id, code, display_code, name, name_vi, flag_emoji, total_levels)
ON target.id = source.id
WHEN NOT MATCHED THEN
    INSERT (id, code, display_code, name, name_vi, flag_emoji, total_levels)
    VALUES (source.id, source.code, source.display_code, source.name, source.name_vi, source.flag_emoji, source.total_levels);

SET IDENTITY_INSERT Languages OFF;
GO


-- ═══════════════════════════════════════════════════════════
--  2. STAGES
-- ═══════════════════════════════════════════════════════════
SET IDENTITY_INSERT Stages ON;

MERGE INTO Stages AS target
USING (VALUES
    -- English (LISA) - 60 levels
    (1,  1, N'Sơ cấp',    N'Beginner',      N'Beginner',     1,  20, 1, '#4CAF50'),
    (2,  1, N'Trung cấp', N'Intermediate',   N'Intermediate', 21, 40, 2, '#FF9800'),
    (3,  1, N'Cao cấp',   N'Advanced',       N'Advanced',     41, 60, 3, '#F44336'),

    -- Chinese (ZH) - 60 levels
    (4,  2, N'Sơ cấp',    N'Beginner',      N'初级',          1,  20, 1, '#4CAF50'),
    (5,  2, N'Trung cấp', N'Intermediate',   N'中级',          21, 40, 2, '#FF9800'),
    (6,  2, N'Cao cấp',   N'Advanced',       N'高级',          41, 60, 3, '#F44336'),

    -- Japanese (JA) - 100 levels
    (7,  3, N'Sơ cấp',    N'Beginner',      N'初級',          1,  33, 1, '#4CAF50'),
    (8,  3, N'Trung cấp', N'Intermediate',   N'中級',          34, 66, 2, '#FF9800'),
    (9,  3, N'Cao cấp',   N'Advanced',       N'上級',          67, 100, 3, '#F44336')
) AS source (id, language_id, name, name_en, name_native, level_from, level_to, order_index, color_hex)
ON target.id = source.id
WHEN NOT MATCHED THEN
    INSERT (id, language_id, name, name_en, name_native, level_from, level_to, order_index, color_hex)
    VALUES (source.id, source.language_id, source.name, source.name_en, source.name_native,
            source.level_from, source.level_to, source.order_index, source.color_hex);

SET IDENTITY_INSERT Stages OFF;
GO


-- ═══════════════════════════════════════════════════════════
--  3. ACHIEVEMENTS (Thành tích)
-- ═══════════════════════════════════════════════════════════
MERGE INTO Achievements AS target
USING (VALUES
    -- General
    (N'FIRST_LESSON',    N'First Step',           N'Bước đầu tiên',        N'Complete your first lesson',     N'👣',  10, N'general'),
    (N'LEVEL_10',        N'Getting Serious',      N'Nghiêm túc rồi đây',   N'Complete 10 levels',            N'📚',  50, N'completion'),
    (N'LEVEL_30',        N'Halfway There',        N'Nửa đường rồi',        N'Complete 30 levels',            N'🎯', 100, N'completion'),
    (N'LEVEL_60',        N'Language Explorer',     N'Nhà thám hiểm',        N'Complete 60 levels',            N'🌍', 200, N'completion'),
    (N'LEVEL_100',       N'Master',               N'Bậc thầy',             N'Complete 100 levels',           N'👑', 500, N'completion'),

    -- Streak
    (N'STREAK_3',        N'On Fire',              N'Đang nóng',            N'3-day learning streak',         N'🔥',  15, N'streak'),
    (N'STREAK_7',        N'Week Warrior',         N'Chiến binh tuần',      N'7-day learning streak',         N'⚡',  30, N'streak'),
    (N'STREAK_30',       N'Monthly Master',       N'Vua tháng',            N'30-day learning streak',        N'💎', 100, N'streak'),
    (N'STREAK_100',      N'Unstoppable',          N'Không thể cản',        N'100-day learning streak',       N'🏆', 300, N'streak'),

    -- Quiz
    (N'PERFECT_QUIZ',    N'Perfect Score',        N'Điểm tuyệt đối',       N'Score 100% on any quiz',        N'💯',  25, N'quiz'),
    (N'QUIZ_50',         N'Quiz Enthusiast',      N'Mê quiz',              N'Complete 50 quizzes',           N'🧠',  75, N'quiz'),
    (N'SPEED_DEMON',     N'Speed Demon',          N'Tốc độ bàn thờ',       N'Complete quiz under 60 seconds', N'⏱️', 40, N'quiz'),

    -- Multi-language
    (N'POLYGLOT_2',      N'Bilingual',            N'Song ngữ',             N'Learn 2 languages',             N'🗣️',  50, N'general'),
    (N'POLYGLOT_3',      N'Trilingual',           N'Tam ngữ',             N'Learn 3 languages',             N'🌟', 150, N'general')
) AS source (code, name, name_vi, description, icon_emoji, xp_reward, category)
ON target.code = source.code
WHEN NOT MATCHED THEN
    INSERT (code, name, name_vi, description, icon_emoji, xp_reward, category)
    VALUES (source.code, source.name, source.name_vi, source.description, source.icon_emoji, source.xp_reward, source.category);
GO


PRINT N'✅ Seed data inserted successfully!';
GO


-- ============================================================
-- Seed Test Accounts (Admin and Student)
-- Note: Password for both is '123456', hashed using SHA-256 + Salt
-- ============================================================
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@lucy.edu')
BEGIN
    INSERT INTO Users (username, email, password_hash, display_name, role, total_xp, is_active, is_deleted)
    VALUES 
    ('admin', 'admin@lucy.edu', 'faudq84gGjgvjeYGqNRMtsxu49iFmicKzWBp143P/4k=', 'Gi?ng vi�n', 'admin', 0, 1, 0),
    ('student', 'student@lucy.edu', 'faudq84gGjgvjeYGqNRMtsxu49iFmicKzWBp143P/4k=', 'H?c vi�n Test', 'student', 150, 1, 0);
END
GO
