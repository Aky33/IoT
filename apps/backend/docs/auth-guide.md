# Autentizace & Workflow

Popis autentizačních mechanismů, registrační flow s pozvánkami a testování.

## Dvě autentizační vrstvy

| Vrstva            | Kdo                      | Metoda                          | Middleware                         |
| ----------------- | ------------------------ | ------------------------------- | ---------------------------------- |
| Caregiver / Admin | mobilní app, admin panel | JWT (access + refresh token)    | `authenticate` → `authorize(role)` |
| IoT Device        | fyzické tlačítko         | HMAC-SHA256 (pre-shared secret) | `authenticateDevice`               |

## JWT (Caregiver / Admin)

### Tokeny

- **Access token** — krátký (15 min), v response body jako JSON. Klient ho posílá v `Authorization: Bearer <token>` headeru.
- **Refresh token** — dlouhý (7 dní), v httpOnly cookie (`refreshToken`). Klient ho nevidí v JS (XSS ochrana). Automaticky se posílá s requesty na `/auth/*`.

### Token rotation

Při každém `POST /auth/refresh`:

1. Starý refresh token se invaliduje (smaže z DB).
2. Expired tokeny se pročistí.
3. Nový refresh + access token se vydá.

Pokud někdo použije již rotovaný token (reuse detection), všechny sessions daného uživatele se revokují.

### Hesla

Hashované přes `bcryptjs` (10 salt rounds). Plaintext heslo se nikdy neukládá ani neloguje. Minimální délka: 8 znaků.

### Role

- `caregiver` — default při registraci. Přístup k vlastním endpointům (budoucí).
- `admin` — správa uživatelů, zařízení, pečovatelů, pozvánek. Vytvořen přes seed script nebo povýšen existujícím adminem.

## HMAC (IoT Device)

Každé zařízení má `deviceSecret` (generovaný při create, 32 bytes hex). Request musí obsahovat 3 headery:

```
X-Device-Id:   <MongoDB ObjectId zařízení>
X-Timestamp:   <Unix timestamp v sekundách>
X-Signature:   HMAC-SHA256(deviceSecret, "METHOD|URL|TIMESTAMP|BODY")
```

Backend ověří:

1. Timestamp je v okně ±5 minut (prevence replay attacks).
2. Device existuje a je aktivní.
3. HMAC signature sedí (constant-time porovnání).

### Generování HMAC (příklad pro IoT firmware / testování)

```javascript
const crypto = require('crypto');

const deviceId = '...';
const deviceSecret = '...';
const timestamp = Math.floor(Date.now() / 1000).toString();
const body = JSON.stringify({ type: 'standard' });
const payload = `POST|/notifications/create|${timestamp}|${body}`;
const signature = crypto.createHmac('sha256', deviceSecret).update(payload).digest('hex');

// Odeslat:
// X-Device-Id: <deviceId>
// X-Timestamp: <timestamp>
// X-Signature: <signature>
```

## Registrace s pozvánkami

Registrace je uzavřená — vyžaduje pozvánkový kód od admina.

### Flow

```
Admin                              Pečovatel
  │                                    │
  │  POST /invitations/create          │
  │  { "ttlHours": 48 }               │
  │  → { "code": "A3F7B2C1" }         │
  │                                    │
  │  sdílí kód (SMS, email, ústně)     │
  │ ──────────────────────────────────►│
  │                                    │
  │                                    │  POST /auth/register
  │                                    │  { ..., "invitationCode": "A3F7B2C1" }
  │                                    │  → { "accessToken": "...", "caregiver": {...} }
  │                                    │
  │                                    │  Kód je jednorázový, po použití expiruje.
```

### Pozvánka

- Kód: 8 znaků hex (uppercase), generovaný `crypto.randomBytes(4)`.
- TTL: nastavitelný při vytvoření (`ttlHours`, default 24 hodin).
- Jednorázový: po registraci se označí jako použitý.
- MongoDB TTL index automaticky maže expired nepoužité pozvánky.
- Použité pozvánky zůstávají v DB jako audit trail.

### Admin endpointy pro pozvánky

| Metoda | URL                       | Akce                                            |
| ------ | ------------------------- | ----------------------------------------------- |
| POST   | `/invitations/create`     | Vytvoří pozvánku (`ttlHours`, volitelně `role`) |
| GET    | `/invitations/all`        | Aktivní (nepoužité) pozvánky                    |
| DELETE | `/invitations/revoke/:id` | Zruší nepoužitou pozvánku                       |

## Přístupová matice

| Endpoint              | Auth           | Role  |
| --------------------- | -------------- | ----- |
| `POST /auth/register` | pozvánkový kód | —     |
| `POST /auth/login`    | email + heslo  | —     |
| `POST /auth/refresh`  | refresh cookie | —     |
| `POST /auth/logout`   | refresh cookie | —     |
| `GET /health`         | —              | —     |
| `/invitations/*`      | JWT            | admin |
| `/users/*`            | JWT            | admin |
| `/caregivers/*`       | JWT            | admin |
| `/devices/*`          | JWT            | admin |
| `/notifications/*`    | HMAC device    | —     |

## Setup

### 1. Env proměnné

```env
JWT_ACCESS_SECRET=random-64-char-string
JWT_REFRESH_SECRET=different-random-64-char-string
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

Vygenerovat secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. První admin

```bash
npm run seed:admin -- --email admin@example.com --password securePass123
```

Nebo s plným jménem:

```bash
npm run seed:admin -- --email admin@example.com --password securePass123 --firstName Jan --lastName Novák
```

Script buď vytvoří nového admina, nebo povýší existujícího caregivera.

### 3. Onboarding flow

```bash
# 1. Start
npm run setup && npm run dev

# 2. Seed admin
npm run seed:admin -- --email admin@example.com --password securePass123

# 3. Admin login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"securePass123"}'
# → zapamatuj accessToken

# 4. Vytvoř pozvánku
curl -X POST http://localhost:3000/invitations/create \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"ttlHours": 48}'
# → zapamatuj code

# 5. Vytvoř pacienta
curl -X POST http://localhost:3000/users/create \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jan","lastName":"Novák","notes":"Diabetik"}'
# → zapamatuj userId

# 6. Pečovatel se zaregistruje (s kódem)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Marie","lastName":"Nováková","email":"marie@example.com","password":"securePass123","invitationCode":"<code>"}'
# → zapamatuj caregiverId

# 7. Admin vytvoří zařízení (propojí pacienta + pečovatele)
curl -X POST http://localhost:3000/devices/create \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<userId>","caregiverId":"<caregiverId>","name":"Tlačítko obývák","type":"button","status":"active"}'
# → zapamatuj deviceId, přečti deviceSecret z DB

# 8. IoT zařízení pošle notifikaci (HMAC)
# → viz sekce "Generování HMAC" výše
```

## Testování

### Automatické testy

```bash
# Unit + component testy (bez DB)
npm test

# Integrační testy (vyžaduje běžící MongoDB)
npm run db:up
npm run test:integration
```

Testy pokrývají:

- **Unit**: error třídy, cleanJson plugin
- **Component**: authenticate (valid/expired/missing token), authorize (role check), errorHandler (AppError/CastError/duplicate key)
- **Integration**: celý auth flow (admin seed → login → create invitation → register s kódem → reuse detection → refresh rotation → logout)

### Insomnia (manuální API testování)

**Import:** File → Import → `apps/backend/tests/insomnia/insomnia-collection.json`

**Workflow v Insomnia (v pořadí):**

1. **Login** (admin credentials ze seed scriptu) → `accessToken` se auto-nastaví
2. **Create Invitation** → `invitationCode` se auto-nastaví
3. **Register** (s kódem) → `accessToken` se přepíše na nového caregivera
4. **Login** (znovu jako admin) → `accessToken` zpět na admina
5. **Create User** → `userId` se auto-nastaví
6. **Create Caregiver** → `caregiverId` se auto-nastaví (nebo použij ID z registrace)
7. **Create Device** → `deviceId` se auto-nastaví
8. Manuálně: zkopíruj `deviceSecret` z DB do Insomnia env
9. **Create Notification** → HMAC headers se auto-generují z pre-request scriptu

**Environment proměnné (Ctrl+E):**

```json
{
  "baseUrl": "http://localhost:3000",
  "accessToken": "",
  "invitationCode": "",
  "userId": "",
  "caregiverId": "",
  "deviceId": "",
  "deviceSecret": ""
}
```

Všechny hodnoty kromě `deviceSecret` se doplňují automaticky přes after-response scripty. `deviceSecret` se musí zkopírovat z DB (`select: false` — API ho nevrací):

```bash
docker exec iot-care-mongo mongosh --quiet --eval \
  "use('iot-care'); db.devices.findOne({}, {deviceSecret:1})"
```

## Bezpečnostní rozhodnutí

| Rozhodnutí                                                 | Důvod                                                      |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| Access token 15 min                                        | Krátký lifetime minimalizuje dopad úniku                   |
| Refresh v httpOnly cookie                                  | JavaScript nemá přístup → XSS odolný                       |
| Refresh token rotation                                     | Použitý token = invalidní → ukradený starý token nefunguje |
| Reuse detection                                            | Použití rotovaného tokenu → revokace všech sessions        |
| `algorithms: ['HS256']` v jwt.verify                       | Prevence algorithm confusion attack                        |
| `select: false` na passwordHash/refreshTokens/deviceSecret | Citlivá pole se nevrací v API response                     |
| `crypto.timingSafeEqual` pro HMAC                          | Prevence timing attack                                     |
| Registrace jen s pozvánkou                                 | Uzavřený systém — nikdo se neregistruje bez vědomí admina  |
| Role hardcoded při registraci                              | Prevence self-promotion na admin                           |
| Timestamp window ±5 min                                    | Prevence replay attack na HMAC                             |
