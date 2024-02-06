import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {HttpClient} from "@angular/common/http";
import {startSpanManual} from "@sentry/core";
import {ReplaySubject} from "rxjs";

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
    this.httpClient.get('/api/start?param1=test&param2=test2').subscribe((res) => this.data.next(res))
  }
}
