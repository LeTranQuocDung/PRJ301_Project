package com.lucy.avatar;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ============================================================
 * AVATAR PERSONA MANAGER — Cơ chế ẩn danh Lucy
 * ============================================================
 * Mỗi user vào phòng được gán Avatar Persona:
 *   - Tên ẩn danh (tiếng Anh / Nhật / Trung)
 *   - Emoji avatar
 *   - Màu định danh duy nhất trong phòng
 *   - Role: "member" hoặc "super" (Content Creator)
 * realSessionId KHÔNG BAO GIỜ đưa ra ngoài phòng.
 * ============================================================
 */
public class AvatarPersonaManager {

    // ── Singleton ──────────────────────────────────────────
    private static final AvatarPersonaManager INSTANCE = new AvatarPersonaManager();
    public static AvatarPersonaManager getInstance() { return INSTANCE; }

    // ── Name pools ─────────────────────────────────────────
    private static final String[] NAMES_EN = {
        "Blaze","Echo","Nova","Cipher","Drift","Phantom","Volt",
        "Zephyr","Neon","Pixel","Frost","Ember","Storm","Arc",
        "Flux","Gale","Haze","Ion","Luna","Mist","Orb","Pulse"
    };
    private static final String[] NAMES_JA = {
        "ソラ","リン","カゼ","ヒカリ","ツキ","ハナ","ユキ","イズミ","タキ","コト"
    };
    private static final String[] NAMES_ZH = {
        "云朵","星河","晨曦","幽谷","微风","彩虹","翠竹","碧波","明月","飞燕"
    };
    private static final String[] EMOJIS = {
        "🦊","🐺","🦁","🐯","🦅","🦋","🐉","🌙","⚡","🔥",
        "🌊","❄️","🌸","🍀","🎭","🦄","🎯","💎","🌟","🎪"
    };
    private static final String[] COLORS = {
        "#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7",
        "#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE","#82E0AA",
        "#F1948A","#85C1E9","#A9DFBF","#F9E79F","#D7BDE2"
    };

    // key = "roomId:sessionId" → Persona
    private final Map<String, AvatarPersona> personaMap = new ConcurrentHashMap<>();
    // key = roomId → Set<usedName>
    private final Map<String, Set<String>> usedNames = new ConcurrentHashMap<>();
    // key = roomId → Set<usedColor>
    private final Map<String, Set<String>> usedColors = new ConcurrentHashMap<>();

    private AvatarPersonaManager() {}

    // ── Public API ─────────────────────────────────────────

    /**
     * Gán Avatar Persona khi user join phòng.
     * @param sessionId  WebSocket session ID (không expose ra ngoài)
     * @param roomId     ID phòng
     * @param role       "member" hoặc "super"
     * @param language   "EN" | "JA" | "ZH"
     */
    public AvatarPersona assign(String sessionId, String roomId, String role, String language) {
        String key = roomId + ":" + sessionId;
        if (personaMap.containsKey(key)) return personaMap.get(key);

        usedNames.putIfAbsent(roomId, Collections.synchronizedSet(new HashSet<>()));
        usedColors.putIfAbsent(roomId, Collections.synchronizedSet(new HashSet<>()));

        String name  = pickUniqueName(roomId, language, role);
        String color = pickUniqueColor(roomId);
        String emoji = EMOJIS[new Random().nextInt(EMOJIS.length)];

        AvatarPersona p = new AvatarPersona(
            UUID.randomUUID().toString().replace("-","").substring(0,12),
            name, emoji, color, role,
            false, false, System.currentTimeMillis(), roomId
        );
        personaMap.put(key, p);
        return p;
    }

    public AvatarPersona getPersona(String sessionId, String roomId) {
        return personaMap.get(roomId + ":" + sessionId);
    }

    public AvatarPersona updateState(String sessionId, String roomId,
                                     Boolean isMuted, Boolean isHandRaised) {
        AvatarPersona p = personaMap.get(roomId + ":" + sessionId);
        if (p == null) return null;
        if (isMuted      != null) p.setMuted(isMuted);
        if (isHandRaised != null) p.setHandRaised(isHandRaised);
        return p;
    }

    public void release(String sessionId, String roomId) {
        AvatarPersona p = personaMap.remove(roomId + ":" + sessionId);
        if (p != null) {
            Set<String> colors = usedColors.get(roomId);
            if (colors != null) colors.remove(p.getIdentityColor());
        }
    }

    public void releaseRoom(String roomId) {
        usedNames.remove(roomId);
        usedColors.remove(roomId);
        personaMap.entrySet().removeIf(e -> e.getKey().startsWith(roomId + ":"));
    }

    /** Danh sách persona công khai trong phòng (không có sessionId) */
    public List<AvatarPersona> getPublicList(String roomId) {
        List<AvatarPersona> list = new ArrayList<>();
        for (Map.Entry<String, AvatarPersona> e : personaMap.entrySet()) {
            if (e.getKey().startsWith(roomId + ":")) list.add(e.getValue());
        }
        return list;
    }

    // ── Helpers ────────────────────────────────────────────

    private String pickUniqueName(String roomId, String language, String role) {
        Set<String> used = usedNames.get(roomId);
        String[] pool = "JA".equals(language) ? NAMES_JA :
                        "ZH".equals(language) ? NAMES_ZH : NAMES_EN;

        List<String> available = new ArrayList<>();
        for (String n : pool) if (!used.contains(n)) available.add(n);

        String picked;
        if (available.isEmpty()) {
            picked = pool[new Random().nextInt(pool.length)]
                   + (new Random().nextInt(99) + 1);
        } else {
            picked = available.get(new Random().nextInt(available.size()));
        }

        if ("super".equals(role)) picked = "★ " + picked;
        used.add(picked);
        return picked;
    }

    private String pickUniqueColor(String roomId) {
        Set<String> used = usedColors.get(roomId);
        for (String c : COLORS) {
            if (!used.contains(c)) { used.add(c); return c; }
        }
        return COLORS[new Random().nextInt(COLORS.length)];
    }
}
