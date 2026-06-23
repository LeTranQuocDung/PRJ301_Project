-- ============================================================
--  LUCY_DB - Migration: LucyContents cũ → Schema mới
--  Chạy SAU khi đã chạy 01_create_database.sql + 02_seed_data.sql
-- ============================================================
USE LUCY_DB;
GO

-- Kiểm tra bảng cũ có tồn tại không
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LucyContents')
BEGIN
    PRINT N'⚠️ Bảng LucyContents không tồn tại. Bỏ qua migration.';
    RETURN;
END

PRINT N'🔄 Bắt đầu migration từ LucyContents sang schema mới...';

-- ═══════════════════════════════════════════════════════════
--  STEP 1: Tạo Levels từ dữ liệu cũ
-- ═══════════════════════════════════════════════════════════

-- Helper function: xác định stage_id từ language_code + stage name
DECLARE @counter INT = 0;

-- Insert levels cho ENGLISH (LISA)
INSERT INTO Levels (stage_id, language_id, level_number, title, content_type, order_index)
SELECT DISTINCT
    CASE
        WHEN lc.stage = N'Sơ cấp'    THEN 1
        WHEN lc.stage = N'Trung cấp' THEN 2
        WHEN lc.stage = N'Cao cấp'   THEN 3
    END AS stage_id,
    1 AS language_id,  -- EN
    ROW_NUMBER() OVER (ORDER BY lc.id) AS level_number,
    lc.level_name AS title,
    'content' AS content_type,
    ROW_NUMBER() OVER (ORDER BY lc.id) AS order_index
FROM LucyContents lc
WHERE lc.language_code = N'LISA'
  AND lc.level_name IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM Levels l
      WHERE l.language_id = 1
        AND l.title = lc.level_name
  );

SET @counter = @@ROWCOUNT;
PRINT N'  → Inserted ' + CAST(@counter AS NVARCHAR) + N' English levels';

-- Insert levels cho CHINESE (ZH)
INSERT INTO Levels (stage_id, language_id, level_number, title, content_type, order_index)
SELECT DISTINCT
    CASE
        WHEN lc.stage = N'Sơ cấp'    THEN 4
        WHEN lc.stage = N'Trung cấp' THEN 5
        WHEN lc.stage = N'Cao cấp'   THEN 6
    END AS stage_id,
    2 AS language_id,  -- ZH
    ROW_NUMBER() OVER (ORDER BY MIN(lc.id)) AS level_number,
    lc.level_name AS title,
    'qa' AS content_type,
    ROW_NUMBER() OVER (ORDER BY MIN(lc.id)) AS order_index
FROM LucyContents lc
WHERE lc.language_code = N'ZH'
  AND lc.level_name IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM Levels l
      WHERE l.language_id = 2
        AND l.title = lc.level_name
  )
GROUP BY lc.level_name, lc.stage;

SET @counter = @@ROWCOUNT;
PRINT N'  → Inserted ' + CAST(@counter AS NVARCHAR) + N' Chinese levels';

-- Insert levels cho JAPANESE (JA)
INSERT INTO Levels (stage_id, language_id, level_number, title, content_type, order_index)
SELECT DISTINCT
    CASE
        WHEN lc.stage = N'Sơ cấp'    THEN 7
        WHEN lc.stage = N'Trung cấp' THEN 8
        WHEN lc.stage = N'Cao cấp'   THEN 9
    END AS stage_id,
    3 AS language_id,  -- JA
    ROW_NUMBER() OVER (ORDER BY lc.id) AS level_number,
    lc.level_name AS title,
    'content' AS content_type,
    ROW_NUMBER() OVER (ORDER BY lc.id) AS order_index
FROM LucyContents lc
WHERE lc.language_code = N'JA'
  AND lc.level_name IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM Levels l
      WHERE l.language_id = 3
        AND l.title = lc.level_name
  );

SET @counter = @@ROWCOUNT;
PRINT N'  → Inserted ' + CAST(@counter AS NVARCHAR) + N' Japanese levels';


-- ═══════════════════════════════════════════════════════════
--  STEP 2: Migrate content data
-- ═══════════════════════════════════════════════════════════

-- English + Japanese → LevelContents
INSERT INTO LevelContents (level_id, content, content_type, order_index)
SELECT
    l.id AS level_id,
    lc.sub_level AS content,
    'text' AS content_type,
    ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY lc.id) AS order_index
FROM LucyContents lc
JOIN Languages lang ON lang.display_code = lc.language_code
JOIN Levels l ON l.language_id = lang.id AND l.title = lc.level_name
WHERE lc.sub_level IS NOT NULL
  AND LEN(lc.sub_level) > 0;

SET @counter = @@ROWCOUNT;
PRINT N'  → Migrated ' + CAST(@counter AS NVARCHAR) + N' content rows (EN/JA)';

-- Chinese → Questions
INSERT INTO Questions (level_id, question_text, answer_text, question_type, order_index)
SELECT
    l.id AS level_id,
    lc.question_ai AS question_text,
    ISNULL(lc.answer, N'') AS answer_text,
    'open' AS question_type,
    ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY lc.id) AS order_index
FROM LucyContents lc
JOIN Levels l ON l.language_id = 2 AND l.title = lc.level_name
WHERE lc.language_code = N'ZH'
  AND lc.question_ai IS NOT NULL
  AND LEN(lc.question_ai) > 0;

SET @counter = @@ROWCOUNT;
PRINT N'  → Migrated ' + CAST(@counter AS NVARCHAR) + N' Q&A rows (ZH)';


-- ═══════════════════════════════════════════════════════════
--  STEP 3: Đổi tên bảng cũ (backup, không xóa)
-- ═══════════════════════════════════════════════════════════

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'LucyContents')
    AND NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LucyContents_OLD')
BEGIN
    EXEC sp_rename 'LucyContents', 'LucyContents_OLD';
    PRINT N'  → Renamed LucyContents → LucyContents_OLD (backup)';
END

PRINT N'';
PRINT N'✅ Migration hoàn tất!';
PRINT N'   - Bảng cũ được giữ lại với tên LucyContents_OLD';
PRINT N'   - Dùng view v_LucyContents nếu cần truy vấn theo format cũ';
GO
