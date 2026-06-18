# Observability Runbook

## Local API Checks

Use these checks after starting the API:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health/db
curl http://localhost:3001/api/health/redis
curl http://localhost:3001/api/metrics
```

The metrics response should be Prometheus text, not JSON.

To generate request metrics before scraping, call a couple of routes first:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health/db
curl http://localhost:3001/api/health/redis
curl http://localhost:3001/api/metrics
```

## Prometheus Scrape Example

Example scrape target:

```yaml
scrape_configs:
  - job_name: "ai-logistics-api"
    metrics_path: /api/metrics
    static_configs:
      - targets: ["localhost:3001"]
```

If the API is behind a reverse proxy, keep the upstream route unchanged so the
scrape path stays `/api/metrics`.

## Local Grafana And Prometheus Demo

This repo includes a local monitoring stack:

- `docker-compose.monitoring.yml`
- `monitoring/prometheus/prometheus.yml`
- `monitoring/grafana/provisioning/...`
- `monitoring/grafana/dashboards/ai-logistics-observability.json`

### Start the API

```bash
pnpm --filter api build
cd apps/api
node dist/main.js
```

### Start Prometheus and Grafana

In another terminal:

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

### Open the stack

- Prometheus: `http://localhost:9090`
- Prometheus targets: `http://localhost:9090/targets`
- Grafana: `http://localhost:3002`

Grafana login:

- user: `admin`
- password: `admin`

Preprovisioned dashboard:

- `AI Logistics Observability`

### Verify scrape

Check that Prometheus sees the API target as `UP`:

- open `http://localhost:9090/targets`
- look for job `ai-logistics-api`
- verify scrape URL is `/api/metrics`

You can also query metrics directly:

```bash
curl "http://localhost:9090/api/v1/query?query=redis_up"
curl "http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total[5m]))"
```

### Trigger visible dashboard changes

To move the HTTP graphs:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health/db
curl http://localhost:3001/api/health/redis
```

In PowerShell, a quick burst looks like:

```powershell
1..20 | ForEach-Object { Invoke-WebRequest http://localhost:3001/api/health | Out-Null }
```

Expected dashboard effects:

- `HTTP Request Rate` changes
- `HTTP Requests by Route` shows traffic
- `Average HTTP Latency by Route` updates
- `Redis Up` becomes `1` after a successful `/api/health/redis` call

To move queue or assistant panels, trigger real assistant requests or background
jobs. Health endpoints only drive HTTP metrics.

## Shutdown

To stop the local monitoring stack:

```bash
docker compose -f docker-compose.monitoring.yml down
```

If you started the API with `node dist/main.js`, stop that process separately in
the terminal where it is running.
