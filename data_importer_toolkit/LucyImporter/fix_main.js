const fs = require('fs');
let code = fs.readFileSync('D:/PRJ301/LucyImporter/LucyImporter/LucyImporter/src/main/java/com/lucy/Main.java', 'utf8');

const dynamicScan = `    // =====================================================
    //  QUÉT TỰ ĐỘNG THƯ MỤC CHỨA FILE WORD
    // =====================================================
    private static List<String[]> scanWordFiles() {
        List<String[]> files = new ArrayList<>();
        File folder = new File(WORD_FOLDER);
        if (folder.exists() && folder.isDirectory()) {
            for (File file : folder.listFiles()) {
                if (file.isFile() && file.getName().endsWith(".docx") && !file.getName().startsWith("~$")) {
                    String name = file.getName().toLowerCase();
                    // Skip the reviewed files if they contain "reviewed"
                    if (name.contains("reviewed")) continue;
                    
                    if (name.startsWith("eng")) {
                        files.add(new String[]{file.getName(), "english", "LISA"});
                    } else if (name.startsWith("chinese")) {
                        files.add(new String[]{file.getName(), "chinese", "ZH"});
                    } else if (name.startsWith("janpanes") || name.startsWith("japan")) {
                        files.add(new String[]{file.getName(), "japanese", "JA"});
                    }
                }
            }
        }
        return files;
    }`;

// remove old WORD_FILES
code = code.replace(/private static final String\[\]\[\] WORD_FILES = \{[\s\S]*?\};/, dynamicScan);

// replace for (String[] entry : WORD_FILES) with for (String[] entry : scanWordFiles())
code = code.replace('for (String[] entry : WORD_FILES)', 'for (String[] entry : scanWordFiles())');

fs.writeFileSync('D:/PRJ301/LucyImporter/LucyImporter/LucyImporter/src/main/java/com/lucy/Main.java', code, 'utf8');
console.log('Main.java updated for dynamic scanning');
