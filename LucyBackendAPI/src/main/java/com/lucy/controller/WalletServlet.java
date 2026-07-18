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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@WebServlet(urlPatterns = {
    "/api/wallet/balance",
    "/api/wallet/topup",
    "/api/wallet/send-gift"
})
public class WalletServlet extends HttpServlet {

    private Gson gson;
    private static final Map<Integer, Double> balances = new HashMap<>();

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
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.getWriter().write("{\"error\":\"Endpoint not found\"}");
        }
    }

    private void sendError(HttpServletResponse resp, int status, String msg) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"error\":\"" + msg + "\"}");
    }
}
