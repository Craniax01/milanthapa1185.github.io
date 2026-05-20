# Milan Thapa — 3D Portfolio ✦

> An interactive 3D portfolio with a floating sky island, orbiting project crystals,
> ambient fireflies, and a working Java Servlet backend.

**Stack**
- Frontend: HTML + CSS + JavaScript (ES modules)
- 3D:       [Three.js](https://threejs.org/) `r160` (loaded from CDN, no npm install needed)
- Backend:  Java 11 + Servlet API 4 + Tomcat
- Build:    Maven (war)

---

## 📁 What's in here

```
milan-portfolio/
├── pom.xml                                   ← Maven build config
├── src/main/
│   ├── java/com/milan/portfolio/
│   │   ├── ContactServlet.java               ← POST /api/contact
│   │   ├── ProjectsServlet.java              ← GET  /api/projects
│   │   └── VisitorCounterServlet.java        ← GET  /api/visits
│   └── webapp/
│       ├── index.html                        ← The page
│       ├── css/styles.css                    ← All styling
│       ├── js/
│       │   ├── scene.js                      ← Three.js 3D world
│       │   └── main.js                       ← UI + backend bridge
│       └── WEB-INF/web.xml                   ← Servlet container config
└── README.md                                 ← You're reading it
```

---

## 🚀 Run it locally

### Prerequisites
- **Java 11 or newer** — check with `java -version`
- **Maven 3.6+** — check with `mvn -v`

If you don't have them yet:
- Windows: install [Eclipse Temurin JDK 17](https://adoptium.net/) and [Apache Maven](https://maven.apache.org/download.cgi), then make sure both are on your PATH.
- Or just install [IntelliJ IDEA Community](https://www.jetbrains.com/idea/download/) — it bundles Maven and detects this project automatically.

### The one command you need

From inside the `milan-portfolio` folder:

```bash
mvn tomcat7:run
```

Then open: **http://localhost:8080**

That's it. Maven downloads dependencies, fires up an embedded Tomcat server,
deploys the app, and serves the page.

To stop: `Ctrl+C` in the terminal.

---

## 👀 Just want to see the 3D scene without setting up Java?

Open `src/main/webapp/index.html` directly in your browser. The 3D scene, animations,
form, and styling all work. Only the *backend pieces* (visitor count, dynamic project list,
contact form submit) will be skipped — the page falls back to a hardcoded project list and
shows `∞` for the visit count. Great for previewing the look before you set up Tomcat.

> ⚠️ Some browsers block ES modules on `file://`. If the scene doesn't load, run a quick
> static server: `python -m http.server 8000 -d src/main/webapp` then open
> `http://localhost:8000`.

---

## ✏️ Edit your content

| What                 | Where                                                          |
| -------------------- | -------------------------------------------------------------- |
| Bio / about copy     | `src/main/webapp/index.html` (`#about` section)                |
| Skills list          | `src/main/webapp/index.html` (`.skill-grid`)                   |
| Projects             | `src/main/java/com/milan/portfolio/ProjectsServlet.java`       |
| Crystal labels in 3D | `src/main/webapp/js/scene.js` (`_addProjectCrystals` array)    |
| Colors / theme       | `src/main/webapp/css/styles.css` (top `:root` block)           |
| Social links         | `src/main/webapp/index.html` (`.socials` block)                |

After editing Java code, restart `mvn tomcat7:run`.  HTML/CSS/JS changes are picked
up by a simple page refresh.

---

## 📬 Where contact-form messages go

When someone submits the contact form, the message is appended to a log file:

```
<tomcat-temp>/contact-messages.log
```

The exact path is printed in the Tomcat console at startup, e.g.

```
Contact messages will be logged to: /tmp/tomcat.123.8080/contact-messages.log
```

Open that file any time to read your inbox. Format:

```
[2026-05-19T15:43:21+05:45] Jane Doe <jane@example.com> (1.2.3.4)
hey milan, loved the floating island. wanna chat?
---
```

---

## 🌐 Deploy it

A few easy options once you're ready to put it online:

### Option 1 — Render.com (free)
1. Push this folder to a new GitHub repo
2. On Render → New → Web Service → connect the repo
3. Environment: **Docker**, use this `Dockerfile` (create it at the project root):
   ```Dockerfile
   FROM maven:3.9-eclipse-temurin-17 AS build
   COPY . /app
   WORKDIR /app
   RUN mvn -B package
   FROM tomcat:10.1-jdk17-temurin
   COPY --from=build /app/target/milan-portfolio.war /usr/local/tomcat/webapps/ROOT.war
   EXPOSE 8080
   CMD ["catalina.sh", "run"]
   ```
   > Note: Tomcat 10+ uses `jakarta.servlet.*` — if you upgrade, swap `javax.servlet` for
   > `jakarta.servlet` in your Java imports and bump `javax.servlet-api` to
   > `jakarta.servlet-api`.

### Option 2 — Run on your own VPS
1. `mvn package` → produces `target/milan-portfolio.war`
2. Drop the war into Tomcat's `webapps/` folder
3. Browse to `http://your-server:8080/milan-portfolio/`

### Option 3 — Static-only (no backend)
If you don't need contact-form storage / visitor count:
push `src/main/webapp/` to GitHub Pages, Netlify, or Vercel as a static site. The
frontend gracefully falls back to bundled data.

---

## 🐛 Troubleshooting

- **3D scene is blank** → open browser DevTools (F12) → Console tab. If you see
  CORS / module errors, you're loading via `file://` — use the Python static-server
  trick above or run via Tomcat.
- **`mvn` not found** → install Maven, add `apache-maven/bin` to your PATH, restart terminal.
- **Port 8080 already in use** → in `pom.xml`, change `<port>8080</port>` to e.g. `9090`.
- **Slow on old laptops** → in `scene.js`, drop the firefly `count` from 240 to 80 and
  the star `count` from 1000 to 300.

---

## 🎨 Credits

Built by Milan Thapa. 3D scene authored from scratch — no external models or textures.

> *curiosity is my code.*
