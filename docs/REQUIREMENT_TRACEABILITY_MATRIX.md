# Requirement Traceability Matrix (LUCY - PRJ301)

This matrix maps core project requirements from **RBL_PRJ301.docx**, **PRJ30x_Project_Evaluation_Rubric.docx**, and **LUCY_Project_Detailed_Specification.docx** to their respective implementation artifacts, status, and roadmap stages.

---

## 1. Traceability Mapping Matrix

| Req ID | Requirement Description | Implementation Artifact / Evidence Files / Commands | Status | Roadmap Week |
|---|---|---|---|---|
| **REQ-01** | Multi-Language Content | [database_setup.sql](../data_importer_toolkit/database_setup.sql), [ContentServlet.java](../LucyBackendAPI/src/main/java/com/lucy/controller/ContentServlet.java) | **Implemented** | Weeks 1-2 |
| **REQ-02** | User Progress & XP | [ProgressServlet.java](../LucyBackendAPI/src/main/java/com/lucy/controller/ProgressServlet.java), [UserApp.jsx](../src/UserApp.jsx) (ProgressView) | **Implemented** | Weeks 3-4 |
| **REQ-03** | Gamification Store | [EngagementServlet.java](../LucyBackendAPI/src/main/java/com/lucy/controller/EngagementServlet.java) (Gifts API), [UserApp.jsx](../src/UserApp.jsx) (GiftsView) | **Implemented** | Weeks 5-6 |
| **REQ-04** | Live Audio Rooms | [agoraClient.js](../src/services/agoraClient.js), [UserApp.jsx](../src/UserApp.jsx), [server.js](../AgoraTokenServer/server.js)<br/>Evidence commands: `npm run build` in root, `npm run check` in `AgoraTokenServer` | **Implemented with SDK fallback** | Weeks 7-8 |
| **REQ-05** | Document Curriculum Parser | [LucyImporter](../data_importer_toolkit/LucyImporter) (Apache POI console app parser) | **Implemented** | Weeks 1-2 |
| **REQ-06** | Import History Management | [ImportServlet.java](../LucyBackendAPI/src/main/java/com/lucy/controller/ImportServlet.java), [AdminApp.jsx](../src/AdminApp.jsx) (ImportFilesView) | **Implemented** | Weeks 5-6 |
| **REQ-07** | Local MCQ AI Generator | [AIServlet.java](../LucyBackendAPI/src/main/java/com/lucy/controller/AIServlet.java) (Deterministic MCQ Engine) | **Implemented** | Weeks 7-8 |
| **REQ-08** | PBKDF2 Password Hashing | [PasswordUtil.java](../LucyBackendAPI/src/main/java/com/lucy/util/PasswordUtil.java) (65536 iterations, dynamic salt) | **Implemented** | Weeks 3-4 |
| **REQ-09** | Safe Environment Properties | [DBConnection.java](../LucyBackendAPI/src/main/java/com/lucy/util/DBConnection.java) (Reads LUCY_DB_PASSWORD) | **Implemented** | Weeks 3-4 |
| **REQ-10** | Wallet & Payments | [WalletServlet.java](../LucyBackendAPI/src/main/java/com/lucy/controller/WalletServlet.java), [UserApp.jsx](../src/UserApp.jsx) (Wallet Sandbox UI) | **Implemented** | Weeks 9-10 |
| **REQ-11** | Podcasts Live Recording | [PodcastServlet.java](../LucyBackendAPI/src/main/java/com/lucy/controller/PodcastServlet.java), [AdminApp.jsx](../src/AdminApp.jsx) (PodcastsView) | **Implemented** | Weeks 9-10 |
| **REQ-12** | .NET Payment Service | [Lucy.UserPaymentService](../services/Lucy.UserPaymentService) (ASP.NET Core Web API shell)<br/>Evidence command: `dotnet build services/Lucy.UserPaymentService/Lucy.UserPaymentService.csproj` | **Implemented** | Weeks 9-10 |
| **REQ-13** | Flutter Mobile Shell | [lucy_flutter_shell](../mobile/lucy_flutter_shell) (Route/Tab Shell, real HTTP client, local fallback)<br/>Evidence command: `flutter analyze` from `mobile/lucy_flutter_shell` | **Implemented** | Weeks 9-10 |
| **REQ-14** | Capacity Stress Testing | [stress-check.js](../scripts/stress-check.js) (Pure Node.js concurrency check) | **Implemented** | Weeks 9-10 |
| **REQ-15** | AI Agent & Coach Layer | [AgentServlet.java](../LucyBackendAPI/src/main/java/com/lucy/controller/AgentServlet.java) (AI Coach/Mentor/Insights API), [agentTools.js](../src/services/agentTools.js) (Agent tools), [agent-eval-check.js](../scripts/agent-eval-check.js) (Eval harness)<br/>Evidence command: `npm run verify:agents` | **Implemented** | Weeks 9-10 |
| **REQ-16** | Concurrent Multi-Role Validation | [multi-role-scenario-check.js](../scripts/multi-role-scenario-check.js) (Learner, Mentor/Teacher, Admin/System, Payment Service, Agora Token role matrix)<br/>Evidence command: `npm run verify:roles` | **Implemented** | Weeks 9-10 |

* **Status Glossary**:
  * **Implemented**: Code fully written, validated, and functioning under real configurations (including built-in fallback options when external dependencies or hardware are offline).

---

## 2. 10-Week Roadmap Deliverables Traceability

### Phase 1: Planning & Importer (Weeks 1-2)
* **Goal**: SQL Server database setup, table normalization, POI console import parser.
* **Evidence**:
  * Normalized tables seed: [database_setup.sql](../data_importer_toolkit/database_setup.sql).
  * Word file parser: [LucyImporter](../data_importer_toolkit/LucyImporter).

### Phase 2: Core Infrastructure (Weeks 3-4)
* **Goal**: Java backend REST controllers, security configurations, password encryption.
* **Evidence**:
  * Core APIs: `UserServlet`, `ContentServlet`, `ProgressServlet` in [com.lucy.controller](../LucyBackendAPI/src/main/java/com/lucy/controller).
  * Encryption: [PasswordUtil.java](../LucyBackendAPI/src/main/java/com/lucy/util/PasswordUtil.java).

### Phase 3: Interactive Workspaces (Weeks 5-6)
* **Goal**: Student and Admin portals, Document Import Center tracking, Gamified XP stores.
* **Evidence**:
  * Admin Portal UI: [AdminApp.jsx](../src/AdminApp.jsx).
  * Student Portal UI: [UserApp.jsx](../src/UserApp.jsx).

### Phase 4: Audio Rooms & Integration (Weeks 7-8)
* **Goal**: Live Rooms, Agora token creation, AI deterministic MCQ engines, Wallet balance lookup.
* **Evidence**:
  * Agora Token API: [AgoraTokenServer](../AgoraTokenServer).
  * Deterministic AI: [AIServlet.java](../LucyBackendAPI/src/main/java/com/lucy/controller/AIServlet.java).

### Phase 5: Gifting & Quality Check (Weeks 9-10)
* **Goal**: VNPay sandbox Payments, Gifting transactions, Live room podcasts recordings, implemented .NET UserPaymentService, implemented Flutter mobile shell, stress test scripts, and Q&A presentation guides.
* **Evidence**:
  * Wallet / Tipping APIs: `WalletServlet` & `PodcastServlet` in [com.lucy.controller](../LucyBackendAPI/src/main/java/com/lucy/controller).
  * .NET Microservice: [Lucy.UserPaymentService](../services/Lucy.UserPaymentService).
  * Flutter App shell: [lucy_flutter_shell](../mobile/lucy_flutter_shell).
  * Stress testing script: [stress-check.js](../scripts/stress-check.js).
  * Multi-role scenario verification: [multi-role-scenario-check.js](../scripts/multi-role-scenario-check.js).
