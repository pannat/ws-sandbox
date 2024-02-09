import {HttpEvent, HttpHandlerFn, HttpHeaders, HttpRequest} from "@angular/common/http";
import {finalize, Observable} from "rxjs";
import {dynamicSamplingContextToSentryBaggageHeader, stripUrlQueryAndFragment} from '@sentry/utils';
import {getActiveSpan, getDynamicSamplingContextFromSpan, spanToTraceHeader, startSpanManual} from '@sentry/core';
import {getCurrentScope, startSpan} from "@sentry/angular-ivy";

export interface SentryTraceHeader {
    baggage?: string;
    'sentry-trace': string;
}

export const getSentryTraceHeaders = (): SentryTraceHeader | undefined => {
    let headers: SentryTraceHeader | undefined;

    const span = getActiveSpan();
    if (span) {
        headers = { ['sentry-trace']: spanToTraceHeader(span) };
        const dynamicSamplingContext = getDynamicSamplingContextFromSpan(span);
        const sentryBaggageHeader = dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext);
        if (sentryBaggageHeader) {
            headers['baggage'] = sentryBaggageHeader;
        }
    }

    return headers;
};

const mergeHttpHeadersWithSentryTrace = (httpHeaders: HttpHeaders) => {
    const traceHeaders = getSentryTraceHeaders();
    if (traceHeaders) {
        httpHeaders = Object.entries(traceHeaders).reduce(
            (headers, [key, value]) => (typeof value === 'string' ? headers.append(key, value) : headers),
            httpHeaders,
        );
    }

    return httpHeaders;
};

const intercept = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const updatedRequest = () => request.clone({ headers: mergeHttpHeadersWithSentryTrace(request.headers) });

    if (getActiveSpan()) {
        return next(updatedRequest());
    }

    return startSpanManual(
        {
            op: 'http.client',
            name: `${request.method} ${stripUrlQueryAndFragment(request.url)}`,
            scope: getCurrentScope(),
        },
        (span) => next(updatedRequest()).pipe(finalize(() => span?.end(Date.now()))),
    );
};
export const sentryTraceInterceptor = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    console.log(JSON.parse(JSON.stringify(request.headers)));
    return intercept(request, next);
};