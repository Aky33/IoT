# API Endpointy — Referenční dokumentace

Tento dokument slouží jako:
1. **Podklad pro kolegy** — přepis do školního portálu (Command List, dtoIn/dtoOut, validace, sequence, seznam chyb)
2. **Návod pro frontend** — jak endpointy volat, jaké hlavičky posílat, co očekávat v odpovědi

## Základní URL

```
http://localhost:3000  (development)
```

## Formát odpovědí

Všechny odpovědi používají konzistentní JSON formát:
- MongoDB `_id` se přejmenuje na `id` (string)
- Pole `__v` se odstraní
- Časová razítka jsou ve formátu ISO 8601

### Úspěšná odpověď — jeden objekt

```json
{ "id": "...", "firstName": "...", ... }
```

### Úspěšná odpověď — stránkovaný seznam

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "pageSize": 50, "total": 100 }
}
```

### Chybová odpověď

```json
{
  "error": {
    "code": "errorCode",
    "message": "Lidsky čitelná zpráva.",
    "details": {}
  }
}
```

## Stránkování

Endpointy vracející seznamy přijímají query parametry:

| Parametr | Výchozí | Max | Popis |
|----------|---------|-----|-------|
| `page` | 1 | - | Číslo stránky (min 1) |
| `pageSize` | 50 | 200 | Počet položek na stránku |

Příklad: `GET /devices/all?page=2&pageSize=10`

---

## Přehled endpointů (Command List)

| Command | HTTP | Popis | Application profiles |
|---------|------|-------|---------------------|
| `/auth/register` | POST | Registrace pečující osoby (s invitation kódem) | public |
| `/auth/login` | POST | Přihlášení (vrátí JWT) | public |
| `/auth/refresh` | POST | Obnovení access tokenu | authenticated |
| `/auth/logout` | POST | Odhlášení (zneplatnění refresh tokenu) | authenticated |
| `/users/create` | POST | Vytvoří model uživatel | admin |
| `/users/all` | GET | Navrátí všechny modely uživatel | admin |
| `/users/get/{id}` | GET | Navrátí konkrétní model uživatel | admin, caregiver |
| `/users/edit/{id}` | PUT | Zedituje konkrétní model uživatel | admin |
| `/users/delete/{id}` | DELETE | Smaže konkrétní model uživatel | admin |
| `/caregivers/all` | GET | Navrátí všechny modely pečující osoby | admin |
| `/caregivers/get/{id}` | GET | Navrátí konkrétní model pečující osoby | admin |
| `/caregivers/edit/{id}` | PUT | Zedituje konkrétní model pečující osoby | admin |
| `/caregivers/delete/{id}` | DELETE | Smaže konkrétní model pečující osoby | admin |
| `/devices/create` | POST | Vytvoří model zařízení | admin |
| `/devices/all` | GET | Navrátí modely zařízení | admin, caregiver |
| `/devices/get/{id}` | GET | Navrátí konkrétní model zařízení | admin, caregiver |
| `/devices/edit/{id}` | PUT | Zedituje konkrétní model zařízení | admin |
| `/devices/delete/{id}` | DELETE | Smaže konkrétní model zařízení | admin |
| `/notifications/create` | POST | Vytvoří model notifikace | device |
| `/notifications/all` | GET | Navrátí notifikace přihlášeného pečovatele | admin, caregiver |
| `/notifications/stream` | GET | SSE stream notifikací v reálném čase | caregiver |
| `/invitations/create` | POST | Vytvoří pozvánku | admin |
| `/invitations/all` | GET | Navrátí všechny pozvánky | admin |
| `/invitations/revoke/{id}` | DELETE | Zruší (smaže) pozvánku | admin |
| `/push/subscribe` | POST | Uloží push subscription | caregiver, admin |
| `/push/unsubscribe` | DELETE | Odstraní push subscription | caregiver, admin |
| `/push/vapid-public-key` | GET | Vrátí VAPID veřejný klíč | caregiver, admin |

---

## Detailní dokumentace endpointů

---

### POST /auth/register

**Popis:** Registrace nové pečující osoby s invitation kódem.

**Rate limit:** 20 požadavků / 15 minut

**Vstup (dtoIn):**
```js
const dtoIn = {
  firstName: "Marie",
  lastName: "Nováková",
  email: "marie@example.com",
  password: "securePass123",
  phone: "+420123456789",
  invitationCode: "A1B2C3D4"
};
```

| Pole | Typ | Povinné | Poznámka |
|------|-----|---------|----------|
| `firstName` | string | ano | |
| `lastName` | string | ano | |
| `email` | string | ano | Unikátní, automaticky lowercase |
| `password` | string | ano | Min 8 znaků |
| `phone` | string | ne | |
| `invitationCode` | string | ano | 8znakový hex kód od admina |

**Výstup (dtoOut) — 201:**
```js
const dtoOut = {
  accessToken: "eyJ...",
  caregiver: {
    id: "xxx",
    firstName: "Marie",
    lastName: "Nováková",
    email: "marie@example.com",
    phone: "+420123456789",
    role: "caregiver",
    notificationPreferences: {
      sound: true,
      vibration: true,
      doNotDisturb: false
    },
    isActive: true,
    createdAt: "2026-04-29T10:00:00.000Z",
    updatedAt: "2026-04-29T10:00:00.000Z"
  }
};
```

Také nastaví `refreshToken` jako httpOnly cookie.

**Použití na frontendu:**
```js
const res = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(dtoIn),
});
const { accessToken, caregiver } = await res.json();
```

**Seznam chyb:**

| Typ | Kód | Zpráva | Status |
|-----|-----|--------|--------|
| Error | `invitationRequired` | Invitation code is required to register. | 400 |
| Error | `invitationInvalid` | Invitation code is invalid, expired, or already used. | 400 |
| Error | `weakPassword` | Password must be at least 8 characters. | 400 |
| Error | `emailTaken` | A caregiver with this email already exists. | 409 |

---

### POST /auth/login

**Popis:** Přihlášení pečující osoby.

**Rate limit:** 20 požadavků / 15 minut

**Vstup (dtoIn):**
```js
const dtoIn = {
  email: "marie@example.com",
  password: "securePass123"
};
```

**Výstup (dtoOut) — 200:**
```js
const dtoOut = {
  accessToken: "eyJ..."
};
```

Také nastaví `refreshToken` jako httpOnly cookie.

**Použití na frontendu:**
```js
const res = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email, password }),
});
const { accessToken } = await res.json();
```

**Seznam chyb:**

| Typ | Kód | Zpráva | Status |
|-----|-----|--------|--------|
| Error | `invalidCredentials` | Invalid email or password. | 401 |

---

### POST /auth/refresh

**Popis:** Obnovení access tokenu pomocí refresh token cookie.

**Vstup:** Žádný body. Používá `refreshToken` cookie (posílá se automaticky).

**Výstup (dtoOut) — 200:**
```js
const dtoOut = {
  accessToken: "eyJ..."
};
```

Nastaví nový `refreshToken` cookie (rotace tokenu).

**Použití na frontendu:**
```js
const res = await fetch('/auth/refresh', {
  method: 'POST',
  credentials: 'include',
});
const { accessToken } = await res.json();
```

**Seznam chyb:**

| Typ | Kód | Zpráva | Status |
|-----|-----|--------|--------|
| Error | `noRefreshToken` | Refresh token cookie is missing. | 401 |
| Error | `refreshTokenInvalid` | Refresh token is invalid or expired. | 401 |
| Error | `refreshTokenReuse` | Refresh token reuse detected. All sessions revoked. | 401 |

---

### POST /auth/logout

**Popis:** Odhlášení — smaže refresh token z DB a vymaže cookie.

**Vstup:** Žádný.

**Výstup:** 204 No Content

---

### POST /users/create

**Popis:** Vytvoří nového uživatele (pacienta).

**Autorizace:** JWT Bearer token, role `admin`

**Vstup (dtoIn):**
```js
const dtoIn = {
  firstName: "Jan",
  lastName: "Novák",
  notes: "Diabetik, špatně slyší"
};
```

**Validační schéma (dtoInValidationSchema):**
```js
const dtoInValidationSchema = {
  type: "object",
  properties: {
    firstName: { type: "string", maxLength: 50 },
    lastName: { type: "string", maxLength: 50 },
    notes: { type: "string", maxLength: 500 }
  },
  required: ["firstName", "lastName"],
  additionalProperties: false
};
```

**Výstup (dtoOut) — 201:**
```js
const dtoOut = {
  id: "xxx",
  firstName: "Jan",
  lastName: "Novák",
  notes: "Diabetik, špatně slyší",
  isActive: true,
  createdAt: "2026-04-29T10:00:00.000Z",
  updatedAt: "2026-04-29T10:00:00.000Z"
};
```

**Sequence:**
1. Validace dtoIn podle dtoInValidationSchema
2. Systém uloží předaný model do DB
3. Vrátí dtoOut

**Seznam chyb:**

| Typ | Kód | Zpráva | Status |
|-----|-----|--------|--------|
| Error | `validationError` | Request body is invalid. | 400 |
| Error | `forbidden` | You do not have permission. | 403 |

---

### GET /users/all

**Popis:** Navrátí všechny modely uživatel v aplikaci.

**Autorizace:** JWT Bearer token, role `admin`

**Query parametry:** `?page=1&pageSize=10`

**Výstup (dtoOut) — 200:**
```js
const dtoOut = {
  data: [
    {
      id: "xxx",
      firstName: "Jan",
      lastName: "Novák",
      notes: "Diabetik",
      isActive: true,
      createdAt: "2026-04-29T10:00:00.000Z",
      updatedAt: "2026-04-29T10:00:00.000Z"
    }
  ],
  meta: { page: 1, pageSize: 50, total: 1 }
};
```

---

### GET /users/get/{id}

**Popis:** Navrátí konkrétní model uživatel podle id.

**Autorizace:** JWT Bearer token, role `admin` nebo `caregiver`

**Omezení pro caregivera:** Caregiver může zobrazit pouze uživatele, kteří jsou přiřazeni k jeho zařízením. Ověřuje se přes `Device.exists({ caregiverId, userId, isActive: true })`.

**Výstup (dtoOut) — 200:** Stejný formát jako jeden objekt z `/users/all`.

**Seznam chyb:**

| Typ | Kód | Zpráva | Status |
|-----|-----|--------|--------|
| Error | `notFound` | User not found. | 404 |
| Error | `forbidden` | You do not have permission. | 403 |

---

### PUT /users/edit/{id}

**Popis:** Zedituje konkrétní model uživatel podle id.

**Autorizace:** JWT Bearer token, role `admin`

**Vstup (dtoIn) — všechna pole nepovinná (partial update):**
```js
const dtoIn = {
  firstName: "Jan",
  lastName: "Novák",
  notes: "Aktualizované poznámky",
  isActive: true
};
```

**Výstup (dtoOut) — 200:** Aktualizovaný objekt uživatele.

---

### DELETE /users/delete/{id}

**Popis:** Smaže konkrétní model uživatel podle id (soft delete — nastaví `isActive: false`).

**Autorizace:** JWT Bearer token, role `admin`

**Výstup:** 204 No Content

---

### GET /caregivers/all

**Popis:** Navrátí všechny modely pečující osoby v aplikaci.

**Autorizace:** JWT Bearer token, role `admin`

**Query parametry:** `?page=1&pageSize=10`

**Výstup (dtoOut) — 200:**
```js
const dtoOut = {
  data: [
    {
      id: "xxx",
      firstName: "Marie",
      lastName: "Nováková",
      email: "marie@example.com",
      phone: "+420123456789",
      role: "caregiver",
      notificationPreferences: {
        sound: true,
        vibration: true,
        doNotDisturb: false
      },
      isActive: true,
      createdAt: "2026-04-29T10:00:00.000Z",
      updatedAt: "2026-04-29T10:00:00.000Z"
    }
  ],
  meta: { page: 1, pageSize: 50, total: 1 }
};
```

Citlivá pole (`passwordHash`, `refreshTokens`, `pushSubscription`) se nikdy nevrací.

---

### GET /caregivers/get/{id}

**Popis:** Navrátí konkrétní model pečující osoby podle id.

**Autorizace:** JWT Bearer token, role `admin`

**Výstup (dtoOut) — 200:** Stejný formát jako objekt z `/caregivers/all`.

---

### PUT /caregivers/edit/{id}

**Popis:** Zedituje konkrétní model pečující osoby podle id.

**Autorizace:** JWT Bearer token, role `admin`

**Vstup (dtoIn) — všechna pole nepovinná:**
```js
const dtoIn = {
  firstName: "Marie",
  lastName: "Nováková",
  email: "marie.nova@example.com",
  phone: "+420111222333",
  notificationPreferences: {
    sound: false,
    vibration: true,
    doNotDisturb: true
  },
  isActive: false,
  role: "admin"
};
```

Povolená pole: `firstName`, `lastName`, `email`, `phone`, `pushSubscription`, `notificationPreferences`, `isActive`, `role`.

---

### DELETE /caregivers/delete/{id}

**Popis:** Smaže konkrétní model pečující osoby (soft delete).

**Autorizace:** JWT Bearer token, role `admin`

**Výstup:** 204 No Content

---

### POST /devices/create

**Popis:** Vytvoří nové zařízení. Automaticky vygeneruje `deviceSecret` pro HMAC autentizaci.

**Autorizace:** JWT Bearer token, role `admin`

**Vstup (dtoIn):**
```js
const dtoIn = {
  name: "Tlačítko obývák",
  userId: "xxx",
  caregiverId: "xxx"
};
```

**Validační schéma:**
```js
const dtoInValidationSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    userId: { type: "string" },
    caregiverId: { type: "string" },
    lastSeenAt: { type: "string" }
  },
  required: ["name"],
  additionalProperties: false
};
```

**Důležité:** `userId` a `caregiverId` jsou technicky nepovinné při vytváření, ale **musí být nastavené** aby zařízení mohlo posílat notifikace (endpoint `/notifications/create` vyžaduje obě reference).

**Výstup (dtoOut) — 201:**
```js
const dtoOut = {
  id: "xxx",
  name: "Tlačítko obývák",
  userId: "xxx",
  caregiverId: "xxx",
  macAddress: null,
  firmwareVersion: null,
  lastSeenAt: null,
  isActive: true,
  createdAt: "2026-04-29T10:00:00.000Z",
  updatedAt: "2026-04-29T10:00:00.000Z"
};
```

`deviceSecret` se **nevrací** v API odpovědi (`select: false`). Pro konfiguraci gateway je nutné ho přečíst přímo z databáze.

---

### GET /devices/all

**Popis:** Navrátí zařízení.

**Autorizace:** JWT Bearer token
- **Admin:** vrátí všechna zařízení
- **Caregiver:** vrátí pouze zařízení přiřazená přihlášenému pečovateli

**Query parametry:** `?page=1&pageSize=10`

**Výstup (dtoOut) — 200:** Stránkovaný seznam zařízení.

---

### GET /devices/get/{id}

**Popis:** Navrátí konkrétní zařízení.

**Autorizace:** JWT Bearer token
- **Admin:** přístup ke všem
- **Caregiver:** pouze k vlastním (jinak 403)

---

### PUT /devices/edit/{id}

**Popis:** Zedituje zařízení.

**Autorizace:** JWT Bearer token, role `admin`

**Vstup (dtoIn) — všechna pole nepovinná:**
```js
const dtoIn = {
  name: "Tlačítko kuchyň",
  caregiverId: "novy-caregiver-id"
};
```

Povolená pole: `name`, `userId`, `caregiverId`, `macAddress`, `firmwareVersion`, `lastSeenAt`.

---

### DELETE /devices/delete/{id}

**Popis:** Smaže zařízení (soft delete).

**Autorizace:** JWT Bearer token, role `admin`

**Výstup:** 204 No Content

---

### POST /notifications/create

**Popis:** Vytvoří notifikaci. Volá **pouze IoT gateway** přes HMAC autentizaci.

**Rate limit:** 10 požadavků / minutu

**Autentizace:** HMAC-SHA256 přes hlavičky:
```
X-Device-Id: <id_zarizeni>
X-Timestamp: <unix_sekundy>
X-Signature: <hmac_sha256_hex>
```

HMAC podpis se počítá jako:
`HMAC-SHA256(deviceSecret, "POST|/notifications/create|<unix_timestamp>|<JSON.stringify(body)>")`

Příklad payload stringu: `POST|/notifications/create|1714400000|{"type":"standard"}`

**Vstup (dtoIn):**
```js
const dtoIn = {
  type: "standard"  // "standard" | "urgent"
};
```

**Validační schéma:**
```js
const dtoInValidationSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["standard", "urgent"] }
  },
  required: ["type"],
  additionalProperties: false
};
```

`deviceId`, `userId`, `caregiverId` se **neposílají v body** — berou se automaticky z ověřeného zařízení (`req.device`).

**Výstup (dtoOut) — 201:**
```js
const dtoOut = {
  id: "xxx",
  deviceId: "xxx",
  userId: "xxx",
  caregiverId: "xxx",
  type: "standard",
  status: "sent",
  sentAt: "2026-04-29T10:30:00.000Z",
  deliveredAt: null,
  cancelledAt: null,
  createdAt: "2026-04-29T10:30:00.000Z"
};
```

**Sequence:**
1. Ověření HMAC podpisu (authenticateDevice middleware)
2. Validace dtoIn
3. Ověření, že cílový caregiver existuje a je aktivní
4. Vytvoření notifikace v DB (status: pending)
5. Odeslání Web Push (pokud má caregiver pushSubscription)
6. Emitování SSE eventu (pokud má caregiver otevřené spojení)
7. Aktualizace statusu (sent/failed)
8. Vrátí dtoOut

**Seznam chyb:**

| Typ | Kód | Zpráva | Status |
|-----|-----|--------|--------|
| Error | `deviceAuthMissing` | Missing X-Device-Id, X-Timestamp, or X-Signature headers. | 401 |
| Error | `timestampExpired` | Request timestamp is outside the allowed window. | 401 |
| Error | `deviceNotFound` | Device not found or inactive. | 401 |
| Error | `signatureInvalid` | HMAC signature verification failed. | 401 |
| Error | `validationError` | Request body is invalid. | 400 |
| Error | `caregiverNotFound` | Target caregiver not found or inactive. | 422 |
| Error | `rateLimitExceeded` | Too many notifications in a short window. | 429 |

---

### GET /notifications/all

**Popis:** Navrátí notifikace přihlášeného pečovatele.

**Autorizace:** JWT Bearer token, role `admin` nebo `caregiver`

Vždy filtrováno podle `caregiverId` z JWT tokenu — každý uživatel vidí pouze své notifikace.

**Query parametry:** `?page=1&pageSize=10&deviceId=<volitelné>`

**Výstup (dtoOut) — 200:**
```js
const dtoOut = {
  data: [
    {
      id: "xxx",
      deviceId: { id: "xxx", name: "Tlačítko obývák" },
      userId: "xxx",
      caregiverId: "xxx",
      type: "urgent",
      status: "sent",
      sentAt: "2026-04-29T10:30:00.000Z",
      deliveredAt: null,
      cancelledAt: null,
      createdAt: "2026-04-29T10:30:00.000Z"
    }
  ],
  meta: { page: 1, pageSize: 50, total: 1 }
};
```

Pole `deviceId` je populováno — obsahuje `id` a `name` zařízení.

---

### GET /notifications/stream

**Popis:** SSE (Server-Sent Events) stream pro notifikace v reálném čase.

**Autorizace:** JWT token přes query parametr `?token=<accessToken>` (EventSource nepodporuje vlastní hlavičky)

**Dostupné pouze pro:** `caregiver`

**Použití na frontendu:**
```js
const source = new EventSource(`/notifications/stream?token=${accessToken}`);
source.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log(notification);
};
```

**Formát SSE eventu:**
```
data: {"id":"xxx","type":"urgent","deviceName":"Tlačítko obývák","createdAt":"2026-04-29T10:30:00.000Z"}
```

Viz [notifications.md](notifications.md) pro kompletní návod na integraci.

---

### POST /invitations/create

**Popis:** Vytvoří pozvánku pro registraci nového uživatele.

**Autorizace:** JWT Bearer token, role `admin`

**Vstup (dtoIn):**
```js
const dtoIn = {
  ttlHours: 24,
  role: "caregiver"
};
```

| Pole | Výchozí | Poznámka |
|------|---------|----------|
| `ttlHours` | 24 | Hodiny do expirace |
| `role` | `"caregiver"` | `"caregiver"` nebo `"admin"` |

**Výstup (dtoOut) — 201:**
```js
const dtoOut = {
  id: "xxx",
  code: "A1B2C3D4",
  role: "caregiver",
  createdBy: "xxx",
  expiresAt: "2026-04-30T10:00:00.000Z",
  usedAt: null,
  usedBy: null,
  createdAt: "2026-04-29T10:00:00.000Z"
};
```

---

### GET /invitations/all

**Popis:** Navrátí všechny nepoužité pozvánky.

**Autorizace:** JWT Bearer token, role `admin`

**Poznámka:** Vrací **prostý JSON array**, ne stránkovaný objekt `{ data, meta }`.

**Výstup (dtoOut) — 200:**
```js
const dtoOut = [
  {
    id: "xxx",
    code: "A1B2C3D4",
    role: "caregiver",
    createdBy: "xxx",
    expiresAt: "2026-04-30T10:00:00.000Z",
    usedAt: null,
    usedBy: null,
    createdAt: "2026-04-29T10:00:00.000Z"
  }
];
```

---

### DELETE /invitations/revoke/{id}

**Popis:** Zruší (smaže) pozvánku podle id. Hard delete — pozvánka se smaže z databáze.

**Autorizace:** JWT Bearer token, role `admin`

**Výstup:** 204 No Content

---

### POST /push/subscribe

**Popis:** Uloží Web Push subscription pro přihlášeného pečovatele.

**Autorizace:** JWT Bearer token, role `caregiver` nebo `admin`

**Vstup (dtoIn):**
```js
const dtoIn = {
  endpoint: "https://fcm.googleapis.com/fcm/send/...",
  keys: {
    p256dh: "base64url...",
    auth: "base64url..."
  }
};
```

**Výstup (dtoOut) — 200:**
```js
const dtoOut = { ok: true };
```

Viz [notifications.md](notifications.md) pro kompletní návod na Web Push integraci.

---

### DELETE /push/unsubscribe

**Popis:** Odstraní push subscription přihlášeného pečovatele.

**Autorizace:** JWT Bearer token

**Výstup (dtoOut) — 200:**
```js
const dtoOut = { ok: true };
```

---

### GET /push/vapid-public-key

**Popis:** Vrátí VAPID veřejný klíč serveru. Frontend ho potřebuje pro `PushManager.subscribe()`.

**Autorizace:** JWT Bearer token

**Výstup (dtoOut) — 200:**
```js
const dtoOut = {
  vapidPublicKey: "BCQYVw..."
};
```

---

### GET /health

**Popis:** Kontrola stavu serveru a databáze. Veřejný endpoint.

**Výstup (dtoOut) — 200 nebo 503:**
```js
const dtoOut = {
  status: "ok",
  db: "connected",
  timestamp: "2026-04-29T10:00:00.000Z"
};
```

---

## Jak volat chráněné endpointy z frontendu

```js
const res = await fetch('/devices/all', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
});
const data = await res.json();
```

Vždy používejte `credentials: 'include'` pro správné fungování cookies (refresh token).

---

## Kompletní seznam chybových kódů

| Kód | Status | Popis |
|-----|--------|-------|
| `unauthorized` | 401 | Chybí nebo neplatná Authorization hlavička |
| `tokenExpired` | 401 | JWT access token vypršel |
| `tokenInvalid` | 401 | JWT access token je neplatný |
| `forbidden` | 403 | Nedostatečná oprávnění |
| `notFound` | 404 | Zdroj nebyl nalezen nebo je neaktivní |
| `validationError` | 400 | Validace těla požadavku selhala |
| `invitationRequired` | 400 | Chybí invitation kód |
| `invitationInvalid` | 400 | Neplatný, expirovaný nebo použitý kód |
| `weakPassword` | 400 | Heslo kratší než 8 znaků |
| `emailTaken` | 409 | Email je již zaregistrován |
| `invalidCredentials` | 401 | Nesprávný email nebo heslo |
| `noRefreshToken` | 401 | Chybí refresh token cookie |
| `refreshTokenInvalid` | 401 | Refresh token neplatný nebo expirovaný |
| `refreshTokenReuse` | 401 | Detekováno zneužití tokenu, všechny sessions zrušeny |
| `deviceAuthMissing` | 401 | Chybí HMAC hlavičky |
| `timestampExpired` | 401 | Timestamp mimo okno ±5 minut |
| `deviceNotFound` | 401 | Zařízení nenalezeno nebo neaktivní |
| `signatureInvalid` | 401 | HMAC podpis nesedí |
| `caregiverNotFound` | 422 | Cílový caregiver nenalezen nebo neaktivní |
| `rateLimitExceeded` | 429 | Příliš mnoho požadavků |
