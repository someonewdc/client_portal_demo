---
name: docker-reclaim-space
description: >-
  Recovers from Docker/host ENOSPC without aborting the current task: inspects
  disk usage, deletes unused images, build cache, and stopped containers, and
  retries the original command. Never deletes named volumes or database data.
  Use when a command fails with "No space left on device", ENOSPC, overlay2
  ENOSPC, Docker disk full, build cache filling the VM, or the user asks to
  prune Docker images/cache, очистить Docker, освободить место, or reclaim
  space while keeping postgres_data.
---

# Docker reclaim space

`No space left on device` / `ENOSPC` is a recoverable interruption, not a reason to stop the
overall task. Reclaim Docker cache, retry the failed command, then continue.

Data to keep: named volumes, especially PostgreSQL volumes of this project. Do not copy host-
specific volume names from another product blindly. Cache to delete: unused images, dangling
layers, BuildKit cache, stopped containers, unused networks.

## Non-negotiables

- Do not abort the parent workflow after the first ENOSPC. Reclaim, then retry.
- Never `docker system prune --volumes`, `docker volume prune`, `docker compose down -v`, or
  a project `db-reset` / `demo-reset` as a disk fix.
- Never delete named postgres volumes or the Docker Desktop VM disk image (`Docker.raw` /
  factory reset).
- Stop/start stacks through the project's documented lifecycle (Make targets if present). Do
  not invent extra Compose commands.
- Prune is daemon-wide. Unused images from other stopped projects go away; their volumes stay.

## Recover and continue

```
- [ ] Record the failed command (do not drop the parent task)
- [ ] Confirm ENOSPC / docker df
- [ ] Reclaim cache (keep volumes)
- [ ] Confirm space was freed
- [ ] Retry the same failed command
- [ ] Continue the original workflow
```

**1. Record context.** Keep the exact command that failed. That is what you retry.

**2. Confirm it is Docker disk pressure.**

```bash
df -h /
docker system df
```

Typical signal: Docker `Images` / `Build Cache` dominate, or the error comes from `docker` /
`compose` / BuildKit / overlay2. If `/` itself is 100% full outside Docker, prune still helps
when Docker owns the bulk; if the host is full for other reasons, say so after prune fails.

**3. Reclaim cache. Default (stand may keep running):**

```bash
docker container prune -f
docker builder prune -af
docker image prune -af
docker network prune -f
```

Equivalent one-shot (still **without** `--volumes`):

```bash
docker system prune -af
```

If that is not enough, stop this repo's stacks so in-use images become unused, prune again,
then bring the needed stack back via the project lifecycle and retry.

**4. Confirm reclaim.**

```bash
docker system df
df -h /
```

Report before/after for Images and Build Cache. Then retry the **same** failed command.

**5. Only then escalate.** If ENOSPC remains after prune:

- Docker Desktop on macOS: compact/reclaim disk (Troubleshoot / Resources). Do not «Purge
  data» or «Reset to factory defaults» — that wipes volumes.
- If `/` is full of non-Docker files, stop and tell the user. Do not delete project data to
  make room.

## Do not

- Treat ENOSPC as a fatal CI/task result before reclaim + retry.
- Use `--volumes` on any prune.
- Destroy volumes to “unstick” a build or start.
- Skip retry after a successful prune.
