import * as Sentry from "@sentry/nextjs";

export const onRequestError = process.env.SENTRY_DISABLED
  ? undefined
  : Sentry.captureRequestError;