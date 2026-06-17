package com.lucy.agora;

import com.lucy.config.AppConfig;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.*;
import java.util.zip.CRC32;

/**
 * ============================================================
 * AGORA TOKEN UTIL — Tạo RTC Token hoàn toàn bằng Java thuần
 * ============================================================
 * Không dùng SDK Agora — tự implement thuật toán tạo token
 * theo spec chính thức của Agora AccessToken V2.
 *
 * Cách dùng:
 *   String token = AgoraTokenUtil.buildToken(channelName, uid, "publisher");
 * ============================================================
 */
public class AgoraTokenUtil {

    private static final int ROLE_PUBLISHER  = 1;
    private static final int ROLE_SUBSCRIBER = 2;

    // Service type
    private static final short SERVICE_RTC = 1;

    // Privilege
    private static final short PRIVILEGE_JOIN_CHANNEL      = 1;
    private static final short PRIVILEGE_PUBLISH_AUDIO     = 2;
    private static final short PRIVILEGE_PUBLISH_VIDEO     = 3;
    private static final short PRIVILEGE_PUBLISH_DATASTREAM = 4;

    /**
     * Tạo Agora RTC Token V2
     *
     * @param channelName Tên channel (= roomId)
     * @param uid         UID người dùng (0 = auto)
     * @param role        "publisher" hoặc "audience"
     * @return Token string
     */
    public static String buildToken(String channelName, int uid, String role) {
        String appId          = AppConfig.AGORA_APP_ID;
        String appCertificate = AppConfig.AGORA_APP_CERTIFICATE;
        int expireSeconds     = AppConfig.AGORA_TOKEN_EXPIRE_SECONDS;

        long issueTs  = System.currentTimeMillis() / 1000;
        long expireTs = issueTs + expireSeconds;

        String salt = String.valueOf(new Random().nextInt(99999999) + 1);

        boolean isPublisher = "publisher".equalsIgnoreCase(role);

        // Build privilege map
        Map<Short, Integer> privileges = new LinkedHashMap<>();
        privileges.put(PRIVILEGE_JOIN_CHANNEL, (int) expireTs);
        if (isPublisher) {
            privileges.put(PRIVILEGE_PUBLISH_AUDIO,     (int) expireTs);
            privileges.put(PRIVILEGE_PUBLISH_VIDEO,     (int) expireTs);
            privileges.put(PRIVILEGE_PUBLISH_DATASTREAM,(int) expireTs);
        }

        try {
            // Pack message = (salt, ts, expire, privileges)
            byte[] message = packMessage(Integer.parseInt(salt), (int) issueTs, (int) expireTs, privileges);

            // Signature = HMAC-SHA256(appCertificate, appId + channelName + uidStr + message)
            String uidStr = uid == 0 ? "" : String.valueOf(uid);
            byte[] signing = concat(
                appId.getBytes("UTF-8"),
                channelName.getBytes("UTF-8"),
                uidStr.getBytes("UTF-8"),
                message
            );
            byte[] signature = hmacSha256(appCertificate.getBytes("UTF-8"), signing);

            // CRC32 of appId certificate
            CRC32 crcApp  = new CRC32(); crcApp.update(appId.getBytes("UTF-8"));
            CRC32 crcCert = new CRC32(); crcCert.update(appCertificate.getBytes("UTF-8"));

            // Pack content
            ByteBuffer content = ByteBuffer.allocate(
                4 + 4 + signature.length + 4 + message.length
            );
            content.order(ByteOrder.LITTLE_ENDIAN);
            content.putInt((int) crcApp.getValue());
            content.putInt((int) crcCert.getValue());
            putBytes(content, signature);
            putBytes(content, message);

            // version(006) + appId(32) + base64(content)
            String b64 = Base64.getEncoder().encodeToString(content.array());
            return "006" + appId + b64;

        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo Agora token: " + e.getMessage(), e);
        }
    }

    /**
     * Tạo token cho Recording bot (uid = 0, role = publisher)
     */
    public static String buildRecordingToken(String channelName) {
        return buildToken(channelName, 0, "publisher");
    }

    // ── Private helpers ───────────────────────────────────────────────

    private static byte[] packMessage(int salt, int issueTs, int expireTs,
                                      Map<Short, Integer> privileges) throws Exception {
        int size = 4 + 4 + 4 + 2 + privileges.size() * 6;
        ByteBuffer buf = ByteBuffer.allocate(size);
        buf.order(ByteOrder.LITTLE_ENDIAN);
        buf.putInt(salt);
        buf.putInt(issueTs);
        buf.putInt(expireTs);
        buf.putShort((short) privileges.size());
        for (Map.Entry<Short, Integer> e : privileges.entrySet()) {
            buf.putShort(e.getKey());
            buf.putInt(e.getValue());
        }
        return buf.array();
    }

    private static byte[] hmacSha256(byte[] key, byte[] data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data);
    }

    private static byte[] concat(byte[]... arrays) {
        int total = 0;
        for (byte[] a : arrays) total += a.length;
        byte[] result = new byte[total];
        int pos = 0;
        for (byte[] a : arrays) {
            System.arraycopy(a, 0, result, pos, a.length);
            pos += a.length;
        }
        return result;
    }

    private static void putBytes(ByteBuffer buf, byte[] data) {
        buf.putShort((short) data.length);
        buf.put(data);
    }
}
