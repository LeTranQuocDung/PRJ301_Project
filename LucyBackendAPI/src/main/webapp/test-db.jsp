<%@ page import="java.sql.*, com.lucy.util.DBConnection, java.io.*" %>
<%
    out.println("<html><body><pre>");
    try {
        Connection conn = DBConnection.getConnection();
        out.println("Connection successful!");
        out.println("Catalog: " + conn.getCatalog());
        conn.close();
    } catch (Exception e) {
        out.println("Error: " + e.getMessage());
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        out.println(sw.toString());
    }
    out.println("</pre></body></html>");
%>
