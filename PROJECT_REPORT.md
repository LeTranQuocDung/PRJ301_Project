# LUCY Project Report - PRJ301

## 1. Project Overview
LUCY (Language Unity & Collaborative Youth) is a language learning platform designed to facilitate collaborative learning (English, Chinese, Japanese) through live interactive audio rooms, gamified progress, and AI-assisted content generation.

---

## 2. Requirement Mapping
The implementation covers the primary requirements of RBL_PRJ301, the PRJ30x evaluation rubric, and the LUCY detailed specification:
* **Multi-language Support**: English (LISA), Chinese (ZH), and Japanese (JA) materials are fully integrated.
* **Gamification & Rewards**: Progression tracking (XP points) and a reward store for virtual/physical gifts.
* **Role-based Workspaces**: Specialized views for Students (learning dashboard, gamified store, voice chat) and Admins/Teachers (user administration, content import management, classroom/materials tracking).
* **AI Integration**: Automatic generation of multiple-choice practice questions mapped to course topics.
* **Live Interactive Rooms**: Collaborative voice chat rooms powered by Agora SDK.

---

## 3. System Architecture
LUCY uses a modular, decoupled architecture:
* **Frontend**: React application built with vanilla CSS styling, Outfit typography, and dynamic micro-animations. It connects dynamically to the backend API and Agora token servers.
* **Backend**: Java Servlet application running on Apache Tomcat (v9/v10), using Gson for JSON serialization and structured DAO components.
* **Database**: Microsoft SQL Server storing normalized tables for platform entities, tracking logs, and curriculum metadata.
* **Agora Token Server**: Lightweight server endpoint to generate secure RTC/RTM tokens for live audio channels using the official Agora Access Token SDK.
* **Importer Toolkit**: Standalone Java console utility utilizing Apache POI to parse curriculum data from DOCX files and seed the database.

---

## 4. Database Design (8 Normalized Tables)
The database `LUCY_DBS` consists of 8 tables with established relationships:
1. `Users`: Stores user accounts, display names, email, hashed passwords, roles, and current XP.
2. `UserProgress`: Tracks completed lessons per user with a unique composite index (`user_id`, `lang_code`, `level_num`).
3. `Lessons`: Stores curriculum levels (vocabulary, grammar) for backward compatibility.
4. `Languages`: Represents available languages on the platform (code, name, total_levels).
5. `Stages`: Groups course levels into curriculum stages mapped to a language.
6. `LessonSegments`: Stores granular parts of a lesson (e.g. Vocabulary lists, Grammar notes).
7. `Questions`: Holds multiple-choice question sets associated with specific lessons.
8. `ImportFiles`: Audit trail and state tracking for imported DOCX curriculum documents.

```
Relationships:
Users (1) <----> (N) UserProgress
Languages (1) <----> (N) Stages
Lessons (1) <----> (N) LessonSegments
Lessons (1) <----> (N) Questions
```

---

## 5. Main APIs and Business Flows
* **Authentication**: `POST /api/users/login`, `POST /api/users/register`, and `POST /api/users/change-password` manage user credentials securely.
* **Learning Content**: `GET /api/contents` filters lessons by language/stage/level.
* **Progress & XP Balance**: `GET /api/progress` retrieves completed lessons. `POST /api/progress/complete` updates completed units. `POST /api/progress/redeem` deducts XP for store rewards.
* **Administrative Operations**: `POST /api/users/admin/create-user` (with auto-generated secure temp passwords) and `POST /api/users/admin/reset-password`.
* **Curriculum Management**: `GET /api/import/history` returns the import log. `POST /api/import/reprocess` triggers curriculum synchronization.
* **Sandbox Gifting & Payments**: `GET /api/wallet/balance` gets user balances. `POST /api/wallet/topup` mimics payment gateway sandbox top ups. `POST /api/wallet/send-gift` implements direct mentor tipping transactions.
* **Podcast Recordings**: `GET /api/podcasts/recordings` lists recordings. `POST /api/podcasts/record/start` and `POST /api/podcasts/record/stop` manage room audio recording sessions.

---

## 6. AI Integration & Agent Layer
LUCY integrates a deterministic offline local AI question generator endpoint (`POST /api/ai/generate-questions`) alongside a complete AI Agent & Coach Layer:
* **Local MCQ AI Generator**: Employs a deterministic local rule engine to dynamically yield study questions, correct answers, and grammatical breakdowns.
* **LISA AI Learning Coach (`GET /api/agent/coach?userId=1`)**: Returns a dynamic study roadmap, next lesson objectives, risk flags, and recommended practice behaviors.
* **AI Mentor Feedback (`POST /api/agent/mentor-feedback`)**: Analyzes text responses and outputs custom corrective feedback, grammar check, speaking hints, and confidence ratings.
* **AI Admin Insights (`GET /api/agent/admin-insights`)**: Aggregates syllabus statistics, inactive student warnings, and highlights weak course modules.
* **Optional API Connection**: Capable of reading the optional `GEMINI_API_KEY` from environment parameters to interface remote models while falling back to the local engine gracefully if absent.

---

## 7. Security Implementations
* **Password Security**: Store passwords using PBKDF2 (specifically PBKDF2WithHmacSHA256) with dynamic salt, and backward-compatible fallback support for SHA-256 + Salt (used by seeded demo database accounts).
* **Credential Safety**: No database passwords are hardcoded in Java code. The system reads `LUCY_DB_PASSWORD` from environment variables, throwing a clear `SQLException` if missing.
* **CORS Policies**: Explicit origin validation is enforced via `CorsUtil` on all servlet response headers.
* **Admin Guarding**: Critical administrative endpoints verify the `X-LUCY-ROLE` header to prevent unauthorized access.

---

## 8. 10-Week Roadmap Coverage
The 10-week roadmap from the project specification has been mapped as follows:
* **Weeks 1-2 (Database Setup & Importer)**: Implemented. The SQL Server schema is active, and the POI-based Java importer packages and seeds lessons cleanly.
* **Weeks 3-4 (Java Backend APIs & Security)**: Implemented. REST servlets handle users, progress, engagement, and import logs.
* **Weeks 5-6 (React Frontend UI & Navigation)**: Implemented. Student and Admin dashboards are fully functional with premium visual styles.
* **Weeks 7-8 (Agora Audio Integration & AI)**: Implemented. Real Agora Web SDK audio wrapper is integrated with local token server and safe fallback mechanisms; deterministic local AI generator is active. Wallet balance queries (`/api/wallet/balance`) and podcast recordings start/stop are integrated.
* **Weeks 9-10 (Q&A Prep & Deployment)**: Implemented. Sandbox topups, mentor gifting, and live podcast clip processing APIs are active. A custom performance stress-testing utility (`scripts/stress-check.js`) using built-in modules is introduced to verify load capacity. Complete integration testing, verification scripts, and fallback demo scripts are finalized.

---

## 9. Verification and Pass Status
Current test status verified in the workspace:
* Frontend Build (`npm run build`): PASS
* Tomcat Backend Packaging (`mvn package` inside LucyBackendAPI): PASS
* POI Importer Packaging (`mvn package` inside LucyImporter): PASS
* Performance Stress Test Utility: PASS (Simulates load across endpoints concurrently)

