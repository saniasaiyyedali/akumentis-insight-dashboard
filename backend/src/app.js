const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth.routes");
const workforceRoutes = require("./routes/workforce.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => { next(); });

app.use("/api/auth", authRoutes);
app.use("/api/workforce", workforceRoutes);

// Backward compatibility aliases for old dashboard routes
app.all("/api/dashboard/summary", (req, res) => {
  res.redirect(307, "/api/workforce/kpi?" + new URLSearchParams(req.query).toString());
});
app.all("/api/dashboard/employees", (req, res) => {
  res.redirect(307, "/api/workforce/employees?" + new URLSearchParams(req.query).toString());
});
app.all("/api/dashboard/states", (req, res) => {
  res.redirect(307, "/api/workforce/states?" + new URLSearchParams(req.query).toString());
});
app.all("/api/filters/options", (req, res) => {
  res.redirect(307, "/api/workforce/dynamic-filters?" + new URLSearchParams(req.query).toString());
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve frontend static files if dist exists
const distPath = path.join(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(path.join(distPath, "index.html"))) {
  app.use(express.static(distPath));

  // SPA fallback for non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

module.exports = app;
