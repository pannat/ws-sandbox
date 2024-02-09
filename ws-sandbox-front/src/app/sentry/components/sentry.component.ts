import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {HttpClient} from "@angular/common/http";
import {startSpanManual} from "@sentry/core";
import {catchError, EMPTY, finalize, ReplaySubject} from "rxjs";
import {getCurrentScope} from "@sentry/angular-ivy";

@Component({
  selector: 'app-sentry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sentry.component.html',
  styleUrls: ['./sentry.component.scss']
})
export class SentryComponent {
  data = new ReplaySubject(1);

  httpClient = inject(HttpClient);

  fetchSomething() {
      startSpanManual(
          {
            op: 'ui.angular.fetchSomething',
            name: 'search policies',
            scope: getCurrentScope(),
          },
          (span) =>
              this.httpClient.get('/api/start?param1=test&param2=test2').pipe(
                  finalize(() => {
                    span?.end(Date.now());
                  }),
              ),
      ).pipe(catchError(() => EMPTY)).subscribe((res) => this.data.next(res))
  }
}
