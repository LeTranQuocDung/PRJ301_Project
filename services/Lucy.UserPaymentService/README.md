# Lucy User & Payment Service (.NET Core)

This microservice handles anonymous identities, student wallets, VNPay sandbox transactions, and gifting to mentors.

---

## Technical Stack
* **Runtime**: .NET Core 9.0
* **API Framework**: ASP.NET Core Web API (Minimal APIs & Controller routing)
* **API Specs**: Swashbuckle Swagger/OpenAPI v3
* **Repository**: Thread-safe in-memory ConcurrentDictionary store for demos

---

## Environment Configurations

The service behavior can be customized using the following environment variables:
* `LUCY_ENABLE_SWAGGER`: Set to `true` to force enable Swagger UI in non-development environments.
* `LUCY_ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (default: `http://localhost:5173,http://127.0.0.1:5173`).

---

## Build and Run Instructions

1. Ensure you have the .NET 9.0 SDK installed on your system.
2. From the command line, run build:
   ```bash
   dotnet build
   ```
3. Run the service:
   ```bash
   dotnet run
   ```
4. The API will listen locally on:
   - Swagger Documentation: `http://localhost:5000/swagger` or `https://localhost:5001/swagger` (if SSL is active).

---

## API Documentation

### 1. Health Status
* **GET `/health`**
* **Success Response (200 OK)**:
  `{"status":"Healthy","timestamp":"2026-07-14T12:04:33Z"}`

### 2. Anonymous Token
* **POST `/api/identity/anonymous-token`**
* **Request Body**:
  `{"roomId":"room_101","role":"student"}`
* **Success Response (200 OK)**:
  `{"token":"LUCY_ANON_JWT_...","role":"student","roomId":"room_101","expiresInSeconds":3600,"issuedAt":"..."}`

### 3. Wallet Balance
* **GET `/api/payments/wallet/balance?userId=1`**
* **Success Response (200 OK)**:
  `{"userId":1,"balance":150000.0,"currency":"VND","updatedAt":"..."}`

### 4. Sandbox Top Up
* **POST `/api/payments/topup`**
* **Request Body**:
  `{"userId":1,"amount":100000,"method":"demo_vnpay_sandbox"}`
* **Success Response (200 OK)**:
  `{"transactionId":"TXN_NET_TOP_...","userId":1,"amount":100000,"method":"demo_vnpay_sandbox","status":"success","newBalance":250000.0,"timestamp":"..."}`

### 5. Send Gift to Mentor (Gifting transaction)
* **POST `/api/payments/gifts/send`**
* **Request Body**:
  `{"fromUserId":1,"toMentorId":2,"giftCode":"VIP_PERK","amount":20000}`
* **Success Response (200 OK)**:
  `{"transactionId":"TXN_NET_GIFT_...","fromUserId":1,"toMentorId":2,"giftCode":"VIP_PERK","amount":20000,"status":"success","newBalance":130000.0,"timestamp":"..."}`
