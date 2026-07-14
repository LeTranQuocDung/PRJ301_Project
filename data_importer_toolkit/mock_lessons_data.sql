-- ==============================================================================
-- LUCY PROJECT - MOCK DATA FOR LESSONS TABLE
-- ==============================================================================
USE LUCY_DBS;
GO

-- Xóa dữ liệu cũ (nếu có) để tránh trùng lặp khi chạy nhiều lần
TRUNCATE TABLE Lessons;
GO

-- ==============================================================================
-- 1. ENGLISH LESSONS (LISA)
-- ==============================================================================
INSERT INTO Lessons (lang_code, level_num, title, stage, vocab, grammar) VALUES
('LISA', 1, N'Saying Who I Am (Tự giới thiệu)', N'Stage 1', N'Hello, Name, Nice to meet you', N'I am + [Name]'),
('LISA', 2, N'Where I''m From (Quê quán)', N'Stage 1', N'Country, Vietnam, Where, From', N'I am from + [Country]'),
('LISA', 3, N'My Family (Gia đình)', N'Stage 1', N'Father, Mother, Brother, Sister', N'This is my + [Family Member]'),
('LISA', 4, N'Numbers & Time (Số đếm & Thời gian)', N'Stage 1', N'One, Two, Three, Clock, Time', N'It is + [Number] + o''clock'),
('LISA', 5, N'Daily Routine (Sinh hoạt hàng ngày)', N'Stage 1', N'Wake up, Sleep, Eat, Work', N'I + [Verb] + every day'),
('LISA', 6, N'Food & Drinks (Đồ ăn thức uống)', N'Stage 1', N'Rice, Water, Coffee, Bread', N'I would like + [Food], please'),
('LISA', 7, N'Shopping (Mua sắm)', N'Stage 2', N'Buy, Sell, Money, Expensive, Cheap', N'How much does this cost?'),
('LISA', 8, N'Asking For Directions (Hỏi đường)', N'Stage 2', N'Left, Right, Straight, Station', N'Could you tell me how to get to...'),
('LISA', 9, N'At The Hotel (Ở Khách sạn)', N'Stage 2', N'Room, Bed, Booking, Check-in', N'I have a reservation under [Name]'),
('LISA', 10, N'Health & Body (Sức khỏe)', N'Stage 2', N'Head, Hand, Pain, Sick, Doctor', N'I have a + [Symptom]'),
('LISA', 11, N'Weather & Seasons (Thời tiết)', N'Stage 2', N'Rain, Sun, Summer, Winter', N'It is + [Adjective] + today'),
('LISA', 12, N'Hobbies & Interests (Sở thích)', N'Stage 2', N'Book, Music, Sports, Movie', N'I enjoy + [V-ing]'),
('LISA', 13, N'Travel & Vacations (Du lịch)', N'Stage 3', N'Flight, Ticket, Passport, Airport', N'I am traveling to + [Place]'),
('LISA', 14, N'Job & Career (Công việc)', N'Stage 3', N'Office, Boss, Salary, Interview', N'I work as a + [Job Title]');

-- ==============================================================================
-- 2. CHINESE LESSONS (ZH)
-- ==============================================================================
INSERT INTO Lessons (lang_code, level_num, title, stage, vocab, grammar) VALUES
('ZH', 1, N'介绍 (Tự giới thiệu)', N'Stage 1', N'你好 (nǐ hǎo), 谢谢 (xiè xiè), 再见 (zài jiàn)', N'我叫 (Wǒ jiào) + [Name]'),
('ZH', 2, N'家庭 (Gia đình)', N'Stage 1', N'爸爸 (bà ba), 妈妈 (mā ma), 哥哥 (gē ge)', N'我家有 (Wǒ jiā yǒu) + [Number] + 口人'),
('ZH', 3, N'数字和时间 (Số đếm & Thời gian)', N'Stage 1', N'一 (yī), 二 (èr), 三 (sān), 时间 (shí jiān)', N'现在 (Xiàn zài) + [Number] + 点'),
('ZH', 4, N'日常生活 (Sinh hoạt)', N'Stage 1', N'起床 (qǐ chuáng), 睡觉 (shuì jiào)', N'我每天 (Wǒ měi tiān) + [Time] + [Action]'),
('ZH', 5, N'饮食 (Ăn uống)', N'Stage 1', N'米饭 (mǐ fàn), 面条 (miàn tiáo), 水 (shuǐ)', N'我想吃 (Wǒ xiǎng chī) + [Food]'),
('ZH', 6, N'购物 (Mua sắm)', N'Stage 2', N'多少钱 (duō shǎo qián), 便宜 (pián yi)', N'这个多少钱? (Zhè ge duō shǎo qián?)'),
('ZH', 7, N'交通 (Giao thông)', N'Stage 2', N'公交 (gōng jiāo), 坐 (zuò), 去 (qù)', N'我坐 (Wǒ zuò) + [Transport] + 去 (qù) + [Place]'),
('ZH', 8, N'住宿 (Chỗ ở)', N'Stage 2', N'房间 (fáng jiān), 住 (zhù), 哪里 (nǎ lǐ)', N'我住在 (Wǒ zhù zài) + [Place]'),
('ZH', 9, N'身体健康 (Sức khỏe)', N'Stage 2', N'头 (tóu), 手 (shǒu), 病 (bìng)', N'我感冒了 (Wǒ gǎn mào le)'),
('ZH', 10, N'天气 (Thời tiết)', N'Stage 3', N'下雨 (xià yǔ), 晴天 (qíng tiān), 冷 (lěng)', N'今天天气 (Jīn tiān tiān qì) + [Adjective]');

-- ==============================================================================
-- 3. JAPANESE LESSONS (JA)
-- ==============================================================================
INSERT INTO Lessons (lang_code, level_num, title, stage, vocab, grammar) VALUES
('JA', 1, N'自己紹介 (Tự giới thiệu)', N'Stage 1', N'私 (watashi), 名前 (namae)', N'私は [Name] です (Watashi wa [Name] desu)'),
('JA', 2, N'家族 (Gia đình)', N'Stage 1', N'父 (chichi), 母 (haha), 兄 (ani)', N'これは私の [Family] です (Kore wa watashi no [Family] desu)'),
('JA', 3, N'数字と時間 (Số đếm & Thời gian)', N'Stage 1', N'一 (ichi), 二 (ni), 時 (ji)', N'[Number] 時です ([Number]-ji desu)'),
('JA', 4, N'毎日の生活 (Sinh hoạt)', N'Stage 1', N'起きる (okiru), 寝る (neru), 食べる (taberu)', N'私は毎日 [Time] に [Action] ます'),
('JA', 5, N'食べ物と飲み物 (Đồ ăn)', N'Stage 1', N'ご飯 (gohan), 水 (mizu), 飲む (nomu)', N'[Food] を食べたいです ([Food] o tabetai desu)'),
('JA', 6, N'買い物 (Mua sắm)', N'Stage 2', N'買う (kau), お金 (okane), 安い (yasui)', N'これはいくらですか？ (Kore wa ikura desu ka?)'),
('JA', 7, N'道を聞く (Hỏi đường)', N'Stage 2', N'右 (migi), 左 (hidari), 駅 (eki)', N'[Place] はどこですか？ ([Place] wa doko desu ka?)'),
('JA', 8, N'ホテルで (Khách sạn)', N'Stage 2', N'部屋 (heya), 予約 (yoyaku)', N'予約しています (Yoyaku shite imasu)'),
('JA', 9, N'体と健康 (Sức khỏe)', N'Stage 3', N'頭 (atama), 手 (te), 病気 (byouki)', N'[Body part] が痛いです ([Body part] ga itai desu)'),
('JA', 10, N'天気と季節 (Thời tiết)', N'Stage 3', N'雨 (ame), 晴れ (hare), 寒い (samui)', N'今日は [Weather] です (Kyou wa [Weather] desu)');

PRINT N'✅ Đã insert thành công dữ liệu Mock cho bảng Lessons!';
GO
