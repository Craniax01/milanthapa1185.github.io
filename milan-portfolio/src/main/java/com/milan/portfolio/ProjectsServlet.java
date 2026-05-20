package com.milan.portfolio;

import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.List;

/**
 * Serves the list of portfolio projects as JSON.
 * Endpoint: GET /api/projects
 *
 * To add or edit projects, change the PROJECTS list below and rebuild.
 */
@WebServlet(name = "ProjectsServlet", urlPatterns = "/api/projects")
public class ProjectsServlet extends HttpServlet {

    private static final List<JSONObject> PROJECTS = Arrays.asList(
        new JSONObject()
            .put("title", "Java Servlet Website")
            .put("description",
                "A full-stack web application built with Java Servlets and JSP. " +
                "Handles routing, sessions, and dynamic content the classic way.")
            .put("tags", new JSONArray(Arrays.asList("Java", "Servlet", "JSP")))
            .put("url", ""),

        new JSONObject()
            .put("title", "This 3D Portfolio")
            .put("description",
                "The site you're looking at right now. Three.js for the floating sky " +
                "island, Java Servlets for the API, vanilla JS as the glue.")
            .put("tags", new JSONArray(Arrays.asList("Three.js", "Java", "Frontend")))
            .put("url", "https://github.com/Craniax01"),

        new JSONObject()
            .put("title", "Network Pattern Explorer")
            .put("description",
                "A Python tool I built to surface patterns in network traffic data — " +
                "because everything leaves a fingerprint if you know where to look.")
            .put("tags", new JSONArray(Arrays.asList("Python", "Data")))
            .put("url", "")
    );

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
        res.setHeader("Cache-Control", "no-store");

        JSONObject body = new JSONObject()
            .put("projects", new JSONArray(PROJECTS))
            .put("count", PROJECTS.size());

        try (PrintWriter out = res.getWriter()) {
            out.write(body.toString());
        }
    }
}
