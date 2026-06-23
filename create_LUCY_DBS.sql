CREATE DATABASE LUCY_DBS;
GO

USE LUCY_DBS;
GO

CREATE TABLE LucyContents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    language_code NVARCHAR(50),
    stage NVARCHAR(255),
    level_name NVARCHAR(255),
    sub_level NVARCHAR(255),
    question_ai NVARCHAR(MAX),
    answer NVARCHAR(MAX)
);
GO

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NULL,
    Phone VARCHAR(20) NULL,
    Role VARCHAR(50) NOT NULL, -- 'Anonymous Student', 'Teacher', 'Influencer'
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
GO
