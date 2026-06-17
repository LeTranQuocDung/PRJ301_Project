package com.lucy.room;

import com.lucy.config.AppConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.*;
import java.util.function.Consumer;

/**
 * ============================================================
 * STAGE ENGINE — Tự động chuyển Stage phòng học Lucy
 * ============================================================
 * Logic:
 *   1. Nhận danh sách stages từ LucyContentService
 *   2. Đếm ngược bằng ScheduledExecutorService
 *   3. Mỗi giây gọi onTick callback → WS broadcast
 *   4. Hết giờ → auto nextStage → onStageChanged callback
 *   5. Host có thể: next / prev / jump / pause / setDuration
 * ============================================================
 */
public class StageEngine {

    private static final Logger log = LoggerFactory.getLogger(StageEngine.class);
    private static final StageEngine INSTANCE = new StageEngine();
    public static StageEngine getInstance() { return INSTANCE; }

    // Executor dùng chung cho tất cả phòng (daemon threads)
    private final ScheduledExecutorService scheduler =
        Executors.newScheduledThreadPool(4, r -> {
            Thread t = new Thread(r, "lucy-stage-timer");
            t.setDaemon(true);
            return t;
        });

    // Map roomId → RoomStageState
    private final ConcurrentHashMap<String, RoomStageState> rooms = new ConcurrentHashMap<>();

    private StageEngine() {}

    // ── Inner state class ──────────────────────────────────

    public static class RoomStageState {
        String roomId;
        String language;
        List<StageItem> stages;
        int currentIndex;
        long stageDurationMs;
        Map<Integer, Long> customDurations = new HashMap<>();

        // Runtime
        volatile boolean isPaused = false;
        volatile long startedAt   = 0;
        volatile long remainingMs = 0;
        long pausedAt             = 0;

        ScheduledFuture<?> tickFuture    = null;
        ScheduledFuture<?> timeoutFuture = null;

        // Callbacks → WebSocket handler đăng ký
        Consumer<StageEvent> onStageStarted;
        Consumer<StageEvent> onStageChanged;
        Consumer<TickEvent>  onTick;
        Consumer<StageEvent> onPaused;
        Consumer<StageEvent> onResumed;
        Runnable             onAllCompleted;

        StageItem current() {
            if (stages == null || currentIndex >= stages.size()) return null;
            return stages.get(currentIndex);
        }

        long durationFor(int index) {
            Long custom = customDurations.get(index);
            return custom != null ? custom : stageDurationMs;
        }
    }

    /** Một stage/level trong danh sách */
    public static class StageItem {
        public String levelName;
        public String stage;
        public String languageCode;
        public String subLevel;
        public String questionAi;
        public String answer;
    }

    /** Event payload cho callbacks */
    public static class StageEvent {
        public String roomId;
        public int stageIndex;
        public int totalStages;
        public StageItem stage;
        public long durationMs;
        public long remainingMs;
        public String reason;    // "auto" | "manual_next" | "manual_prev" | "manual_jump"
        public String triggeredBy;
    }

    public static class TickEvent {
        public String roomId;
        public int stageIndex;
        public long remainingMs;
        public long durationMs;
        public double progress;  // 0.0 → 1.0
    }

    // ── Public API ─────────────────────────────────────────

    /**
     * Khởi tạo Stage Engine cho phòng mới.
     * stages được inject từ bên ngoài (LucyContentService đã fetch từ DB).
     */
    public void initRoom(String roomId, String language, List<StageItem> stages,
                         long stageDurationMs, int startIndex,
                         Consumer<StageEvent> onStarted,
                         Consumer<StageEvent> onChanged,
                         Consumer<TickEvent>  onTick,
                         Consumer<StageEvent> onPaused,
                         Consumer<StageEvent> onResumed,
                         Runnable             onAllCompleted) {
        if (rooms.containsKey(roomId)) {
            log.warn("[StageEngine] Room {} đã tồn tại", roomId);
            return;
        }

        RoomStageState state = new RoomStageState();
        state.roomId         = roomId;
        state.language       = language;
        state.stages         = stages != null ? stages : demoStages();
        state.currentIndex   = startIndex;
        state.stageDurationMs = stageDurationMs > 0 ? stageDurationMs
            : AppConfig.DEFAULT_STAGE_DURATION_MINUTES * 60_000L;
        state.onStageStarted  = onStarted;
        state.onStageChanged  = onChanged;
        state.onTick          = onTick;
        state.onPaused        = onPaused;
        state.onResumed       = onResumed;
        state.onAllCompleted  = onAllCompleted;

        rooms.put(roomId, state);
        log.info("[StageEngine] Room {} init — {} stages ({})", roomId, state.stages.size(), language);
    }

    /** Bắt đầu đếm giờ cho Stage hiện tại */
    public void startCurrentStage(String roomId) {
        RoomStageState state = rooms.get(roomId);
        if (state == null) return;

        cancelTimers(state);

        long duration = state.durationFor(state.currentIndex);
        state.startedAt  = System.currentTimeMillis();
        state.remainingMs = duration;
        state.isPaused   = false;

        StageItem current = state.current();
        log.info("[StageEngine] Room {} — Stage {}/{}: \"{}\" ({}s)",
            roomId, state.currentIndex + 1, state.stages.size(),
            current != null ? current.levelName : "?", duration / 1000);

        // Fire onStageStarted
        if (state.onStageStarted != null) {
            state.onStageStarted.accept(buildStageEvent(state, "started", null));
        }

        // Tick mỗi 1 giây
        state.tickFuture = scheduler.scheduleAtFixedRate(() -> {
            if (state.isPaused) return;
            long elapsed = System.currentTimeMillis() - state.startedAt;
            state.remainingMs = Math.max(0, duration - elapsed);

            if (state.onTick != null) {
                TickEvent te = new TickEvent();
                te.roomId     = roomId;
                te.stageIndex = state.currentIndex;
                te.remainingMs = state.remainingMs;
                te.durationMs  = duration;
                te.progress    = Math.min(1.0, (double) elapsed / duration);
                state.onTick.accept(te);
            }
        }, 1, 1, TimeUnit.SECONDS);

        // Timeout khi hết giờ
        state.timeoutFuture = scheduler.schedule(() -> {
            cancelTimers(state);
            autoAdvance(roomId);
        }, duration, TimeUnit.MILLISECONDS);
    }

    /** Chuyển Stage kế tiếp (tay) */
    public void nextStage(String roomId, String triggeredBy) {
        advance(roomId, "manual_next", triggeredBy);
    }

    /** Lùi Stage (tay) */
    public void prevStage(String roomId, String triggeredBy) {
        RoomStageState state = rooms.get(roomId);
        if (state == null || state.currentIndex <= 0) return;
        cancelTimers(state);
        state.currentIndex--;
        if (state.onStageChanged != null)
            state.onStageChanged.accept(buildStageEvent(state, "manual_prev", triggeredBy));
        startCurrentStage(roomId);
    }

    /** Nhảy đến stage cụ thể */
    public void jumpToStage(String roomId, int targetIndex, String triggeredBy) {
        RoomStageState state = rooms.get(roomId);
        if (state == null) return;
        if (targetIndex < 0 || targetIndex >= state.stages.size()) return;
        cancelTimers(state);
        state.currentIndex = targetIndex;
        if (state.onStageChanged != null)
            state.onStageChanged.accept(buildStageEvent(state, "manual_jump", triggeredBy));
        startCurrentStage(roomId);
    }

    /** Toggle pause / resume */
    public void togglePause(String roomId) {
        RoomStageState state = rooms.get(roomId);
        if (state == null) return;

        state.isPaused = !state.isPaused;

        if (state.isPaused) {
            state.pausedAt = System.currentTimeMillis();
            if (state.onPaused != null)
                state.onPaused.accept(buildStageEvent(state, "paused", null));
            log.info("[StageEngine] Room {} — PAUSED", roomId);
        } else {
            if (state.pausedAt > 0) {
                long delta = System.currentTimeMillis() - state.pausedAt;
                state.startedAt += delta;
                state.pausedAt = 0;
            }
            if (state.onResumed != null)
                state.onResumed.accept(buildStageEvent(state, "resumed", null));
            log.info("[StageEngine] Room {} — RESUMED", roomId);
        }
    }

    /** Đặt custom duration cho một stage */
    public void setCustomDuration(String roomId, int stageIndex, long durationMs) {
        RoomStageState state = rooms.get(roomId);
        if (state == null) return;
        state.customDurations.put(stageIndex, durationMs);
    }

    /** Lấy snapshot trạng thái hiện tại (để trả về REST) */
    public Map<String, Object> getRoomSnapshot(String roomId) {
        RoomStageState state = rooms.get(roomId);
        if (state == null) return null;

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("roomId",        roomId);
        map.put("language",      state.language);
        map.put("currentIndex",  state.currentIndex);
        map.put("totalStages",   state.stages.size());
        map.put("currentStage",  state.current());
        map.put("isPaused",      state.isPaused);
        map.put("remainingMs",   state.remainingMs);
        map.put("stageDurationMs", state.durationFor(state.currentIndex));

        List<Map<String,Object>> all = new ArrayList<>();
        for (int i = 0; i < state.stages.size(); i++) {
            Map<String,Object> s = new LinkedHashMap<>();
            s.put("index",     i);
            s.put("levelName", state.stages.get(i).levelName);
            s.put("stage",     state.stages.get(i).stage);
            s.put("isCurrent", i == state.currentIndex);
            all.add(s);
        }
        map.put("allStages", all);
        return map;
    }

    /** Dọn dẹp khi phòng kết thúc */
    public void destroyRoom(String roomId) {
        RoomStageState state = rooms.remove(roomId);
        if (state != null) {
            cancelTimers(state);
            log.info("[StageEngine] Room {} destroyed", roomId);
        }
    }

    // ── Private helpers ────────────────────────────────────

    private void autoAdvance(String roomId) {
        advance(roomId, "auto", "system");
    }

    private void advance(String roomId, String reason, String triggeredBy) {
        RoomStageState state = rooms.get(roomId);
        if (state == null) return;
        cancelTimers(state);

        int next = state.currentIndex + 1;
        if (next >= state.stages.size()) {
            log.info("[StageEngine] Room {} — Tất cả stages đã xong!", roomId);
            if (state.onAllCompleted != null) state.onAllCompleted.run();
            return;
        }
        state.currentIndex = next;
        if (state.onStageChanged != null)
            state.onStageChanged.accept(buildStageEvent(state, reason, triggeredBy));
        startCurrentStage(roomId);
    }

    private void cancelTimers(RoomStageState state) {
        if (state.tickFuture    != null) { state.tickFuture.cancel(false);    state.tickFuture    = null; }
        if (state.timeoutFuture != null) { state.timeoutFuture.cancel(false); state.timeoutFuture = null; }
    }

    private StageEvent buildStageEvent(RoomStageState state, String reason, String triggeredBy) {
        StageEvent e = new StageEvent();
        e.roomId      = state.roomId;
        e.stageIndex  = state.currentIndex;
        e.totalStages = state.stages.size();
        e.stage       = state.current();
        e.durationMs  = state.durationFor(state.currentIndex);
        e.remainingMs = state.remainingMs;
        e.reason      = reason;
        e.triggeredBy = triggeredBy;
        return e;
    }

    private List<StageItem> demoStages() {
        String[] names = {"Intro","Warm Up","Main Topic","Q&A","Wrap Up"};
        List<StageItem> list = new ArrayList<>();
        for (String n : names) {
            StageItem s = new StageItem();
            s.levelName   = n;
            s.stage       = "Demo";
            s.languageCode = "EN";
            list.add(s);
        }
        return list;
    }
}
