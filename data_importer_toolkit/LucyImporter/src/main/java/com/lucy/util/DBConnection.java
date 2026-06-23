package com.lucy.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Kết nối SQL Server cho LUCY_DB
 * ⚙️ Sửa HOST / USER / PASSWORD bên dưới
 */
public class DBConnection {

    // ⚙️ CHỈ SỬA 3 DÒNG NÀY
    private static final String USER = "lucy_admin";
    private static final String PASSWORD = "123456";

    private static final String URL = "jdbc:sqlserver://localhost;"
            + "databaseName=LUCY_DBS;"
            + "encrypt=false;"
            + "trustServerCertificate=true;";

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("Khong tim thay JDBC driver!", e);
        }
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    public static void close(Connection c) {
        if (c != null)
            try {
                c.close();
            } catch (SQLException ignored) {
            }
    }

    /** Chạy hàm main() này để test kết nối trước */
    public static void main(String[] args) {
        System.out.println("Testing connection to LUCY_DB...");
        System.out.println("URL: " + URL);
        try (Connection conn = getConnection()) {
            System.out.println("✅ Kết nối thành công: "
                    + conn.getMetaData().getDatabaseProductVersion());
        } catch (SQLException e) {
            System.err.println("❌ Lỗi: " + e.getMessage());
            System.err.println("Kiểm tra lại HOST / INSTANCE / USER / PASSWORD");
        }
    }
}
