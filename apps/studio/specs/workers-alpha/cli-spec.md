# Workers (alpha) — CLI spec

> Documentation only. Nothing in the Studio code depends on this file — it
> captures the CLI surface the dashboard POC is designed around. All numbers
> and vocabulary come from `apps/studio/lib/constants/workers.ts`.

Creation and management of Workers is **CLI-only** at alpha. The dashboard is
read-mostly: it lists workers, opens logs, and deletes. There is no create form.

## Commands

### `supabase workers deploy`

Builds and deploys a worker from the current directory.

```
supabase workers deploy [name] [flags]
```

| Flag           | Values                                        | Default | Notes |
| -------------- | --------------------------------------------- | ------- | ----- |
| `--runtime`    | `node` `deno` `bun` `python` `dockerfile`     | detected | Node.js 24, Deno 2.9, Bun (latest stable), Python 3.14. No Rust. |
| `--size`       | `2x1` `4x2`                                   | `2x1`   | `2x1` = 2 GB / 1 vCPU, `4x2` = 4 GB / 2 vCPU. **No resize** — to change, delete and redeploy. |
| `--access`     | `public` `private`                            | `public`| Private is only meaningful with a Dockerfile. |
| `--instances`  | `1`–`10`                                       | `1`     | Hard cap of 100 instances per project. |

- **Region** is always US West (next to your database) and cannot be chosen.
- **Secrets** are read from the existing project Secrets API — no new flag.
- There is **no `--from-function`** upgrade flow and **no `serve`** command at alpha.

On success the CLI prints the worker's endpoint (public) or a note that it has
no endpoint (private), then streams lifecycle events until it reaches `active`.

### `supabase workers list`

Lists the project's workers: name, runtime, size, access, state, instances,
and (for public workers) endpoint. Also prints `N of 100 project instances used`
— the only "budget" signal at alpha (there is no pricing or metering).

### `supabase workers logs <name>`

Tails the worker's logs from Logflare. Request logs, worker stdout/stderr, and
lifecycle events are all included; lifecycle lines are tagged distinctly so
they never read as a normal log line.

| Flag          | Notes                                             |
| ------------- | ------------------------------------------------- |
| `--no-lifecycle` | Hide lifecycle events, show only request/stdout. |
| `--follow`    | Keep streaming (default).                         |

### `supabase workers delete <name>`

Deletes a worker. It is killed immediately — there is **no drain period**, and a
public worker's endpoint stops responding right away. Frees the worker's
instances back toward the project cap. To bring it back, redeploy.

## Lifecycle

Happy path: `deploying → active → suspended (scale-to-zero) → resuming → draining`.
`suspended` is healthy-and-cheap ($0 while idle, resumes in under a second on
traffic), not an error. `errored` is a separate fault state reachable from
`active` or `resuming`. `killed` is terminal after delete.
