import process from 'process';
import {diag, DiagConsoleLogger, DiagLogLevel} from '@opentelemetry/api';
import {OTLPTraceExporter} from "@opentelemetry/exporter-trace-otlp-http";
import {NodeSDK} from "@opentelemetry/sdk-node";

import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import {Resource} from '@opentelemetry/resources';

export const initializeOtel = () => {
  // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  const exporterOptions = {
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }

  const sdk = new NodeSDK({
    instrumentations: [
      new HttpInstrumentation(),
      new FastifyInstrumentation(),
    ],
    traceExporter: new OTLPTraceExporter(exporterOptions),
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'sandbox-fastify'
    })
  });

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
  sdk.start()

// gracefully shut down the SDK on process exit
  process.on('beforeExit', async () => {
    await sdk.shutdown();
  });
}
