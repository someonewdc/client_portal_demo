---
name: pr-review
description: >-
  Performs a thorough GitHub pull request review: lists every defect, and
  verifies that CI checks actually ran and passed for the head SHA rather than
  treating a green badge as proof. Use when the user asks for a review, PR
  review, code review, ревью, to inspect checks, or to look for false positives.
---

# PR review

При запросе ревью сделай качественное ревью PR, опиши все недочёты и проверь, реально ли
проходят проверки или это false positive.

Do not rubber-stamp. Do not treat a green GitHub badge, a skipped job, or a stale check from
another SHA as success.

This skill is the project review path. Do not launch Bugbot unless the user asked for
`/review-bugbot`.

Данные PR и checks — skill `github-remote` (MCP). Не начинай с `gh pr view` / `gh pr checks`.

## Scope

1. Identify the PR: URL/number from the user, or `list_pull_requests`. Then
   `pull_request_read` `get` (`number`, `url`, `base`, `head`, `head SHA`,
   `title`, `body`).
2. Refuse to review a PR whose base is not `main` unless the user named another base.
3. Read the full diff and the files around it (`get_diff`, `get_files`,
   `get_commits`). Do not review from the PR title alone.

## Quality review

Read `AGENTS.md`, `docs/decisions.md`, and the thematic docs for the changed surface before
commenting.

Look for, and report, at least:

- Incorrect behavior, missing unhappy paths, regressions.
- Contract drift (DTO, OpenAPI, Prisma, frontend, docs, generated client out of sync).
- Scope violations and fake UI (dead buttons, `#` links, decorative data).
- Layer/package/cross-context boundary breaks.
- Tests that do not exercise the change, were deleted, skipped, or weakened.
- Secrets, real PII, unredacted logs.
- Incomplete impact surface (callers, fixtures, playbooks, status).

Cite `path:line`. Describe the defect and why it matters. Do not file style nits that the
linter already owns.

## CI is evidence, not decoration

Required CI jobs are those in `.github/workflows/ci.yml` **этого** репозитория для данного
event. Сверь список workflow с тем, что реально ran. Не тащи матрицу профилей Вольтариса, если
её нет в новом CI.

Head SHA and checks: `pull_request_read` `get`, `get_status`, `get_check_runs`.

If the review needs job **log text** (MCP его не отдаёт): one `gh run view <id> --log`
with `required_permissions: ["full_network"]` **after** MCP already returned the
head SHA and check runs. Do not start with `gh pr view`.

A check is a **real pass** only if all of the following hold:

- It belongs to this PR's current `headRefOid`, not an older commit.
- The job executed (not `skipped`, `cancelled`, or missing).
- `conclusion` is `success` from the job itself, not from `continue-on-error`.
- The log shows the expected commands actually ran, not an empty/`--passWithNoTests` success.
- Failed tests were not hidden by skip, `xit`, `.skip`, narrowed grep, or a retry that flipped
  a flake to green without a fix.

A check is a **false positive** (report as a blocker) if any of:

- Combined status is green while a required job is skipped/missing.
- Checks are pending, cancelled, or from a different SHA than `headRefOid`.
- Duration is implausibly short for the job's expected steps, and the log does not show them.
- The PR removed, skipped, or weakened tests that previously covered the change.
- `if:` / path filters / matrix exclusions dropped a required job.
- Author claimed CI passed without a run URL and SHA.

If checks are still running, say so. Do not approve on a pending run. If logs are
inaccessible, record that CI evidence is **не проверено** and do not invent a pass.

Publish the review through MCP `pull_request_review_write`, not `gh pr review`.
If GitHub rejects `APPROVE` / `REQUEST_CHANGES` on your own PR, submit `COMMENT`
with the same verdict via MCP. Do not retry through `gh`.

## Output

Write the review in the user language. Required sections:

1. **Verdict** — `request changes` / `comment` / `approve`. Approve only when there are no
   blockers **and** CI is a real pass on this SHA.
2. **CI** — head SHA, run URL, each required job `success|failure|skipped|missing|pending`,
   and whether the green signal is real or a false positive.
3. **Findings** — Blocker / Should fix / Note. If none, say «недочётов не найдено» only after
   the diff was read.
4. **Unverified** — anything not actually inspected.

Do not merge, push to `main`, or implement fixes unless the user asked for that next step.
