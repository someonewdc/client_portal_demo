# Toolchain

Стенд dest (уже выставлен генератором):

| Что             | Значение                                  |
| --------------- | ----------------------------------------- |
| Node            | 24.x (`engines` в корневом package.json)  |
| pnpm            | 11                                        |
| Web             | `http://localhost:3100`                   |
| API             | `http://localhost:3101`, prefix `/api/v1` |
| Postgres        | хост `:5434`, БД `protostar_status`       |
| Compose project | `protostar-status`                        |

Команды: `make bootstrap`, `make up`, `make down`, `make dev`, `make restart`,
`make verify`. Не сырой `docker compose` в чатах агента.

Не занимать `:3000` / `:3001` / `:5433`. Не публиковать packages.
