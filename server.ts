import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { dbService } from "./server/services/dbService.js";
import apiRouter from "./server/routes/api.js";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to Database
  const currentDbMode = await dbService.connect();
  console.log(`Database initialized in "${currentDbMode}" mode.`);

  // Enable CORS
  app.use(cors());

  // Configure middleware - support base64 images for project upload
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // SEO Endpoints: robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Sitemap: ${req.protocol}://${req.get("host")}/sitemap.xml`);
  });

  // SEO Endpoints: sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    res.type("application/xml");
    const host = `${req.protocol}://${req.get("host")}`;
    
    let projects: any[] = [];
    try {
      projects = await dbService.projects.getAll();
    } catch (e) {
      // ignore
    }

    const projectUrls = projects.map(p => `
  <url>
    <loc>${host}/#project-${p.id}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${host}/#about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${host}/#skills</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${host}/#projects</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${host}/#certificates</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${host}/#contact</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>${projectUrls}
</urlset>`;

    res.send(sitemap);
  });

  // API Routes
  app.use("/api", apiRouter);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: dbService.getMode() });
  });

  // Vite static assets serving & client fallbacks
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development server with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting production server...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files from the /dist build directory
    app.use(express.static(distPath));
    
    // SPA routing fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully listening at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error during server boot:", err);
  process.exit(1);
});
