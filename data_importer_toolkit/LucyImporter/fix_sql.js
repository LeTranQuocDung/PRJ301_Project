const fs = require('fs');
let code = fs.readFileSync('D:/PRJ301/LucyImporter/LucyImporter/LucyImporter/sql/05_insert_data.sql', 'utf8');

const warning = `-- ============================================================
-- LƯU Ý QUAN TRỌNG:
-- FILE NÀY HIỆN ĐÃ CŨ (CHỈ CÓ 11 LEVELS MẪU).
-- ĐỂ NHẬP FULL 100 LEVELS, HÃY DÙNG TOOL LucyImporter (NetBeans Java Project).
-- TOOL ĐÓ SẼ QUÉT THƯ MỤC VÀ ĐỌC FILE WORD ĐỂ NẠP VÀO SQL TỰ ĐỘNG.
-- ============================================================\n\n`;

fs.writeFileSync('D:/PRJ301/LucyImporter/LucyImporter/LucyImporter/sql/05_insert_data.sql', warning + code, 'utf8');
console.log('05_insert_data.sql warning added');
