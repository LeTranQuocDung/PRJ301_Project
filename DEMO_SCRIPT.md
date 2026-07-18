# LUCY - Demo Presentation Script & Checklist

This document provides a step-by-step walkthrough script for demonstrating the LUCY application during evaluation.

---

## 1. Setup Instructions

Before running the demo, ensure all servers and configurations are initialized:

### Step 1.1: Database Setup
1. Execute `data_importer_toolkit/database_setup.sql` in SQL Server Management Studio (SSMS) with SQLCMD mode enabled.
2. Ensure you have configured the SQLCMD password variable at the top of the script.

### Step 1.2: Environment Variables
Create a `.env` file in the project root matching `.env.example`:
```env
LUCY_DB_URL=jdbc:sqlserver://localhost;instanceName=SQLEXPRESS;databaseName=LUCY_DBS;encrypt=false;trustServerCertificate=true;
LUCY_DB_USER=lucy_admin
LUCY_DB_PASSWORD=your_configured_db_password
LUCY_ALLOWED_ORIGIN=http://localhost:5173
VITE_LUCY_API_BASE=http://localhost:8080/LucyBackendAPI
VITE_AGORA_TOKEN_BASE=http://localhost:3000
```

### Step 1.3: Package and Run Java Backend (Tomcat)
1. Package the WAR file:
   ```bash
   cd LucyBackendAPI
   mvn clean package -DskipTests
   ```
2. Deploy `target/LucyBackendAPI.war` into your Tomcat `webapps/` directory and start Tomcat.

### Step 1.4: Run curriculum Importer
1. Package the tool:
   ```bash
   cd data_importer_toolkit/LucyImporter
   mvn clean package -DskipTests
   ```
2. Execute the importer to seed the 100 language levels:
   ```bash
   java -jar target/LucyImporter-1.0-SNAPSHOT-jar-with-dependencies.jar
   ```

### Step 1.5: Run Agora Token Server
1. Start your local Agora Token Server on port 3000:
   ```bash
   cd agora_token_server
   npm install
   npm start
   ```

### Step 1.6: Run React Frontend
1. Start the React development server:
   ```bash
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

---

## 2. Step-by-Step Demo Script

### Scenario A: Administrator Workspace (Role: Admin)
1. **Login**: Go to login page, enter email `admin@lucy.edu` and password `123456`.
2. **Dashboard**: Navigate to Admin Dashboard. Notice the sleek visual theme and bento-grid layout.
3. **User Management**:
   * Click **User Management** in the navbar.
   * Fill out "Add New Account" with name `Teacher Alice` and email `alice@lucy.edu`. Set role to `Mentor`.
   * Click **Create Account**. Note the popup showing the auto-generated secure password (e.g., `Lucy@194832`).
   * Locate the created user in the table list. Click **Reset Pass** next to the user. Confirm the prompt and observe the newly generated temporary password.
4. **Document Import Center**:
   * Click **Import Files** in the navbar.
   * Observe the table loading dynamic import history from `/api/import/history`.
   * Click **Re-import** on `LISA_English_Stage1.docx`. Observe the status transition to `processing` and then to `success` with record counts loaded from the servlet.
5. **AI Questions Preview**:
   * Click **DOCX Preview** to see parsed lessons.
   * Click **AI Generated Questions** in the sidebar.
   * Set Topic to "Advanced Business English", select Language: `English`, Level: `Intermediate`.
   * Click **Generate Questions**. Observe the loading indicator, and examine the generated multiple-choice (MCQ) list showing correct answers, options, and explanations.
6. **AI System Insights (Admin Agent)**:
   * Click **AI Insights** in the navbar.
   * Verify classroom health percentage (92%), weak syllabus areas, and recommended administrative actions.

### Scenario B: Teacher Classroom Tracking (Role: Teacher)
1. **Login**: Logout and login with email `mentor@lucy.edu` and password `123456`.
2. **Classrooms**: Access the Teacher Workspace. Note the dynamic student progress logs (e.g., "Nguyen Van A - 85% Completed").
3. **Materials**: Toggle to **Teaching Materials** and examine the list of active English/Chinese courses.

### Scenario C: Student Learning & Rewards (Role: Student)
1. **Login**: Logout and login with email `student@lucy.edu` and password `123456`.
2. **Learning Board**: Select a language card (English/Chinese/Japanese). Click on "Welcome & Greetings" to complete a lesson. Observe XP point updates.
3. **Wallet Balance & Sandbox Top-Up**:
   * Click **Premium Perks** in the sidebar.
   * Observe the student's current wallet balance loaded via `/api/wallet/balance?userId=1`.
   * Click **Sandbox Top Up (+100k)**. Check that the VNPay sandbox simulation is triggered and balance is incremented to `250,000 VND` dynamically.
4. **Store Rewards & Gifting**:
   * Click **Gifts Store** in the sidebar.
   * View exchangeable gifts (T-Shirt, Double XP Pass).
   * Click **Redeem** on a gift. Check that the XP balance is deducted transaction-safely on the backend.
5. **Collaborative Audio & Podcasts**:
   * Click **Live Rooms** in the sidebar.
   * Click **Create Room** or **Join**. Verify the console network tab to see dynamic tokens fetched from Agora Token Server.
   * Click **Podcasts** in the sidebar to review the dynamic podcasts list.
6. **AI Coach & Mentor (Student Agent)**:
   * Click **AI Coach** in the sidebar.
   * View the personalized learning goals and risk flags (e.g., "low speaking practice").
   * Type a response into the input box and click **Get AI Feedback** to receive instant grammar correction, speaking tip, and confidence score.

### Scenario D: Live Podcast Recording (Role: Admin / Teacher)
1. **Login**: Login with email `admin@lucy.edu` and password `123456`.
2. **Record Live session**:
   * Click **Podcasts** in the navbar.
   * Click **Start Room Recording** to trigger `/api/podcasts/record/start` simulation. Note the alert confirming session creation.
   * Speak inside the Agora room to simulate the lecture content.
   * Click **Stop Recording** to trigger `/api/podcasts/record/stop`. Observe that a new live room audio clip is added dynamically to the recordings list with a `processing` status badge.

---

## 3. Q&A Talking Points and Fallback Strategies

* **Q: How does the AI integration work?**
  * **Answer**: The backend implements a deterministic template rules-engine for multiple-choice questions. It ensures that the demo is 100% reliable, fast, and does not require active OpenAI or external cloud API credentials during class evaluations.
* **Q: How are database credentials protected?**
  * **Answer**: We enforce environment-variable loading via `System.getenv("LUCY_DB_PASSWORD")`. If the variable is absent, the connection throws a clear SQLException immediately instead of failing silently or using unsafe hardcoded defaults.
* **Q: What is the sandbox payment and wallet flow?**
  * **Answer**: The student balance is managed on the Java backend via `WalletServlet`. It simulates payment gateway response processing (topups) and currency-based gifting to mentor teachers under a secure transaction structure.
* **Q: How does the podcast recording system operate?**
  * **Answer**: Starting a recording triggers an Agora cloud recording API simulation on `PodcastServlet`, storing the audio session ID, and generating processed podcast materials upon stopping.
* **Q: How do you verify system capacity under concurrent users?**
  * **Answer**: We run a Node.js performance test tool (`node scripts/stress-check.js`) that concurrently hits backend APIs (Contents, Import, Wallet, Podcasts, AI) to report latencies and success rates.
* **Q: How do you verify multiple roles at the same time?**
  * **Answer**: We run `npm run verify:roles`. It starts concurrent isolated role scenarios for Learner, Mentor/Teacher, Admin/System, Payment Service, and Agora Token checks. Each role uses its own session headers and reports PASS, SKIP, or FAIL per endpoint, so offline optional services do not create fake failures but reachable broken APIs fail the check.
* **Q: How does the AI Agent & Coach Layer function?**
  * **Answer**: It leverages a localized, deterministic response engine (AgentServlet) that evaluates user learning logs, progress, and submitted answers to deliver context-specific corrections, confidence scores, and classroom health indicators. It is capable of checking the optional `GEMINI_API_KEY` to link dynamic models, but runs deterministically without it.
* **Q: What is the fallback if local SQL Server is unavailable during the live demo?**
  * **Answer**: The frontend components (such as Import History and AI Questions) have built-in offline fallbacks that load seed arrays gracefully if the API is offline.
* **Q: How do you run the complete validation suite?**
  * **Answer**: You run `npm run verify:all` which sequentially validates package audits, frontend bundle build, token server check, concurrent role smoke tests, and the AI Agent schema evaluation.
