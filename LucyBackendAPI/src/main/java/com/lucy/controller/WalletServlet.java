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
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@WebServlet(urlPatterns = {
    "/api/wallet/balance",
    "/api/wallet/topup",
    "/api/wallet/send-gift",
    "/api/wallet/zalopay-create",
    "/api/wallet/zalopay-confirm"
})
public class WalletServlet extends HttpServlet {

    private Gson gson;
    private static final Map<Integer, Double> balances = new HashMap<>();

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

        if (path.contains("balance")) {
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

        if (path.contains("topup")) {
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
