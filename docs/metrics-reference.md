# Metrics Reference

## Summary

The API exposes Prometheus-compatible metrics at:

- `GET /api/metrics`

The endpoint returns scrapeable text and includes both custom application
metrics and default process or runtime metrics collected through `prom-client`
with the `api_` prefix.

## HTTP Metrics

### `http_requests_total`

Meaning:

- total number of HTTP requests handled by the API

Labels:

- `method`
- `route`
- `status_code`

Population:

- recorded in `request-logging.middleware.ts`

### `http_errors_total`

Meaning:

- total number of HTTP responses with status `>= 400`

Labels:

- `method`
- `route`
- `status_code`

Population:

- recorded in `request-logging.middleware.ts`

### `http_request_duration_seconds`

Meaning:

- HTTP request latency histogram in seconds

Labels:

- `method`
- `route`
- `status_code`

Population:

- recorded in `request-logging.middleware.ts`

## Queue Metrics

### `queue_jobs_total`

Meaning:

- total number of processed queue jobs by queue and outcome

Labels:

- `queue`
- `status`

Allowed values seen today:

- `status=completed`
- `status=failed`

Population:

- recorded in assistant, document-processing, and email worker services

## Assistant Metrics

### `assistant_requests_total`

Meaning:

- total assistant requests by status, model, and operation

Labels:

- `status`
- `model`
- `operation`

Population:

- recorded in `assistant.service.ts`

### `assistant_request_duration_seconds`

Meaning:

- assistant request latency histogram in seconds

Labels:

- `status`
- `model`
- `operation`

Population:

- recorded in `assistant.service.ts`

### `assistant_tokens_total`

Meaning:

- cumulative assistant token usage grouped by model and token type

Labels:

- `model`
- `token_type`

Allowed values seen today:

- `token_type=prompt`
- `token_type=completion`
- `token_type=total`

Population:

- recorded in `assistant.service.ts`

### `assistant_estimated_cost_usd_total`

Meaning:

- cumulative estimated assistant cost in USD grouped by model

Labels:

- `model`

Population:

- recorded in `assistant.service.ts`

## Dependency And Process Metrics

### `redis_up`

Meaning:

- Redis connectivity status
- `1` means reachable
- `0` means unreachable or last check failed

Population:

- set in `redis-health.service.ts`
- updated when `/api/health/redis` is called

### `api_uptime_seconds`

Meaning:

- API process uptime in seconds

Population:

- collected dynamically in the metrics service

## Default Runtime Metrics

The metrics endpoint also exposes default runtime metrics collected through
`prom-client` with the prefix:

- `api_`

Examples include process and Node.js runtime data such as:

- CPU usage
- memory usage
- event loop or GC related metrics when supported

## Practical Notes

- Health endpoints are useful for generating quick local metric movement before
  opening Grafana
- `redis_up` only changes after the Redis health check runs
- queue and assistant metrics need real queue jobs or assistant requests to move
