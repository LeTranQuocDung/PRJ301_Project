-- ============================================================
-- This sample SQL file is legacy and only contains 11 demo levels.
-- For the full 100-level import, run the Java LucyImporter tool.
-- ============================================================

-- ============================================================
-- LUCY_DB - FULL DATA CHO 11 LEVELS ĐẦU TIÊN (EN, ZH, JA)
-- ============================================================
USE LUCY_DB;
GO

PRINT N'Bắt đầu Insert dữ liệu...';

DECLARE @lv INT;
DECLARE @q INT;

-- ═══════════════════════════════════════════════════════════
-- 🇬🇧 ENGLISH (LISA) - 11 Levels (stage_id = 1, language_id = 1)
-- ═══════════════════════════════════════════════════════════

-- LEVEL 1: SAYING WHO I AM
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 1, N'SAYING WHO I AM', N'Tự giới thiệu', 'content', 1);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Hello - Xin chào
2. Name - Tên
3. Nice to meet you - Rất vui được gặp bạn', 'vocabulary', 1),
(@lv, N'Grammar', N'I am + [Tên]: I am Lucy.', 'grammar', 2);
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index)
VALUES (@lv, N'What does "Nice to meet you" mean?', N'Rất vui được gặp bạn', N'Câu chào phổ biến', 'multiple_choice', 1, 1);
SET @q = SCOPE_IDENTITY();
INSERT INTO QuestionOptions (question_id, option_text, is_correct, order_index) VALUES
(@q, N'Rất vui được gặp bạn', 1, 1), (@q, N'Tạm biệt', 0, 2), (@q, N'Xin lỗi', 0, 3);

-- LEVEL 2: WHERE I'M FROM
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 2, N'WHERE I''M FROM', N'Quê quán', 'content', 2);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Country - Quốc gia
2. Vietnam - Việt Nam
3. Where - Ở đâu', 'vocabulary', 1),
(@lv, N'Grammar', N'I am from + [Quốc gia]: I am from Vietnam.', 'grammar', 2);
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index)
VALUES (@lv, N'I am _____ Vietnam.', N'from', N'Dùng giới từ from để chỉ xuất xứ', 'fill_blank', 1, 1);

-- LEVEL 3: MY FAMILY
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 3, N'MY FAMILY', N'Gia đình', 'content', 3);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Father - Bố
2. Mother - Mẹ
3. Brother - Anh/em trai', 'vocabulary', 1);

-- LEVEL 4: NUMBERS & TIME
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 4, N'NUMBERS & TIME', N'Số & Thời gian', 'content', 4);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. One - Một
2. Time - Thời gian
3. Clock - Đồng hồ', 'vocabulary', 1);

-- LEVEL 5: DAILY ROUTINE
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 5, N'DAILY ROUTINE', N'Sinh hoạt', 'content', 5);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Wake up - Thức dậy
2. Sleep - Ngủ', 'vocabulary', 1);

-- LEVEL 6: FOOD & DRINKS
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 6, N'FOOD & DRINKS', N'Đồ ăn', 'content', 6);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Rice - Cơm
2. Water - Nước', 'vocabulary', 1);

-- LEVEL 7: SHOPPING
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 7, N'SHOPPING', N'Mua sắm', 'content', 7);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Buy - Mua
2. Money - Tiền', 'vocabulary', 1);

-- LEVEL 8: ASKING FOR DIRECTIONS
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 8, N'ASKING FOR DIRECTIONS', N'Hỏi đường', 'content', 8);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Left - Trái
2. Right - Phải', 'vocabulary', 1);

-- LEVEL 9: AT THE HOTEL
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 9, N'AT THE HOTEL', N'Khách sạn', 'content', 9);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Room - Phòng
2. Bed - Giường', 'vocabulary', 1);

-- LEVEL 10: HEALTH & BODY
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 10, N'HEALTH & BODY', N'Sức khỏe', 'content', 10);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Head - Đầu
2. Hand - Tay', 'vocabulary', 1);

-- LEVEL 11: WEATHER & SEASONS
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (1, 1, 11, N'WEATHER & SEASONS', N'Thời tiết', 'content', 11);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. Rain - Mưa
2. Sun - Nắng', 'vocabulary', 1);


-- ═══════════════════════════════════════════════════════════
-- 🇨🇳 CHINESE (ZH) - 11 Levels (stage_id = 4, language_id = 2)
-- ═══════════════════════════════════════════════════════════
-- LEVEL 1: 介绍 (Giới thiệu)
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 1, N'介绍', N'Giới thiệu', 'qa', 1);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 你叫什么名字？(Nǐ jiào shénme míngzì?)', N'👉 我叫小明。(Wǒ jiào Xiǎomíng.)', N'Hỏi tên', 'open', 1, 1),
(@lv, N'Q: 你是哪国人？(Nǐ shì nǎ guórén?)', N'👉 我是越南人。(Wǒ shì Yuènán rén.)', N'Hỏi quốc tịch', 'open', 1, 2);

-- LEVEL 2: 家庭
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 2, N'家庭', N'Gia đình', 'qa', 2);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 你家有几口人？', N'👉 我家有四口人。', N'Hỏi số người', 'open', 1, 1);

-- LEVEL 3: 数字和时间
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 3, N'数字和时间', N'Số và Thời gian', 'qa', 3);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 现在几点？', N'👉 现在八点。', N'Hỏi giờ', 'open', 1, 1);

-- LEVEL 4: 日常生活
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 4, N'日常生活', N'Sinh hoạt', 'qa', 4);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 你每天几点起床？', N'👉 我六点起床。', N'Hỏi thức dậy', 'open', 1, 1);

-- LEVEL 5: 饮食
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 5, N'饮食', N'Ăn uống', 'qa', 5);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 你想吃什么？', N'👉 我想吃米饭。', N'Hỏi ăn gì', 'open', 1, 1);

-- LEVEL 6: 购物
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 6, N'购物', N'Mua sắm', 'qa', 6);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 这个多少钱？', N'👉 这个十块钱。', N'Hỏi giá', 'open', 1, 1);

-- LEVEL 7: 交通
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 7, N'交通', N'Giao thông', 'qa', 7);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 你怎么去学校？', N'👉 我坐公交车去。', N'Hỏi đi lại', 'open', 1, 1);

-- LEVEL 8: 住宿
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 8, N'住宿', N'Chỗ ở', 'qa', 8);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 你住在哪儿？', N'👉 我住在北京。', N'Hỏi nơi ở', 'open', 1, 1);

-- LEVEL 9: 身体健康
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 9, N'身体健康', N'Sức khỏe', 'qa', 9);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 你怎么了？', N'👉 我感冒了。', N'Hỏi bệnh', 'open', 1, 1);

-- LEVEL 10: 天气
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 10, N'天气', N'Thời tiết', 'qa', 10);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 今天天气怎么样？', N'👉 今天下雨。', N'Hỏi thời tiết', 'open', 1, 1);

-- LEVEL 11: 爱好
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (4, 2, 11, N'爱好', N'Sở thích', 'qa', 11);
SET @lv = SCOPE_IDENTITY();
INSERT INTO Questions (level_id, question_text, answer_text, explanation, question_type, difficulty, order_index) VALUES 
(@lv, N'Q: 你的爱好是什么？', N'👉 我喜欢看书。', N'Hỏi sở thích', 'open', 1, 1);


-- ═══════════════════════════════════════════════════════════
-- 🇯🇵 JAPANESE (JA) - 11 Levels (stage_id = 7, language_id = 3)
-- ═══════════════════════════════════════════════════════════
-- LEVEL 1: 自己紹介
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 1, N'自己紹介', N'Tự giới thiệu', 'content', 1);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. わたし (Watashi) - Tôi
2. なまえ (Namae) - Tên', 'vocabulary', 1);

-- LEVEL 2: 家族
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 2, N'家族', N'Gia đình', 'content', 2);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. ちち (Chichi) - Bố
2. はは (Haha) - Mẹ', 'vocabulary', 1);

-- LEVEL 3: 数字と時間
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 3, N'数字と時間', N'Số & Thời gian', 'content', 3);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. いち (Ichi) - 1
2. じ (Ji) - Giờ', 'vocabulary', 1);

-- LEVEL 4: 毎日の生活
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 4, N'毎日の生活', N'Sinh hoạt', 'content', 4);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. おきる (Okiru) - Thức dậy
2. ねる (Neru) - Ngủ', 'vocabulary', 1);

-- LEVEL 5: 食べ物と飲み物
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 5, N'食べ物と飲み物', N'Đồ ăn', 'content', 5);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. たべる (Taberu) - Ăn
2. のむ (Nomu) - Uống', 'vocabulary', 1);

-- LEVEL 6: 買い物
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 6, N'買い物', N'Mua sắm', 'content', 6);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. かう (Kau) - Mua
2. おかね (Okane) - Tiền', 'vocabulary', 1);

-- LEVEL 7: 道を聞く
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 7, N'道を聞く', N'Hỏi đường', 'content', 7);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. みぎ (Migi) - Phải
2. ひだり (Hidari) - Trái', 'vocabulary', 1);

-- LEVEL 8: ホテルで
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 8, N'ホテルで', N'Khách sạn', 'content', 8);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. へや (Heya) - Phòng
2. ベッド (Beddo) - Giường', 'vocabulary', 1);

-- LEVEL 9: 体と健康
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 9, N'体と健康', N'Sức khỏe', 'content', 9);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. あたま (Atama) - Đầu
2. て (Te) - Tay', 'vocabulary', 1);

-- LEVEL 10: 天気と季節
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 10, N'天気と季節', N'Thời tiết', 'content', 10);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. あめ (Ame) - Mưa
2. はれ (Hare) - Nắng', 'vocabulary', 1);

-- LEVEL 11: 趣味
INSERT INTO Levels (stage_id, language_id, level_number, title, title_vi, content_type, order_index)
VALUES (7, 3, 11, N'趣味', N'Sở thích', 'content', 11);
SET @lv = SCOPE_IDENTITY();
INSERT INTO LevelContents (level_id, sub_level_name, content, content_type, order_index) VALUES 
(@lv, N'Vocabulary', N'1. ほん (Hon) - Sách
2. おんがく (Ongaku) - Am nhac', 'vocabulary', 1);

PRINT N'Hoàn thành Insert dữ liệu!';
GO
