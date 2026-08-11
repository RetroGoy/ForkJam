const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },

  // Le typecheck TS reste bloquant ; on n'échoue pas le build sur des
  // règles ESLint cosmétiques (ex: apostrophes non échappées).
  eslint: {
    ignoreDuringBuilds: true,
  },

  serverExternalPackages: ["bufferutil", "utf-8-validate"],
};

module.exports = withSentryConfig(nextConfig, {
  org: "forkjam",
  project: "javascript-nextjs",

  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,

  automaticVercelMonitors: false,
});