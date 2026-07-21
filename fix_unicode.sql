-- Fix display names using NCHAR to bypass terminal encoding issues
-- Quản trị viên = Q u a(breve:NCHAR(0x1EA3)) n   t r i(dot:NCHAR(0x1ECB))   v i e(circ:NCHAR(0x00EA)) n
-- Giảng viên Mentor = G i a(hook:NCHAR(0x1EA3)) n g   v i e(circ:NCHAR(0x00EA)) n   M e n t o r
-- Học viên Test = H o(hook:NCHAR(0x1ECd)) c   v i e(circ:NCHAR(0x00EA)) n   T e s t

-- Admin: Quản trị viên
UPDATE Users SET display_name = N'Qu' + NCHAR(0x1EA3) + N'n tr' + NCHAR(0x1ECB) + N' vi' + NCHAR(0x00EA) + N'n' WHERE id = 1;

-- Mentor: Giảng viên Mentor  
UPDATE Users SET display_name = N'Gi' + NCHAR(0x1EA3) + N'ng vi' + NCHAR(0x00EA) + N'n Mentor' WHERE id = 2;

-- Student: Học viên Test
UPDATE Users SET display_name = N'H' + NCHAR(0x1ECd) + N'c vi' + NCHAR(0x00EA) + N'n Test' WHERE id = 3;

-- Verify
SELECT id, display_name, email, role FROM Users WHERE id IN (1,2,3);
