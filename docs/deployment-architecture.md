# Architektura nasazeni - IoT Care

## Puvodni architektura (dva kontejnery)

```
                    Internet
                       |
        +--------------+--------------+
        |                             |
  iot-frontend                  iot-backend
  (serve, port 4173)            (Express, port 3000)
  web--iot-frontend--*.code.run be--iot-backend--*.code.run
        |                             |
        |                      +------+------+
        |                      |             |
        |                   MongoDB    IoT Gateway
        |                              (Raspberry Pi)
        |
   React SPA (Vite build)
   fetch() -> be--iot-backend--*.code.run
```

**Frontend kontejner** (`iot-frontend`):
- Docker image s `serve` (staticke soubory)
- Vite build s `VITE_API_BASE_URL` nasmerovanym na backend domenu
- Port 4173, vlastni domena `web--iot-frontend--*.code.run`

**Backend kontejner** (`iot-backend`):
- Express.js API server
- Port 3000, vlastni domena `be--iot-backend--*.code.run`
- CORS s `origin: frontendUrl` pro cross-origin pozadavky

**Problemy teto architektury:**

1. **Third-party cookies**: Frontend a backend na ruznych domenach = refresh token cookie je cross-origin. Safari/iOS (ITP) tyto cookies blokuje. PWA se po zavreni odhlasi, protoze cookie se smaze.
2. **SameSite cookie**: Pro cross-origin bylo nutne `sameSite: 'none'` + `secure: true`, coz nektere prohlizece blokovaly.
3. **Route konflikty**: Frontend SPA routes (`/notifications`, `/devices`) kolidovaly s backend API routes pri F5 refreshi.
4. **Slozitost proxy**: Vite dev proxy vyzadoval 13 specifickych pravidel pro kazdy API endpoint, aby se vyhnul kolizi se SPA routes.
5. **Dva kontejnery**: Dvojnasobne naklady na hosting, slozitejsi deployment.

---

## Nova architektura (jeden kontejner)

```
                    Internet
                       |
              +--------+--------+
              |                 |
            iot                IoT Gateway
      (Express, port 3000)     (Raspberry Pi)
      p01--iot--*.code.run      |
              |                 |
        +-----+-----+          |
        |           |           |
     /api/*      /* (SPA)      POST /api/notifications/create
     API routes  static files   (HMAC auth, server-to-server)
        |
     MongoDB
```

**Jeden kontejner** (`iot`):
- Express.js servuje API i staticke frontend soubory
- Port 3000, jedna domena `p01--iot--*.code.run`
- Frontend build (`dist/`) zkopirovan do `public/` v Docker image

---

## Co se zmenilo a proc

### 1. Slouceni do jednoho Docker image

**Soubor:** `/IoT/Dockerfile` (novy, root projektu)

Multi-stage Docker build:
- Stage 1: Buildne frontend (`npm run build` -> `dist/`)
- Stage 2: Instaluje backend + kopiruje `dist/` do `public/`

**Proc:** Jeden kontejner = jedna domena = first-party cookies. Snizeni nakladu na hosting (1 kontejner misto 2).

### 2. Express servuje staticke soubory

**Soubor:** `apps/backend/src/app.js`

Pridano za API routes:
- `express.static(publicDir)` — servuje JS, CSS, images
- SPA fallback `GET /{*splat}` — vraci `index.html` pro vsechny HTML pozadavky, ktere neodpoviadaji API routam

**Proc:** Frontend SPA potrebuje, aby server vracel `index.html` pro vsechny klientske routes (`/notifications`, `/devices/xxx` atd.). API routes se matchuji driv, takze nedochazi ke kolizi.

### 3. API prefix `/api`

**Soubory:**
- `apps/backend/src/app.js` — vsechny routes prefixnute `/api`
- `apps/frontend/src/lib/api-client.ts` — `buildUrl()` automaticky prepend `/api`
- `apps/frontend/vite.config.ts` — proxy zjednoduseno na jedno pravidlo: `"/api" -> backend`

Prehled zmen:
| Puvodni cesta | Nova cesta |
|---|---|
| `/auth/login` | `/api/auth/login` |
| `/devices/all` | `/api/devices/all` |
| `/notifications/create` | `/api/notifications/create` |
| `/notifications/stream` | `/api/notifications/stream` |
| `/push/subscribe` | `/api/push/subscribe` |
| `/users/all` | `/api/users/all` |
| `/caregivers/all` | `/api/caregivers/all` |
| `/invitations/all` | `/api/invitations/all` |
| `/health` | `/api/health` |

**Proc:** Frontend SPA routes (`/notifications`, `/devices`) kolidovaly s backend API routes. S `/api` prefixem se namespacy ciste oddeli — `/api/*` je backend, vsechno ostatni je frontend.

### 4. Cookie path

**Soubor:** `apps/backend/src/controllers/authController.js`

- `path: '/auth'` -> `path: '/api/auth'`
- Odebrana `crossOrigin` logika (uz neni potreba)
- Zpet na `sameSite: 'strict'` (same-origin, bezpecnejsi)

**Proc:** Cookie path musi odpovidat route, na ktere se posilaji auth pozadavky. S `/api` prefixem se cesta zmenila.

### 5. Odebrani FRONTEND_URL

**Soubory:**
- `apps/backend/src/config/index.js` — odebrano `frontendUrl`
- `apps/backend/.env` a `.env.prod` — odebrano `FRONTEND_URL`

**Proc:** Frontend a backend jsou na stejnem originu, nepotrebujeme konfigurovat cross-origin CORS ani cookie nastaveni.

### 6. Vite proxy zjednoduseni

**Soubor:** `apps/frontend/vite.config.ts`

Puvodnich 13 specifickych proxy pravidel nahrazeno jednim:
```js
proxy: { "/api": backend }
```

**Proc:** Vsechny API requesty zacinaji `/api`, takze staci jedno pravidlo. Zadne riziko kolize se SPA routes.

---

## Lokalni vyvoj

Lokalni workflow se nemeni:

```bash
# Terminal 1 — backend
cd apps/backend
npm run db:up    # spusti MongoDB v Dockeru
npm run dev      # nodemon na portu 3000

# Terminal 2 — frontend
cd apps/frontend
npm run dev      # Vite na portu 5174, proxy /api -> localhost:3000
```

Frontend a backend jsou v repozitari stale oddelene (`apps/frontend`, `apps/backend`). Spojeni do jednoho kontejneru je jen zalezitost Docker buildu.

---

## Build a deployment

```bash
cd ~/IoT
docker buildx build --platform=linux/amd64 -t vizeweby/iot:latest --push .
```

Na Northflank:
- Jeden kontejner `iot` s image `vizeweby/iot:latest`
- Port 3000 (HTTP)
- Env promenne z `.env.prod` (bez `FRONTEND_URL`)

---

## IoT Gateway (Raspberry Pi)

Gateway posila pozadavky na novou URL:

- **Endpoint:** `https://p01--iot--*.code.run/api/notifications/create`
- **Metoda:** `POST`
- **Headers:** `Content-Type`, `X-Device-Id`, `X-Timestamp`, `X-Signature`
- **HMAC payload:** `POST|/api/notifications/create|<timestamp>|<JSON body>`

CORS se na gateway nevztahuje — jde o server-to-server komunikaci (Node-RED/Node.js), ne o prohlizec.
