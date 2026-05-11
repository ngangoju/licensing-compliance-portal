import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class H2Test {
    public static void main(String[] args) throws Exception {
        Connection conn = DriverManager.getConnection("jdbc:h2:mem:test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE", "sa", "");
        Statement stmt = conn.createStatement();
        try {
            stmt.execute("CREATE SCHEMA IF NOT EXISTS \"audit\"");
            stmt.execute("CREATE TABLE IF NOT EXISTS \"audit\".\"log\" (\n" +
                    "    \"id\" UUID PRIMARY KEY,\n" +
                    "    \"application_id\" UUID,\n" +
                    "    \"actor_id\" UUID,\n" +
                    "    \"actor_role\" VARCHAR,\n" +
                    "    \"action\" VARCHAR,\n" +
                    "    \"description\" TEXT,\n" +
                    "    \"previous_state\" VARCHAR,\n" +
                    "    \"new_state\" VARCHAR,\n" +
                    "    \"ip_address\" VARCHAR,\n" +
                    "    \"user_agent\" TEXT,\n" +
                    "    \"created_at\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n" +
                    ")");
            stmt.execute("INSERT INTO \"audit\".\"log\" (\n" +
                    "    \"id\", \"application_id\", \"actor_id\", \"actor_role\", \"action\", \"description\",\n" +
                    "    \"previous_state\", \"new_state\", \"ip_address\", \"user_agent\", \"created_at\"\n" +
                    ") VALUES (RANDOM_UUID(), RANDOM_UUID(), RANDOM_UUID(), 'APPLICANT', 'APPLICATION_CREATED', 'Desc', NULL, NULL, '127.0.0.1', 'Agent', CURRENT_TIMESTAMP)");
            System.out.println("Success!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
