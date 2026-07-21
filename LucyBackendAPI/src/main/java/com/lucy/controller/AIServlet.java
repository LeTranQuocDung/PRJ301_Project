package com.lucy.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonArray;
import com.lucy.util.CorsUtil;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.*;

@WebServlet("/api/ai/generate-questions")
public class AIServlet extends HttpServlet {

    private Gson gson;
    private String geminiApiKey;
    private String llmEndpoint;
    private String llmModel;

    @Override
    public void init() throws ServletException {
        gson = new GsonBuilder().setPrettyPrinting().create();
        geminiApiKey = loadApiKey();

        llmEndpoint = System.getenv("LUCY_LLM_ENDPOINT");
        if (llmEndpoint == null || llmEndpoint.trim().isEmpty()) {
            llmEndpoint = System.getProperty("LUCY_LLM_ENDPOINT", "https://generativelanguage.googleapis.com/v1beta");
        }

        llmModel = System.getenv("LUCY_LLM_MODEL");
        if (llmModel == null || llmModel.trim().isEmpty()) {
            llmModel = System.getProperty("LUCY_LLM_MODEL", "gemini-2.5-flash");
        }
    }

    private String loadApiKey() {
        String key = System.getenv("GEMINI_API_KEY");
        if (key != null && !key.trim().isEmpty()) return key.trim();

        key = System.getProperty("GEMINI_API_KEY");
        if (key != null && !key.trim().isEmpty()) return key.trim();

        try {
            java.io.File cur = new java.io.File(".").getAbsoluteFile();
            for (int i = 0; i < 6 && cur != null; i++) {
                java.io.File f = new java.io.File(cur, ".env");
                if (f.exists() && f.isFile()) {
                    try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(f))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (line.trim().startsWith("GEMINI_API_KEY=")) {
                                String val = line.trim().substring("GEMINI_API_KEY=".length()).trim();
                                if (!val.isEmpty()) return val;
                            }
                        }
                    }
                }
                cur = cur.getParentFile();
            }
        } catch (Exception ignored) {}

        return "";
    }

    private String cleanJsonString(String raw) {
        if (raw == null) return null;
        String clean = raw.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }

    private String callLLM(String systemPrompt, String userPrompt) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return null;
        }
        try {
            // Support direct official Google Gemini API if key starts with AIzaSy or AQ.
            if (geminiApiKey.trim().startsWith("AIzaSy") || geminiApiKey.trim().startsWith("AQ.")) {
                String[] modelsToTry = {"gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"};
                if (llmModel != null && !llmModel.trim().isEmpty() && !llmModel.contains("2.5")) {
                    modelsToTry = new String[]{llmModel.trim(), "gemini-1.5-flash", "gemini-2.0-flash"};
                }

                for (String model : modelsToTry) {
                    try {
                        java.net.URL url = new java.net.URL("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey.trim());
                        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(8000);
                        conn.setReadTimeout(15000);

                        JsonObject requestBody = new JsonObject();

                        // Set system instructions
                        JsonObject systemInstruction = new JsonObject();
                        com.google.gson.JsonArray sysParts = new com.google.gson.JsonArray();
                        JsonObject sysPartObj = new JsonObject();
                        sysPartObj.addProperty("text", systemPrompt);
                        sysParts.add(sysPartObj);
                        systemInstruction.add("parts", sysParts);
                        requestBody.add("systemInstruction", systemInstruction);

                        // Set contents
                        com.google.gson.JsonArray contents = new com.google.gson.JsonArray();
                        JsonObject userContentObj = new JsonObject();
                        userContentObj.addProperty("role", "user");
                        com.google.gson.JsonArray userParts = new com.google.gson.JsonArray();
                        JsonObject userPartObj = new JsonObject();
                        userPartObj.addProperty("text", userPrompt);
                        userParts.add(userPartObj);
                        userContentObj.add("parts", userParts);
                        contents.add(userContentObj);
                        requestBody.add("contents", contents);

                        // Generation config for JSON output
                        JsonObject generationConfig = new JsonObject();
                        generationConfig.addProperty("responseMimeType", "application/json");
                        generationConfig.addProperty("temperature", 0.7);
                        requestBody.add("generationConfig", generationConfig);

                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = requestBody.toString().getBytes("utf-8");
                            os.write(input, 0, input.length);
                        }

                        int code = conn.getResponseCode();
                        if (code >= 200 && code < 300) {
                            try (java.io.BufferedReader br = new java.io.BufferedReader(
                                    new java.io.InputStreamReader(conn.getInputStream(), "utf-8"))) {
                                StringBuilder sb = new StringBuilder();
                                String line;
                                while ((line = br.readLine()) != null) {
                                    sb.append(line);
                                }
                                JsonObject responseJson = JsonParser.parseString(sb.toString()).getAsJsonObject();
                                return responseJson.getAsJsonArray("candidates")
                                        .get(0).getAsJsonObject()
                                        .getAsJsonObject("content")
                                        .getAsJsonArray("parts")
                                        .get(0).getAsJsonObject()
                                        .get("text").getAsString();
                            }
                        } else {
                            System.err.println("Gemini API call (" + model + ") returned code: " + code);
                        }
                    } catch (Exception e) {
                        System.err.println("Gemini API error (" + model + "): " + e.getMessage());
                    }
                }
                return null;
            }

            // OpenAI compatible endpoint proxy
            String cleanEndpoint = llmEndpoint.trim();
            if (!cleanEndpoint.endsWith("/")) {
                cleanEndpoint += "/";
            }
            java.net.URL url = new java.net.URL(cleanEndpoint + "chat/completions");
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + geminiApiKey);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            conn.setDoOutput(true);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(15000);

            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("model", llmModel);
            requestBody.addProperty("temperature", 0.9);

            JsonArray messages = new JsonArray();

            JsonObject sysMsg = new JsonObject();
            sysMsg.addProperty("role", "system");
            sysMsg.addProperty("content", systemPrompt);
            messages.add(sysMsg);

            JsonObject usrMsg = new JsonObject();
            usrMsg.addProperty("role", "user");
            usrMsg.addProperty("content", userPrompt);
            messages.add(usrMsg);

            requestBody.add("messages", messages);

            try (java.io.OutputStream os = conn.getOutputStream()) {
                byte[] input = requestBody.toString().getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) {
                try (java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(conn.getInputStream(), "utf-8"))) {
                    java.util.List<String> lines = new java.util.ArrayList<>();
                    String line;
                    boolean isSSE = false;
                    while ((line = br.readLine()) != null) {
                        String trimmed = line.trim();
                        if (!trimmed.isEmpty()) {
                            lines.add(trimmed);
                            if (trimmed.startsWith("data:")) {
                                isSSE = true;
                            }
                        }
                    }

                    if (isSSE) {
                        StringBuilder fullContent = new StringBuilder();
                        for (String l : lines) {
                            if (l.startsWith("data:")) {
                                String payload = l.substring(5).trim();
                                if (payload.equals("[DONE]")) break;
                                try {
                                    JsonObject chunk = JsonParser.parseString(payload).getAsJsonObject();
                                    if (chunk.has("choices")) {
                                        JsonArray choices = chunk.getAsJsonArray("choices");
                                        if (choices.size() > 0) {
                                            JsonObject choice = choices.get(0).getAsJsonObject();
                                            if (choice.has("delta")) {
                                                JsonObject delta = choice.getAsJsonObject("delta");
                                                if (delta.has("content")) {
                                                    fullContent.append(delta.get("content").getAsString());
                                                }
                                            } else if (choice.has("message")) {
                                                JsonObject message = choice.getAsJsonObject("message");
                                                if (message.has("content")) {
                                                    fullContent.append(message.get("content").getAsString());
                                                }
                                            }
                                        }
                                    }
                                } catch (Exception e) {
                                    // Ignore malformed chunk
                                }
                            }
                        }
                        return fullContent.toString();
                    } else {
                        StringBuilder responseSB = new StringBuilder();
                        for (String l : lines) {
                            responseSB.append(l);
                        }
                        JsonObject responseJson = JsonParser.parseString(responseSB.toString()).getAsJsonObject();
                        return responseJson.getAsJsonArray("choices")
                                .get(0).getAsJsonObject()
                                .getAsJsonObject("message")
                                .get("content").getAsString();
                    }
                }
            } else {
                System.err.println("LLM call failed with HTTP code: " + code);
            }
        } catch (Exception e) {
            System.err.println("LLM connection error: " + e.getMessage());
        }
        return null;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CorsUtil.setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");

        try {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = req.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }

            if (sb.length() == 0) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Empty request body\"}");
                return;
            }

            JsonObject json = JsonParser.parseString(sb.toString()).getAsJsonObject();
            String lang  = json.has("lang")  ? json.get("lang").getAsString().trim()  : "English";
            String level = json.has("level") ? json.get("level").getAsString().trim() : "Beginner";
            String topic = json.has("topic") ? json.get("topic").getAsString().trim() : "General";
            int count    = json.has("count") ? json.get("count").getAsInt()           : 3;

            if (count <= 0) count = 3;
            if (count > 15) count = 15;

            // Build system prompt
            String systemPrompt =
                "You are an expert language teacher specializing in " + lang + ". " +
                "Generate exactly " + count + " unique multiple-choice questions (MCQ) for a " + level + " level student " +
                "on the topic: \"" + topic + "\". " +
                "Each question must be genuinely different — different vocabulary, different grammar points, different scenarios. " +
                "Return ONLY a valid JSON array. Each element must have exactly these fields: " +
                "\"question\" (string), " +
                "\"options\" (array of exactly 4 strings, each starting with \"A) \", \"B) \", \"C) \", \"D) \"), " +
                "\"answer\" (string matching one of the options exactly), " +
                "\"explanation\" (string explaining why the answer is correct). " +
                "Do NOT wrap the array in markdown code blocks. Return raw JSON only.";

            double randomSeed = Math.random();
            String userPrompt =
                "Language: " + lang + "\n" +
                "Level: " + level + "\n" +
                "Topic: " + topic + "\n" +
                "Number of questions: " + count + "\n" +
                "Random seed: " + randomSeed + "\n" +
                "Make sure all questions test different aspects of the topic with clearly distinct correct answers and are completely different from any previous generation.";

            String llmResult = callLLM(systemPrompt, userPrompt);

            if (llmResult != null) {
                try {
                    String cleaned = cleanJsonString(llmResult);
                    JsonArray arr = JsonParser.parseString(cleaned).getAsJsonArray();
                    if (arr.size() > 0) {
                        resp.getWriter().write(gson.toJson(arr));
                        return;
                    }
                } catch (Exception parseEx) {
                    System.err.println("Failed to parse LLM question output as JSON array: " + parseEx.getMessage());
                }
            }

            // Fallback: Rich authentic questions generated with randomized option positions
            List<Map<String, Object>> fallback = generateRichFallbackQuestions(lang, level, topic, count);
            resp.getWriter().write(gson.toJson(fallback));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Failed to generate questions\"}");
        }
    }

    // ─── Rich Fallback Question Bank & Dynamic Generator ──────────────────────
    private static class QuestionTemplate {
        String question;
        String correct;
        String[] wrong;
        String explanation;

        QuestionTemplate(String question, String correct, String[] wrong, String explanation) {
            this.question = question;
            this.correct = correct;
            this.wrong = wrong;
            this.explanation = explanation;
        }
    }

    private List<Map<String, Object>> generateRichFallbackQuestions(String lang, String level, String topic, int count) {
        List<QuestionTemplate> bank = getQuestionBank(lang, level);
        List<Map<String, Object>> result = new ArrayList<>();
        Random rand = new Random();

        // Shuffle question bank to avoid repetitive questions
        List<QuestionTemplate> shuffledBank = new ArrayList<>(bank);
        Collections.shuffle(shuffledBank, rand);

        for (int i = 0; i < count; i++) {
            QuestionTemplate qt;
            if (i < shuffledBank.size()) {
                qt = shuffledBank.get(i);
            } else {
                // Generate dynamic randomized question if count > bank size
                qt = createDynamicQuestion(lang, level, topic, i + 1, rand);
            }

            // Prepare choices and shuffle option order (A, B, C, D)
            List<String> rawChoices = new ArrayList<>();
            rawChoices.add(qt.correct);
            rawChoices.add(qt.wrong[0]);
            rawChoices.add(qt.wrong[1]);
            rawChoices.add(qt.wrong[2]);
            Collections.shuffle(rawChoices, rand);

            String[] prefixes = {"A) ", "B) ", "C) ", "D) "};
            List<String> options = new ArrayList<>();
            String formattedAnswer = "";

            for (int k = 0; k < 4; k++) {
                String choiceStr = prefixes[k] + rawChoices.get(k);
                options.add(choiceStr);
                if (rawChoices.get(k).equals(qt.correct)) {
                    formattedAnswer = choiceStr;
                }
            }

            Map<String, Object> qMap = new HashMap<>();
            qMap.put("question", qt.question);
            qMap.put("options", options);
            qMap.put("answer", formattedAnswer);
            qMap.put("explanation", qt.explanation);

            result.add(qMap);
        }

        return result;
    }

    private List<QuestionTemplate> getQuestionBank(String lang, String level) {
        List<QuestionTemplate> list = new ArrayList<>();
        String key = lang.toUpperCase() + "_" + level.toUpperCase();

        if (key.startsWith("ENGLISH_BEGINNER") || key.startsWith("EN_BEGINNER")) {
            list.add(new QuestionTemplate(
                "Choose the correct sentence to introduce yourself in English:",
                "Hello, my name is John and I am a student.",
                new String[]{"Hello, I name John and I student.", "Hello, my name John is a student.", "Hello, I am name John student."},
                "The subject pronoun 'I' requires 'am', and 'my name is' correctly introduces your name."
            ));
            list.add(new QuestionTemplate(
                "Which option correctly completes the sentence: 'She _____ to school by bus every morning.'?",
                "goes",
                new String[]{"go", "going", "gone"},
                "With third-person singular subjects ('She'), simple present tense requires the verb ending '-es' (goes)."
            ));
            list.add(new QuestionTemplate(
                "What is the correct plural form of the noun 'child'?",
                "children",
                new String[]{"childs", "childrens", "childes"},
                "'Child' is an irregular noun; its plural form is 'children'."
            ));
            list.add(new QuestionTemplate(
                "Fill in the blank: 'There _____ a book and three pens on the desk.'",
                "is",
                new String[]{"are", "be", "were"},
                "When using 'There is/are', the verb agrees with the first noun phrase in the list ('a book' -> singular -> 'is')."
            ));
            list.add(new QuestionTemplate(
                "Choose the polite response to: 'Thank you very much for your help!'",
                "You're very welcome!",
                new String[]{"No problem, I don't care.", "Yes, I am.", "Thank you too for nothing."},
                "'You're very welcome!' is the standard polite response to expression of gratitude."
            ));
            list.add(new QuestionTemplate(
                "Select the correct preposition: 'The cat is sleeping _____ the couch.'",
                "on",
                new String[]{"at", "into", "to"},
                "We use 'on' to indicate position on a flat surface like a couch or chair."
            ));
            list.add(new QuestionTemplate(
                "Which sentence expresses past routine correctly?",
                "I visited my grandparents every summer when I was young.",
                new String[]{"I visit my grandparents yesterday.", "I am visiting my grandparents last year.", "I will visit my grandparents ago."},
                "The simple past tense 'visited' is used for completed past actions."
            ));
        } else if (key.startsWith("ENGLISH_INTERMEDIATE") || key.startsWith("EN_INTERMEDIATE")) {
            list.add(new QuestionTemplate(
                "Choose the correct form: 'If it _____ tomorrow, we will cancel the picnic.'",
                "rains",
                new String[]{"will rain", "rained", "is raining"},
                "In first conditional sentences (real future possibilities), the 'if' clause uses simple present ('rains')."
            ));
            list.add(new QuestionTemplate(
                "Select the correct passive voice sentence for: 'The company launched a new product yesterday.'",
                "A new product was launched by the company yesterday.",
                new String[]{"A new product is launched by the company yesterday.", "A new product has been launched yesterday.", "A new product launched by the company."},
                "Simple past passive is formed with 'was/were' + past participle ('was launched')."
            ));
            list.add(new QuestionTemplate(
                "Which word is a synonym for 'reluctant'?",
                "unwilling",
                new String[]{"eager", "enthusiastic", "prompt"},
                "'Reluctant' means hesitant or unwilling to do something."
            ));
            list.add(new QuestionTemplate(
                "Fill in the blank: 'I have lived in London _____ three years.'",
                "for",
                new String[]{"since", "during", "from"},
                "'For' is used with a period of duration ('three years'), whereas 'since' is used with a starting point in time."
            ));
            list.add(new QuestionTemplate(
                "Choose the sentence with correct relative pronoun usage:",
                "The teacher who won the award is very dedicated.",
                new String[]{"The teacher which won the award is very dedicated.", "The teacher whom won the award is very dedicated.", "The teacher whose won the award is very dedicated."},
                "'Who' is the subject relative pronoun used for human subjects."
            ));
        } else if (key.startsWith("ENGLISH_ADVANCED") || key.startsWith("EN_ADVANCED")) {
            list.add(new QuestionTemplate(
                "Choose the correct subjunctive sentence:",
                "It is essential that the manager be notified immediately.",
                new String[]{"It is essential that the manager is notified immediately.", "It is essential that the manager will be notified immediately.", "It is essential that the manager was notified immediately."},
                "The subjunctive mood after expressions of necessity ('essential that...') uses the base verb form ('be')."
            ));
            list.add(new QuestionTemplate(
                "What does the idiom 'bite the bullet' mean?",
                "To face a difficult situation with courage and get it over with.",
                new String[]{"To get angry and start a fight.", "To avoid taking responsibility.", "To celebrate an unexpected achievement."},
                "'Bite the bullet' is an idiom meaning to endure a painful or difficult situation bravely."
            ));
            list.add(new QuestionTemplate(
                "Select the correct inverted sentence:",
                "Hardly had we arrived at the station when the train departed.",
                new String[]{"Hardly we had arrived at the station when the train departed.", "Hardly did we arrived at the station when the train departed.", "Hardly we arrived at the station when the train departed."},
                "Negative adverbs at the sentence head ('Hardly') trigger subject-auxiliary inversion ('had we arrived')."
            ));
        } else if (key.startsWith("CHINESE") || key.startsWith("ZH")) {
            if (key.contains("BEGINNER")) {
                list.add(new QuestionTemplate(
                    "Select the correct translation for: 'Hello, my name is Wang Lin.'",
                    "你好，我叫王林。",
                    new String[]{"你好，我是叫王林。", "你好，我名字王林。", "你好，我有王林。"},
                    "In Chinese, '我叫 + Name' is the standard way to state your name."
                ));
                list.add(new QuestionTemplate(
                    "Fill in the blank with the correct measure word: '桌子上有一___书。'",
                    "本",
                    new String[]{"个", "张", "只"},
                    "'本' (běn) is the measure word for books, notebooks, and documents."
                ));
                list.add(new QuestionTemplate(
                    "Translate to Chinese: 'Where are you from?'",
                    "你是哪国人？",
                    new String[]{"你在哪里人？", "你是什么人？", "你去哪国？"},
                    "'你是哪国人？' (Nǐ shì nǎ guó rén?) literally asks 'Which country person are you?'."
                ));
                list.add(new QuestionTemplate(
                    "What is the meaning of '谢谢' (xièxie)?",
                    "Thank you",
                    new String[]{"Goodbye", "Sorry", "You're welcome"},
                    "'谢谢' is Chinese for 'Thank you'."
                ));
            } else {
                list.add(new QuestionTemplate(
                    "Choose the correct sentence with '把' (bǎ) construction:",
                    "请把书放在桌子上。",
                    new String[]{"请书把放在桌子上。", "请把放在桌子上书。", "请放在桌子上把书。"},
                    "The '把' structure is: Subject + 把 + Object + Verb + Result/Direction/Location."
                ));
                list.add(new QuestionTemplate(
                    "Select the correct complement of result: '这道题我听___了。'",
                    "懂",
                    new String[]{"看", "在", "去"},
                    "'听懂' (tīng dǒng) means to understand by listening."
                ));
                list.add(new QuestionTemplate(
                    "What does the Chinese idiom '不可思议' (bù kě sī yì) mean?",
                    "Unbelievable / Inconceivable",
                    new String[]{"Careless and irresponsible", "Extremely dangerous", "Very friendly"},
                    "'不可思议' describes something so amazing or mysterious that it is beyond imagination."
                ));
            }
        } else if (key.startsWith("JAPANESE") || key.startsWith("JA")) {
            if (key.contains("BEGINNER")) {
                list.add(new QuestionTemplate(
                    "Choose the correct particle: 'わたし___学生です。'",
                    "は",
                    new String[]{"が", "に", "を"},
                    "The topic marker particle 'は' (wa) marks 'わたし' (I) as the topic of the sentence."
                ));
                list.add(new QuestionTemplate(
                    "Fill in the blank with the correct time particle: '毎朝 7時___ 起きます。'",
                    "に",
                    new String[]{"で", "を", "と"},
                    "The particle 'に' (ni) marks a specific point in time when an action occurs ('7時に')."
                ));
                list.add(new QuestionTemplate(
                    "What is the polite phrase used when meeting someone for the first time in Japanese?",
                    "はじめまして",
                    new String[]{"おやすみなさい", "いただきます", "ごちそうさまでした"},
                    "'はじめまして' (Hajimemashite) means 'Nice to meet you'."
                ));
                list.add(new QuestionTemplate(
                    "Choose the correct translation for 'This is a book':",
                    "これは本です。",
                    new String[]{"それは本です。", "あれは本です。", "ここ本です。"},
                    "'これ' (kore) refers to something near the speaker."
                ));
            } else {
                list.add(new QuestionTemplate(
                    "Select the correct honorific (謙譲語 - Kenjougo / Humble form) for '食べる' (to eat):",
                    "いただく",
                    new String[]{"召し上がる", "お食べになる", "参る"},
                    "'いただく' (itadaku) is the humble verb used for eating or drinking."
                ));
                list.add(new QuestionTemplate(
                    "Choose the correct te-form for sentence connection: '朝起きて、顔を___、朝ご飯を食べます。'",
                    "洗って",
                    new String[]{"洗う", "洗います", "洗った"},
                    "Actions in sequence use the te-form ('洗って' - wash and...)."
                ));
                list.add(new QuestionTemplate(
                    "What does the grammar point '～に違いない' (ni chigainai) express?",
                    "Strong conviction / Certainty ('Must be...')",
                    new String[]{"Doubt or hesitation", "Permission to do something", "Regret for past action"},
                    "'～に違いない' indicates the speaker's firm belief or conviction about something."
                ));
            }
        }

        // Generic fallback items if language bank is sparse
        if (list.size() < 3) {
            list.add(new QuestionTemplate(
                "Select the sentence with correct grammar and natural word order in " + lang + ":",
                "I enjoy studying foreign languages every day.",
                new String[]{"I enjoys study foreign language every days.", "I am enjoy studying foreign language every day.", "Every day I enjoying study foreign languages."},
                "Proper subject-verb agreement and natural word order make this sentence grammatically correct."
            ));
            list.add(new QuestionTemplate(
                "Which word best completes the practice sentence for " + level + " level?",
                "practice",
                new String[]{"practicingly", "practicable", "practiceful"},
                "Using the correct word form is essential for clear communication."
            ));
            list.add(new QuestionTemplate(
                "Identify the correct response in a daily conversation context:",
                "That sounds like a great idea! Let's do it.",
                new String[]{"That sound like great idea! Let doing it.", "That is sounded like great idea!", "That sounding great idea!"},
                "Active expressions of agreement require correct tense and subject-verb agreement."
            ));
        }

        return list;
    }

    private QuestionTemplate createDynamicQuestion(String lang, String level, String topic, int index, Random rand) {
        String[] grammarPoints = {
            "subject-verb agreement", "tense consistency", "correct preposition usage",
            "vocabulary accuracy", "polite conversational tone", "article placement"
        };
        String gp = grammarPoints[index % grammarPoints.length];

        String qText = String.format("Question #%d (%s - %s): Which of the following sentences demonstrates proper %s when discussing '%s'?", index, lang, level, gp, topic);
        String correct = String.format("Learning %s at %s level requires mastering %s for %s.", lang, level, gp, topic);
        String wrong1 = String.format("Learning %s at %s level require master %s for %s.", lang, level, gp, topic);
        String wrong2 = String.format("Learned %s at %s level requiring master %s for %s.", lang, level, gp, topic);
        String wrong3 = String.format("To learn %s at %s level are mastering %s for %s.", lang, level, gp, topic);

        String explanation = String.format("Option 1 correctly applies %s in %s for %s level learners.", gp, lang, level);

        return new QuestionTemplate(qText, correct, new String[]{wrong1, wrong2, wrong3}, explanation);
    }
}

