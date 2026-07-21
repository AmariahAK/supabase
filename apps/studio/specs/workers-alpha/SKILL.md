---
name: supabase-workers
description: Deploy and manage Supabase Workers (managed compute in microVMs next to your Postgres) from an agent. Use when the user wants to deploy, list, inspect logs for, or delete a Worker. Alpha — CLI-driven, no MCP tools.
---

# Supabase Workers (alpha)

Supabase Workers run managed compute in microVMs in the same region as a
project's Postgres. This skill lets an agent operate Workers through the
Supabase CLI. There are **no MCP tools** for Workers at alpha — this SKILL file
is the entire agent surface.

## Hard constraints (do not design around these)

- **Naming**: call it a "Worker" / "Workers".
- **Sizes**: exactly two — `2x1` (2 GB / 1 vCPU) and `4x2` (4 GB / 2 vCPU).
  There is **no resize**. To change size, delete and redeploy.
- **Runtimes**: Node.js 24, Deno 2.9, Bun (latest stable), Python 3.14,
  Dockerfile. **No Rust.**
- **Region**: always US West, always locked (deploys next to the DB).
- **Instances**: 1–10 per deploy (default 1), hard cap of 100 per project.
- **No pricing or metering** at alpha — never quote a dollar rate or cost
  estimate. The instance cap ("N of 100 used") is the only budget signal.
- **Access modes**: `public` (HTTP via the API Gateway; every request needs a
  valid Supabase Auth key) or `private` (no endpoint; only meaningful with a
  Dockerfile; its logs are its product).
- **Not available**: cost estimator, `--from-function` upgrade, deployment
  history, rollback, branching, persistent disk, dependency scanning, built-in
  load balancing, a local `serve` command, secret cloaking.

## Recipes

### Deploy a worker

```bash
supabase workers deploy my-worker --runtime node --size 2x1 --access public --instances 1
```

Report back the endpoint (public) or that it has no endpoint (private). Never
promise autoscaling or load balancing.

### List / inspect

```bash
supabase workers list
supabase workers logs my-worker --follow
```

When summarizing logs, keep lifecycle events distinct from request/stdout lines.

### Delete

```bash
supabase workers delete my-worker
```

Warn the user first: deletion is immediate, there is no drain period, and a
public endpoint stops responding right away. Deleting frees its instances.

## Honesty rules

- If asked to resize, explain there is no resize — offer delete + redeploy.
- If asked about cost, explain there is no metering at alpha; report the
  instance count against the cap instead.
- If asked to upgrade an Edge Function into a Worker, explain that flow doesn't
  exist yet.
