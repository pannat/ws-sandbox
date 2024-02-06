import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {provideLogger} from "./sentry";
import {sentryTraceInterceptor} from "./sentry/sentry-trace.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([sentryTraceInterceptor])), provideRouter(routes), provideLogger]
};
