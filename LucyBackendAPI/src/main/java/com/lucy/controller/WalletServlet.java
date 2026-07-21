package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.lucy.util.CorsUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

@WebServlet(urlPatterns = {
    "/api/wallet/balance",
    "/api/wallet/topup",
    "/api/wallet/topup-request",
    "/api/wallet/topup-status",
    "/api/wallet/topup-requests",
    "/api/wallet/topup-approve",
    "/api/wallet/topup-reject",
    "/api/wallet/sepay-webhook",
    "/api/wallet/sepay-payment-info",
    "/api/wallet/send-gift",
    "/api/wallet/zalopay-create",
    "/api/wallet/zalopay-confirm"
})
public class WalletServlet extends HttpServlet {

    private Gson gson;
    private String sepayWebhookApiKey;
    private String sepayApiToken;
    private static final Map<Integer, Double> balances = new HashMap<>();
    private static final Map<String, Map<String, Object>> topupRequests = new LinkedHashMap<>();
    private static final Set<String> processedBankTransactions = new HashSet<>();

    private String getZaloPayAppId() {
        String env = System.getenv("ZALOPAY_APP_ID");
        return (env != null && !env.trim().isEmpty()) ? env.trim() : "2553";
    }

    private String getZaloPayKey1() {
        String env = System.getenv("ZALOPAY_KEY1");
        return (env != null && !env.trim().isEmpty()) ? env.trim() : "PcY4iZIKFCIdgZvA6ueMcGsEw2GaIcBh";
    }

    private String getZaloPayKey2() {
        String env = System.getenv("ZALOPAY_KEY2");
        return (env != null && !env.trim().isEmpty()) ? env.trim() : "kLfiRAWhA7AEbMeetKMuEc5W07nCfjfl";
    }

    private String getZaloPayEndpoint() {
        String env = System.getenv("ZALOPAY_ENDPOINT");
        if (env != null && !env.trim().isEmpty()) return env.trim();
        String appId = getZaloPayAppId();
        return "2553".equals(appId) ? "https://sb-openapi.zalopay.vn/v2/create" : "https://openapi.zalopay.vn/v2/create";
    }

    static {
        // Seed default wallet balances for demo users
        balances.put(1, 150000.0); // Demo student (id=1)
        balances.put(2, 250000.0); // Demo mentor (id=2)
        balances.put(3, 0.0);
    }

    @Override
    public void init() throws ServletException {
        gson = new GsonBuilder().setPrettyPrinting().create();
        sepayWebhookApiKey = loadSetting("SEPAY_WEBHOOK_API_KEY");
        sepayApiToken = loadSetting("SEPAY_API_TOKEN");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");

        String path = req.getServletPath();
        if (path == null) path = "";

        if (path.contains("sepay-payment-info")) {
            handleSepayPaymentInfo(req, resp);
        } else if (path.contains("topup-status")) {
            handleTopupStatus(req, resp);
        } else if (path.contains("topup-requests")) {
            if (!isAdmin(req)) {
                sendError(resp, HttpServletResponse.SC_FORBIDDEN, "Admin role is required");
                return;
            }
            List<Map<String, Object>> result;
            synchronized (topupRequests) {
                expirePendingTopups();
                result = new ArrayList<>(topupRequests.values());
            }
            resp.getWriter().write(gson.toJson(result));
        } else if (path.contains("balance")) {
            String userIdParam = req.getParameter("userId");
            int userId = 1;
            if (userIdParam != null && !userIdParam.trim().isEmpty()) {
                try {
                    userId = Integer.parseInt(userIdParam);
                } catch (NumberFormatException e) {
                    sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid userId parameter");
                    return;
                }
            }

            double balance = balances.getOrDefault(userId, 0.0);
            Map<String, Object> result = new HashMap<>();
            result.put("userId", userId);
            result.put("balance", balance);
            result.put("currency", "VND");
            result.put("updatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            resp.getWriter().write(gson.toJson(result));
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");
        req.setCharacterEncoding("UTF-8");

        String path = req.getServletPath();
        if (path == null) path = "";

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        } catch (Exception e) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid request body");
            return;
        }

        if (sb.length() == 0) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Empty request body");
            return;
        }

        JsonObject json;
        try {
            json = gson.fromJson(sb.toString(), JsonObject.class);
        } catch (Exception e) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid JSON format");
            return;
        }

        if (path.contains("sepay-webhook")) {
            handleSepayWebhook(req, json, resp);
        } else if (path.contains("topup-request")) {
            createTopupRequest(json, resp);
        } else if (path.contains("topup-approve")) {
            reviewTopupRequest(req, json, resp, true);
        } else if (path.contains("topup-reject")) {
            reviewTopupRequest(req, json, resp, false);
        } else if (path.contains("topup")) {
            int userId = json.has("userId") ? json.get("userId").getAsInt() : 0;
            double amount = json.has("amount") ? json.get("amount").getAsDouble() : 0.0;
            String method = json.has("method") ? json.get("method").getAsString().trim() : "";

            if (userId <= 0 || amount <= 0 || method.isEmpty()) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Validation failed: userId > 0, amount > 0, method non-empty are required");
                return;
            }

            double newBalance = balances.getOrDefault(userId, 0.0) + amount;
            balances.put(userId, newBalance);

            Map<String, Object> txn = new HashMap<>();
            txn.put("transactionId", "TXN_TOPUP_" + System.currentTimeMillis());
            txn.put("userId", userId);
            txn.put("amount", amount);
            txn.put("method", method);
            txn.put("status", "success");
            txn.put("newBalance", newBalance);
            txn.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            resp.getWriter().write(gson.toJson(txn));

        } else if (path.contains("send-gift")) {
            int fromUserId = json.has("fromUserId") ? json.get("fromUserId").getAsInt() : 0;
            int toMentorId = json.has("toMentorId") ? json.get("toMentorId").getAsInt() : 0;
            String giftCode = json.has("giftCode") ? json.get("giftCode").getAsString().trim() : "";
            double amount = json.has("amount") ? json.get("amount").getAsDouble() : 0.0;

            if (fromUserId <= 0 || toMentorId <= 0 || giftCode.isEmpty() || amount <= 0) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Validation failed: fromUserId > 0, toMentorId > 0, giftCode non-empty, amount > 0 are required");
                return;
            }

            double senderBalance = balances.getOrDefault(fromUserId, 0.0);
            if (senderBalance < amount) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Insufficient balance: Current balance is " + senderBalance);
                return;
            }

            double newSenderBalance = senderBalance - amount;
            balances.put(fromUserId, newSenderBalance);
            balances.put(toMentorId, balances.getOrDefault(toMentorId, 0.0) + amount);

            Map<String, Object> txn = new HashMap<>();
            txn.put("transactionId", "TXN_GIFT_" + System.currentTimeMillis());
            txn.put("fromUserId", fromUserId);
            txn.put("toMentorId", toMentorId);
            txn.put("giftCode", giftCode);
            txn.put("amount", amount);
            txn.put("status", "success");
            txn.put("newBalance", newSenderBalance);
            txn.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            resp.getWriter().write(gson.toJson(txn));

        } else if (path.contains("zalopay-create")) {
            // ── ZaloPay Order Creation ───────────────────────────────────────
            String userIdStr = "1";
            if (json.has("userId")) {
                try {
                    userIdStr = json.get("userId").getAsString();
                } catch (Exception e) {
                    userIdStr = "1";
                }
            }
            long amount = json.has("amount") ? json.get("amount").getAsLong() : 50000;
            String title = json.has("title") ? json.get("title").getAsString() : "Thanh toan LUCY Premium";

            String dateStr = new SimpleDateFormat("yyMMdd").format(new Date());
            String appTransId = dateStr + "_" + (100000 + new Random().nextInt(900000));
            long appTime = System.currentTimeMillis();

            String embedData = "{\"redirecturl\":\"http://localhost:5173\"}";
            String item = "[{\"itemid\":\"lucy_premium\",\"itemname\":\"" + title + "\",\"itemprice\":" + amount + ",\"itemquantity\":1}]";
            String description = "LUCY - " + title + " #" + appTransId;

            String appId = getZaloPayAppId();
            String key1 = getZaloPayKey1();
            String endpoint = getZaloPayEndpoint();

            // Compute ZaloPay HMAC SHA256 MAC
            String macInput = appId + "|" + appTransId + "|lucy_user_" + userIdStr + "|" + amount + "|" + appTime + "|" + embedData + "|" + item;
            String mac = hmacSHA256(macInput, key1);

            JsonObject zpReq = new JsonObject();
            zpReq.addProperty("app_id", Integer.parseInt(appId));
            zpReq.addProperty("app_user", "lucy_user_" + userIdStr);
            zpReq.addProperty("app_time", appTime);
            zpReq.addProperty("amount", amount);
            zpReq.addProperty("app_trans_id", appTransId);
            zpReq.addProperty("embed_data", embedData);
            zpReq.addProperty("item", item);
            zpReq.addProperty("description", description);
            zpReq.addProperty("bank_code", "");
            zpReq.addProperty("mac", mac);

            String orderUrl = null;
            String zpTransToken = null;

            try {
                URL url = new URL(endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(zpReq.toString().getBytes("UTF-8"));
                }

                if (conn.getResponseCode() == 200) {
                    try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                        StringBuilder respSb = new StringBuilder();
                        String line;
                        while ((line = br.readLine()) != null) respSb.append(line);
                        JsonObject zpResp = gson.fromJson(respSb.toString(), JsonObject.class);
                        if (zpResp != null && zpResp.has("order_url")) {
                            orderUrl = zpResp.get("order_url").getAsString();
                        }
                        if (zpResp != null && zpResp.has("zp_trans_token")) {
                            zpTransToken = zpResp.get("zp_trans_token").getAsString();
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("ZaloPay direct API call warning: " + e.getMessage());
            }

            // Fallback ZaloPay order URL for localhost offline/sandbox testing if direct gateway call is unreachable
            if (orderUrl == null || orderUrl.isEmpty()) {
                orderUrl = "https://qcgateway.zalopay.vn/openinapp/order?app_id=" + appId + "&app_trans_id=" + appTransId;
            }

            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("appId", appId);
            result.put("appTransId", appTransId);
            result.put("zpTransToken", zpTransToken != null ? zpTransToken : "ZPT_" + System.currentTimeMillis());
            result.put("amount", amount);
            result.put("orderUrl", orderUrl);
            result.put("qrCodeText", "zalopay://qr/p/v1/" + appTransId);
            result.put("createdAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            resp.getWriter().write(gson.toJson(result));

        } else if (path.contains("zalopay-confirm")) {
            // ── Confirm ZaloPay sandbox payment completion ───────────────────
            int userId = json.has("userId") ? json.get("userId").getAsInt() : 1;
            double amount = json.has("amount") ? json.get("amount").getAsDouble() : 50000.0;

            double newBalance = balances.getOrDefault(userId, 0.0) + amount;
            balances.put(userId, newBalance);

            Map<String, Object> txn = new HashMap<>();
            txn.put("status", "success");
            txn.put("userId", userId);
            txn.put("amount", amount);
            txn.put("newBalance", newBalance);
            txn.put("message", "Thanh toán ZaloPay thành công!");
            txn.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            resp.getWriter().write(gson.toJson(txn));

        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    private void handleSepayPaymentInfo(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (sepayApiToken == null || sepayApiToken.isEmpty()) {
            sendError(resp, HttpServletResponse.SC_SERVICE_UNAVAILABLE, "SEPAY_API_TOKEN is not configured");
            return;
        }
        long amount;
        try {
            amount = Long.parseLong(req.getParameter("amount"));
        } catch (Exception ex) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "A valid amount is required");
            return;
        }
        String reference = req.getParameter("reference") == null ? "" : req.getParameter("reference").trim().toUpperCase();
        if (amount <= 0 || reference.isEmpty() || !reference.matches("LUCY[A-Z0-9]+")) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid amount or payment reference");
            return;
        }

        HttpURLConnection connection = null;
        try {
            URL url = new URL("https://userapi.sepay.vn/v2/bank-accounts?active=true&page=1&per_page=20");
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + sepayApiToken);
            // SePay's edge protection blocks Java 8's default User-Agent with
            // Cloudflare error 1010. Identify this server-side integration.
            connection.setRequestProperty("User-Agent", "LucyBackendAPI/1.0");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(15000);

            int status = connection.getResponseCode();
            if (status != HttpServletResponse.SC_OK) {
                sendError(resp, HttpServletResponse.SC_BAD_GATEWAY, "SePay account API returned HTTP " + status);
                return;
            }
            JsonObject response;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), "UTF-8"))) {
                response = gson.fromJson(reader, JsonObject.class);
            }
            if (response == null || !response.has("data") || !response.get("data").isJsonArray()) {
                sendError(resp, HttpServletResponse.SC_BAD_GATEWAY, "Invalid response from SePay account API");
                return;
            }

            JsonObject account = null;
            for (com.google.gson.JsonElement element : response.getAsJsonArray("data")) {
                JsonObject candidate = element.getAsJsonObject();
                boolean active = true;
                if (candidate.has("active") && !candidate.get("active").isJsonNull()) {
                    String activeValue = candidate.get("active").getAsString();
                    active = "1".equals(activeValue) || "true".equalsIgnoreCase(activeValue)
                            || "active".equalsIgnoreCase(activeValue);
                }
                if (active) {
                    account = candidate;
                    break;
                }
            }
            if (account == null) {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "No active bank account is linked in SePay");
                return;
            }

            String accountNumber = account.get("account_number").getAsString();
            String accountName = account.get("account_holder_name").getAsString();
            // SePay API v2 returns bank fields directly on the account object.
            // Keep the nested fallback for compatibility with OAuth/v1 responses.
            String bankName;
            if (account.has("bank_short_name") && !account.get("bank_short_name").isJsonNull()) {
                bankName = account.get("bank_short_name").getAsString();
            } else {
                JsonObject bank = account.getAsJsonObject("bank");
                bankName = bank.get("short_name").getAsString();
            }
            String qrUrl = "https://vietqr.app/img?acc=" + java.net.URLEncoder.encode(accountNumber, "UTF-8")
                    + "&bank=" + java.net.URLEncoder.encode(bankName, "UTF-8")
                    + "&amount=" + amount
                    + "&des=" + java.net.URLEncoder.encode(reference, "UTF-8");

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("accountName", accountName);
            result.put("accountNumber", accountNumber);
            result.put("bankName", bankName);
            result.put("amount", amount);
            result.put("reference", reference);
            result.put("qrImageUrl", qrUrl);
            resp.getWriter().write(gson.toJson(result));
        } catch (Exception ex) {
            sendError(resp, HttpServletResponse.SC_BAD_GATEWAY, "Cannot load bank account from SePay");
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private void createTopupRequest(JsonObject json, HttpServletResponse resp) throws IOException {
        int userId = json.has("userId") ? json.get("userId").getAsInt() : 0;
        double amount = json.has("amount") ? json.get("amount").getAsDouble() : 0.0;
        String reference = json.has("reference") ? json.get("reference").getAsString().trim().toUpperCase() : "";
        String userName = json.has("userName") ? json.get("userName").getAsString().trim() : "User " + userId;
        if (userId <= 0 || amount <= 0 || reference.isEmpty()) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "userId, amount and reference are required");
            return;
        }
        synchronized (topupRequests) {
            expirePendingTopups();
            for (Map<String, Object> existing : topupRequests.values()) {
                if (reference.equals(existing.get("reference"))) {
                    sendError(resp, HttpServletResponse.SC_CONFLICT, "This transfer reference already exists");
                    return;
                }
            }
            String requestId = "TOPUP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("requestId", requestId);
            request.put("userId", userId);
            request.put("userName", userName);
            request.put("amount", amount);
            request.put("reference", reference);
            request.put("status", "pending");
            LocalDateTime createdAt = LocalDateTime.now();
            request.put("createdAt", createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            request.put("expiresAt", createdAt.plusMinutes(5).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            request.put("reviewedAt", null);
            topupRequests.put(requestId, request);
            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.getWriter().write(gson.toJson(request));
        }
    }

    private void handleTopupStatus(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String reference = req.getParameter("reference") == null ? "" : req.getParameter("reference").trim().toUpperCase();
        int userId;
        try {
            userId = Integer.parseInt(req.getParameter("userId"));
        } catch (Exception ex) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "A valid userId is required");
            return;
        }
        if (reference.isEmpty()) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "reference is required");
            return;
        }
        synchronized (topupRequests) {
            expirePendingTopups();
            for (Map<String, Object> request : topupRequests.values()) {
                int requestUserId = ((Number) request.get("userId")).intValue();
                if (requestUserId == userId && reference.equals(request.get("reference"))) {
                    resp.getWriter().write(gson.toJson(request));
                    return;
                }
            }
        }
        sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Top-up request not found");
    }

    private void reviewTopupRequest(HttpServletRequest req, JsonObject json,
            HttpServletResponse resp, boolean approve) throws IOException {
        if (!isAdmin(req)) {
            sendError(resp, HttpServletResponse.SC_FORBIDDEN, "Admin role is required");
            return;
        }
        String requestId = json.has("requestId") ? json.get("requestId").getAsString().trim() : "";
        synchronized (topupRequests) {
            expirePendingTopups();
            Map<String, Object> request = topupRequests.get(requestId);
            if (request == null) {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Top-up request not found");
                return;
            }
            if (!"pending".equals(request.get("status"))) {
                sendError(resp, HttpServletResponse.SC_CONFLICT, "Top-up request was already reviewed");
                return;
            }
            request.put("status", approve ? "approved" : "rejected");
            request.put("reviewedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            request.put("approvalSource", "admin");
            if (approve) creditTopupRequest(request, ((Number) request.get("amount")).doubleValue());
            resp.getWriter().write(gson.toJson(request));
        }
    }

    private void handleSepayWebhook(HttpServletRequest req, JsonObject json,
            HttpServletResponse resp) throws IOException {
        if (sepayWebhookApiKey == null || sepayWebhookApiKey.isEmpty()) {
            sendError(resp, HttpServletResponse.SC_SERVICE_UNAVAILABLE, "SePay webhook is not configured");
            return;
        }
        String authorization = req.getHeader("Authorization");
        if (authorization == null || !constantTimeEquals("Apikey " + sepayWebhookApiKey, authorization.trim())) {
            sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Invalid SePay webhook credentials");
            return;
        }
        String transferType = json.has("transferType") ? json.get("transferType").getAsString() : "";
        if (!"in".equalsIgnoreCase(transferType)) {
            sendWebhookResult(resp, "ignored", "Not an incoming transfer", null);
            return;
        }
        String transactionId = json.has("id") ? json.get("id").getAsString() : "";
        String referenceCode = json.has("referenceCode") ? json.get("referenceCode").getAsString().trim() : "";
        String deduplicationKey = !transactionId.isEmpty() ? "ID:" + transactionId : "REF:" + referenceCode;
        String content = json.has("content") ? json.get("content").getAsString().toUpperCase() : "";
        double transferAmount = json.has("transferAmount") ? json.get("transferAmount").getAsDouble() : 0.0;
        if ((transactionId.isEmpty() && referenceCode.isEmpty()) || content.isEmpty() || transferAmount <= 0) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid SePay transaction payload");
            return;
        }
        synchronized (topupRequests) {
            expirePendingTopups();
            if (processedBankTransactions.contains(deduplicationKey)) {
                sendWebhookResult(resp, "duplicate", "Transaction was already processed", null);
                return;
            }
            Map<String, Object> matchedRequest = null;
            for (Map<String, Object> candidate : topupRequests.values()) {
                String paymentReference = String.valueOf(candidate.get("reference")).toUpperCase();
                double expectedAmount = ((Number) candidate.get("amount")).doubleValue();
                if ("pending".equals(candidate.get("status")) && content.contains(paymentReference)
                        && Math.abs(expectedAmount - transferAmount) < 0.01) {
                    matchedRequest = candidate;
                    break;
                }
            }
            if (matchedRequest == null) {
                sendWebhookResult(resp, "unmatched", "No pending top-up matches content and amount", null);
                return;
            }
            matchedRequest.put("status", "approved");
            matchedRequest.put("reviewedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            matchedRequest.put("bankTransactionId", transactionId);
            matchedRequest.put("bankReferenceCode", referenceCode);
            matchedRequest.put("approvalSource", "sepay_webhook");
            creditTopupRequest(matchedRequest, transferAmount);
            processedBankTransactions.add(deduplicationKey);
            sendWebhookResult(resp, "success", "Wallet credited", matchedRequest);
        }
    }

    private void creditTopupRequest(Map<String, Object> request, double amount) {
        int userId = ((Number) request.get("userId")).intValue();
        double newBalance = balances.getOrDefault(userId, 0.0) + amount;
        balances.put(userId, newBalance);
        request.put("newBalance", newBalance);
    }

    private void expirePendingTopups() {
        LocalDateTime now = LocalDateTime.now();
        for (Map<String, Object> request : topupRequests.values()) {
            if (!"pending".equals(request.get("status"))) continue;
            Object expiresAtValue = request.get("expiresAt");
            if (expiresAtValue == null) continue;
            try {
                LocalDateTime expiresAt = LocalDateTime.parse(String.valueOf(expiresAtValue), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                if (!now.isBefore(expiresAt)) {
                    request.put("status", "expired");
                    request.put("reviewedAt", now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                    request.put("approvalSource", "timeout");
                }
            } catch (Exception ignored) { }
        }
    }

    private void sendWebhookResult(HttpServletResponse resp, String status,
            String message, Map<String, Object> request) throws IOException {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("status", status);
        result.put("message", message);
        if (request != null) result.put("topupRequest", request);
        resp.getWriter().write(gson.toJson(result));
    }

    private boolean isAdmin(HttpServletRequest req) {
        return "ADMIN".equalsIgnoreCase(req.getHeader("X-LUCY-ROLE"));
    }

    private boolean constantTimeEquals(String expected, String actual) {
        if (expected == null || actual == null) return false;
        int difference = expected.length() ^ actual.length();
        int maxLength = Math.max(expected.length(), actual.length());
        for (int i = 0; i < maxLength; i++) {
            char left = i < expected.length() ? expected.charAt(i) : 0;
            char right = i < actual.length() ? actual.charAt(i) : 0;
            difference |= left ^ right;
        }
        return difference == 0;
    }

    private String loadSetting(String name) {
        String value = System.getenv(name);
        if (value == null || value.trim().isEmpty()) value = System.getProperty(name);
        if (value == null || value.trim().isEmpty()) {
            java.io.File envFile = findEnvFile();
            if (envFile.exists()) {
                try (BufferedReader reader = new BufferedReader(new java.io.FileReader(envFile))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        String trimmed = line.trim();
                        if (trimmed.startsWith(name + "=")) {
                            value = trimmed.substring(name.length() + 1).trim();
                            if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\""))
                                    || (value.startsWith("'") && value.endsWith("'")))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            break;
                        }
                    }
                } catch (Exception ignored) { }
            }
        }
        return value == null ? "" : value.trim();
    }

    /**
     * NetBeans starts Tomcat with Tomcat's bin directory as the working
     * directory. Resolve .env from both there and the deployed webapp so the
     * project-level .env is found regardless of how the application starts.
     */
    private java.io.File findEnvFile() {
        java.util.List<java.io.File> roots = new java.util.ArrayList<>();
        roots.add(new java.io.File(System.getProperty("user.dir", ".")));

        String webRoot = getServletContext().getRealPath("/");
        if (webRoot != null && !webRoot.trim().isEmpty()) {
            roots.add(new java.io.File(webRoot));
        }

        for (java.io.File root : roots) {
            java.io.File current = root;
            for (int depth = 0; current != null && depth < 8; depth++) {
                java.io.File candidate = new java.io.File(current, ".env");
                if (candidate.isFile() && candidate.canRead()) return candidate;
                current = current.getParentFile();
            }
        }
        return new java.io.File(".env");
    }

    private static String hmacSHA256(String data, String key) {
        try {
            javax.crypto.Mac hmacSHA256 = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(key.getBytes("UTF-8"), "HmacSHA256");
            hmacSHA256.init(secretKey);
            byte[] bytes = hmacSHA256.doFinal(data.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private void sendError(HttpServletResponse resp, int status, String msg) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"error\":\"" + msg + "\"}");
    }
}
