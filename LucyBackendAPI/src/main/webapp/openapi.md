# LUCY OpenAPI v3 Documentation

This document describes all API endpoints accessible under the `/api/*` root path for the LUCY application.

---

## Servers
- Development Local: `http://localhost:8080/LucyBackendAPI`

---

## 1. Paths

### `/api/users/login` (POST)
- **Summary**: User login.
- **Request Body** (application/json):
  - `email` (string, required)
  - `password` (string, required)
- **Responses**:
  - `200 OK`: Returns logged in user info.
  - `401 Unauthorized`: Bad credentials.

### `/api/users/register` (POST)
- **Summary**: Student user self-registration.
- **Request Body** (application/json):
  - `username` (string, required)
  - `email` (string, required)
  - `password` (string, required)
  - `avatarUrl` (string, optional)
- **Responses**:
  - `200 OK`: Returns registered user details.
  - `400 Bad Request`: Validation failure.

### `/api/users/change-password` (POST)
- **Summary**: Change user credentials.
- **Request Body** (application/json):
  - `userId` (integer, required)
  - `email` (string, required)
  - `oldPassword` (string, required)
  - `newPassword` (string, required)
- **Responses**:
  - `200 OK`: Success message.
  - `400 Bad Request`: Password mismatch.

### `/api/lessons` (GET)
- **Summary**: Fetch lessons list.
- **Parameters**:
  - `lang` (query, string): `LISA` | `ZH` | `JA`
- **Responses**:
  - `200 OK`: Returns JSON array of lessons.

### `/api/contents` (GET)
- **Summary**: Fetch content with language, stage and level filters.
- **Parameters**:
  - `language` (query, string): Filter language
  - `stage` (query, string): Filter stage
  - `level` (query, integer): Filter level
- **Responses**:
  - `200 OK`: Returns JSON array of matching content.

### `/api/progress` (GET)
- **Summary**: Retrieve learning progress and total XP for a user.
- **Parameters**:
  - `userId` (query, integer, required): ID of the user.
- **Responses**:
  - `200 OK`: Returns total XP and array of completed lessons.

### `/api/progress/complete` (POST)
- **Summary**: Log a completed lesson and add XP.
- **Request Body** (application/json):
  - `userId` (integer, required)
  - `languageCode` (string, required)
  - `lessonId` (string, required)
  - `levelNum` (integer, required)
  - `xp` (integer, required)
- **Responses**:
  - `200 OK`: Completion confirmation and XP addition status.

### `/api/progress/redeem` (POST)
- **Summary**: Deduct XP or adjust balance for redeeming reward gifts.
- **Request Body** (application/json):
  - `userId` (integer, required)
  - `xpDelta` (integer, required)
  - `reason` (string, required)
- **Responses**:
  - `200 OK`: Redemption success confirmation.
  - `400 Bad Request`: Insufficient balance or invalid input data.

### `/api/ai/generate-questions` (POST)
- **Summary**: Generate local deterministic MCQ questions.
- **Request Body** (application/json):
  - `prompt` (string, required)
  - `level` (string, optional)
  - `count` (integer, optional)
- **Responses**:
  - `200 OK`: Returns JSON array of practice questions.

### `/api/engagement/podcasts` (GET)
- **Summary**: Fetch audio podcasts.
- **Responses**:
  - `200 OK`: Returns JSON array of podcasts.

### `/api/engagement/premium` (GET)
- **Summary**: Fetch premium course content perks.
- **Responses**:
  - `200 OK`: Returns JSON array of premium courses.

### `/api/engagement/gifts` (GET)
- **Summary**: Fetch redeemable store rewards.
- **Responses**:
  - `200 OK`: Returns JSON array of exchangeable gifts.

### `/api/teacher/classrooms` (GET)
- **Summary**: Fetch teacher's classrooms and student lists.
- **Responses**:
  - `200 OK`: Returns JSON object of classroom details and student arrays.

### `/api/teacher/materials` (GET)
- **Summary**: Fetch teaching materials for teacher.
- **Responses**:
  - `200 OK`: Returns JSON array of subjects and lessons.

### `/api/import/history` (GET)
- **Summary**: Fetch document import history and status.
- **Responses**:
  - `200 OK`: Returns JSON array of imported files.

### `/api/import/reprocess` (POST)
- **Summary**: Reprocess an imported document file.
- **Request Body** (application/json):
  - `fileName` (string, required)
- **Responses**:
  - `200 OK`: Reprocess success confirmation.
  - `400 Bad Request`: Unknown file name or validation failure.

### `/api/wallet/balance` (GET)
- **Summary**: Retrieve student wallet balance.
- **Parameters**:
  - `userId` (query, integer, optional): ID of the user.
- **Responses**:
  - `200 OK`: Returns wallet balance object.

### `/api/wallet/topup` (POST)
- **Summary**: Sandbox top up for wallet balance.
- **Request Body** (application/json):
  - `userId` (integer, required)
  - `amount` (number, required)
  - `method` (string, required)
- **Responses**:
  - `200 OK`: Sandbox payment success transaction object.

### `/api/wallet/send-gift` (POST)
- **Summary**: Gifting transaction to transfer wallet balance to mentor.
- **Request Body** (application/json):
  - `fromUserId` (integer, required)
  - `toMentorId` (integer, required)
  - `giftCode` (string, required)
  - `amount` (number, required)
- **Responses**:
  - `200 OK`: Transaction confirmation object.
  - `400 Bad Request`: Insufficient balance or invalid input.

### `/api/podcasts/recordings` (GET)
- **Summary**: Retrieve recorded podcast sessions.
- **Responses**:
  - `200 OK`: Returns JSON array of recordings.

### `/api/podcasts/record/start` (POST)
- **Summary**: Start live room recording.
- **Request Body** (application/json):
  - `roomId` (string, required)
  - `creatorId` (integer, required)
  - `title` (string, required)
- **Responses**:
  - `200 OK`: Session started info.

### `/api/podcasts/record/stop` (POST)
- **Summary**: Stop live room recording and process audio.
- **Request Body** (application/json):
  - `sessionId` (string, required)
- **Responses**:
  - `200 OK`: Session stopped status and generated recording metadata.