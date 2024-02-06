import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'sentry',
        loadComponent: () => import('./sentry/components/sentry.component').then((m) => m.SentryComponent)
    },
    {
        path: 'page-sentry-2',
        loadComponent: () => import('./sentry/components/sentry.component').then((m) => m.SentryComponent)
    },
    {
        path: 'page-sentry-3',
        loadComponent: () => import('./sentry/components/sentry.component').then((m) => m.SentryComponent)
    },
    {
        path: 'ws',
        loadComponent: () => import('./ws/components/ws.component').then((m) => m.WsComponent)
    }
];
