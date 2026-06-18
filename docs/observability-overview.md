# Observability Overview

## Summary

This document captures the current observability baseline in the logistics
monorepo and the production-oriented target for monitoring, structured logging,
error tracking, and AI operational telemetry.

The repo already has a useful foundation:

- `GET /api/health`
- `GET /api/health/db`
- `GET /api/health/redis`
- `GET /api/metrics`
- Redis-backed BullMQ queues
- persisted `ai_logs`
- `GET /api/ai-logs/metrics`

The main gaps that originally existed were:

- no unified structured application logger
- no request correlation or request logging middleware
- no dedicated Redis health or readiness endpoint
- no Prometheus-style metrics endpoint
- no centralized error tracking
- AI metrics existed, but were not yet framed as full observability

Most of these are now implemented in the API. The remaining work is mostly
dashboard expansion, alerting, and production rollout discipline.

## Current State Audit

### API health

The Nest API uses `app.setGlobalPrefix("api")` in `apps/api/src/main.ts`, so
the active health routes are:

- `GET /api/health`
- `GET /api/health/db`
- `GET /api/health/redis`

Current behavior:

- `/api/health` is a lightweight liveness endpoint that returns `status`,
  `uptime`, and `timestamp`
- `/api/health/db` verifies database reachability with `select 1`
- `/api/health/redis` verifies Redis reachability through the Redis health
  service

### Redis and queues

Redis is a critical dependency in production terms:

- BullMQ queues are configured from `REDIS_URL`
- assistant, document-processing, and email flows depend on queue workers
- queue availability affects background execution even when the HTTP API is up

### Logging

The API now has a shared observability base:

- `Winston` JSON logging is wired in as the main structured logger
- request logging middleware emits one structured record per HTTP request
- `X-Request-Id` is accepted or generated and propagated through request
  context
- queue workers and a set of critical services now log structured events instead
  of only ad hoc string logs

### Error tracking

The API now uses a Sentry-first model:

- Sentry is initialized only when `SENTRY_DSN` is present
- unhandled HTTP exceptions are captured through a global exception filter
- worker failures and worker-level errors are captured in assistant, document,
  and email queue flows
- process-level `unhandledRejection` and `uncaughtException` are also captured

### AI telemetry

The repo has a strong AI telemetry layer:

- `ai_logs` persists AI operational records
- stored fields include status, latency, prompt tokens, completion tokens,
  total tokens, and estimated cost
- `GET /api/ai-logs` supports paginated operational review
- `GET /api/ai-logs/metrics` aggregates request, error, token, latency, and
  cost metrics

Important boundary:

- `ai_logs` is operational business telemetry
- it does not replace runtime logs, tracing, or incident alerting

## Target Architecture

### Logging

Use `Winston + JSON` as the backend logging standard.

Core fields:

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

Layer split:

- `Winston` handles runtime and operational logs
- `ai_logs` handles AI business telemetry and cost analytics
- Sentry handles centralized exception capture and alerting

Redaction rules:

- do not log full prompts or full model responses by default
- do not log JWTs, cookies, raw uploaded document contents, or secrets
- any debug payload snapshot must be explicitly scoped and sanitized

### Error tracking

Use Sentry as the primary error tracking service while keeping structured logs
and `ai_logs`.

The production design should include:

- global Nest exception capture
- worker failure capture
- request correlation via `requestId`
- environment-aware sampling
- graceful fallback when Sentry is disabled

### Health and metrics

Keep these endpoints:

- `GET /api/health`
- `GET /api/health/db`
- `GET /api/health/redis`
- `GET /api/metrics`

Semantics:

- `/api/health` = process is running
- `/api/health/db` = primary database dependency is reachable
- `/api/health/redis` = Redis-backed queue or cache dependency is reachable
- `/api/metrics` = Prometheus-compatible counters, gauges, and histograms

## AI Observability Direction

The current AI dashboard baseline should keep these KPI groups:

- requests per day
- costs
- errors
- latency
- tokens

Recommended next additions:

- error rate by day
- p95 latency
- top failing operations
- cost by model
- queue vs sync execution split if both paths stay active
- stronger correlation between AI rows and runtime logs via `requestId` or
  `providerRequestId`

## Public Interfaces

Public API routes:

- `GET /api/health`
- `GET /api/health/db`
- `GET /api/health/redis`
- `GET /api/metrics`
- `GET /api/ai-logs`
- `GET /api/ai-logs/metrics`

Operational interfaces:

- request logging middleware that injects or propagates `X-Request-Id`
- shared backend log field contract
- Sentry configuration surface for API and workers

## Acceptance Checks

- `GET /api/health` returns `ok` with uptime and timestamp
- `GET /api/health/db` fails clearly when the database is unavailable
- `GET /api/health/redis` fails clearly when Redis is unavailable
- `GET /api/metrics` returns scrapeable Prometheus text
- each HTTP request emits one structured JSON log entry with `requestId`
- uncaught controller or service errors appear in both `Winston` logs and Sentry
- queue worker failures appear in both `Winston` logs and Sentry
- assistant requests continue writing `ai_logs` with tokens, cost, and status
- sensitive fields are redacted from logs and error tracking payloads

## Recommended Rollout Order

1. Add structured `Winston` logging with a shared field contract
2. Add request logging middleware and `X-Request-Id` propagation
3. Add Sentry for API and worker exception capture
4. Add `GET /api/health/redis`
5. Add `GET /api/metrics` with a minimal Prometheus-friendly metric set
6. Extend the AI dashboard after runtime logging and error tracking are in
   place

## Defaults And Assumptions

- Prefer `Winston + JSON` over replacing the logging stack with `Pino`
- Prefer `Sentry first` over a DIY-only error tracking design
- Keep health endpoints under the existing `/api` global prefix
- Keep `ai_logs` as AI operational telemetry, not as the primary replacement
  for backend logging
