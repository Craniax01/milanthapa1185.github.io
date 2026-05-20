package com.milan.portfolio;

import org.json.JSONException;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.OffsetDateTime;
import java.util.regex.Pattern;

/**
 * Accepts contact form submissions and appends them to a log file
 * Milan can read whenever he wants.
 *
 * Endpoint: POST /api/contact
 *   request body  : name, email, message
 *   success body  : ok=true plus a friendly message
 *   failure body  : ok=false plus an error string
 *
 * Messages land in: tomcat-temp-dir/contact-messages.log
 */
@WebServlet(name = "ContactServlet", urlPatterns = "/api/contact")
public class ContactServlet extends HttpServlet {

    private static final String LOG_FILE = "contact-messages.log";
    private static final Pattern EMAIL_RX =
        Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private Path logPath;

    @Override
    public void init() throws ServletException {
        // ServletContext.TEMPDIR attribute is a java.io.File
        Object attr = getServletContext().getAttribute("javax.servlet.context.tempdir");
        Path tmp;
        if (attr instanceof java.io.File) {
            tmp = ((java.io.File) attr).toPath();
        } else {
            tmp = Paths.get(System.getProperty("java.io.tmpdir"));
        }
        logPath = tmp.resolve(LOG_FILE);
        log("Contact messages will be logged to: " + logPath.toAbsolutePath());
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");

        // Read body
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = req.getReader()) {
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
        }

        // Parse + validate
        String name, email, message;
        try {
            JSONObject body = new JSONObject(sb.toString());
            name    = body.optString("name",    "").trim();
            email   = body.optString("email",   "").trim();
            message = body.optString("message", "").trim();
        } catch (JSONException e) {
            badRequest(res, "Invalid JSON.");
            return;
        }

        if (name.isEmpty() || email.isEmpty() || message.isEmpty()) {
            badRequest(res, "Please fill in name, email, and message.");
            return;
        }
        if (name.length() > 200 || email.length() > 200 || message.length() > 5000) {
            badRequest(res, "Too long. Trim it down a bit.");
            return;
        }
        if (!EMAIL_RX.matcher(email).matches()) {
            badRequest(res, "That email doesn't look valid.");
            return;
        }

        // Append to log
        String ip = req.getRemoteAddr();
        String entry = String.format(
            "[%s] %s <%s> (%s)%n%s%n---%n%n",
            OffsetDateTime.now(),
            sanitize(name),
            sanitize(email),
            ip,
            sanitize(message)
        );

        try {
            Files.write(
                logPath,
                entry.getBytes(StandardCharsets.UTF_8),
                StandardOpenOption.CREATE,
                StandardOpenOption.APPEND
            );
        } catch (IOException e) {
            log("Failed to write contact message: " + e.getMessage());
            res.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            try (PrintWriter out = res.getWriter()) {
                out.write(new JSONObject()
                    .put("ok", false)
                    .put("error", "Could not save your message. Try again later.")
                    .toString());
            }
            return;
        }

        String firstName = sanitize(name).split("\\s+")[0];
        try (PrintWriter out = res.getWriter()) {
            out.write(new JSONObject()
                .put("ok", true)
                .put("message", "Thanks " + firstName + "! Your message landed safely.")
                .toString());
        }
    }

    /** Bad-request helper. Sets 400 and writes a JSON error body. */
    private void badRequest(HttpServletResponse res, String msg) throws IOException {
        res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        try (PrintWriter out = res.getWriter()) {
            out.write(new JSONObject().put("ok", false).put("error", msg).toString());
        }
    }

    /** Strip newlines and control chars so each log entry stays one record. */
    private String sanitize(String s) {
        return s.replaceAll("[\\r\\n\\t]+", " ").trim();
    }
}
