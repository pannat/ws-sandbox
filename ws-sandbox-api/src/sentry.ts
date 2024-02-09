import * as Sentry from "@sentry/node";
import {ProfilingIntegration} from "@sentry/profiling-node";

export const initializeSentry = () => {
  Sentry.init({
    dsn: "https://b88e6d0eda9fcb25bf847814fd601920@us.sentry.io/4506699218681856",
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });
}
