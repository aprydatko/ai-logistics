# Observability And Monitoring

## Summary

This document audits the current observability baseline in the logistics
monorepo and defines a production-oriented target for monitoring, structured
logging, error tracking, and AI operational telemetry.

The repo already has a useful foundation:

- `GET /api/health`
- `GET /api/health/db`
- Redis-backed BullMQ queues
- persisted `ai_logs`
- `GET /api/ai-logs/metrics`

The main gaps today are:

- no unified structured application logger
- no request correlation or request logging middleware
- no dedicated Redis health or readiness endpoint
- no Prometheus-style metrics endpoint
- no centralized error tracking
- AI metrics exist, but are not yet framed as full observability

## Current State Audit

### API health

The Nest API uses `app.setGlobalPrefix("api")` in `apps/api/src/main.ts`, so
the active health routes are:

- `GET /api/health`
- `GET /api/health/db`

Current behavior:

- `/api/health` is a lightweight liveness endpoint that returns `status`,
  `uptime`, and `timestamp`
- `/api/health/db` verifies database reachability with `select 1`

Current limitation:

- health coverage stops at process uptime and database reachability
- Redis is not checked even though it is a real runtime dependency

### Redis and queues

Redis is already a critical dependency in production terms:

- BullMQ queues are configured from `REDIS_URL`
- assistant, document-processing, and email flows depend on queue workers
- queue availability affects background execution even when the HTTP API is up

Current limitation:

- there is no dedicated `GET /api/health/redis`
- there is no Redis readiness signal for uptime monitors or deployment checks

### Logging

Logging exists, but it is still ad hoc:

- several services and workers use Nest `Logger`
- queue auth, notification delivery, notification email workers, gateway code,
  and document vision code already emit logs
- there is no single structured logger shared across the API and workers

Current limitation:

- log format is not standardized
- there is no shared field contract
- request correlation is missing
- logs are harder to search, aggregate, and alert on in Docker or future log
  pipelines

### AI telemetry

The repo already has a strong AI telemetry baseline:

- `ai_logs` persists AI operational records
- stored fields include status, latency, prompt tokens, completion tokens,
  total tokens, and estimated cost
- `GET /api/ai-logs` supports paginated operational review
- `GET /api/ai-logs/metrics` already aggregates request, error, token, latency,
  and cost metrics

Current limitation:

- `ai_logs` is useful telemetry, but it is not a replacement for runtime logs,
  tracing, or alerting
- AI metrics are not yet correlated with HTTP requests, worker runs, or a
  central incident workflow

## Target Logging Architecture

### Recommendation: Winston + JSON

Use `Winston` with JSON output as the default backend logging layer.

This gives the team:

- machine-readable logs for Docker and future log shipping
- consistent parsing in ELK, Loki, Grafana, or other aggregation stacks
- safer filtering during incidents involving assistant failures, queue workers,
  and document processing
- one operational format across HTTP handlers, background workers, and internal
  services

Recommended standard log fields:

- `timestamp`
- `level`
- `message`
- `service`
- `environment`
- `requestId`
- `userId`
- `route`
- `method`
- `statusCode`
- `durationMs`
- `operation`
- `provider`
- `providerRequestId`

### Logging split

Use each layer for a different responsibility:

- `Winston` handles runtime and operational logs
- `ai_logs` handles AI business telemetry, cost analytics, and usage review
- Sentry handles centralized exception capture and alerting

Do not treat these as interchangeable:

- `Winston` should answer "what happened in the running system?"
- `ai_logs` should answer "how is the AI feature performing and costing?"
- Sentry should answer "what failed, where, and how often?"

### Redaction rules

Normal application logs should not store:

- full prompts or full model responses by default
- JWTs
- cookies
- uploaded document contents
- raw secrets or API keys

If a payload snapshot is needed for debugging, it should be:

- explicitly scoped
- sanitized first
- limited to the minimum useful fields

## Error Tracking Strategy

### Recommendation: Sentry first, hybrid model

Use Sentry as the primary error tracking service, while keeping:

- `Winston` for structured runtime logs
- `ai_logs` for AI usage, cost, and status reporting

This hybrid model is closer to production standards than a DIY-only approach
because it gives:

- stack traces
- issue grouping
- alerting
- release visibility
- environment-aware sampling
- optional frontend runtime coverage later

### Target design

The production design should include:

- global Nest exception capture
- worker error capture for assistant, document, and email queues
- `requestId` attached to both logs and Sentry context
- environment-aware sampling so development and production stay usable
- sanitization before sending request or user context to Sentry
- graceful fallback when Sentry is disabled

Fallback behavior:

- if Sentry is disabled or unavailable, the API still logs errors through
  `Winston`
- requests and workers continue serving or failing normally without taking down
  the process because telemetry is unavailable

## Health And Metrics Endpoints

### Target endpoints

Keep the existing endpoints:

- `GET /api/health`
- `GET /api/health/db`

Add these endpoints:

- `GET /api/health/redis`
- `GET /api/metrics`

### Endpoint semantics

Use clear separation of purpose:

- `/api/health` means the process is running
- `/api/health/db` means the primary database dependency is reachable
- `/api/health/redis` means the Redis-backed queue or cache dependency is reachable
- `/api/metrics` means machine-readable counters, gauges, and histograms for
  uptime monitoring and Prometheus scraping

`/api/metrics` should not be a JSON health payload. It should be scrapeable text
that monitoring systems can ingest directly.

### Recommended first metrics

Start with a narrow, high-value set:

- process uptime
- HTTP request count
- HTTP request duration
- HTTP error count by route and status
- queue job success count
- queue job failure count
- Redis connectivity status
- assistant request count
- assistant failure count
- assistant token usage
- assistant estimated cost

## Request Logging And Correlation

Add request logging middleware that injects or propagates `X-Request-Id`.

Target behavior:

- accept an incoming `X-Request-Id` when present
- generate a new request id when absent
- attach the request id to request context, structured logs, and Sentry context
- emit one structured log entry per HTTP request with route, method, status, and
  duration

This is important because it connects:

- API request logs
- queue follow-up logs
- error tracking events
- AI usage records when request-linked identifiers are stored

## AI Observability Direction

The existing `ai_logs` system is already a strong base for an AI usage
dashboard. The goal is to professionalize it, not replace it.

Keep these KPI groups as first-class metrics:

- requests per day
- costs
- errors
- latency
- tokens

Recommended next improvements:

- filtering and slicing by model
- filtering and slicing by operation
- filtering and slicing by status
- filtering by date range
- separate user-visible failures from provider or internal failures
- correlate AI rows with runtime logs via `requestId` or `providerRequestId`

Recommended next dashboard additions:

- error rate by day
- p95 latency
- top failing operations
- cost by model
- queue vs sync execution split if both execution paths remain active

Important boundary:

- the AI dashboard should support product and operational review
- it should not become the only incident tool for runtime failures

## Public Interface Additions

Target public API additions:

- `GET /api/health/redis`
- `GET /api/metrics`

Target operational interfaces:

- request logging middleware that injects or propagates `X-Request-Id`
- shared backend log field contract
- Sentry configuration surface for API and workers

Existing routes that should remain unchanged:

- `GET /api/health`
- `GET /api/health/db`
- `GET /api/ai-logs`
- `GET /api/ai-logs/metrics`

## Acceptance Checks

Use these checks when implementing the observability stack:

- `GET /api/health` returns `ok` with uptime and timestamp
- `GET /api/health/db` fails clearly when the database is unavailable
- `GET /api/health/redis` fails clearly when Redis is unavailable
- `GET /api/metrics` returns scrapeable metrics text
- each HTTP request emits one structured JSON log entry with `requestId`
- uncaught controller or service errors appear in both `Winston` logs and Sentry
- queue worker failures appear in both `Winston` logs and Sentry
- assistant requests continue writing `ai_logs` with tokens, cost, and status
- sensitive fields are redacted from logs and error tracking payloads

## Recommended Rollout Order

Implement this in small phases:

1. Add structured `Winston` logging with a shared field contract.
2. Add request logging middleware and `X-Request-Id` propagation.
3. Add Sentry for API and worker exception capture.
4. Add `GET /api/health/redis`.
5. Add `GET /api/metrics` with a minimal Prometheus-friendly metric set.
6. Extend the AI dashboard only after runtime logging and error tracking are in
   place.

## Defaults And Assumptions

- Prefer `Winston + JSON` over replacing the logging stack with `Pino`
- Prefer `Sentry first` over a DIY-only error tracking design
- Keep health endpoints under the existing `/api` global prefix
- Keep `ai_logs` as AI operational telemetry, not as the primary replacement
  for backend logging
- Keep the document as a production roadmap rather than a short checklist
