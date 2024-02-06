import {HttpEvent, HttpHandlerFn, HttpHeaders, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {dynamicSamplingContextToSentryBaggageHeader} from '@sentry/utils';
import {getActiveSpan, spanToTraceContext, spanToTraceHeader, startSpanManual} from '@sentry/core';
import {startSpan} from "@sentry/angular-ivy";

export interface SentryTraceHeader {
    baggage?: string;
    'sentry-trace': string;
}

export const getSentryTraceHeaders = (): SentryTraceHeader | undefined => {
    let headers: SentryTraceHeader | undefined;

    const span = getActiveSpan();
    if (span) {
        headers = { ['sentry-trace']: spanToTraceHeader(span) };
        const dynamicSamplingContext = spanToTraceContext(span);
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

const mapRequest = (request: HttpRequest<unknown>): HttpRequest<unknown> => {
    const updatedRequest = () => request.clone({ headers: mergeHttpHeadersWithSentryTrace(request.headers) });
    const activeSpan = getActiveSpan();
    if (activeSpan) {
        return updatedRequest();
    }

    return startSpan({
        op: 'HTTP Request',
        name: request.url,
    }, updatedRequest);
}

export const sentryTraceInterceptor = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const updatedRequest = mapRequest(request);

    return next(updatedRequest);
};