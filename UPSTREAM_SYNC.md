# UPSTREAM_SYNC.md

Practical fork-first sync flow for Derek’s local AlphaClaw runtime.

## Current remotes
- `fork` → `https://github.com/derek-betz/alphaclaw.git` (your repo)
- `origin` → `https://github.com/chrysb/alphaclaw` (upstream)

## Rule of thumb
- **Pull from upstream (`origin`)**
- **Push to your fork (`fork`)**
- Only open upstream PRs when you explicitly want to.

## Quick status
```bash
git remote -v
git status
git branch --show-current
```

## One-time safety hardening (recommended)
Prevent accidental push to upstream by setting push URL to disabled:
```bash
git remote set-url --push origin DISABLED
```

Verify:
```bash
git remote -v
```
You should see `origin (push) DISABLED`.

## Standard sync cycle
From runtime repo root:

```bash
# 1) get latest refs
git fetch origin
git fetch fork

# 2) update your local main from upstream
git checkout main
git merge --ff-only origin/main

# 3) push updated main to your fork
git push fork main
```

## Working on fixes
```bash
# create feature branch from main
git checkout main
git checkout -b fix/my-change

# commit your changes
git add <files>
git commit -m "fix: ..."

# push to your fork branch
git push -u fork fix/my-change
```

## Bring upstream changes into your long-lived branch
```bash
git fetch origin
git checkout fix/my-change

# choose one:
# merge style
git merge origin/main
# or rebase style
# git rebase origin/main

# push updated branch to fork
git push fork fix/my-change
```

## Recovery / rollback tips
- Abort a bad merge:
```bash
git merge --abort
```
- Abort a bad rebase:
```bash
git rebase --abort
```
- Restore branch to fork state:
```bash
git fetch fork
git reset --hard fork/<branch>
```

## Notes for this setup
- Runtime may have unrelated local diffs in `package.json` / `package-lock.json`; commit intentionally and avoid accidental bundling.
- Keep operational config/state changes in `.openclaw` repo, not runtime code repo.
