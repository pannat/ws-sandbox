import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {SocketService} from "../socket.service";
import {SocketStatsStore} from "../socket-stats.store";

@Component({
  selector: 'app-ws',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ws.component.html',
  styleUrls: ['./ws.component.scss'],
  providers: [SocketStatsStore, SocketService]
})
export class WsComponent implements OnInit {
  readonly message$ = this.socketService.listen(['message', 'connect', 'disconnect']);
  constructor(private socketService: SocketService) {}

  ngOnInit() {
    // Инициализация подключения вебсокета
    this.socketService.init(`ws://localhost:8080/statuses?guid=test-guid&source=ARM_LPU`);
  }

  send() {
    // Отправляем сообщение серверу
    this.socketService.watchQueue([{ id: 'dgfgjhk', code: 'blabla'}]);
  }
}
