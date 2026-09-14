# Архитектура

## Три контура (не смешивать)

```text
браузер
  ├─ protostar.ru              → статика Astro (репозиторий protostar_site)
  ├─ demo.protostar.ru         → overlay «Вольтарис» (demo_b2b)
  ├─ show.protostar.ru         → второй инстанс Вольтариса
  └─ status.protostar.ru       → этот git (D-002, пока не cutover)
       ├─ /                    → заглушка «ссылка от менеджера»
       ├─ /r/{secret}          → страница заявки (Nuxt)
       └─ /api/v1/             → Nest на том же hostname
```

Apex **не** проксирует `/api/v1/` сюда. Path `/portal` на `protostar.ru` запрещён
хостовым ТЗ сайта. Sibling-hostname, не вложенный path (cookie host-only, как
demo/show).

Локально этот стенд — `:3100` / `:3101` / `:5434`, чтобы не пересечься с Нордщитом
(`3000`/`3001`/`5433`) и overlay Вольтариса (`13000+` / `14000+`).

## Слои этого git

```text
apps/web  ──> @protostar/api-client ──> @protostar/openapi-client-core
apps/api  ──> @protostar/nestjs-core ──> @protostar/platform-core
все       ──> @protostar/tsconfig + eslint-config
```

Hexagon: HTTP-контроллер → application use-case → port; Prisma только в
infrastructure. Web не знает Prisma. Packages не знают заявку.

Генератор уже собрал kit кабинета (`GET` по секрету, `/r/…`, лист файла) без
Demo/Conductor/live. Новых public exports в packages для v1 не нужно.

## Что не строить

- Второй nginx внутри Compose (вход — хостовый nginx сайта, когда будет D-002).
- mock-api.
- Nx / Turborepo / npm publish.
- git submodule ядра Нордщита.
