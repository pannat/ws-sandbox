import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {SocketService} from "./ws/socket.service";
import {SocketStatsStore} from "./ws/socket-stats.store";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [SocketStatsStore, SocketService]
})
export class AppComponent implements OnInit {
  readonly message$ = this.socketService.listen(['message', 'connect', 'disconnect']);
  constructor(private socketService: SocketService) {}

  ngOnInit() {
    // Инициализация подключения вебсокета
    this.socketService.init(`ws://localhost:8080/statuses?guid=test-guid&source=ARM_LPU`);

    // Отправляем сообщение серверу
    this.socketService.watchQueue([{ id: 'dgfgjhk', code: 'blabla'}]);
  }
}
