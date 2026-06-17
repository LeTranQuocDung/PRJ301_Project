package com.lucy.config;

/**
 * Cấu hình trung tâm của Lucy Realtime Server.
 * Tất cả giá trị đọc từ System.getenv() hoặc giá trị mặc định.
 * Chỉnh sửa tại đây hoặc set Environment Variable trên server.
 */
public class AppConfig {

    // ── Agora ─────────────────────────────────────────────────────────
    public static final String AGORA_APP_ID =
            env("AGORA_APP_ID", "YOUR_AGORA_APP_ID");

    public static final String AGORA_APP_CERTIFICATE =
            env("AGORA_APP_CERTIFICATE", "YOUR_AGORA_APP_CERTIFICATE");

    /** Thời hạn token Agora (giây) */
    public static final int AGORA_TOKEN_EXPIRE_SECONDS =
            Integer.parseInt(env("AGORA_TOKEN_EXPIRE_SECONDS", "3600"));

    /** Customer Key + Secret cho Cloud Recording RESTful API */
    public static final String AGORA_CUSTOMER_KEY =
            env("AGORA_CUSTOMER_KEY", "YOUR_CUSTOMER_KEY");

    public static final String AGORA_CUSTOMER_SECRET =
            env("AGORA_CUSTOMER_SECRET", "YOUR_CUSTOMER_SECRET");

    // ── Stage Timer ───────────────────────────────────────────────────
    /** Thời lượng mỗi Stage (phút) */
    public static final int DEFAULT_STAGE_DURATION_MINUTES =
            Integer.parseInt(env("DEFAULT_STAGE_DURATION_MINUTES", "15"));

    // ── Lucy Java Backend (nếu chạy chung project thì dùng nội bộ) ───
    public static final String LUCY_API_BASE_URL =
            env("LUCY_API_BASE_URL", "http://localhost:8080/LucyBackendAPI");

    // ── AWS S3 ────────────────────────────────────────────────────────
    public static final String AWS_ACCESS_KEY    = env("AWS_ACCESS_KEY_ID", "");
    public static final String AWS_SECRET_KEY    = env("AWS_SECRET_ACCESS_KEY", "");
    public static final String AWS_REGION        = env("AWS_REGION", "ap-southeast-1");
    public static final String S3_BUCKET         = env("S3_BUCKET_NAME", "lucy-podcast-recordings");

    // ── Misc ──────────────────────────────────────────────────────────
    public static final int MAX_VIRTUAL_AVATARS  = 5;
    public static final int MAX_PARTICIPANTS     = 100;

    private static String env(String key, String defaultVal) {
        String v = System.getenv(key);
        return (v != null && !v.isEmpty()) ? v : defaultVal;
    }
}
