import {CustomSpan} from "@jufab/opentelemetry-angular-interceptor";
import {Span} from "@opentelemetry/sdk-trace-web";
import {HttpErrorResponse, HttpRequest, HttpResponse} from "@angular/common/http";

export class CustomSpanImpl implements CustomSpan {
    add(span: Span, request: HttpRequest<unknown>, response: HttpResponse<unknown> | HttpErrorResponse): Span {
        span.setAttribute('attribute.key', 'test');
        return span;
    }
}