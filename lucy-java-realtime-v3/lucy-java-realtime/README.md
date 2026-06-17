# Lucy Realtime Server — Hướng dẫn chạy trên NetBeans 17

## Yêu cầu
- NetBeans 17+
- JDK 8 hoặc 11+
- Apache Tomcat 9.x (tích hợp sẵn trong NetBeans)
- Maven (tích hợp sẵn trong NetBeans)

---

## Bước 1 — Mở project trong NetBeans

1. **File → Open Project**
2. Chọn thư mục `lucy-java-realtime`
3. NetBeans nhận diện Maven project → tự load dependencies

---

## Bước 2 — Cấu hình Agora & DB

Mở file: `src/main/java/com/lucy/config/AppConfig.java`

Điền các giá trị thật:
```java
// Lấy từ https://console.agora.io
AGORA_APP_ID          = "YOUR_AGORA_APP_ID";
AGORA_APP_CERTIFICATE = "YOUR_AGORA_APP_CERTIFICATE";
AGORA_CUSTOMER_KEY    = "YOUR_CUSTOMER_KEY";
AGORA_CUSTOMER_SECRET = "YOUR_CUSTOMER_SECRET";
```

Hoặc set Environment Variables trước khi chạy Tomcat:
```
AGORA_APP_ID=xxxxx
AGORA_APP_CERTIFICATE=xxxxx
```

DB connection (trong `LucyContentService.java`):
```java
// Mặc định kết nối localhost:1433, DB=LUCY_DBS
// Thay đổi nếu DB ở server khác:
DB_URL  = "jdbc:sqlserver://YOUR_HOST:1433;databaseName=LUCY_DBS;..."
DB_USER = "sa"
DB_PASS = "your_password"
```

---

## Bước 3 — Thêm Tomcat vào NetBeans (nếu chưa có)

1. **Tools → Servers → Add Server**
2. Chọn **Apache Tomcat or TomEE**
3. Trỏ đến thư mục cài Tomcat
4. Finish

---

## Bước 4 — Chạy project

1. Chuột phải vào project → **Run**
2. NetBeans tự build WAR và deploy lên Tomcat
3. Server chạy tại: `http://localhost:8080/LucyRealtimeServer`

---

## Test ngay sau khi chạy

### Test Console (browser)
Mở: http://localhost:8080/LucyRealtimeServer/

Giao diện test đầy đủ gồm:
- Kết nối WebSocket
- Tạo phòng, join, chat
- Stage countdown trực quan
- Nút điều khiển recording

### REST API
```bash
# Health check
GET http://localhost:8080/LucyRealtimeServer/health

# Tạo phòng
POST http://localhost:8080/LucyRealtimeServer/api/rooms
Body: {"roomId":"ROOM001","language":"LISA","stageDurationMinutes":15}

# Danh sách phòng
GET http://localhost:8080/LucyRealtimeServer/api/rooms

# Chi tiết phòng + stage state
GET http://localhost:8080/LucyRealtimeServer/api/rooms/ROOM001

# Lấy Agora token
POST http://localhost:8080/LucyRealtimeServer/api/agora/token
Body: {"channelName":"ROOM001","uid":1,"role":"publisher"}
```

### WebSocket
```
ws://localhost:8080/LucyRealtimeServer/ws
```

---

## Cấu trúc thư mục

```
lucy-java-realtime/
├── pom.xml
└── src/main/java/com/lucy/
    ├── config/
    │   └── AppConfig.java           ← Cấu hình tập trung
    ├── agora/
    │   └── AgoraTokenUtil.java      ← Tạo RTC Token (Java thuần)
    ├── avatar/
    │   ├── AvatarPersona.java       ← Model ẩn danh
    │   └── AvatarPersonaManager.java← Gán/quản lý Persona
    ├── room/
    │   ├── RoomManager.java         ← Quản lý phòng, participants
    │   └── StageEngine.java         ← Auto timer chuyển Stage
    ├── recording/
    │   └── AgoraRecordingService.java← Cloud Recording + Podcast
    ├── service/
    │   └── LucyContentService.java  ← Load Stage từ SQL Server DB
    ├── socket/
    │   └── LucyWebSocketServer.java ← WebSocket endpoint (thay Socket.io)
    ├── servlet/
    │   ├── RoomServlet.java         ← REST API endpoints
    │   └── CorsFilter.java
    └── util/
        └── JsonUtil.java            ← JSON helpers
```

---

## Tích hợp với Mobile Client (Agora SDK)

Client nhận `agoraConfig` từ event `room:joined`:
```json
{
  "appId":   "your_app_id",
  "token":   "generated_token",
  "channel": "ROOM001",
  "uid":     12345
}
```

### React Native
```javascript
import RtcEngine from 'react-native-agora';
const engine = await RtcEngine.create(agoraConfig.appId);
await engine.enableAudio();
await engine.joinChannel(agoraConfig.token, agoraConfig.channel, null, agoraConfig.uid);
```

### Flutter
```dart
await engine.initialize(RtcEngineContext(appId: agoraConfig['appId']));
await engine.joinChannel(
  token: agoraConfig['token'],
  channelId: agoraConfig['channel'],
  uid: agoraConfig['uid'],
  options: ChannelMediaOptions(),
);
```

---

## WebSocket Events Reference

| Client → Server       | Mô tả                              |
|-----------------------|------------------------------------|
| `room:join`           | Vào phòng, nhận Avatar Persona     |
| `room:leave`          | Rời phòng                          |
| `room:start_live`     | Host bắt đầu Live + Stage timer    |
| `room:end_live`       | Host kết thúc                      |
| `audio:mute_toggle`   | Toggle mute bản thân               |
| `audio:mute_all`      | Host mute toàn phòng               |
| `audio:hand_raise`    | Toggle giơ tay                     |
| `stage:next`          | Host chuyển Stage tiếp             |
| `stage:prev`          | Host lùi Stage                     |
| `stage:jump`          | Host nhảy đến Stage bất kỳ         |
| `stage:pause_toggle`  | Host pause/resume timer            |
| `chat:message`        | Gửi tin nhắn ẩn danh               |
| `recording:start`     | Super bắt đầu ghi âm               |
| `recording:stop`      | Super dừng ghi → tạo Podcast       |

| Server → Client       | Mô tả                              |
|-----------------------|------------------------------------|
| `room:joined`         | Xác nhận join + agoraConfig        |
| `stage:started`       | Stage mới bắt đầu                  |
| `stage:tick`          | Đếm ngược mỗi giây                 |
| `stage:changed`       | Stage chuyển (auto hoặc manual)    |
| `stage:completed`     | Tất cả stage đã xong               |
| `recording:stopped`   | Dừng ghi + PodcastMeta (S3 URL)    |

---

## ⚠️ Cập nhật v3 — Quan trọng

### 1. Đã tích hợp trực tiếp code DB gốc của bạn
Không viết lại SQL nữa — copy y nguyên 3 file từ `LucyBackendAPI`:
- `com/lucy/util/DBConnection.java`
- `com/lucy/model/LucyRow.java`
- `com/lucy/dao/LucyDAO.java`

**Phải sửa `DBConnection.java`** với thông tin DB thật của bạn trước khi chạy:
```java
private static final String USER     = "lucy_admin";   // ← sửa user thật
private static final String PASSWORD = "123456";        // ← sửa password thật
private static final String URL = "jdbc:sqlserver://localhost:1433;databaseName=LUCY_DBS;...";
```

### 2. Giao diện đã sửa lỗi tràn chữ
Toàn bộ CSS dùng `overflow-wrap`, `min-width:0`, `text-overflow:ellipsis` ở mọi container — chữ dài (tên phòng, tên stage, chat) sẽ tự xuống dòng hoặc cắt "..." thay vì đẩy vỡ layout.

### 3. Audio đã hoạt động THẬT (không chỉ log giả)
Trang `index.html` giờ load **Agora Web SDK (AgoraRTC_N)** thật. Khi bấm "Join":
1. Browser xin quyền microphone
2. Tự động kết nối vào Agora channel = roomId
3. Người khác join cùng phòng sẽ **nghe được giọng nói thật** qua loa
4. Nút Mute/Unmute điều khiển track audio thật, không chỉ đổi icon

**Lưu ý:** cần điền `AGORA_APP_ID` + `AGORA_APP_CERTIFICATE` thật trong `AppConfig.java`, nếu không token sẽ invalid và Agora từ chối kết nối (sẽ thấy lỗi đỏ trong log "Agora join lỗi").
