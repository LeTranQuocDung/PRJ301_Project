package com.lucy.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * SQL Server connection utility for LUCY_DBS
 */
public class DBConnection {

    private static String getEnvOrProperty(String key, String defaultValue) {
        String val = System.getenv(key);
        if (val == null) {
            val = System.getProperty(key);
        }
        return val != null ? val : defaultValue;
    }

    private static String requireEnvOrProperty(String key) throws SQLException {
        String val = System.getenv(key);
        if (val == null) {
            val = System.getProperty(key);
        }
        if (val == null || val.trim().isEmpty()) {
            throw new SQLException("Required database environment variable or property '" + key + "' is missing. Connection cannot be established.");
        }
        return val;
    }

    private static final String USER = getEnvOrProperty("LUCY_DB_USER", "lucy_admin");
    private static final String URL = getEnvOrProperty("LUCY_DB_URL", "jdbc:sqlserver://localhost;databaseName=LUCY_DBS;encrypt=false;trustServerCertificate=true;");

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("Microsoft SQL Server JDBC Driver class not found", e);
        }
        String dbPassword = requireEnvOrProperty("LUCY_DB_PASSWORD");
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
