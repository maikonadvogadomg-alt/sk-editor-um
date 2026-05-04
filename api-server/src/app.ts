import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { join } from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", router);

// In production, serve the static web apps
if (process.env.NODE_ENV === "production") {
  const cwd = process.cwd();

  // Assistente IA JurÃ­dico at /assistente/
  const assistenteDir = join(cwd, "artifacts/assistente-ia/dist/public");
  if (existsSync(assistenteDir)) {
    app.use("/assistente", express.static(assistenteDir));
    app.get("/assistente/*", (_req, res) => {
      const idx = join(assistenteDir, "index.html");
      if (existsSync(idx)) res.sendFile(idx);
      else res.status(404).send("Not found");
    });
  }

  // DevTools PWA (analytics-dashboard) at /
  const dashboardDir = join(cwd, "artifacts/analytics-dashboard/dist/public");
  if (existsSync(dashboardDir)) {
    app.use("/", express.static(dashboardDir));
    // SPA fallback â serve index.html for all non-API, non-assistente routes
    app.get(/^(?!\/api).*$/, (_req, res) => {
      const idx = join(dashboardDir, "index.html");
      if (existsSync(idx)) res.sendFile(idx);
      else res.status(404).send("Not found");
    });
  }
}

export default app;
