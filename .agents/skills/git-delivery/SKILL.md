---
name: git-delivery
description: >-
  Delivers every change through a feature branch and a pull request into main.
  Never pushes commits to main. Use when implementing, committing, pushing,
  creating a branch, opening a PR, merging, or when the user mentions git,
  GitHub, feature branch, pull request, or main.
---

# Git delivery

Каждое изменение — feature-ветка, затем PR в `main`. В `main` не пушить.

Default branch — `main`, пока `docs/decisions.md` нового проекта не сказал иное.

Удалённый GitHub (открыть/обновить PR) — skill `github-remote`, не `gh` в
sandbox. Перед `git push` и перед PR прочитай `github-remote`.

## Non-negotiables

- Work only on a feature branch. If `HEAD` is `main`, create and switch to a feature branch
  before any commit.
- Land changes only by opening a pull request targeting `main`.
- Never run `git push origin main`, `git push origin HEAD:main`, force-push to `main`, merge
  locally into `main` and push, or commit directly on `main`.
- If the user asks to push or merge into `main` without a PR, refuse that path and open a PR
  instead.
- Do not merge the PR unless the user explicitly asked to merge.

## Start of work

1. Confirm branch:

```bash
git branch --show-current
git status --short
```

2. If on `main` (or detached / dirty on `main`), create a feature branch from up-to-date
   `main` before editing further. `git fetch` / `pull` — сразу с
   `required_permissions: ["all"]` (skill `github-remote`):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b <type>/<short-topic>
```

If local uncommitted work already exists on `main`, create the branch in place
(`git checkout -b …`) so the work moves with you. Do not stash unless checkout is blocked.

Branch name: lowercase, hyphens, prefix `feat/`, `fix/`, `docs/`, `chore/`, or `ci/`.

## After the change

Commit only when the user asked. Then push the **feature branch**, not `main`.
Первый `git push` — с `required_permissions: ["all"]`:

```bash
git push -u origin HEAD
```

Open or update a PR into `main` through GitHub MCP (`create_pull_request` /
`update_pull_request`, `base=main`). Do not open a PR with `gh` while MCP is
available. If a PR for this branch already exists (`list_pull_requests`), push
commits to that branch. Do not open a second PR.

PR body:

```markdown
## Summary
- …

## Test plan
- …
```

## After push

CI runs on PR open and on every later commit to that PR. Do not claim CI passed unless you
inspected the run for this SHA (`pr-review`).

## Do not

- Push to `main`.
- Use `main` as a working branch.
- Fast-forward `main` locally and push.
- Bypass CI by merging from the local checkout.
- Probe `gh` in the sandbox to open or update a PR.
