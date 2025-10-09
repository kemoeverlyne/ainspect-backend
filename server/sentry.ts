import * as Sentry from "@sentry/node";
import type { Express } from "express";

export function initSentry(app: Express) {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });

    // Basic Sentry middleware (simplified for compatibility)
    app.use((req, res, next) => {
      Sentry.addBreadcrumb({
        message: `${req.method} ${req.url}`,
        category: 'http',
        level: 'info',
      });
      next();
    });
  }
}

export function setupSentryErrorHandler(app: Express) {
  if (process.env.SENTRY_DSN) {
    // Custom error handler that captures exceptions to Sentry
    app.use((err: any, req: any, res: any, next: any) => {
      Sentry.captureException(err);
      next(err);
    });
  }
}

export { Sentry };