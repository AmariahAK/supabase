# Updating self-hosted Supabase

`update.sh` updates an existing `./docker` deployment in place, merging a newer release over your files with a 3-way merge so your secrets, overrides, and data are preserved and real conflicts are surfaced instead of overwritten.

Read the [Update your self-hosted deployment](https://supabase.com/docs/guides/self-hosting/updating) for more information.

**No `.supabase-version` file?** Most existing deployments won't have one yet - see [No `.supabase-version`](#no-supabase-version-older-or-manual-installs) below before your first update.

## Quick reference

Run from your deployment directory (where `docker-compose.yml` and `.env` live). It needs `git` and `jq` on the host (both installed by `setup.sh`). Back up your database first - `update.sh` backs up configuration, not data.

```sh
sh update.sh --dry-run   # preview; writes nothing
sh update.sh             # apply (targets the latest self-hosted/v* release)
sh run.sh pull           # pull new images
sh run.sh recreate       # restart to pick up the changes
```

`update.sh` updates vendor files (`docker-compose.yml`, override templates, `volumes/*`, scripts, `.env.example`) and appends new `.env` keys. It never touches `.env` values you set, `docker-compose.override.yml`, or paths in `.gitignore` (data directories, snippets, your edge functions).

## Conflicts

If the summary lists **CONFLICTS**, `update.sh` wrote merge markers into those files and exits with status `2`. Edit each file, pick the correct content, remove the `<<<<<<<` / `=======` / `>>>>>>>` markers, then run `sh run.sh pull && sh run.sh recreate`. While conflicts remain the version stamp is not advanced; it updates on your next clean run.

## Breaking changes

Some releases need a manual step first (for example, a Postgres major upgrade). `update.sh` lists them **before** modifying anything and waits for confirmation. Complete the steps (including any `utils/*.sh` script mentioned), then re-run.

## No `.supabase-version` (older or manual installs)

Most existing deployments won't have this file yet. Without a recorded base version `update.sh` runs in **report-only** mode. Record the version your files came from once, then re-run - prefer the exact commit SHA if you can find it (if you still have the `git clone` you set up from: `git -C /path/to/your/clone rev-parse HEAD`), otherwise the closest release tag:

```sh
printf 'ref=<commit-sha>\n' > .supabase-version          # best: the exact commit
printf 'ref=self-hosted/v0.7.0\n' > .supabase-version    # or the closest release tag
# or, for a single run:  sh update.sh --from <sha-or-tag>
```

First time updating an old, untracked install? See [Coming from an old, untracked install](https://supabase.com/docs/guides/self-hosting/updating#coming-from-an-old-untracked-install) for the step-by-step.

## Options

| Flag | Purpose |
| --- | --- |
| `--dry-run` | Show the plan; write nothing |
| `--to <tag>` | Update to a specific release (e.g. `self-hosted/v0.7.0`) |
| `--from <ref>` | Supply the base version when `.supabase-version` is missing |
| `--yes` | Skip the breaking-change confirmation prompt |

For the full walkthrough see the [guide](https://supabase.com/docs/guides/self-hosting/updating); [CHANGELOG.md](./CHANGELOG.md) and [versions.md](./versions.md) list releases.
