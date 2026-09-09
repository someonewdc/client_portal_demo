---
name: nuxt-ssr-data-and-ui
description: >-
  Implements Nuxt SSR storefront data and UI against a generated OpenAPI
  client: useFetch/useAsyncData, no Nest/Prisma imports, no catalog in Pinia,
  URL filters, Tailwind-first from @theme, real form states, and cookie
  forwarding only for the current request. Use when adding pages, composables,
  stores, or storefront UI.
---

# Nuxt SSR data and UI

`openapi-client-core` не знает Nuxt. Визуальный язык конкретного бренда сюда не копируй.

Нужен, только если новый продукт — Nuxt SSR. Иначе skill не копируй.

## Данные

- Server state: `useFetch` / `useAsyncData` + один facade над generated client
  (`createProblemAwareClient<Paths>`).
- Web не импортирует Nest DTO, Prisma, backend source, mock fixtures.
- Pinia **не** для server state (списки, цены, session, capabilities). Default этой линии
  (ADR-006 исходного стенда): session не в Pinia/`localStorage`. Client-only черновик допустим,
  если продукт это явно решил; цены перед submit всё равно перепроверяет API. Иное — только
  после `docs/decisions.md` нового продукта.
- Фильтры списков — в URL (direct load, reload, back/forward).
- Capabilities с backend. Не держи вторую hardcoded matrix ролей/профилей во frontend, пока
  новый продукт явно не решил иначе.
- Browser client: `credentials: 'include'`.
- SSR: forward только cookie **текущего** request и только на validated origin. Не forward
  `Authorization` и чужие cookies.
- Route middleware — UX, не security boundary.

Ошибки: безопасное UI-сообщение + `traceId`, если есть. Не показывай stack/SQL/transport.

## UI

- У каждой формы: loading / empty / error / success. Нет ссылок `#` и мёртвых CTA.
- Semantic HTML, labels, focus, keyboard, `useSeoMeta` где страница публичная.
- Новый и затронутый UI — Tailwind-first от проектного `@theme`. Arbitrary values только для
  geometry, которую нельзя выразить token.
- Не массовая замена class «заодно». Legacy CSS удаляй вместе с последним caller.
- Не собирай универсальный UI-kit. `data-testid` — hook, не styling API.

Изменённый visual component: устойчивый selector; desktop и mobile, если layout менялся.

## Do not

- Класть каталог в Pinia «для удобства».
- Вызывать internal mock control с браузера.
- Тащить `@theme` токены Вольтариса в новый бренд.
