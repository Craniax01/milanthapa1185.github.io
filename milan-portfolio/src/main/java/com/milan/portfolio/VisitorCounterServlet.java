package com.milan.portfolio;

import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Tracks total page views. Persists the count to a file so it survives restarts.
 * Endpoint: GET /api/visits  returns JSON like  {"count": 42}
 */
@WebServlet(name = "VisitorCounterServlet", urlPatterns = "/api/visits")
public class VisitorCounterServlet extends HttpServlet {

    private static final String COUNTER_FILE = "visits.txt";
    private final AtomicLong counter = new AtomicLong(0);
    private Path counterPath;

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
        counterPath = tmp.resolve(COUNTER_FILE);

        try {
            if (Files.exists(counterPath)) {
                String s = new String(Files.readAllBytes(counterPath)).trim();
                if (!s.isEmpty()) counter.set(Long.parseLong(s));
            }
        } catch (Exception e) {
            log("Could not read visits file: " + e.getMessage());
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        long current = counter.incrementAndGet();

        // Persist - fire-and-forget; failure shouldn't break the response
        try {
            Files.write(counterPath,
                String.valueOf(current).getBytes(),
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING);
        } catch (Exception ignored) { }

        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
        res.setHeader("Cache-Control", "no-store");

        JSONObject body = new JSONObject().put("count", current);
        try (PrintWriter out = res.getWriter()) {
            out.write(body.toString());
        }
    }
}
