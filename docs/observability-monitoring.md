# Observability And Monitoring

Use this page as the entry point for the repo observability docs.

## Documents

- [observability-overview.md](./observability-overview.md): current state,
  target architecture, rollout order, and acceptance checks
- [observability-runbook.md](./observability-runbook.md): local checks,
  Prometheus and Grafana startup, scrape verification, and shutdown commands
- [metrics-reference.md](./metrics-reference.md): Prometheus metrics exposed by
  the API, what they mean, and where they are populated

## Recommended Reading Order

1. Start with `observability-overview.md`
2. Use `metrics-reference.md` when you need exact metric names and labels
3. Use `observability-runbook.md` when you want to run or verify the stack
