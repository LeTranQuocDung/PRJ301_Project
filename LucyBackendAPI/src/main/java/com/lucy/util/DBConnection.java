package com.lucy.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * SQL Server connection utility for LUCY_DBS
 */
public class DBConnection {

    private static java.io.File findEnvFile() {
        java.io.File current = new java.io.File(System.getProperty("user.dir", "."));
        for (int depth = 0; current != null && depth < 8; depth++) {
            java.io.File candidate = new java.io.File(current, ".env");
            if (candidate.isFile() && candidate.canRead()) return candidate;
            candidate = new java.io.File(current, "LucyBackendAPI/.env");
            if (candidate.isFile() && candidate.canRead()) return candidate;
            current = current.getParentFile();
        }
        return new java.io.File(".env");
    }

    private static String loadSetting(String name, String defaultValue) {
        String value = System.getenv(name);
        if (value == null || value.trim().isEmpty()) value = System.getProperty(name);
        if (value == null || value.trim().isEmpty()) {
            java.io.File envFile = findEnvFile();
            if (envFile.exists()) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(envFile))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        String trimmed = line.trim();
                        if (trimmed.startsWith(name + "=")) {
                            value = trimmed.substring(name.length() + 1).trim();
                            if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\""))
                                    || (value.startsWith("'") && value.endsWith("'")))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            break;
                        }
                    }
                } catch (Exception ignored) { }
            }
        }
        return (value != null && !value.trim().isEmpty()) ? value.trim() : defaultValue;
    }

    private static final String USER = loadSetting("LUCY_DB_USER", "lucy_admin");
    private static final String URL = loadSetting("LUCY_DB_URL", "jdbc:sqlserver://localhost\\SQLEXPRESS;databaseName=LUCY_DBS;encrypt=false;trustServerCertificate=true;");

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("Microsoft SQL Server JDBC Driver class not found", e);
        }
        String dbPassword = loadSetting("LUCY_DB_PASSWORD", "123456");
        return DriverManager.getConnection(URL, USER, dbPassword);
    }

    public static void close(Connection c) {
        if (c != null) {
            try {
                c.close();
            } catch (SQLException ignored) {
            }
        }
    }

    /** Run main() to test connection */
    public static void main(String[] args) {
        System.out.println("Testing connection to LUCY_DBS...");
        System.out.println("URL: " + URL);
        try (Connection conn = getConnection()) {
            System.out.println("Connection successful: "
                    + conn.getMetaData().getDatabaseProductVersion());
        } catch (SQLException e) {
            System.err.println("Connection failed: " + e.getMessage());
            System.err.println("Please check your configuration: HOST / INSTANCE / USER / PASSWORD env settings.");
        }
    }
}

