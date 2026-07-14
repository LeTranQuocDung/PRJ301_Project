-- ==============================================================================
-- LUCY PROJECT DATABASE SETUP SCRIPT
-- ==============================================================================
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
    CREATE LOGIN lucy_admin WITH PASSWORD = '123456';
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
        stage NVARCHAR(50),                 -- Stage (SÆ¡ cáº¥p, Trung cáº¥p, etc.)
        vocab NVARCHAR(MAX),                -- Vocabulary content or Sub-level content
        grammar NVARCHAR(MAX)               -- Grammar or QA Answers
    );
END
GO

-- ==============================================================================
-- HOW TO USE THIS FILE:
-- 1. Open SQL Server Management Studio (SSMS)
-- 2. Connect to your SQL Server (e.g. localhost) using Windows Authentication or 'sa'
-- 3. Copy all this text and run it in a New Query window, OR run the following via CMD:
--    sqlcmd -S localhost -U sa -P 123456 -i database_setup.sql
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
-- Note: Password for both is '123456', hashed using SHA-256 + Salt
-- ==============================================================================
IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@lucy.edu')
BEGIN
    INSERT INTO Users (username, email, password_hash, display_name, role, total_xp, is_active, is_deleted)
    VALUES 
    ('admin', 'admin@lucy.edu', 'faudq84gGjgvjeYGqNRMtsxu49iFmicKzWBp143P/4k=', 'Quản trị viên', 'admin', 0, 1, 0),
    ('mentor', 'mentor@lucy.edu', 'faudq84gGjgvjeYGqNRMtsxu49iFmicKzWBp143P/4k=', 'Giảng viên Mentor', 'mentor', 0, 1, 0),
    ('student', 'student@lucy.edu', 'faudq84gGjgvjeYGqNRMtsxu49iFmicKzWBp143P/4k=', 'Học viên Test', 'student', 150, 1, 0);
END
GO

