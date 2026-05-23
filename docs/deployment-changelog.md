# Zmena deploymentu: slouceni do jednoho kontejneru

## Co se zmenilo

Frontend a backend nyni bezi v **jednom Docker kontejneru** misto dvou. Express servuje API (`/api/*`) i staticke frontend soubory (React SPA) na jednom portu.

## Proc

Dva kontejnery = dve domeny = cross-origin cookies. Safari na iOS blokuje third-party cookies (ITP), takze se PWA po zavreni odhlasila — refresh token cookie se smazal.

Sloucenim do jednoho kontejneru je cookie first-party a problem zmizi.

## Hlavni zmeny

- **Vsechny API routes maji prefix `/api`** (`/auth/login` -> `/api/auth/login`, `/devices/all` -> `/api/devices/all` atd.)
- **Refresh token cookie path**: `/auth` -> `/api/auth`
- **Vite proxy**: 13 pravidel -> jedno (`"/api" -> backend`)
- **Root Dockerfile**: multi-stage build (frontend build + backend + staticke soubory)
- **Gateway**: nova URL `https://<domena>/api/notifications/create`, HMAC payload obsahuje `/api` prefix

## Co se nezmenilo

- Frontend kod (React, komponenty, hooks) — beze zmen
- Backend API logika — beze zmen
- Lokalni vyvoj — `npm run dev` zvlast pro frontend i backend, Vite proxy funguje stejne
- Databaze — beze zmen
- Autentizace (JWT + HMAC) — beze zmen

## Build

```bash
cd ~/IoT
docker buildx build --platform=linux/amd64 -t vizeweby/iot:latest --push .
```

## Northflank

- Novy kontejner `iot` s image `vizeweby/iot:latest`
- Stare kontejnery `iot-frontend` a `iot-backend` smazat
- Env promenne z `.env.prod` (bez `FRONTEND_URL`)
