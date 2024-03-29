import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  combineLatest,
  exhaustMap,
  filter,
  finalize,
  map,
  switchMap,
  takeWhile,
  tap,
  timer,
  withLatestFrom,
} from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { SocketStatsStore } from "./socket-stats.store";

export const assertDefined: <T>(value: T | undefined | null, error?: string) => asserts value is T = <T>(
  value: T | undefined | null,
  error?: string,
) => {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return;
  }

  if (!value) {
    throw new Error(error || 'Value is not defined');
  }
};

export function assertTrue(value: boolean, error?: string): asserts value is true {
  if (!value) {
    throw new Error(error || 'Value is falsy');
  }
}

export interface Message {
  clientId: string;
  message: string;
  sentAt: Date;
}

export interface Message2<T> {
  traceId: string;
  spanId: string;
  type: 'choose_state' | 'next_state';
  source: 'ARM_LPU' | string;
  data: {
    "object_id": "f77948dc-7bc8-42cb-979e"; // guid
    "payload": T;
  },
}

/*"payload": {// 'next_state'
  "datacontetnttype": "application/json",
      "state": {
    "code": "12"
  }
}
},*/

export type EventType = 'error' | 'message' | 'connect' | 'disconnect';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WsMessageContent {}

export interface SubscriptionMessage extends WsMessageContent {
  eventType: EventType | EventType[];
  isSubscribe: boolean;
}

export interface SubscriptionEvent<TBody = unknown> extends WsMessageContent {
  eventType: EventType;
  body: TBody;
}

export interface WsMessage {
  event: string;
  data: WsMessageContent;
}

const RETRY_SECONDS = 5;
const MAX_RETRIES = 30;
const DEBUG_MODE = true;

interface SocketState {
  wsSubjectConfig?: WebSocketSubjectConfig<WsMessage>;
  subMessages: WsMessageContent[];
  socket?: WebSocketSubject<WsMessage>;
  connectError?: unknown;
}

@Injectable()
export class SocketService extends ComponentStore<SocketState> {
  private messages = new Subject<WsMessageContent>();
  private readonly connected = new Subject<void>();
  private readonly wsSubjectConfig$ = this.select(({ wsSubjectConfig }) => wsSubjectConfig);

  /**
   * Per-eventType counts of how many subscriptions are active.
   */
  private eventTypeSubscriptionCounts: Map<EventType, number> = new Map();

  /**
   * The current state of the websocket connection.
   */
  readonly isConnected$ = this.statsStore.isConnected$;

  /**
   * A stream of messages received
   */
  private messages$ = this.messages.asObservable();

  private readonly subMessages$ = this.select(({ subMessages }) => subMessages);

  private readonly socket$ = this.select(({ socket }) => socket);

  /**
   * A stream that emits whenever the websocket connects.
   */
  readonly connected$ = this.connected.asObservable();

  /**
   * A stream of errors that occurred when trying to connect to the websocket.
   */
  readonly connectError$ = this.select(({ connectError }) => connectError);

  /**
   * A stream of messages to send, combined with whether the websocket is connected.
   * This will emit when the websocket is connected, and there are messages to send.
   */
  private readonly toSend$ = combineLatest([this.isConnected$, this.subMessages$]).pipe(
    filter(([isConnected, queue]) => !!(isConnected && queue.length)),
    map(([, queue]) => queue),
  );

  /**
   * Constructs the WebSocketSubjectConfig object, with open and close observers
   * to handle connection status, and trying to re-connect when disconnected.
   */
  private readonly setUpWebSocketSubjectConfig = this.updater<string>((state, url) => {
    const wsSubjectConfig: WebSocketSubjectConfig<WsMessage> = {
      url,
      closeObserver: {
        next: (event) => {
          DEBUG_MODE && console.log('closeObserver', event);
          this.statsStore.setConnected(false);

          this.tryReconnect();
        },
      },
      openObserver: {
        next: (event) => {
          DEBUG_MODE && console.log('openObserver', event);

          this.patchState({ connectError: undefined });

          this.statsStore.setConnected(true);
          this.statsStore.bumpConnections();

          // Notify connected
          this.connected.next();
        },
      },
    };

    return { ...state, wsSubjectConfig };
  })

  /**
   * Attempts to connect to the websocket.
   */
  private readonly connect = this.effect((trigger$) =>
    trigger$.pipe(
      withLatestFrom(this.wsSubjectConfig$),
      switchMap(([, config]) => {
        assertDefined(config);

        // Create a new socket and listen for messages, pushing them into the messages Subject.
        const socket = new WebSocketSubject(config);
        this.patchState({ socket });
        return socket.pipe(
          tap((msg) => {
            this.messages.next(msg);
            this.statsStore.bumpMessagesReceived();
          }),
          catchError((err) => {
            this.patchState({ connectError: err });

            DEBUG_MODE && console.log('error in connect', err);
            return EMPTY;
          }),
        );
      }),
    ),
  );

  /**
   * Disconnects the socket. For simulation purposes. The service will automatically try to reconnect.
   */
  readonly disconnect = this.effect((trigger$) =>
    trigger$.pipe(
      withLatestFrom(this.isConnected$, this.socket$),
      tap(([, isConnected, socket]) => {
        if (isConnected && socket) {
          socket.complete();
        }
      }),
    ),
  );

  /**
   * Handles attempting to reconnect to the websocket until connected or
   * the max retries have been reached.
   */
  private readonly tryReconnect = this.effect((trigger$) =>
    trigger$.pipe(
      exhaustMap(() => {
        return timer(RETRY_SECONDS * 1000).pipe(
          withLatestFrom(this.isConnected$),
          takeWhile(([, isConnected]) => {
            if (!isConnected) {
              this.statsStore.bumpConnectionRetries();
            }

            return !isConnected && this.statsStore.reconnectionTries < MAX_RETRIES;
          }),
          tap(() => {
            this.connect();
          }),
        );
      }),
    ),
  );

  /**
   * Watches the queue for changes, and when the socket exists,
   * sends the messages in the queue.
   */
  readonly watchQueue = this.effect((queue$: Observable<WsMessageContent[]>) =>
    queue$.pipe(
      withLatestFrom(this.socket$),
      tap(([queue, socket]) => {
        DEBUG_MODE && console.log('watchQueue', queue, socket);

        if (!socket) {
          return;
        }

        while (queue.length) {
          const msg = queue.shift();
          assertDefined(msg);

          DEBUG_MODE && console.log('Sending queued message', msg);
          socket.next({
            event: 'subscriptions',
            data: msg,
          });

          this.patchState({ subMessages: queue });
        }
      }),
    ),
  );

  /**
   * Adds a message to the queue to send to the server to subscribe or unsubscribe to/from a notification.
   */
  private readonly queueSubMessage = this.effect((msg$: Observable<SubscriptionMessage>) =>
    msg$.pipe(
      withLatestFrom(this.subMessages$),
      tap(([msg, queue]) => {
        if (msg.isSubscribe) {
          this.statsStore.bumpSubscriptionCount();
        } else {
          this.statsStore.dropSubscriptionCount();
        }

        this.patchState({ subMessages: [...queue, msg] });
      }),
    ),
  );

  constructor(private statsStore: SocketStatsStore) {
    super({
      subMessages: [],
    });
  }

  init(url: string) {
    this.setUpWebSocketSubjectConfig(url);
    this.statsStore.setConnected(false);

    this.connect();
    this.watchQueue(this.toSend$);
  }

  /**
   * Begins listening to a type of events or events.
   *
   * Sets up the subscription with the server, sending a subscribe message, and returning a stream
   * of filtered messages.
   *
   * When the client closes the stream, sends an unsubscribe message to the server.
   *
   * @param eventType
   * @returns A stream of messages of the specified type.
   */
  listen<T extends SubscriptionEvent>(eventType: EventType | EventType[]): Observable<T> {
    // Send a message to the server to begin subscribe to each of the event types we're
    // first to subscribe to.
    this.subscribeIfFirst(eventType);

    return this.messages$.pipe(
      map((msg) => msg as SubscriptionEvent),
      filter((msg) => {
        if (typeof eventType === 'string') {
          return msg.eventType === eventType;
        } else {
          return eventType.includes(msg.eventType);
        }
      }),
      map((msg) => msg as T),
      finalize(() => {
        // Caller has unsubscribed from the stream.
        // Send the message to the server to  unsubscribe for each eventType we're
        // last to unsubscribe from.
        this.unsubscribeIfLast(eventType);
      }),
    );
  }

  /**
   * Checks if the first subscription to the event type(s) and sends a message to the server to begin subscribing.
   * @param eventType
   */
  private subscribeIfFirst(eventType: EventType | EventType[]) {
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];

    eventTypes.forEach((eventType) => {
      const count = this.eventTypeSubscriptionCounts?.get(eventType) ?? 0;
      if (!count) {
        const msg = {
          eventType,
          isSubscribe: true,
        } as SubscriptionMessage;

        // Send a message to the server to begin subscribe to the event type(s).
        this.queueSubMessage(msg);
      }

      this.eventTypeSubscriptionCounts.set(eventType, count + 1);
    });
  }

  /**
   * Checks if the last subscription to the event type(s) and sends a message to the server to begin unsubscribing.
   * @param eventType
   */
  private unsubscribeIfLast(eventType: EventType | EventType[]) {
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];

    eventTypes.forEach((eventType) => {
      const count = (this.eventTypeSubscriptionCounts?.get(eventType) ?? 0) - 1;

      if (count < 0) {
        throw new Error(`Unsubscribe called for ${eventType} but no count found`);
      }

      if (!count) {
        const msg = {
          eventType,
          isSubscribe: false,
        } as SubscriptionMessage;

        // Send a message to the server to begin subscribe to the event type(s).
        this.queueSubMessage(msg);
      }

      this.eventTypeSubscriptionCounts.set(eventType, count);
    });
  }
}
