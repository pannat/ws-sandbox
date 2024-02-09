import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors, withInterceptorsFromDi} from "@angular/common/http";
import {provideLogger} from "./sentry";
import {sentryTraceInterceptor} from "./sentry/sentry-trace.interceptor";
import {
  CompositePropagatorModule,
  OpenTelemetryInterceptorModule, OTEL_CUSTOM_SPAN, OTEL_INSTRUMENTATION_PLUGINS,
  OtelColExporterModule, OtelWebTracerModule
} from "@jufab/opentelemetry-angular-interceptor";
import {XMLHttpRequestInstrumentation} from "@opentelemetry/instrumentation-xml-http-request";
import {FetchInstrumentation} from "@opentelemetry/instrumentation-fetch";
import {CustomSpanImpl} from "./otel/custom-span";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([sentryTraceInterceptor]), withInterceptorsFromDi()),
    provideRouter(routes),
    provideLogger,
    // Для интерцептора ANGULAR
    importProvidersFrom(OpenTelemetryInterceptorModule.forRoot({
      commonConfig: {
        console: true, // Display trace on console (only in DEV env)
        production: false, // Send Trace with BatchSpanProcessor (true) or SimpleSpanProcessor (false)
        serviceName: 'sandbox-angular', // Service name send in trace
        probabilitySampler: '1',
      },
      otelcolConfig: {
        url: '/otel', // URL of opentelemetry collector
      },
    })),
    // Если используются только плагины
    /*importProvidersFrom(OtelWebTracerModule.forRoot({
      commonConfig: {
        console: true, // Display trace on console (only in DEV env)
        production: false, // Send Trace with BatchSpanProcessor (true) or SimpleSpanProcessor (false)
        serviceName: 'sandbox-angular', // Service name send in trace
        probabilitySampler: '1',
      },
      otelcolConfig: {
        url: '/otel', // URL of opentelemetry collector
      }})
    ),*/
    /*{provide: OTEL_INSTRUMENTATION_PLUGINS, useValue: [new XMLHttpRequestInstrumentation(), new FetchInstrumentation()]}*/
    //Insert OtelCol exporter module
    importProvidersFrom(OtelColExporterModule),
    //Insert propagator module
    importProvidersFrom(CompositePropagatorModule),
    { provide: OTEL_CUSTOM_SPAN, useClass: CustomSpanImpl }
  ]
};
