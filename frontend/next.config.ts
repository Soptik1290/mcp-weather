import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

// Wrap config with Sentry
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require("@sentry/nextjs/build/cjs/config");

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
  widenClientFileUpload: true,
  disableLogger: true,
});
