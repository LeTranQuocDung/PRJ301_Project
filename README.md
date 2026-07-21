# LUCY - Language Unity & Collaborative Youth

LUCY is a modern voice-based social platform combined with EdTech features, designed to help students learn foreign languages (English, Chinese, Japanese) anonymously in live audio rooms.

---

### Documentation Links
* **[Project Report](PROJECT_REPORT.md)**: Detailed report mapping requirements, database schema design, system architecture, security, and week 1-10 roadmap.
* **[Demo Script & Presentation Guide](DEMO_SCRIPT.md)**: Setup commands, step-by-step presentation scenario scripts (Admin/Teacher/Student), and Q&A talking points.
* **[Requirement Traceability Matrix](docs/REQUIREMENT_TRACEABILITY_MATRIX.md)**: Maps academic and product specification requirements to implementation evidence.

---

## 1. Environment Variables and System Properties

LUCY uses the following environment variables (configured via `.env` or system environment):

### Database Configuration (DBConnection)
* `LUCY_DB_URL`: JDBC Connection URL for SQL Server (default: `jdbc:sqlserver://localhost;instanceName=SQLEXPRESS;databaseName=LUCY_DBS;encrypt=false;trustServerCertificate=true;`)
* `LUCY_DB_USER`: Database login username (default: `lucy_admin`)
* `LUCY_DB_PASSWORD`: Database login password. This must be configured locally in your environment or .env file before execution.

### CORS Configuration (CorsUtil)
* `LUCY_ALLOWED_ORIGIN`: Allowed client origin for CORS requests (default: `http://localhost:5173`)

### Frontend React App Configuration
* `VITE_LUCY_API_BASE`: Base URL path of the Tomcat Java Backend API (default: `http://localhost:8080/LucyBackendAPI`)
* `VITE_AGORA_TOKEN_BASE`: Base URL path of the Agora Token Server (default: `http://localhost:3000`)

### Agora Token Server
* `APP_ID`: Agora App ID (required)
* `APP_CERTIFICATE`: Agora App Certificate (required)
* `CLIENT_ORIGIN`: Allowed client origin for Agora Token Server CORS requests (default: `http://localhost:5173`)

---

## 2. Setup Instructions

### Database Setup
1. Open SQL Server Management Studio (SSMS).
2. Connect using Windows Authentication or `sa` account.
3. Run the script `data_importer_toolkit/database_setup.sql` to initialize database `LUCY_DBS`, login `lucy_admin`, and basic tables.
4. Import the language data:
   * Navigate to `data_importer_toolkit/LucyImporter` and package the tool:
     ```bash
     mvn clean package -DskipTests
     ```
   * Execute the importer:
     ```bash
     java -jar target/LucyImporter-1.0-SNAPSHOT-jar-with-dependencies.jar
     ```
      This automatically imports the 100 language levels into the SQL database.

#### Normalized Database Schema
The database contains 8 normalized tables with foreign key constraints and indexes:
* `Users`: Authentication and student/admin profiles (role, total_xp).
* `UserProgress`: Tracks completed lessons per user transaction-safely.
* `Lessons`: Core table storing raw language levels (vocab, grammar) for backward compatibility.
* `Languages`: Core metadata representing available languages (code, name, total_levels).
* `Stages`: Groups levels into educational stages (Stage 1-3) associated with a language.
* `LessonSegments`: Holds granular lesson components (e.g., Vocabulary, Grammar).
* `Questions`: Database of MCQ practice questions mapped to lessons.
* `ImportFiles`: Audit trail and state machine tracking imported curriculum DOCX files.

### Java Backend API Setup
1. Navigate to the `LucyBackendAPI` directory.
2. Package the war file using Maven:
     ```bash
     mvn clean package -DskipTests
     ```
3. Deploy the resulting `LucyBackendAPI.war` file to your Apache Tomcat (Webapps folder).
4. Run Tomcat. The API will listen on `http://localhost:8080/LucyBackendAPI`.

### Agora Token Server Setup
1. Navigate to the `AgoraTokenServer` directory.
2. Create a `.env` file from the provided `.env.example`:
     ```env
     APP_ID=your_agora_app_id
     APP_CERTIFICATE=your_agora_app_certificate
     CLIENT_ORIGIN=http://localhost:5173
     PORT=3000
     ```
3. Install dependencies and run the server:
     ```bash
     npm install
     npm start
     ```

### Frontend React App Setup
1. Navigate to the root directory.
2. Install dependencies:
     ```bash
     npm install
     ```
3. Run the development server:
     ```bash
     npm run dev
     ```
4. Access the frontend app at `http://localhost:5173`.

### Performance Stress Check Tool
1. Run the local concurrent stress testing script to verify backend endpoints latency under load:
   ```bash
   # Set API Base optionally, then execute
   node scripts/stress-check.js
   ```
2. The script will output concurrency rate, request counts, success/failure rates, and average response times.

### .NET User & Payment Service Setup
1. Navigate to the `services/Lucy.UserPaymentService` directory.
2. Build the project:
   ```bash
   dotnet build
   ```
3. Run the microservice:
   ```bash
   dotnet run
   ```

### Flutter Mobile Shell Setup
1. Navigate to the `mobile/lucy_flutter_shell` directory.
2. Run analysis to check code health:
   ```bash
   flutter analyze
   ```
3. Run the app:
   ```bash
   flutter run
   ```

---

## 3. Core API Endpoints

### Authentication (/api/users)
* `POST /api/users/register`: Register new user. JSON Body: `{ username, email, password, avatarUrl, role }`.
* `POST /api/users/login`: Log in user. JSON Body: `{ email, password }`.
* `POST /api/users/change-password`: Change user password. JSON Body: `{ userId, email, oldPassword, newPassword }`.

### Learning Progress APIs (/api/progress)
* `GET /api/progress?userId=...`: Retrieve total XP and list of completed lessons.
* `POST /api/progress/complete`: Log a completed lesson and add XP.
* `POST /api/progress/redeem`: Deduct XP or adjust balance for redeeming rewards. JSON Body: `{ userId, xpDelta, reason }`.

### AI Generator API
* `POST /api/ai/generate-questions`: Generate language practice questions deterministically. JSON Body: `{ prompt, level, count }`.

### Engagement APIs (/api/engagement)
* `GET /api/engagement/podcasts`: Retrieve list of voice podcasts for English/Chinese/Japanese.
* `GET /api/engagement/premium`: Retrieve list of premium courses and features.
* `GET /api/engagement/gifts`: Retrieve list of exchangeable rewards and gifts.

### Teacher Workspace APIs (/api/teacher)
* `GET /api/teacher/classrooms`: Retrieve classroom and student lists for teacher dashboard.
* `GET /api/teacher/materials`: Retrieve subjects and lessons teaching materials for teacher dashboard.

### Wallet & Payments APIs (/api/wallet)
* `GET /api/wallet/balance?userId=...`: Retrieve current balance for a user.
* `POST /api/wallet/topup`: Sandbox wallet top up simulation. JSON Body: `{ userId, amount, method }`.
* `POST /api/wallet/send-gift`: Transfer wallet funds to mentor. JSON Body: `{ fromUserId, toMentorId, giftCode, amount }`.

### Podcast & Room Recording APIs (/api/podcasts)
* `GET /api/podcasts/recordings`: Retrieve recorded podcast sessions.
* `POST /api/podcasts/record/start`: Start live room recording. JSON Body: `{ roomId, creatorId, title }`.
* `POST /api/podcasts/record/stop`: Stop room recording. JSON Body: `{ sessionId }`.

---

## 4. Security Implementation Notes

1. ** Centralized CORS Management**: All servlets utilize `com.lucy.util.CorsUtil` to dynamically allow origins configured via `LUCY_ALLOWED_ORIGIN` (defaulting to `http://localhost:5173`), avoiding wildcard `*` vulnerabilities.
2. **PBKDF2 Password Hashing**: Passwords are saved and verified using `PBKDF2WithHmacSHA256` (65536 iterations, 16-byte random salt). It maintains backward compatibility with legacy SHA-256 hashed accounts.
3. **Role Validation (Admin Guard)**: Admin and teacher APIs require headers `X-LUCY-ROLE=admin` (or `teacher`/`mentor`) to authorize actions.
4. **Credential Safety**: No API keys or passwords are hardcoded in the source code; they must be supplied via environment variables or system properties.

---

## 5. Unified Verification Script

You can verify the entire multi-language platform syntax, builds, and dependencies in one single command. Run this from the root directory:
```bash
npm run verify:all
```
This runs the following checks sequentially:
* Frontend package dependencies audit and Vite bundle build.
* Node.js syntax and `AgoraTokenServer` scripts check.
* Concurrent multi-role scenario check for Learner, Mentor/Teacher, Admin/System, Payment Service, and Agora Token roles.
* AI Agent Layer Schema & API Integration Evaluation (`npm run verify:agents`).
* Java Maven packages build for `LucyBackendAPI` and `LucyImporter`.
* .NET Payment service build (`Lucy.UserPaymentService.csproj`).
* Flutter mobile application project code analysis (`lucy_flutter_shell`).

Run the AI Agent layer evaluation independently:
```bash
npm run verify:agents
```

Run the multi-role check independently when you want to validate role behavior without running the full build suite:
```bash
npm run verify:roles
```
The role check uses isolated session headers per role, runs scenarios concurrently, marks offline optional services as `SKIP`, and fails only when a reachable service returns bad status or invalid JSON.

---

## 6. Roadmap Implementation Status

* [x] Java 17 compatibility build.
* [x] Dynamic database connection via environment variables.
* [x] Centralized CorsUtil and dynamic allowed origins.
* [x] PBKDF2 Password hashing with backward compatibility.
* [x] Input validation & Admin role checks.
* [x] ContentServlet supporting filter by language, stage, and level.
* [x] Local deterministic MCQ AI Generator (/api/ai/generate-questions).
* [x] Dynamic Agora Token Server with credentials fallback.
* [x] Backend-backed learning progress tracking (UserProgress table, ProgressServlet).
* [x] Frontend dynamic progress syncing and LocalStorage fallback.
* [x] Engagement APIs (/api/engagement/podcasts, /api/engagement/premium, /api/engagement/gifts).
* [x] Transaction-safe XP redemption API (/api/progress/redeem) to exchange rewards.
* [x] Seeded teacher dashboard workspace API (/api/teacher/classrooms, /api/teacher/materials).
* [x] Wallet & sandbox payment simulator (/api/wallet/balance, /api/wallet/topup, /api/wallet/send-gift).
* [x] Podcasts room recording start/stop APIs (/api/podcasts/record/start, /api/podcasts/record/stop).
* [x] Custom performance stress-testing utility tool script (scripts/stress-check.js).
* [x] AI Agent & Coach Layer (AI Coach, AI Mentor, Admin Insights, and agentTools).
* [x] ASCII-only files for documentation to prevent mojibake.

---

## 7. Demo Checklist

* Start SQL Server and ensure `LUCY_DBS` is created.
* Build and start `LucyBackendAPI` (Tomcat) & `AgoraTokenServer` (Node.js).
* Register a new student account using the React Login panel.
* Verify the student account is successfully created in SQL database and initial XP is 0.
* Log in as the new student, navigate to "Explore", and click "Learn Now".
* Complete a lesson step-by-step and verify +20 XP is awarded.
* Check SQL database table `UserProgress` to confirm the record was added, and the user's `total_xp` in `Users` increased to 20.
* Navigate to "Gifts Store", load reward items via API, and redeem a gift (e.g. Lucy Premium T-Shirt). Verify XP deduction if balance is sufficient, or verify correct error handling if balance is insufficient.
* Log in as admin (credentials: `admin` / `123456`) and verify access to the Admin Dashboard.
* Log in as teacher/mentor, navigate to "Classrooms" and "Materials" views, and verify that the classroom and material tables successfully fetch data from the Teacher API (or fallback to offline seed data when server is down).
* Log in as student, navigate to the "AI Coach" tab, verify the personalized plan loads, and submit a practice text response to get AI corrections/feedback.
* Log in as admin, navigate to the "AI Insights" tab under the AI section, and verify system metrics and health alerts.

---

## 8. Local SePay Webhook Tunnel

The project uses the existing `.tools/ngrok/ngrok.exe`. Add the token from the ngrok dashboard to the ignored project `.env` file:

```dotenv
NGROK_AUTHTOKEN=YOUR_NGROK_AUTHTOKEN
```

Start Tomcat on port 8080, then run:

```powershell
npm run ngrok
```

The tunnel policy only permits `POST /LucyBackendAPI/api/wallet/sepay-webhook`; all other public paths are rejected. Copy the HTTPS forwarding address printed by ngrok and append that path when configuring the webhook in SePay. Never commit ngrok or SePay tokens.
