import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === "development" ? 1.0 : 0.1,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "production",
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
