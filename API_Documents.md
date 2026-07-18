# LUCY API Specifications

This document defines the REST API endpoints exposed by the Lucy Backend Server. All request and response bodies use UTF-8 JSON.

---

## 1. Authentication Endpoints

### 1.1 Register New User
* **Endpoint**: `POST /api/users/register`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "username": "student_test",
    "email": "student_test@lucy.edu",
    "password": "mySecurePassword123",
    "avatarUrl": "fox_avatar",
    "role": "student"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "id": 4,
    "username": "student_test",
    "email": "student_test@lucy.edu",
    "role": "student",
    "avatarUrl": "fox_avatar"
  }
  ```
* **Error Response (400 Bad Request / 409 Conflict)**:
  `{"error": "Username or email already exists"}`

### 1.2 User Login
* **Endpoint**: `POST /api/users/login`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "email": "student_test@lucy.edu",
    "password": "mySecurePassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "id": 4,
    "username": "student_test",
    "email": "student_test@lucy.edu",
    "role": "student",
    "avatarUrl": "fox_avatar"
  }
  ```
* **Error Response (401 Unauthorized)**:
  `{"error": "Invalid email or password"}`

### 1.3 Change Password
* **Endpoint**: `POST /api/users/change-password`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "userId": 4,
    "email": "student_test@lucy.edu",
    "oldPassword": "mySecurePassword123",
    "newPassword": "newSecretPassword456"
  }
  ```
* **Success Response (200 OK)**:
  `{"success": true, "message": "Password changed successfully"}`
* **Error Response (400 / 500)**:
  `{"error": "Invalid current password"}`

---

## 2. Learning Content and Progress Endpoints

### 2.1 Fetch Lessons (Legacy Compatibility)
* **Endpoint**: `GET /api/lessons`
* **Query Parameters**:
  * `lang` (optional): `LISA` (English), `ZH` (Chinese), `JA` (Japanese)
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "langCode": "LISA",
      "levelNum": 1,
      "title": "Welcome & Greetings",
      "stage": "Beginner",
      "vocab": "Hello, Goodbye, Thank you",
      "grammar": "Subject + Verb + Object"
    }
  ]
  ```

### 2.2 Filter Content (New Unified API)
* **Endpoint**: `GET /api/contents`
* **Query Parameters**:
  * `language`: `LISA` | `ZH` | `JA` (case insensitive)
  * `stage`: Stage name filter (optional)
  * `level`: Level number filter (optional)
* **Success Response (200 OK)**:
  Format matching 2.1. If language is `ZH`, vocabulary maps to lesson sub-level titles, and grammar maps to Chinese Q&A responses automatically.

### 2.3 Get User Learning Progress
* **Endpoint**: `GET /api/progress`
* **Query Parameters**:
  * `userId` (required): The ID of the student user
* **Success Response (200 OK)**:
  ```json
  {
    "totalXp": 120,
    "progressList": [
      {
        "id": 12,
        "userId": 4,
        "langCode": "LISA",
        "levelNum": 1,
        "completedAt": "2026-07-14 11:00:00"
      }
    ]
  }
  ```

### 2.4 Save Lesson Complete
* **Endpoint**: `POST /api/progress/complete`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "userId": 4,
    "languageCode": "LISA",
    "lessonId": "lisa1",
    "levelNum": 1,
    "xp": 20
  }
  ```
* **Success Response (200 OK)**:
  `{"success": true, "message": "Progress saved and XP updated"}`

### 2.5 Redeem Gift XP (Deduct XP)
* **Endpoint**: `POST /api/progress/redeem`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "userId": 4,
    "xpDelta": -500,
    "reason": "redeem_lucy_premium_t-shirt"
  }
  ```
* **Success Response (200 OK)**:
  `{"success": true, "message": "Redemption successful"}`
* **Error Response (400 Bad Request)**:
  `{"error": "Insufficient XP balance or user not found"}`

---

## 3. AI Generated Content

### 3.1 Generate Practice Questions
* **Endpoint**: `POST /api/ai/generate-questions`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "prompt": "Practice business greeting phrases",
    "level": "Intermediate",
    "count": 3
  }
  ```
* **Success Response (200 OK)**:
  ```json
  [
    {
      "question": "What is a professional way to greet a new client in a business meeting?",
      "options": [
        "What's up buddy?",
        "It is a pleasure to meet you, looking forward to our collaboration.",
        "Catch you later.",
        "Yo, nice to see you."
      ],
      "answer": "It is a pleasure to meet you, looking forward to our collaboration."
    }
  ]
  ```

---

## 4. Engagement & Audio Content

### 4.1 Get Podcasts
* **Endpoint**: `GET /api/engagement/podcasts`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "title": "Daily English Tips",
      "episodes": 12,
      "lang": "English",
      "subs": 234,
      "accent": "blue",
      "flagCode": "GB"
    }
  ]
  ```

### 4.2 Get Premium Perks
* **Endpoint**: `GET /api/engagement/premium`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "title": "Advanced Business English",
      "langCode": "GB",
      "accent": "blue"
    }
  ]
  ```

### 4.3 Get Reward Gifts
* **Endpoint**: `GET /api/engagement/gifts`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "name": "Lucy Premium T-Shirt",
      "xp": 500,
      "desc": "Premium cotton t-shirt with Lucy branding",
      "iconCode": "tshirt"
    }
  ]
  ```

---

## 5. Teacher Workspace APIs

### 5.1 Get Teacher Classrooms Data
* **Endpoint**: `GET /api/teacher/classrooms`
* **Success Response (200 OK)**:
  ```json
  {
    "className": "Lop Tieng Anh Giao Tiep K12",
    "totalStudents": 3,
    "students": [
      {
        "name": "Nguyen Van A",
        "email": "nva@gmail.com",
        "progress": "85%",
        "status": "Active"
      }
    ]
  }
  ```

### 5.2 Get Teaching Materials Data
* **Endpoint**: `GET /api/teacher/materials`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "subject": "Tieng Anh Giao Tiep",
      "lessons": [
        "Bai 1: Greetings & Introductions",
        "Bai 2: Daily Routines"
      ]
    }
  ]
  ```

---

## 6. Document Import APIs

### 6.1 Get Import History
* **Endpoint**: `GET /api/import/history`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "name": "LISA_English_Stage1.docx",
      "size": "142 KB",
      "records": 20,
      "status": "success",
      "date": "2026-07-10",
      "language": "English",
      "stage": "Stage 1"
    }
  ]
  ```

### 6.2 Reprocess Import File
* **Endpoint**: `POST /api/import/reprocess`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "fileName": "LISA_English_Stage1.docx"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "records": 20
  }
  ```
* **Error Response (400 Bad Request)**:
  `{"error": "Unknown file name: Invalid_File.docx"}`

---

## 7. Wallet & Sandbox Payments

### 7.1 Get Wallet Balance
* **Endpoint**: `GET /api/wallet/balance`
* **Query Parameters**:
  * `userId` (optional, default: 1): The ID of the student user
* **Success Response (200 OK)**:
  ```json
  {
    "userId": 1,
    "balance": 150000.0,
    "currency": "VND",
    "updatedAt": "2026-07-14T11:55:17"
  }
  ```

### 7.2 Sandbox Wallet Top Up
* **Endpoint**: `POST /api/wallet/topup`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "userId": 1,
    "amount": 100000,
    "method": "demo_vnpay_sandbox"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "transactionId": "TXN_TOPUP_1780411762123",
    "userId": 1,
    "amount": 100000.0,
    "method": "demo_vnpay_sandbox",
    "status": "success",
    "newBalance": 250000.0,
    "timestamp": "2026-07-14T11:55:20"
  }
  ```

### 7.3 Send Gift to Mentor (Gifting transaction)
* **Endpoint**: `POST /api/wallet/send-gift`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "fromUserId": 1,
    "toMentorId": 2,
    "giftCode": "VIP_PERK",
    "amount": 20000
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "transactionId": "TXN_GIFT_1780411762456",
    "fromUserId": 1,
    "toMentorId": 2,
    "giftCode": "VIP_PERK",
    "amount": 20000.0,
    "status": "success",
    "newBalance": 130000.0,
    "timestamp": "2026-07-14T11:55:22"
  }
  ```

---

## 8. Podcast & Live Room Recordings

### 8.1 Get Recorded Sessions
* **Endpoint**: `GET /api/podcasts/recordings`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "REC_123456789",
      "title": "Introduction to IELTS Speaking",
      "language": "English",
      "duration": "12:34",
      "creator": "Mr. John",
      "premium": false,
      "status": "completed",
      "createdAt": "2026-07-13T11:56:08"
    }
  ]
  ```

### 8.2 Start Live Room Recording
* **Endpoint**: `POST /api/podcasts/record/start`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "roomId": "room_101",
    "creatorId": 2,
    "title": "Live Mentor QA Session"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "sessionId": "SESS_1780411762999",
    "roomId": "room_101",
    "creatorId": 2,
    "title": "Live Mentor QA Session",
    "status": "recording",
    "startedAt": "2026-07-14T11:56:08"
  }
  ```

### 8.3 Stop Live Room Recording
* **Endpoint**: `POST /api/podcasts/record/stop`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "sessionId": "SESS_1780411762999"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "sessionId": "SESS_1780411762999",
    "status": "processing",
    "recording": {
      "id": "REC_987654321",
      "title": "Live Mentor QA Session (Live)",
      "language": "English",
      "duration": "05:00",
      "creator": "Mentor",
      "premium": false,
      "status": "processing",
      "createdAt": "2026-07-14T11:56:10"
    }
  }
  ```

