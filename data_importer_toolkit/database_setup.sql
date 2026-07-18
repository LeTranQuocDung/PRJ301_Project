-- ==============================================================================
-- LUCY PROJECT DATABASE SETUP SCRIPT
-- ==============================================================================
-- NOTE ON EXECUTION: This script uses SQLCMD variables for security configurations.
-- In SSMS, please enable SQLCMD Mode (Query -> SQLCMD Mode) before executing.
-- Alternatively, replace the $(LUCY_DB_LOGIN_PASSWORD) occurrences manually.
-- ==============================================================================
:setvar LUCY_DB_LOGIN_PASSWORD "Lucy@123456"

-- 1. Create the Database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'LUCY_DBS')
BEGIN
    CREATE DATABASE LUCY_DBS;
END
GO

USE LUCY_DBS;
GO

-- 2. Create the SQL Login User 'lucy_admin' if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'lucy_admin')
BEGIN
    CREATE LOGIN lucy_admin WITH PASSWORD = '$(LUCY_DB_LOGIN_PASSWORD)';
END
GO

-- 3. Create the Database User and Grant Permissions
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'lucy_admin')
BEGIN
    CREATE USER lucy_admin FOR LOGIN lucy_admin;
    ALTER ROLE db_owner ADD MEMBER lucy_admin;
END
GO

-- ==============================================================================
-- TABLE CREATION
-- ==============================================================================
-- 4. Create the 'Lessons' table for storing the extracted English/Chinese/Japanese data
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Lessons]') AND type in (N'U'))
BEGIN
    CREATE TABLE Lessons (
        id INT IDENTITY(1,1) PRIMARY KEY,
        lang_code NVARCHAR(50) NOT NULL,    -- LISA (English), ZH (Chinese), JA (Japanese)
        level_num INT NOT NULL,             -- 1, 2, 3...
        title NVARCHAR(200) NOT NULL,       -- Title of the lesson
        stage NVARCHAR(50),                 -- Stage (So cap, Trung cap, Cao cap, etc.)
        vocab NVARCHAR(MAX),                -- Vocabulary content or Sub-level content
        grammar NVARCHAR(MAX)               -- Grammar or QA Answers
    );
END
GO

-- ==============================================================================
-- HOW TO USE THIS FILE:
-- 1. Open SQL Server Management Studio (SSMS)
-- 2. Connect to your SQL Server (e.g. localhost) using Windows Authentication or 'sa'
-- 3. Enable SQLCMD Mode (Query -> SQLCMD Mode) and set variables at the top of this file.
-- 4. Copy all this text and run it in a New Query window, OR run the following via CMD:
--    sqlcmd -S localhost -U sa -P <sa_password> -v LUCY_DB_LOGIN_PASSWORD="<local_password>" -i database_setup.sql
-- ==============================================================================

-- ==============================================================================
-- 5. Create the 'Users' table for Authentication
-- ==============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE Users (
        id              INT IDENTITY(1,1)   PRIMARY KEY,
        username        NVARCHAR(50)        NOT NULL UNIQUE,
        email           NVARCHAR(255)       NOT NULL UNIQUE,
        password_hash   NVARCHAR(255)       NOT NULL,
        display_name    NVARCHAR(100),
        avatar_url      NVARCHAR(500),
        role            NVARCHAR(20)        NOT NULL DEFAULT 'student',
        total_xp        INT                 NOT NULL DEFAULT 0,
        is_active       BIT                 NOT NULL DEFAULT 1,
        is_deleted      BIT                 NOT NULL DEFAULT 0,
        last_login_at   DATETIME2,
        created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2           NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ==============================================================================
-- 6. Seed Test Accounts (Admin and Student)
-- Note: Password for all demo accounts is '123456', hashed using SHA-256 + Salt.
-- WARNING: These are seeded application demo login accounts (credentials for logging
-- into the React Web Client UI) and are NOT the database credentials or logins.
-- ==============================================================================
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@lucy.edu')
BEGIN
    INSERT INTO Users (username, email, password_hash, display_name, role, total_xp, is_active, is_deleted)
    VALUES 
    ('admin', 'admin@lucy.edu', 'faudq84gGjgvjeYGqNRMtsxu49iFmicKzWBp143P/4k=', 'Admin User', 'admin', 0, 1, 0),
    ('mentor', 'mentor@lucy.edu', 'faudq84gGjgvjeYGqNRMtsxu49iFmicKzWBp143P/4k=', 'Mentor Teacher', 'teacher', 0, 1, 0),
    ('student', 'student@lucy.edu', 'faudq84gGjgvjeYGqNRMtsxu49iFmicKzWBp143P/4k=', 'Test Student', 'student', 150, 1, 0);
END
GO

-- ==============================================================================
-- 7. Create the 'UserProgress' table for tracking completed lessons
-- ==============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserProgress]') AND type in (N'U'))
BEGIN
    CREATE TABLE UserProgress (
        id              INT IDENTITY(1,1)   PRIMARY KEY,
        user_id         INT                 NOT NULL FOREIGN KEY REFERENCES Users(id),
        lang_code       NVARCHAR(50)        NOT NULL,
        level_num       INT                 NOT NULL,
        completed_at    DATETIME2           NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UC_UserProgress UNIQUE (user_id, lang_code, level_num)
    );
END
GO

-- ==============================================================================
-- 8. Normalized Platform Content Tables
-- ==============================================================================

-- Languages Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Languages]') AND type in (N'U'))
BEGIN
    CREATE TABLE Languages (
        id              INT IDENTITY(1,1)   PRIMARY KEY,
        code            NVARCHAR(50)        NOT NULL UNIQUE, -- LISA, ZH, JA
        display_code    NVARCHAR(50)        NOT NULL,        -- EN, ZH, JA
        name            NVARCHAR(100)       NOT NULL,        -- English, Chinese, Japanese
        total_levels    INT                 NOT NULL DEFAULT 0,
        is_active       BIT                 NOT NULL DEFAULT 1,
        created_at      DATETIME2           NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2           NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Stages Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stages]') AND type in (N'U'))
BEGIN
    CREATE TABLE Stages (
        id              INT IDENTITY(1,1)   PRIMARY KEY,
        language_id     INT                 NOT NULL FOREIGN KEY REFERENCES Languages(id),
        name            NVARCHAR(100)       NOT NULL,
        level_from      INT                 NOT NULL,
        level_to        INT                 NOT NULL,
        order_index     INT                 NOT NULL DEFAULT 0,
        is_active       BIT                 NOT NULL DEFAULT 1
    );
END
GO

-- LessonSegments Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LessonSegments]') AND type in (N'U'))
BEGIN
    CREATE TABLE LessonSegments (
        id              INT IDENTITY(1,1)   PRIMARY KEY,
        lesson_id       INT                 NOT NULL FOREIGN KEY REFERENCES Lessons(id),
        segment_name    NVARCHAR(100)       NOT NULL, -- Vocab, Grammar, Reading
        content         NVARCHAR(MAX)       NOT NULL,
        content_type    NVARCHAR(50)        NOT NULL DEFAULT 'text', -- text, json, html
        order_index     INT                 NOT NULL DEFAULT 0
    );
END
GO

-- Questions Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Questions]') AND type in (N'U'))
BEGIN
    CREATE TABLE Questions (
        id              INT IDENTITY(1,1)   PRIMARY KEY,
        lesson_id       INT                 NOT NULL FOREIGN KEY REFERENCES Lessons(id),
        question_text   NVARCHAR(MAX)       NOT NULL,
        answer_text     NVARCHAR(MAX)       NOT NULL,
        question_type   NVARCHAR(50)        NOT NULL DEFAULT 'MCQ', -- MCQ, FillIn
        difficulty      NVARCHAR(20)        NOT NULL DEFAULT 'Medium',
        order_index     INT                 NOT NULL DEFAULT 0,
        CONSTRAINT CK_Questions_Difficulty CHECK (difficulty IN ('Easy', 'Medium', 'Hard'))
    );
END
GO

-- ImportFiles Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ImportFiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE ImportFiles (
        id              INT IDENTITY(1,1)   PRIMARY KEY,
        file_name       NVARCHAR(255)       NOT NULL UNIQUE,
        language_code   NVARCHAR(50)        NOT NULL,
        stage_name      NVARCHAR(100)       NOT NULL,
        status          NVARCHAR(50)        NOT NULL DEFAULT 'pending',
        records_count   INT                 NULL,
        imported_at     DATETIME2           NOT NULL DEFAULT GETDATE(),
        CONSTRAINT CK_ImportFiles_Status CHECK (status IN ('success', 'error', 'processing', 'queued', 'pending'))
    );
END
GO

-- ==============================================================================
-- 9. Seed Normalized Metadata
-- ==============================================================================

-- Seed Languages
IF NOT EXISTS (SELECT * FROM Languages WHERE code = 'LISA')
BEGIN
    INSERT INTO Languages (code, display_code, name, total_levels, is_active)
    VALUES 
    ('LISA', 'EN', 'English', 3, 1),
    ('ZH', 'ZH', 'Chinese', 2, 1),
    ('JA', 'JA', 'Japanese', 3, 1);
END
GO

-- Seed Stages
IF NOT EXISTS (SELECT * FROM Stages)
BEGIN
    DECLARE @lang_en INT = (SELECT id FROM Languages WHERE code = 'LISA');
    DECLARE @lang_zh INT = (SELECT id FROM Languages WHERE code = 'ZH');
    DECLARE @lang_ja INT = (SELECT id FROM Languages WHERE code = 'JA');

    INSERT INTO Stages (language_id, name, level_from, level_to, order_index, is_active)
    VALUES 
    (@lang_en, 'Stage 1', 1, 10, 1, 1),
    (@lang_en, 'Stage 2', 11, 20, 2, 1),
    (@lang_en, 'Stage 3', 21, 30, 3, 1),
    (@lang_zh, 'Stage 1', 1, 10, 1, 1),
    (@lang_zh, 'Stage 2', 11, 20, 2, 1),
    (@lang_ja, 'Stage 1', 1, 10, 1, 1),
    (@lang_ja, 'Stage 2', 11, 20, 2, 1),
    (@lang_ja, 'Stage 3', 21, 30, 3, 1);
END
GO

-- Seed ImportFiles
IF NOT EXISTS (SELECT * FROM ImportFiles WHERE file_name = 'LISA_English_Stage1.docx')
BEGIN
    INSERT INTO ImportFiles (file_name, language_code, stage_name, status, records_count, imported_at)
    VALUES
    ('LISA_English_Stage1.docx', 'LISA', 'Stage 1', 'success', 20, '2026-07-10 12:00:00'),
    ('LISA_English_Stage2.docx', 'LISA', 'Stage 2', 'success', 25, '2026-07-11 12:00:00'),
    ('LISA_English_Stage3.docx', 'LISA', 'Stage 3', 'success', 30, '2026-07-12 12:00:00'),
    ('Chinese_Stage1_Content.docx', 'ZH', 'Stage 1', 'success', 18, '2026-07-13 12:00:00'),
    ('Chinese_Stage2_Content.docx', 'ZH', 'Stage 2', 'success', 22, '2026-07-13 14:00:00'),
    ('Japanese_Stage1_Content.docx', 'JA', 'Stage 1', 'success', 20, '2026-07-14 12:00:00'),
    ('Japanese_Stage2_Content.docx', 'JA', 'Stage 2', 'success', 24, '2026-07-14 15:00:00'),
    ('Japanese_Stage3_Content.docx', 'JA', 'Stage 3', 'success', 28, '2026-07-14 18:00:00');
END
GO



