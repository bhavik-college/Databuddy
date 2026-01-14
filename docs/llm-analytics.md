# LLM Analytics Specification

This document implements the LLM analytics plan based on
`ai_call_spans` in `packages/db/src/clickhouse/schema.ts`. It defines
metrics, charts, pages, and the data flow that powers the UI.

## Source schema

Primary table: `observability.ai_call_spans`

Core dimensions:
- `timestamp`
- `user_id`
- `website_id`
- `provider`
- `model`
- `type` (`generate`, `stream`)
- `finish_reason`
- `http_status`
- `error_name`
- `tool_call_names`

Core measures:
- `input_tokens`, `output_tokens`, `total_tokens`
- `cached_input_tokens`, `cache_creation_input_tokens`, `reasoning_tokens`
- `input_token_cost_usd`, `output_token_cost_usd`, `total_token_cost_usd`
- `tool_call_count`, `tool_result_count`
- `web_search_count`
- `duration_ms`

## Derived metrics (KPI definitions)

- Total calls: `count()`
- Total tokens: `sum(total_tokens)`
- Input tokens: `sum(input_tokens)`
- Output tokens: `sum(output_tokens)`
- Cache hit rate:
  - `sumIf(cached_input_tokens, cached_input_tokens > 0) / sum(input_tokens)`
- Total cost (USD): `sum(total_token_cost_usd)`
- Cost per call: `sum(total_token_cost_usd) / count()`
- Cost per 1K tokens: `sum(total_token_cost_usd) / (sum(total_tokens) / 1000)`
- Average latency: `avg(duration_ms)`
- p75 latency: `quantile(0.75)(duration_ms)`
- Error rate: `countIf(error_name IS NOT NULL) / count()`
- Tool use rate: `countIf(tool_call_count > 0) / count()`
- Web search rate: `countIf(web_search_count > 0) / count()`

## Global filters and drilldowns

Global filters (apply to all pages):
- Time range
- `website_id`
- `user_id`
- `provider`
- `model`
- `type`
- Error-only toggle (`error_name IS NOT NULL`)

Drilldowns:
- Click on chart series or bars to apply dimension filters.
- Click on a table row to open trace details by `trace_id`.

## Page map and chart specs

### 1) Overview

Primary KPIs:
- Total calls
- Total cost
- Total tokens
- Average latency
- p75 latency
- Error rate
- Cache hit rate

Charts:
- Calls over time (line): `count()` by time bucket.
- Cost over time (line): `sum(total_token_cost_usd)` by time bucket.
- Latency over time (line): `avg(duration_ms)` and p75 by time bucket.
- Tokens over time (line): `sum(total_tokens)` by time bucket.
- Providers breakdown (bar): `count()` by `provider`.
- Models breakdown (bar): `count()` by `model`.
- Finish reason breakdown (bar): `count()` by `finish_reason`.
- Error names (bar): `count()` by `error_name` (filtered to errors).

Table:
- Recent calls list with `timestamp`, `provider`, `model`, `total_tokens`,
  `total_token_cost_usd`, `duration_ms`, `finish_reason`, `error_name`.

### 2) Cost and Tokens

Primary KPIs:
- Total cost
- Cost per call
- Cost per 1K tokens
- Total tokens
- Input vs output tokens

Charts:
- Cost by provider (stacked area): `sum(total_token_cost_usd)` by time,
  stacked by `provider`.
- Cost by model (stacked area): `sum(total_token_cost_usd)` by time,
  stacked by `model`.
- Cached vs non-cached input tokens (stacked bar):
  - cached: `sumIf(input_tokens, cached_input_tokens > 0)`
  - non-cached: `sumIf(input_tokens, cached_input_tokens = 0 OR cached_input_tokens IS NULL)`
- Token split (bar): `sum(input_tokens)` vs `sum(output_tokens)` by time.

Table:
- Model cost summary with `model`, `provider`, `total_tokens`,
  `total_token_cost_usd`, `cost_per_1k`.

### 3) Performance

Primary KPIs:
- Average latency
- p75 latency
- p95 latency
- Slowest models (by p75)

Charts:
- Latency distribution (histogram): `duration_ms` buckets.
- Latency by model (bar): p50, p75, p95 by `model`.
- Latency by provider (bar): p50, p75, p95 by `provider`.
- Duration vs tokens (scatter):
  - x: `total_tokens`
  - y: `duration_ms`
  - color: `model` or `provider`
- Tool calls impact (bar):
  - group by `tool_call_count` buckets and show `avg(duration_ms)`.

Table:
- Slowest calls with `duration_ms`, `total_tokens`, `provider`, `model`,
  `finish_reason`, `error_name`.

### 4) Reliability

Primary KPIs:
- Error rate
- Error count
- Top error name
- Top HTTP status

Charts:
- Error rate over time (line): `countIf(error_name IS NOT NULL) / count()`.
- Errors by name (bar): `count()` by `error_name`.
- Errors by model (bar): `count()` by `model` (filtered to errors).
- HTTP status breakdown (bar): `count()` by `http_status`.
- Finish reason vs errors (stacked bar):
  - `finish_reason` on x-axis, stacked by error vs non-error.

Table:
- Error list with `timestamp`, `error_name`, `error_message`, `model`,
  `provider`, `http_status`, `duration_ms`.

### 5) Tooling and Agents

Primary KPIs:
- Tool use rate
- Average tool calls per request
- Web search rate
- Top tool name

Charts:
- Tool call rate over time (line):
  - `countIf(tool_call_count > 0) / count()`.
- Tool calls vs latency (scatter):
  - x: `tool_call_count`
  - y: `duration_ms`.
- Top tool names (bar):
  - `count()` by each entry in `tool_call_names`.
- Web search count impact (bar):
  - group by `web_search_count` buckets and show `avg(total_token_cost_usd)`
    and `avg(duration_ms)`.

Table:
- Tool usage list with `tool_call_names`, `tool_call_count`,
  `tool_result_count`, `model`, `provider`, `duration_ms`.

### 6) Session and Trace Explorer

Primary KPIs:
- Unique users: `uniq(user_id)`
- Unique traces: `uniq(trace_id)`
- Average calls per trace: `count() / uniq(trace_id)`

Charts:
- Calls per trace distribution (histogram).
- Trace latency spread (box plot-like summary using p50/p75/p95 by trace).

Table:
- Trace list with `trace_id`, `user_id`, `website_id`, `calls`, `tokens`,
  `cost`, `errors`, `avg_duration_ms`, `p75_duration_ms`.
- Clicking a trace shows call sequence with per-call details.

## Query map (ClickHouse patterns)

Time series (bucketed):
```
SELECT
  toStartOfInterval(timestamp, INTERVAL 1 HOUR) AS bucket,
  count() AS calls,
  sum(total_token_cost_usd) AS cost,
  sum(total_tokens) AS tokens,
  avg(duration_ms) AS avg_duration,
  quantile(0.75)(duration_ms) AS p75_duration
FROM observability.ai_call_spans
WHERE timestamp >= {start} AND timestamp < {end}
  AND {filters}
GROUP BY bucket
ORDER BY bucket ASC
```

Breakdowns (model or provider):
```
SELECT
  model,
  provider,
  count() AS calls,
  sum(total_token_cost_usd) AS cost,
  sum(total_tokens) AS tokens,
  quantile(0.75)(duration_ms) AS p75_duration
FROM observability.ai_call_spans
WHERE timestamp >= {start} AND timestamp < {end}
  AND {filters}
GROUP BY model, provider
ORDER BY cost DESC
LIMIT 20
```

Errors:
```
SELECT
  error_name,
  count() AS error_count,
  any(error_message) AS sample_message
FROM observability.ai_call_spans
WHERE timestamp >= {start} AND timestamp < {end}
  AND error_name IS NOT NULL
  AND {filters}
GROUP BY error_name
ORDER BY error_count DESC
LIMIT 20
```

Trace summary:
```
SELECT
  trace_id,
  user_id,
  website_id,
  count() AS calls,
  sum(total_tokens) AS tokens,
  sum(total_token_cost_usd) AS cost,
  countIf(error_name IS NOT NULL) AS errors,
  avg(duration_ms) AS avg_duration_ms,
  quantile(0.75)(duration_ms) AS p75_duration_ms
FROM observability.ai_call_spans
WHERE timestamp >= {start} AND timestamp < {end}
  AND trace_id IS NOT NULL
  AND {filters}
GROUP BY trace_id, user_id, website_id
ORDER BY cost DESC
LIMIT 200
```

Tool names:
```
SELECT
  tool_name,
  count() AS calls
FROM
(
  SELECT arrayJoin(tool_call_names) AS tool_name
  FROM observability.ai_call_spans
  WHERE timestamp >= {start} AND timestamp < {end}
    AND {filters}
)
GROUP BY tool_name
ORDER BY calls DESC
LIMIT 20
```

## Design guidance and inspirations

Inspiration references:
- Vercel Analytics for a clean KPI header and minimal chart chrome.
- Sentry Performance for latency-first views and trace drilldowns.
- Datadog APM for aligned KPI + time series sections.
- OpenAI Usage for cost and token emphasis.

Layout system:
- Use a top KPI row, then a primary time series row, then a grid of
  breakdown charts.
- Keep charts compact with consistent axis placement and short legends.
- Preserve mobile stacking order: KPIs, primary series, breakdowns, table.

Interaction design:
- Charts must support keyboard focus and click to filter.
- Show selected filter chips with clear remove actions.
- Tables are sortable and allow row click to open trace details.

Empty and error states:
- Empty state offers a clear next action (connect provider or send test call).
- Error state includes retry and timestamp of last successful refresh.

## Data flow

1) Client and server LLM calls generate spans.
2) Ingestion writes spans into `ai_call_spans`.
3) API aggregates by time bucket and dimensions.
4) UI renders KPIs, charts, and tables using the aggregated results.
