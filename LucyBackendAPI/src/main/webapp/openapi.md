# REST API Endpoints

---

# 1. Get All Contents

## Endpoint

```http
GET /api/contents
```

## Description

Returns all learning contents from database.

---

## Request Example

```http
GET http://localhost:8080/LucyBackendAPI/api/contents
```

---

## Response Example

```json
[
  {
    "languageCode": "LISA",
    "stage": "Sơ cấp",
    "levelName": "SAYING WHO I AM",
    "subLevel": "Sub-level 1: My name\nMy full name\nMy nickname\nHow people call me\nSub-level 2: Where I’m from\nCountry\nCity\nOne simple fact\nSub-level 3: Me now\nStudent / worker\nSimple sentence: “I am…”\nSub-level 4: One thing about me\nI like…\nI don’t like…\nSub-level 5: Repeat \u0026 swap\nAsk and answer with partners\nSub-level 6: Mini story\n“My name is… I’m from… I am…”"
  }
]
```

---

# 2. Get Contents By Language

## Endpoint

```http
GET /api/contents?language={LANGUAGE_CODE}
```

---

## Supported Languages

| Code | Language |
|---|---|
| LISA | English |
| ZH | Chinese |
| JA | Japanese |

---

## Request Example

```http
GET http://localhost:8080/LucyBackendAPI/api/contents?language=ZH
```

---

## Response Example

```json
[
  {
    "languageCode": "ZH",
    "stage": "Sơ cấp",
    "levelName": "我的朋友",
    "questionAi": "你有好朋友吗？",
    "answer": "我有一个好朋友。"
  
]
```

---

# 3. Get Contents By Stage

## Endpoint

```http
GET /api/contents?stage={STAGE_NAME}
```

---

## Request Example

```http
GET http://localhost:8080/LucyBackendAPI/api/contents?stage=SƠ CẤP
```

---

## Response Example

```json
[
  {
    "languageCode": "JA",
    "stage": "Sơ cấp",
    "levelName": "私の1週間",
    "subLevel": "平日のルーティン\n週末との比較\n忙しい日 vs 暇な日\n勉強／仕事と休息のバランス\n最近の変化 ``\n1週間のストーリー"
  }
]
```

---

# 4. Get Contents By Level

## Endpoint

```http
GET /api/contents?level={LEVEL_NAME}
```

---

## Request Example

```http
GET http://localhost:8080/LucyBackendAPI/api/contents?level=YESTERDAY
```

---

## Response Example

```json
[
  {
    "languageCode": "LISA",
    "stage": "Sơ cấp",
    "levelName": "YESTERDAY",
    "subLevel": "1: Yesterday morning\n2: Yesterday afternoon\n3: Yesterday evening\n4: One thing I did\n5: Ask about yesterday\n6: Yesterday story\nLEVEL 11–15: FUNCTIONAL COMMUNICATION (A1 → A2)"
  }
]
```

---