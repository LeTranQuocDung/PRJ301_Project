package com.lucy.recording;

import com.google.gson.*;
import com.lucy.config.AppConfig;
import org.apache.http.client.methods.*;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.*;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ============================================================
 * AGORA RECORDING SERVICE — Cloud Recording → Podcast
 * ============================================================
 * Gọi Agora RESTful Cloud Recording API:
 *   1. acquire()  → resourceId
 *   2. start()    → sid
 *   3. query()    → trạng thái
 *   4. stop()     → fileList + podcastMeta
 * ============================================================
 */
public class AgoraRecordingService {

    private static final Logger log = LoggerFactory.getLogger(AgoraRecordingService.class);
    private static final AgoraRecordingService INSTANCE = new AgoraRecordingService();
    public static AgoraRecordingService getInstance() { return INSTANCE; }

    private static final String BASE = "https://api.agora.io/v1/apps/";
    private final Gson gson = new Gson();

    // roomId → RecordingSession
    private final ConcurrentHashMap<String, RecordingSession> sessions = new ConcurrentHashMap<>();

    private AgoraRecordingService() {}

    // ── Inner model ────────────────────────────────────────

    public static class RecordingSession {
        public String roomId;
        public String resourceId;
        public String sid;
        public long   startedAt;
        public long   stoppedAt;
        public String status;   // "recording" | "stopped"
        public List<Map<String,Object>> fileList = new ArrayList<>();
    }

    public static class PodcastMeta {
        public String podcastId;
        public String roomId;
        public String title;
        public String description;
        public long   duration;
        public String durationFormatted;
        public String recordedAt;
        public String status;   // "draft"
        public List<Map<String,Object>> audioFiles;
        public List<String> tags;
    }

    // ── Public API ─────────────────────────────────────────

    /** Bước 1: acquire resourceId */
    public String acquire(String roomId) throws Exception {
        String url = BASE + AppConfig.AGORA_APP_ID + "/cloud_recording/acquire";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cname", roomId);
        body.put("uid",   "0");
        Map<String, Object> cr = new LinkedHashMap<>();
        cr.put("resourceExpiredHour", 24);
        cr.put("scene", 0);
        body.put("clientRequest", cr);

        JsonObject res = post(url, gson.toJson(body));
        String resourceId = res.get("resourceId").getAsString();
        log.info("[Recording] acquire roomId={} resourceId={}", roomId, resourceId);
        return resourceId;
    }

    /** Bước 2: start recording */
    public String start(String roomId, String resourceId, String token) throws Exception {
        String url = BASE + AppConfig.AGORA_APP_ID
            + "/cloud_recording/resourceid/" + resourceId + "/mode/mix/start";

        Map<String, Object> recConfig = new LinkedHashMap<>();
        recConfig.put("maxIdleTime",  30);
        recConfig.put("streamTypes",  0);       // audio only
        recConfig.put("channelType",  0);
        recConfig.put("audioProfile", 2);
        recConfig.put("subscribeAudioUids", Collections.singletonList("#allstream#"));
        recConfig.put("subscribeUidGroup",  0);

        Map<String, Object> fileConfig = new LinkedHashMap<>();
        fileConfig.put("avFileType", Arrays.asList("hls", "mp4"));

        Map<String, Object> storage = buildStorageConfig(roomId);

        Map<String, Object> cr = new LinkedHashMap<>();
        cr.put("token",                token);
        cr.put("recordingConfig",      recConfig);
        cr.put("recordingFileConfig",  fileConfig);
        cr.put("storageConfig",        storage);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cname",         roomId);
        body.put("uid",           "0");
        body.put("clientRequest", cr);

        JsonObject res = post(url, gson.toJson(body));
        String sid = res.get("sid").getAsString();

        RecordingSession session = new RecordingSession();
        session.roomId     = roomId;
        session.resourceId = resourceId;
        session.sid        = sid;
        session.startedAt  = System.currentTimeMillis();
        session.status     = "recording";
        sessions.put(roomId, session);

        log.info("[Recording] STARTED roomId={} sid={}", roomId, sid);
        return sid;
    }

    /** Bước 3: query trạng thái */
    public Map<String, Object> query(String roomId) throws Exception {
        RecordingSession session = sessions.get(roomId);
        if (session == null) return Collections.singletonMap("status", "not_found");

        String url = BASE + AppConfig.AGORA_APP_ID
            + "/cloud_recording/resourceid/" + session.resourceId
            + "/sid/" + session.sid + "/mode/mix/query";

        JsonObject res = get(url);
        JsonObject sr  = res.has("serverResponse") ? res.getAsJsonObject("serverResponse") : new JsonObject();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status",   sr.has("status")   ? sr.get("status").getAsInt()   : -1);
        result.put("duration", sr.has("duration") ? sr.get("duration").getAsLong() : 0L);
        return result;
    }

    /** Bước 4: stop recording → PodcastMeta */
    public PodcastMeta stop(String roomId) throws Exception {
        RecordingSession session = sessions.get(roomId);
        if (session == null) throw new IllegalStateException("Không có recording session cho room " + roomId);

        String url = BASE + AppConfig.AGORA_APP_ID
            + "/cloud_recording/resourceid/" + session.resourceId
            + "/sid/" + session.sid + "/mode/mix/stop";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cname", roomId);
        body.put("uid",   "0");
        body.put("clientRequest", new HashMap<>());

        JsonObject res = post(url, gson.toJson(body));
        JsonObject sr  = res.has("serverResponse") ? res.getAsJsonObject("serverResponse") : new JsonObject();

        // Lấy file list
        List<Map<String,Object>> fileList = new ArrayList<>();
        if (sr.has("fileList") && sr.get("fileList").isJsonArray()) {
            for (JsonElement fe : sr.getAsJsonArray("fileList")) {
                JsonObject f = fe.getAsJsonObject();
                Map<String,Object> fm = new LinkedHashMap<>();
                fm.put("fileName",  f.has("fileName")  ? f.get("fileName").getAsString()  : "");
                fm.put("fileSize",  f.has("fileSize")   ? f.get("fileSize").getAsLong()    : 0L);
                fm.put("trackType", f.has("trackType") ? f.get("trackType").getAsString() : "");
                fm.put("url",       buildS3Url(fm.get("fileName").toString()));
                fileList.add(fm);
            }
        }

        session.stoppedAt = System.currentTimeMillis();
        session.status    = "stopped";
        session.fileList  = fileList;
        sessions.remove(roomId);

        long durationSec = (session.stoppedAt - session.startedAt) / 1000;

        PodcastMeta meta = new PodcastMeta();
        meta.podcastId          = "LUCY-" + roomId + "-" + System.currentTimeMillis();
        meta.roomId             = roomId;
        meta.title              = "Lucy Live Recording — " + new java.util.Date(session.startedAt);
        meta.description        = "Buổi học trực tiếp được ghi lại từ Lucy Live Room.";
        meta.duration           = durationSec;
        meta.durationFormatted  = formatDuration(durationSec);
        meta.recordedAt         = new java.util.Date(session.startedAt).toString();
        meta.status             = "draft";
        meta.audioFiles         = fileList;
        meta.tags               = Arrays.asList("lucy-live", "language-learning");

        log.info("[Recording] STOPPED roomId={} podcast={} dur={}",
            roomId, meta.podcastId, meta.durationFormatted);
        return meta;
    }

    /** Quick start (acquire + start) */
    public RecordingSession startRecording(String roomId, String token) throws Exception {
        String resourceId = acquire(roomId);
        String sid        = start(roomId, resourceId, token);
        return sessions.get(roomId);
    }

    public boolean isRecording(String roomId) {
        return sessions.containsKey(roomId);
    }

    // ── Private helpers ────────────────────────────────────

    private Map<String, Object> buildStorageConfig(String roomId) {
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("vendor",    1);          // AWS S3
        cfg.put("region",    14);         // ap-southeast-1
        cfg.put("bucket",    AppConfig.S3_BUCKET);
        cfg.put("accessKey", AppConfig.AWS_ACCESS_KEY);
        cfg.put("secretKey", AppConfig.AWS_SECRET_KEY);
        cfg.put("fileNamePrefix", Arrays.asList("lucy-recordings", roomId));
        return cfg;
    }

    private String buildS3Url(String fileName) {
        return "https://" + AppConfig.S3_BUCKET + ".s3."
            + AppConfig.AWS_REGION + ".amazonaws.com/" + fileName;
    }

    private String formatDuration(long seconds) {
        long h = seconds / 3600, m = (seconds % 3600) / 60, s = seconds % 60;
        if (h > 0) return String.format("%d:%02d:%02d", h, m, s);
        return String.format("%02d:%02d", m, s);
    }

    private String authHeader() {
        String creds = AppConfig.AGORA_CUSTOMER_KEY + ":" + AppConfig.AGORA_CUSTOMER_SECRET;
        return "Basic " + Base64.getEncoder().encodeToString(creds.getBytes());
    }

    private JsonObject post(String url, String body) throws Exception {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost req = new HttpPost(url);
            req.setHeader("Content-Type", "application/json");
            req.setHeader("Authorization", authHeader());
            req.setEntity(new StringEntity(body, "UTF-8"));
            try (CloseableHttpResponse resp = client.execute(req)) {
                String json = EntityUtils.toString(resp.getEntity(), "UTF-8");
                return JsonParser.parseString(json).getAsJsonObject();
            }
        }
    }

    private JsonObject get(String url) throws Exception {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpGet req = new HttpGet(url);
            req.setHeader("Authorization", authHeader());
            try (CloseableHttpResponse resp = client.execute(req)) {
                String json = EntityUtils.toString(resp.getEntity(), "UTF-8");
                return JsonParser.parseString(json).getAsJsonObject();
            }
        }
    }
}
