-- ============================================================
--  LUCY_DB - Complete Database Schema
--  Created: 2026-05-24
--  SQL Server (T-SQL)
-- ============================================================

-- Tạo database (chạy 1 lần, bỏ qua nếu đã có)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'LUCY_DB')
BEGIN
    CREATE DATABASE LUCY_DB;
END
GO

USE LUCY_DB;
GO

-- ============================================================
--  PHẦN 1: BẢNG NỘI DUNG HỌC (CONTENT)
-- ============================================================

-- 1.1 Languages - Ngôn ngữ hỗ trợ
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Languages')
CREATE TABLE Languages (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    code            NVARCHAR(10)        NOT NULL UNIQUE,       -- 'EN', 'ZH', 'JA'
    display_code    NVARCHAR(10)        NOT NULL,              -- 'LISA', 'ZH', 'JA' (backward compat)
    name            NVARCHAR(100)       NOT NULL,              -- 'English', '中文', '日本語'
    name_vi         NVARCHAR(100),                             -- 'Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật'
    flag_emoji      NVARCHAR(10),                              -- '🇬🇧', '🇨🇳', '🇯🇵'
    total_levels    INT                 NOT NULL DEFAULT 0,    -- tổng số level
    is_active       BIT                 NOT NULL DEFAULT 1,
    created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2           NOT NULL DEFAULT GETDATE()
);
GO

-- 1.2 Stages - Cấp độ lớn (Sơ cấp / Trung cấp / Cao cấp)
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Stages')
CREATE TABLE Stages (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    language_id     INT                 NOT NULL,
    name            NVARCHAR(50)        NOT NULL,              -- 'Sơ cấp'
    name_en         NVARCHAR(50),                              -- 'Beginner'
    name_native     NVARCHAR(50),                              -- '初級' (tiếng bản địa)
    level_from      INT                 NOT NULL,              -- 1
    level_to        INT                 NOT NULL,              -- 33
    order_index     INT                 NOT NULL DEFAULT 0,
    color_hex       NVARCHAR(7),                               -- '#4CAF50' (cho UI)
    is_active       BIT                 NOT NULL DEFAULT 1,
    created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Stages_Language FOREIGN KEY (language_id) REFERENCES Languages(id),
    CONSTRAINT CK_Stages_LevelRange CHECK (level_from > 0 AND level_to >= level_from)
);
GO

-- 1.3 Levels - Bài học (mỗi level = 1 bài)
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Levels')
CREATE TABLE Levels (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    stage_id        INT                 NOT NULL,
    language_id     INT                 NOT NULL,
    level_number    INT                 NOT NULL,              -- 1, 2, 3, ...
    title           NVARCHAR(200)       NOT NULL,              -- 'SAYING WHO I AM'
    title_vi        NVARCHAR(200),                             -- 'Tự giới thiệu'
    description     NVARCHAR(MAX),                             -- Mô tả chi tiết
    content_type    NVARCHAR(20)        NOT NULL DEFAULT 'content',  -- 'content' | 'qa'
    estimated_minutes INT               DEFAULT 15,            -- Thời gian học ước tính
    xp_reward       INT                 NOT NULL DEFAULT 10,   -- Điểm XP khi hoàn thành
    status          NVARCHAR(20)        NOT NULL DEFAULT 'active',   -- 'active' | 'draft' | 'archived'
    order_index     INT                 NOT NULL DEFAULT 0,
    is_free         BIT                 NOT NULL DEFAULT 1,    -- Miễn phí hay premium
    created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Levels_Stage    FOREIGN KEY (stage_id)    REFERENCES Stages(id),
    CONSTRAINT FK_Levels_Language FOREIGN KEY (language_id) REFERENCES Languages(id),
    CONSTRAINT UQ_Levels_LangNum UNIQUE (language_id, level_number),
    CONSTRAINT CK_Levels_Status  CHECK (status IN ('active', 'draft', 'archived')),
    CONSTRAINT CK_Levels_Type    CHECK (content_type IN ('content', 'qa'))
);
GO

-- 1.4 LevelContents - Nội dung dạng text (English / Japanese)
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LevelContents')
CREATE TABLE LevelContents (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    level_id        INT                 NOT NULL,
    sub_level_name  NVARCHAR(200),                             -- 'Sub-level 1: My name'
    content         NVARCHAR(MAX)       NOT NULL,              -- Nội dung chi tiết
    content_type    NVARCHAR(30)        DEFAULT 'text',        -- 'text' | 'vocabulary' | 'grammar' | 'dialogue' | 'practice'
    order_index     INT                 NOT NULL DEFAULT 0,
    is_active       BIT                 NOT NULL DEFAULT 1,
    created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_LevelContents_Level FOREIGN KEY (level_id) REFERENCES Levels(id) ON DELETE CASCADE
);
GO

-- 1.5 Questions - Câu hỏi / Q&A (Chinese + Quiz cho tất cả ngôn ngữ)
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Questions')
CREATE TABLE Questions (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    level_id        INT                 NOT NULL,
    question_text   NVARCHAR(MAX)       NOT NULL,              -- Nội dung câu hỏi
    answer_text     NVARCHAR(MAX),                             -- Đáp án (open-ended)
    explanation     NVARCHAR(MAX),                             -- Giải thích đáp án
    question_type   NVARCHAR(30)        NOT NULL DEFAULT 'open',  -- 'open' | 'multiple_choice' | 'fill_blank' | 'matching' | 'speaking' | 'listening'
    difficulty      INT                 NOT NULL DEFAULT 1,    -- 1-5
    order_index     INT                 NOT NULL DEFAULT 0,
    is_active       BIT                 NOT NULL DEFAULT 1,
    created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Questions_Level FOREIGN KEY (level_id) REFERENCES Levels(id) ON DELETE CASCADE,
    CONSTRAINT CK_Questions_Difficulty CHECK (difficulty BETWEEN 1 AND 5),
    CONSTRAINT CK_Questions_Type CHECK (question_type IN ('open','multiple_choice','fill_blank','matching','speaking','listening'))
);
GO

-- 1.6 QuestionOptions - Lựa chọn cho câu hỏi multiple choice
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuestionOptions')
CREATE TABLE QuestionOptions (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    question_id     INT                 NOT NULL,
    option_text     NVARCHAR(MAX)       NOT NULL,
    is_correct      BIT                 NOT NULL DEFAULT 0,
    order_index     INT                 NOT NULL DEFAULT 0,

    CONSTRAINT FK_QuestionOptions_Question FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE
);
GO


-- ============================================================
--  PHẦN 2: BẢNG NGƯỜI DÙNG (USERS)
-- ============================================================

-- 2.1 Users - Người dùng
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
CREATE TABLE Users (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    username        NVARCHAR(50)        NOT NULL UNIQUE,
    email           NVARCHAR(255)       NOT NULL UNIQUE,
    password_hash   NVARCHAR(255)       NOT NULL,
    display_name    NVARCHAR(100),
    avatar_url      NVARCHAR(500),
    role            NVARCHAR(20)        NOT NULL DEFAULT 'student',  -- 'student' | 'teacher' | 'admin'
    total_xp        INT                 NOT NULL DEFAULT 0,
    is_active       BIT                 NOT NULL DEFAULT 1,
    is_deleted      BIT                 NOT NULL DEFAULT 0,          -- Soft delete
    last_login_at   DATETIME2,
    created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT CK_Users_Role CHECK (role IN ('student', 'teacher', 'admin'))
);
GO

-- 2.2 UserLanguages - Ngôn ngữ user đang học
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserLanguages')
CREATE TABLE UserLanguages (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    user_id         INT                 NOT NULL,
    language_id     INT                 NOT NULL,
    current_level_id INT,                                       -- Level đang học
    is_primary      BIT                 NOT NULL DEFAULT 0,     -- Ngôn ngữ chính đang focus
    is_active       BIT                 NOT NULL DEFAULT 1,
    started_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_UserLang_User     FOREIGN KEY (user_id)         REFERENCES Users(id),
    CONSTRAINT FK_UserLang_Lang     FOREIGN KEY (language_id)     REFERENCES Languages(id),
    CONSTRAINT FK_UserLang_Level    FOREIGN KEY (current_level_id) REFERENCES Levels(id),
    CONSTRAINT UQ_UserLang          UNIQUE (user_id, language_id)
);
GO


-- ============================================================
--  PHẦN 3: THEO DÕI TIẾN TRÌNH (PROGRESS)
-- ============================================================

-- 3.1 UserProgress - Tiến trình từng level
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserProgress')
CREATE TABLE UserProgress (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    user_id         INT                 NOT NULL,
    level_id        INT                 NOT NULL,
    status          NVARCHAR(20)        NOT NULL DEFAULT 'not_started',  -- 'not_started' | 'in_progress' | 'completed'
    score           DECIMAL(5,2),                               -- 0.00 - 100.00
    best_score      DECIMAL(5,2),                               -- Điểm cao nhất
    attempts        INT                 NOT NULL DEFAULT 0,     -- Số lần thử
    time_spent_seconds INT              NOT NULL DEFAULT 0,     -- Tổng thời gian học
    started_at      DATETIME2,
    completed_at    DATETIME2,
    created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_UserProgress_User  FOREIGN KEY (user_id)  REFERENCES Users(id),
    CONSTRAINT FK_UserProgress_Level FOREIGN KEY (level_id) REFERENCES Levels(id),
    CONSTRAINT UQ_UserProgress       UNIQUE (user_id, level_id),
    CONSTRAINT CK_UserProgress_Status CHECK (status IN ('not_started', 'in_progress', 'completed'))
);
GO

-- 3.2 QuizAttempts - Lần làm quiz
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuizAttempts')
CREATE TABLE QuizAttempts (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    user_id         INT                 NOT NULL,
    level_id        INT                 NOT NULL,
    score           DECIMAL(5,2),
    total_questions INT                 NOT NULL DEFAULT 0,
    correct_answers INT                 NOT NULL DEFAULT 0,
    time_spent_seconds INT,
    attempted_at    DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_QuizAttempts_User  FOREIGN KEY (user_id)  REFERENCES Users(id),
    CONSTRAINT FK_QuizAttempts_Level FOREIGN KEY (level_id) REFERENCES Levels(id)
);
GO

-- 3.3 QuizAnswers - Chi tiết từng câu trả lời
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuizAnswers')
CREATE TABLE QuizAnswers (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    attempt_id      INT                 NOT NULL,
    question_id     INT                 NOT NULL,
    selected_option_id INT,                                     -- Cho multiple choice
    user_answer     NVARCHAR(MAX),                              -- Cho open/fill_blank
    is_correct      BIT,
    time_spent_seconds INT,

    CONSTRAINT FK_QuizAnswers_Attempt  FOREIGN KEY (attempt_id)  REFERENCES QuizAttempts(id) ON DELETE CASCADE,
    CONSTRAINT FK_QuizAnswers_Question FOREIGN KEY (question_id) REFERENCES Questions(id),
    CONSTRAINT FK_QuizAnswers_Option   FOREIGN KEY (selected_option_id) REFERENCES QuestionOptions(id)
);
GO


-- ============================================================
--  PHẦN 4: SPACED REPETITION (ÔN TẬP LẶP LẠI)
-- ============================================================

-- 4.1 UserReviewCards - Thẻ ôn tập (thuật toán SM-2)
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserReviewCards')
CREATE TABLE UserReviewCards (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    user_id         INT                 NOT NULL,
    question_id     INT                 NOT NULL,
    ease_factor     DECIMAL(4,2)        NOT NULL DEFAULT 2.50,  -- Hệ số dễ (SM-2)
    interval_days   INT                 NOT NULL DEFAULT 1,     -- Khoảng cách ôn (ngày)
    repetitions     INT                 NOT NULL DEFAULT 0,     -- Số lần đã ôn
    next_review_at  DATETIME2           NOT NULL,               -- Ngày ôn tiếp theo
    last_reviewed_at DATETIME2,
    created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_ReviewCards_User     FOREIGN KEY (user_id)     REFERENCES Users(id),
    CONSTRAINT FK_ReviewCards_Question FOREIGN KEY (question_id) REFERENCES Questions(id),
    CONSTRAINT UQ_ReviewCards          UNIQUE (user_id, question_id)
);
GO


-- ============================================================
--  PHẦN 5: GAMIFICATION
-- ============================================================

-- 5.1 UserStreaks - Chuỗi ngày học liên tục
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserStreaks')
CREATE TABLE UserStreaks (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    user_id         INT                 NOT NULL,
    language_id     INT                 NOT NULL,
    current_streak  INT                 NOT NULL DEFAULT 0,
    longest_streak  INT                 NOT NULL DEFAULT 0,
    last_activity_date DATE,
    updated_at      DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Streaks_User FOREIGN KEY (user_id)     REFERENCES Users(id),
    CONSTRAINT FK_Streaks_Lang FOREIGN KEY (language_id)  REFERENCES Languages(id),
    CONSTRAINT UQ_Streaks      UNIQUE (user_id, language_id)
);
GO

-- 5.2 DailyActivity - Lịch sử hoạt động hàng ngày (cho heatmap)
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DailyActivity')
CREATE TABLE DailyActivity (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    user_id         INT                 NOT NULL,
    language_id     INT                 NOT NULL,
    activity_date   DATE                NOT NULL,
    xp_earned       INT                 NOT NULL DEFAULT 0,
    minutes_spent   INT                 NOT NULL DEFAULT 0,
    levels_completed INT                NOT NULL DEFAULT 0,
    quizzes_taken   INT                 NOT NULL DEFAULT 0,

    CONSTRAINT FK_Daily_User FOREIGN KEY (user_id)    REFERENCES Users(id),
    CONSTRAINT FK_Daily_Lang FOREIGN KEY (language_id) REFERENCES Languages(id),
    CONSTRAINT UQ_Daily      UNIQUE (user_id, language_id, activity_date)
);
GO

-- 5.3 Achievements - Danh sách thành tích
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Achievements')
CREATE TABLE Achievements (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    code            NVARCHAR(50)        NOT NULL UNIQUE,       -- 'FIRST_LESSON', 'STREAK_7', ...
    name            NVARCHAR(100)       NOT NULL,
    name_vi         NVARCHAR(100),
    description     NVARCHAR(500),
    icon_emoji      NVARCHAR(10),                              -- '🏆', '🔥', '⭐'
    xp_reward       INT                 NOT NULL DEFAULT 0,
    category        NVARCHAR(30)        DEFAULT 'general',     -- 'general' | 'streak' | 'completion' | 'quiz' | 'social'
    criteria_json   NVARCHAR(MAX),                             -- JSON mô tả điều kiện
    is_active       BIT                 NOT NULL DEFAULT 1,
    created_at      DATETIME2           NOT NULL DEFAULT GETDATE()
);
GO

-- 5.4 UserAchievements - Thành tích đã đạt
-- ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserAchievements')
CREATE TABLE UserAchievements (
    id              INT IDENTITY(1,1)   PRIMARY KEY,
    user_id         INT                 NOT NULL,
    achievement_id  INT                 NOT NULL,
    earned_at       DATETIME2           NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_UserAchieve_User   FOREIGN KEY (user_id)        REFERENCES Users(id),
    CONSTRAINT FK_UserAchieve_Achiev FOREIGN KEY (achievement_id) REFERENCES Achievements(id),
    CONSTRAINT UQ_UserAchieve        UNIQUE (user_id, achievement_id)
);
GO


-- ============================================================
--  PHẦN 6: INDEXES
-- ============================================================

-- Content indexes
CREATE NONCLUSTERED INDEX IX_Stages_LanguageId     ON Stages(language_id);
CREATE NONCLUSTERED INDEX IX_Levels_StageId        ON Levels(stage_id);
CREATE NONCLUSTERED INDEX IX_Levels_LanguageId     ON Levels(language_id);
CREATE NONCLUSTERED INDEX IX_Levels_Status         ON Levels(status) WHERE status = 'active';
CREATE NONCLUSTERED INDEX IX_LevelContents_LevelId ON LevelContents(level_id);
CREATE NONCLUSTERED INDEX IX_Questions_LevelId     ON Questions(level_id);
CREATE NONCLUSTERED INDEX IX_QuestionOpts_QId      ON QuestionOptions(question_id);

-- User indexes
CREATE NONCLUSTERED INDEX IX_UserLang_UserId       ON UserLanguages(user_id);
CREATE NONCLUSTERED INDEX IX_UserProgress_UserId   ON UserProgress(user_id);
CREATE NONCLUSTERED INDEX IX_UserProgress_LevelId  ON UserProgress(level_id);
CREATE NONCLUSTERED INDEX IX_UserProgress_Status   ON UserProgress(status);
CREATE NONCLUSTERED INDEX IX_QuizAttempts_UserId   ON QuizAttempts(user_id);
CREATE NONCLUSTERED INDEX IX_QuizAttempts_LevelId  ON QuizAttempts(level_id);
CREATE NONCLUSTERED INDEX IX_QuizAnswers_AttemptId ON QuizAnswers(attempt_id);

-- Review / Gamification indexes
CREATE NONCLUSTERED INDEX IX_ReviewCards_UserId    ON UserReviewCards(user_id);
CREATE NONCLUSTERED INDEX IX_ReviewCards_NextReview ON UserReviewCards(next_review_at);
CREATE NONCLUSTERED INDEX IX_DailyActivity_User    ON DailyActivity(user_id, activity_date);
CREATE NONCLUSTERED INDEX IX_UserStreaks_UserId     ON UserStreaks(user_id);
GO


-- ============================================================
--  PHẦN 7: VIEW TƯƠNG THÍCH NGƯỢC (Legacy)
-- ============================================================

-- View này giả lập bảng LucyContents cũ để code Java cũ vẫn chạy được
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_LucyContents')
    DROP VIEW v_LucyContents;
GO

CREATE VIEW v_LucyContents AS
-- Content rows (English / Japanese)
SELECT
    lc.id,
    lang.display_code   AS language_code,
    s.name              AS stage,
    l.title             AS level_name,
    lc.content          AS sub_level,
    NULL                AS question_ai,
    NULL                AS answer
FROM LevelContents lc
JOIN Levels l       ON lc.level_id = l.id
JOIN Stages s       ON l.stage_id = s.id
JOIN Languages lang ON l.language_id = lang.id
WHERE l.status = 'active' AND lc.is_active = 1

UNION ALL

-- Q&A rows (Chinese)
SELECT
    q.id,
    lang.display_code   AS language_code,
    s.name              AS stage,
    l.title             AS level_name,
    NULL                AS sub_level,
    q.question_text     AS question_ai,
    q.answer_text       AS answer
FROM Questions q
JOIN Levels l       ON q.level_id = l.id
JOIN Stages s       ON l.stage_id = s.id
JOIN Languages lang ON l.language_id = lang.id
WHERE l.status = 'active' AND q.is_active = 1;
GO

PRINT '✅ LUCY_DB schema created successfully!';
GO
