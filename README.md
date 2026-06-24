# LUCY E-Learning Platform

Dá»± Ã¡n LUCY lÃ  ná»n táº£ng há»c ngoáº¡i ngá»¯ trá»±c tuyáº¿n (Tiáº¿ng Anh, Tiáº¿ng Trung, Tiáº¿ng Nháº­t) dÃ nh cho há»c viÃªn vÃ  giáº£ng viÃªn, bao gá»“m cÃ¡c tÃ­nh nÄƒng há»c qua Video, Live Room (Agora RTC), vÃ  Thi tráº¯c nghiá»‡m.

## ðŸ›  HÆ°á»›ng dáº«n cÃ i Ä‘áº·t cho ngÆ°á»i má»›i (Setup Guide)

Náº¿u báº¡n vá»«a táº£i (clone) source code nÃ y vá» mÃ¡y, hÃ£y lÃ m theo cÃ¡c bÆ°á»›c dÆ°á»›i Ä‘Ã¢y Ä‘á»ƒ váº­n hÃ nh há»‡ thá»‘ng.

### BÆ°á»›c 1: CÃ i Ä‘áº·t CÆ¡ sá»Ÿ dá»¯ liá»‡u (SQL Server)

Há»‡ thá»‘ng hiá»‡n táº¡i Ä‘ang váº­n hÃ nh trÃªn cáº¥u trÃºc Database V1 (`LUCY_DBS`). Báº¡n cáº§n cháº¡y cÃ¡c file SQL sau Ä‘á»ƒ khá»Ÿi táº¡o:

1. Má»Ÿ **SQL Server Management Studio (SSMS)** vÃ  káº¿t ná»‘i vÃ o Database Engine cá»§a báº¡n.
2. Má»Ÿ vÃ  cháº¡y (Execute - F5) file `data_importer_toolkit/database_setup.sql`. File nÃ y sáº½ khá»Ÿi táº¡o Database `LUCY_DBS` vÃ  báº£ng `Lessons` Ä‘á»ƒ chá»©a ná»™i dung bÃ i giáº£ng.
3. Má»Ÿ vÃ  cháº¡y file `create_LUCY_DBS.sql` (náº±m á»Ÿ thÆ° má»¥c gá»‘c). File nÃ y sáº½ táº¡o báº£ng `Users` vÃ  tá»± Ä‘á»™ng bÆ¡m 2 tÃ i khoáº£n Test vÃ o há»‡ thá»‘ng.

**ðŸ”‘ TÃ i khoáº£n Test máº·c Ä‘á»‹nh (ÄÃ£ mÃ£ hÃ³a SHA-256):**
- **Admin:** Username: `admin` | Email: `admin@lucy.edu` | Pass: `123456`
- **Há»c viÃªn:** Username: `student` | Email: `student@lucy.edu` | Pass: `123456`

*(LÆ°u Ã½: 5 file SQL náº±m trong thÆ° má»¥c `data_importer_toolkit/LucyImporter/sql/` lÃ  cáº¥u trÃºc Database V2 (`LUCY_DB`) siÃªu chi tiáº¿t dÃ nh cho tÆ°Æ¡ng lai. Hiá»‡n táº¡i Backend chÆ°a Migrate sang cáº¥u trÃºc V2 nÃ y nÃªn báº¡n khÃ´ng cáº§n cháº¡y chÃºng).*

---

### BÆ°á»›c 2: CÃ i Ä‘áº·t Backend (Java Tomcat & Maven)

Backend sá»­ dá»¥ng Java Servlet, káº¿t ná»‘i tá»›i SQL thÃ´ng qua JDBC.

1. **Báº­t TCP/IP trong SQL Server:**
   - Má»Ÿ `SQL Server Configuration Manager`.
   - Chá»n `SQL Server Network Configuration` > `Protocols for MSSQLSERVER`.
   - Báº­t `TCP/IP` (Enable) vÃ  Ä‘áº£m báº£o cá»•ng máº·c Ä‘á»‹nh lÃ  `1433`. Restart láº¡i dá»‹ch vá»¥ SQL Server.

2. **Cáº¥u hÃ¬nh káº¿t ná»‘i DB:**
   - Má»Ÿ file: `LucyBackendAPI/src/main/java/com/lucy/util/DBConnection.java`
   - Äáº£m báº£o cáº¥u hÃ¬nh Username vÃ  Password trong code trÃ¹ng khá»›p vá»›i tÃ i khoáº£n `sa` trÃªn mÃ¡y cá»§a báº¡n. Máº·c Ä‘á»‹nh lÃ :
     - user: `sa`
     - password: `123456` *(Sá»­a láº¡i náº¿u mÃ¡y báº¡n dÃ¹ng pass khÃ¡c)*
     - databaseName: `LUCY_DBS`

3. **Build & Deploy:**
   - DÃ¹ng IDE (Eclipse/NetBeans/IntelliJ) má»Ÿ thÆ° má»¥c `LucyBackendAPI`.
   - Cháº¡y `mvn clean package` Ä‘á»ƒ táº¡o file `.war`.
   - Deploy file `.war` lÃªn Server **Apache Tomcat 10+** (Ä‘áº£m báº£o Tomcat cháº¡y á»Ÿ port 8080).
   - API sáº½ cháº¡y táº¡i: `http://localhost:8080/LucyBackendAPI/api/users/...`

---

### BÆ°á»›c 3: CÃ i Ä‘áº·t Frontend (React + Vite)

Frontend Ä‘Æ°á»£c build báº±ng ReactJS vÃ  Vite.

1. Äáº£m báº£o mÃ¡y Ä‘Ã£ cÃ i Ä‘áº·t **Node.js** (PhiÃªn báº£n 18+).
2. Tá»›i thÆ° má»¥c gá»‘c cá»§a project (nÆ¡i chá»©a file `package.json`).
3. Khá»Ÿi Ä‘á»™ng nhanh báº±ng cÃ¡ch:
   - **Click Ä‘Ãºp chuá»™t vÃ o file `start_web.bat`** (File nÃ y sáº½ tá»± Ä‘á»™ng cÃ i Ä‘áº·t thÆ° viá»‡n vÃ  má»Ÿ server).
   - HOáº¶C má»Ÿ Terminal cháº¡y thá»§ cÃ´ng 2 lá»‡nh: `npm install` vÃ  `npm run dev`.
4. Má»Ÿ trÃ¬nh duyá»‡t vÃ  truy cáº­p vÃ o Ä‘Æ°á»ng link hiá»ƒn thá»‹ (thÆ°á»ng lÃ  `http://localhost:5173`).

---

### ðŸŒŸ LÆ°u Ã½
- **Giao diá»‡n:** á»¨ng dá»¥ng há»— trá»£ Dark Theme tá»± Ä‘á»™ng Ä‘á»“ng bá»™ trÃªn cáº£ Admin vÃ  Student.
- **TÃ­nh nÄƒng Live Room:** YÃªu cáº§u káº¿t ná»‘i Internet Ä‘á»ƒ SDK Agora RTC hoáº¡t Ä‘á»™ng.
