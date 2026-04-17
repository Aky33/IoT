# Setup & Runbook

Tento dokument popisuje prvotní zprovoznění projektu a běžné denní příkazy.

## Předpoklady

- **Node.js 18+** (doporučeno 20 LTS) — `node --version`
- **npm 9+** — `npm --version`
- **Docker Desktop** nebo **OrbStack** — `docker --version`

MongoDB se v lokálním prostředí nespouští nativně, běží v Dockeru přes `docker-compose.yml`.

## První spuštění

Z kořene repozitáře:

```bash
npm install
npm run setup
npm run dev
```

Co dělá který krok:

1. `npm install` — stáhne závislosti do `node_modules/`.
2. `npm run setup` — vytvoří `.env` z `.env.example` (pokud ještě neexistuje) a spustí MongoDB kontejner v Dockeru.
3. `npm run dev` — spustí Express server s nodemonem (hot reload).

Ověření běhu:

```bash
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}
```

## Porty

| Služba  | Host port                          | Container port |
| ------- | ---------------------------------- | -------------- |
| Server  | 3000 (`PORT` v `.env`)             | —              |
| MongoDB | 27019 (`MONGO_HOST_PORT` v `.env`) | 27017          |

Pokud máš 27019 obsazený jinou službou, změň `MONGO_HOST_PORT` v `.env` a pusť `npm run db:down && npm run db:up`.

## Denní příkazy

- `npm run dev` — start serveru s hot reloadem
- `npm start` — produkční start (`node src/server.js`)
- `npm run db:up` — nastartuje Mongo kontejner
- `npm run db:down` — zastaví Mongo kontejner (data v Docker volume zůstávají)
- `npm run db:logs` — streamuje logy z Mongo kontejneru

## Environment proměnné (`.env`)

- `PORT` (default `3000`) — port Express serveru
- `NODE_ENV` (default `development`) — režim běhu
- `MONGO_HOST_PORT` (default `27019`) — host port pro Mongo kontejner
- `MONGO_DB_NAME` (default `iot-care`) — název databáze
- `MONGODB_URI` — odvozené z výše uvedených; nastav ručně pro Atlas nebo autentizovaný connect


## Reset databáze

```bash
npm run db:down
docker volume rm iot_mongo-data
npm run db:up
```

## Troubleshooting

- **`Error: port is already allocated`** při `npm run setup` — změň `MONGO_HOST_PORT` v `.env` na volný port.
- **`MongoNetworkError: connect ECONNREFUSED`** — Mongo kontejner neběží. Zkontroluj `docker ps` a spusť `npm run db:up`.
- **Server se restartuje v nekonečné smyčce** — `nodemon` vidí změny v `node_modules/`. Nechat `node_modules` v `.gitignore` a nepouštět příkazy, co modifikují závislosti během běhu.
