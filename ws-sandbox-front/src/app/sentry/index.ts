import {APP_INITIALIZER, ErrorHandler, makeEnvironmentProviders} from "@angular/core";
import {Router} from "@angular/router";
import * as Sentry from '@sentry/angular-ivy';

export const initializeLogger = () => async () => {
    Sentry.init({
        dsn: 'https://6b1f8f34e907b94af5a96a585c4d6096@us.sentry.io/4506698681876480',
        integrations: [
            new Sentry.BrowserTracing({
                tracePropagationTargets: ["localhost"],
                routingInstrumentation: Sentry.routingInstrumentation,
            }),
        ],
        maxBreadcrumbs: 50,
        tracesSampleRate: 1,
        environment: 'test',
    });
};

export const provideLogger = makeEnvironmentProviders([
    {
        provide: APP_INITIALIZER,
        useFactory: initializeLogger,
        multi: true,
    },
    {
        provide: APP_INITIALIZER,
        useFactory: () => () => {},
        deps: [Sentry.TraceService],
        multi: true,
    },
    {
        provide: ErrorHandler,
        useValue: Sentry.createErrorHandler({
            logErrors: true,
            showDialog: false,
        }),
    },
    {
        provide: Sentry.TraceService,
        deps: [Router],
    },
]);