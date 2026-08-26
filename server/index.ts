import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    const redact = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(redact);
      if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
        return Object.fromEntries(Object.entries(value as Record<string, unknown>)
          .filter(([key]) => !["password", "verificationCode", "verificationCodeExpires"].includes(key))
          .map(([key, child]) => [key, redact(child)]));
      }
      return value;
    };
    const safeBody = redact(bodyJson);
    capturedJsonResponse = safeBody as Record<string, any>;
    return originalResJson.apply(res, [safeBody, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

async function main() {
  if (process.env.SEED_ON_START === "true" && process.env.NODE_ENV !== "production") {
    await seedDatabase();
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(err);
    if (!res.headersSent) res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
  });
}

if (import.meta.url.startsWith("file:")) {
  void main().catch((error) => {
    console.error("Server startup failed", error);
    process.exitCode = 1;
  });
}
