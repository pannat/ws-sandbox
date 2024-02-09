import { initializeOtel } from "./otel";
initializeOtel();
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import * as Sentry from "@sentry/node";
import {continueTrace} from "@sentry/core";
import websocket, { SocketStream } from '@fastify/websocket';
import { initializeSentry } from "./sentry";

import { trace, SpanStatusCode } from "@opentelemetry/api";

initializeSentry();


const json = [
  {
    "_id": "65be5f9e221615de6ffc979b",
    "index": 0,
    "guid": "45cb6c42-5856-4908-aed8-7349d59c5db6",
    "isActive": true,
    "balance": "$2,147.08",
    "picture": "http://placehold.it/32x32",
    "age": 38,
    "eyeColor": "green",
    "name": "Hunt Lang",
    "gender": "male",
    "company": "DYNO",
    "email": "huntlang@dyno.com",
    "phone": "+1 (938) 454-2147",
    "address": "338 Troy Avenue, Kilbourne, North Dakota, 2433",
    "about": "Dolor mollit tempor fugiat et laboris non quis. Dolor consectetur est anim minim id ea pariatur laboris. Quis et qui id ea. Ipsum occaecat elit aliquip elit culpa id excepteur minim. Consectetur in nisi aliquip aliqua.\r\n",
    "registered": "2014-09-17T12:14:13 -04:00",
    "latitude": -89.589514,
    "longitude": 30.295766,
    "tags": [
      "consequat",
      "officia",
      "culpa",
      "occaecat",
      "veniam",
      "nisi",
      "aliqua"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Lily Sweet"
      },
      {
        "id": 1,
        "name": "Laverne Rodgers"
      },
      {
        "id": 2,
        "name": "Love Leblanc"
      }
    ],
    "greeting": "Hello, Hunt Lang! You have 2 unread messages.",
    "favoriteFruit": "banana"
  },
  {
    "_id": "65be5f9eb54831503d52e726",
    "index": 1,
    "guid": "dc781d24-4272-41cb-bb96-9d4f631b460a",
    "isActive": true,
    "balance": "$2,072.28",
    "picture": "http://placehold.it/32x32",
    "age": 22,
    "eyeColor": "blue",
    "name": "Ester Goodwin",
    "gender": "female",
    "company": "ROCKLOGIC",
    "email": "estergoodwin@rocklogic.com",
    "phone": "+1 (834) 431-2094",
    "address": "541 Oak Street, Neibert, Northern Mariana Islands, 4005",
    "about": "Proident aliquip proident cillum sit non aliquip ad consequat labore et aute eiusmod. Nostrud pariatur proident occaecat enim et minim cupidatat. Veniam officia sunt commodo anim proident elit irure ipsum ad est elit sit et. Nostrud dolore ipsum eiusmod exercitation proident minim amet. Reprehenderit cillum irure elit nostrud Lorem fugiat occaecat esse nulla culpa. Fugiat aute ea elit in eu.\r\n",
    "registered": "2018-06-27T04:21:02 -03:00",
    "latitude": 69.154258,
    "longitude": -167.167472,
    "tags": [
      "cillum",
      "enim",
      "et",
      "ullamco",
      "cupidatat",
      "ex",
      "veniam"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Elba Berger"
      },
      {
        "id": 1,
        "name": "Powers Gaines"
      },
      {
        "id": 2,
        "name": "Jillian Holland"
      }
    ],
    "greeting": "Hello, Ester Goodwin! You have 3 unread messages.",
    "favoriteFruit": "strawberry"
  },
  {
    "_id": "65be5f9e38e2c2bbddba47b5",
    "index": 2,
    "guid": "beaacbb9-99be-4ced-be9e-ad25addc41f8",
    "isActive": false,
    "balance": "$1,488.42",
    "picture": "http://placehold.it/32x32",
    "age": 26,
    "eyeColor": "brown",
    "name": "Bass Nielsen",
    "gender": "male",
    "company": "BALUBA",
    "email": "bassnielsen@baluba.com",
    "phone": "+1 (843) 509-3160",
    "address": "905 Auburn Place, Adelino, Massachusetts, 7546",
    "about": "Ad incididunt in aliquip fugiat id adipisicing ipsum magna Lorem cupidatat nostrud. Aute velit consequat deserunt commodo. Deserunt veniam labore nostrud nostrud reprehenderit et mollit magna dolore. Ullamco nisi et esse officia id mollit occaecat fugiat velit cillum minim. Deserunt nisi nisi cillum incididunt aliquip officia consectetur elit pariatur. Est sunt occaecat voluptate duis quis amet reprehenderit ut.\r\n",
    "registered": "2018-11-28T02:27:24 -03:00",
    "latitude": 48.381993,
    "longitude": 6.993923,
    "tags": [
      "cupidatat",
      "adipisicing",
      "nostrud",
      "elit",
      "est",
      "quis",
      "proident"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Vickie Knapp"
      },
      {
        "id": 1,
        "name": "Lina Joseph"
      },
      {
        "id": 2,
        "name": "Carly Avery"
      }
    ],
    "greeting": "Hello, Bass Nielsen! You have 3 unread messages.",
    "favoriteFruit": "strawberry"
  },
  {
    "_id": "65be5f9e531622250b39bbe2",
    "index": 3,
    "guid": "6cb32158-5d32-4fd2-951b-bce2b8c89273",
    "isActive": true,
    "balance": "$2,746.62",
    "picture": "http://placehold.it/32x32",
    "age": 27,
    "eyeColor": "brown",
    "name": "Rowena Langley",
    "gender": "female",
    "company": "TELEPARK",
    "email": "rowenalangley@telepark.com",
    "phone": "+1 (892) 406-3104",
    "address": "871 Hart Street, Yorklyn, Maine, 6171",
    "about": "Adipisicing excepteur exercitation aliquip occaecat cupidatat. Et officia sunt velit minim veniam veniam nostrud laboris id culpa mollit tempor esse eiusmod. Enim Lorem dolor excepteur sint esse nulla aute ipsum amet. Officia nulla dolore nisi nisi incididunt velit deserunt. Proident officia esse do qui aliquip labore dolor exercitation excepteur nulla nostrud in labore.\r\n",
    "registered": "2017-05-23T03:54:41 -03:00",
    "latitude": -58.88258,
    "longitude": -77.506392,
    "tags": [
      "cillum",
      "anim",
      "quis",
      "aliquip",
      "eu",
      "anim",
      "cupidatat"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Noel Cochran"
      },
      {
        "id": 1,
        "name": "Decker Mercado"
      },
      {
        "id": 2,
        "name": "Small Ferrell"
      }
    ],
    "greeting": "Hello, Rowena Langley! You have 6 unread messages.",
    "favoriteFruit": "strawberry"
  },
  {
    "_id": "65be5f9e14e279d5ee99e426",
    "index": 4,
    "guid": "291cc199-a9ff-49df-b98b-92017380512b",
    "isActive": false,
    "balance": "$2,064.44",
    "picture": "http://placehold.it/32x32",
    "age": 39,
    "eyeColor": "blue",
    "name": "Trujillo Houston",
    "gender": "male",
    "company": "NETROPIC",
    "email": "trujillohouston@netropic.com",
    "phone": "+1 (936) 581-2941",
    "address": "655 Grove Street, Chicopee, Indiana, 1457",
    "about": "Sint consequat anim ipsum Lorem nulla incididunt labore laboris. Ipsum reprehenderit nostrud irure non reprehenderit consectetur laborum do fugiat sunt consequat proident aliqua. Duis laboris excepteur fugiat proident voluptate sunt do id laboris deserunt sunt proident aliqua. Dolore adipisicing irure exercitation amet irure reprehenderit nostrud voluptate mollit anim do nostrud commodo aute. Ex consectetur sit elit commodo aliquip in elit aute consequat id elit magna ullamco voluptate. Voluptate id laboris aliqua cillum ullamco magna reprehenderit Lorem cupidatat dolore incididunt tempor.\r\n",
    "registered": "2018-09-29T05:33:04 -03:00",
    "latitude": -34.681116,
    "longitude": -110.955391,
    "tags": [
      "esse",
      "veniam",
      "dolore",
      "exercitation",
      "nisi",
      "ad",
      "et"
    ],
    "friends": [
      {
        "id": 0,
        "name": "Lula Pollard"
      },
      {
        "id": 1,
        "name": "Tanisha Orr"
      },
      {
        "id": 2,
        "name": "Nona Estes"
      }
    ],
    "greeting": "Hello, Trujillo Houston! You have 7 unread messages.",
    "favoriteFruit": "strawberry"
  }
]

const server: FastifyInstance = fastify({ logger: true });

server.register(cors, { origin: "*" });
server.register(websocket);

server.register(async function (fastify) {
  fastify.get('/statuses', { websocket: true }, (connection: SocketStream, req: FastifyRequest) => {
    connection.socket.on('message', (message: Buffer) => {
      const incomingMessageBody = JSON.parse(message.toString()) as { data?: { type?: 'choose_state' | 'next_state' } };
      if (incomingMessageBody?.data?.type === 'choose_state') {
        // Отправляем статусы
        return connection.socket.send(JSON.stringify({ eventType: 'message', data: json }));
      }

      if (incomingMessageBody?.data?.type === 'next_state') {
        // Случайным образом отправляем ошибку или статусы
        const outgoingMessageBody = Math.random() < 0.5 ? { eventType: 'error', data: { type: 'next_state', reason: 'Переход по статусу невозможен' } } : { eventType: 'message', data: json };
        return connection.socket.send(JSON.stringify(outgoingMessageBody));
      }
    })
  })

  // @ts-ignore
  fastify.get('/api/start', async function (request, reply) {
    let traceParent;
    const sentryTrace = request.headers['sentry-trace'];
    const baggage = request.headers['baggage'];
    if (sentryTrace && baggage) {
      traceParent = continueTrace({sentryTrace, baggage});
    }

    const transaction = Sentry.startTransaction({
      op: "Handle incoming request",
      name: request.originalUrl,
      ...traceParent
    });

    const span = trace.getActiveSpan();
    console.log('span', span);
    if (span) {
      const err = new Error("This is a test error");
      // recordException converts the error into a span event.
      span.recordException(err);
      span.setAttribute('my-first-attr', 'my-first-value');
      // Update the span status to failed.
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
    }

    // reply.status(400).send({ message: 'Test Error' }).then(() => transaction.finish(Date.now()))
    reply.status(200).send({ message: 'Ok' }).then(() => transaction.finish(Date.now()))
  });
});

// Run the server!
const start = async () => {
  try {
    await server.listen({ port: 8080 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();

