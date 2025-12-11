import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = process.env.SENTRY_DISABLED
  ? undefined
  : Sentry.captureRouterTransitionStart;