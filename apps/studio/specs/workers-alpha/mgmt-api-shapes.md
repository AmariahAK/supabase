# Workers (alpha) — management API shapes

> Documentation only, and **illustrative** — there is no real Workers backend
> at alpha, and the Studio POC is driven entirely by a mock store
> (`apps/studio/state/workers-mock-state.ts`). These shapes describe what the
> management API is expected to look like so the mock and the eventual real
> integration line up. Field names mirror the `Worker` type in
> `apps/studio/components/interfaces/Workers/Workers.types.ts`.

## Resource: Worker

```jsonc
{
  "id": "wkr_abc123",
  "slug": "image-resizer",
  "name": "image-resizer",
  "runtime": "node",              // node | deno | bun | python | dockerfile
  "size": "4x2",                  // 2x1 | 4x2  (no resize)
  "access": "public",            // public | private
  "state": "active",             // see lifecycle below
  "region": "us-west-1",         // always locked
  "instances": 3,                 // 1–10, project cap 100
  "created_at": "2026-07-20T09:14:00Z",
  "created_by": { "type": "user", "name": "ana@acme.dev" },
  "endpoint": "https://workers.supabase.co/v1/image-resizer" // omitted for private
}
```

No `price`, `cost`, or `rate` field exists — pricing is not part of the alpha
API. No `disk`, `history`, or `rollback` fields either.

## Lifecycle state

```
deploying -> active -> suspended -> resuming -> draining   (happy path)
errored                                                    (fault, from active/resuming)
killed                                                     (terminal, after delete)
```

`suspended` means scaled-to-zero and healthy — clients should render it calm,
not as an error.

## Endpoints (expected)

| Method & path                         | Purpose |
| ------------------------------------- | ------- |
| `GET /v1/projects/{ref}/workers`      | List workers. Include `instances_used` / `instances_cap` in the response envelope so clients can render the "N of 100" meter. |
| `GET /v1/projects/{ref}/workers/{id}` | Fetch one worker. |
| `DELETE /v1/projects/{ref}/workers/{id}` | Delete (kill immediately, no drain). |

Deploy is intentionally **not** a dashboard-callable management endpoint at
alpha — it goes through the CLI build pipeline. The dashboard is read-mostly.

## Logs

Request logs, worker stdout/stderr, and lifecycle events are all written to
**Logflare**, tagged with the project ref and worker id. A `kind` field
(`request` | `stdout` | `lifecycle`) distinguishes them so lifecycle events are
never silently mixed into the stdout stream.
