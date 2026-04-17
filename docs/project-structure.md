# Project Structure

Dokument popisuje strukturu repozitáře — co která složka obsahuje a jakou má odpovědnost.

## Tok requestu

```text
HTTP request
    │
    ▼
┌───────────────┐     middleware/requestId.js
│  requestId    │     — generuje X-Request-Id, ukládá do req.id
└───────┬───────┘     — echoem zpět v response headeru
        │
        ▼
┌───────────────┐     cors, json body parser, morgan (s req.id)
│   core mw     │
└───────┬───────┘
        │
        ▼
┌───────────────┐     routes/<resource>.js
│    Router     │     — URL + HTTP metoda
└───────┬───────┘     — řetězí validateBody + rateLimit + controller
        │
        ▼
┌───────────────┐     middleware/validateBody.js
│ validateBody  │     — validace req.body proti JSON schématu
└───────┬───────┘     — vyhodí ValidationError
        │
        ▼
┌───────────────┐     controllers/<resource>Controller.js
│  Controller   │     — HTTP ↔ doména
└───────┬───────┘     — volá repository (CRUD) nebo service (orchestrace)
        │
        ▼
┌───────────────┐     services/<resource>Service.js
│   Service     │     — orchestrace napříč entitami
└───────┬───────┘     — validace invariantů, side effects
        │
        ▼
┌───────────────┐     repositories/<resource>Repository.js
│  Repository   │     — jediný touchpoint s Mongoose modelem
└───────┬───────┘     — pagination, soft-delete filtry
        │
        ▼
┌───────────────┐     models/<Resource>.js
│    Mongoose   │     — schema, validace na úrovni DB, indexy, toJSON
└───────┬───────┘
        │
        ▼
     MongoDB

Error flow:
  controller/service vyhodí AppError (nebo subclass)
    → middleware/errorHandler.js
    → JSON chyba s req.id
```

## Vrstvy

### [src/routes/](../src/routes/) — Express Router

Definice URL cest a HTTP metod, zřetězení middleware → controller. Jeden soubor per resource. URL patterny dodržují REST konvence.

REST CRUD vzor pro každý resource:

| Metoda | URL               | Akce                      |
| ------ | ----------------- | ------------------------- |
| POST   | `/<resource>`     | create                    |
| GET    | `/<resource>`     | list (`?page=&pageSize=`) |
| GET    | `/<resource>/:id` | read                      |
| PUT    | `/<resource>/:id` | update                    |
| DELETE | `/<resource>/:id` | soft delete (204)         |

### [src/controllers/](../src/controllers/) — HTTP handlers

Převod HTTP requestu na volání repository nebo service, mapování výsledku na HTTP response. Vyhazování `NotFoundError` / `ValidationError` při business chybách.

Jeden soubor per resource, exportuje objekt `<resource>Controller`. Metody: `create`, `list`, `get`, `update`, `remove`. Signatura `(req, res)` — bez `next`, Express 5 chytá async rejekce automaticky.

### [src/services/](../src/services/) — Orchestrace

Operace, které sahají do více entit — typicky notifikační flow (ověřit Device, načíst Caregiver, založit Notification, poslat push, update status). Pro ryzí CRUD (User, Caregiver, Device) vrstva není potřeba, controller volá repository přímo.

Služby neznají Express objekty (req/res) — berou a vrací plain data, jsou unit-testovatelné bez HTTP.

### [src/repositories/](../src/repositories/) — Data access

Jediné místo, kde se volá Mongoose model. Jeden soubor per resource, exportuje objekt `<resource>Repository`.

Konvenční metody:

- `create(data)` — insert
- `findById(id)` — single (respektuje soft-delete filtr)
- `findMany(pageInfo)` — paginovaný list
- `findBy<Relation>(id, pageInfo)` — paginovaný list podle vazby
- `update(id, data)` — update
- `remove(id)` — soft delete

Metody vrací plain objekty, ne Mongoose dokumenty (`doc.toJSON()` aplikuje `cleanJson` plugin → `id` místo `_id`, bez `__v`).

### [src/validation/](../src/validation/) — Request body schémata

JSON-schema-like objekty popisující tvar `req.body` pro mutující operace. Konzumuje je `validateBody` middleware.

### [src/models/](../src/models/) — Mongoose schémata

Datové modely (User, Caregiver, Device, Notification). Obsahují:

- **`cleanJson` plugin** — uniformní JSON serializace (`_id` → `id`, bez `__v`).
- **Indexy** — single-key na cizí klíče a `isActive`, compound na `{ fk: 1, createdAt: -1 }` pro listy.
- **Unique + sparse** — `Caregiver.email`, `Device.macAddress`.
- **Format validation** — regex pattern pro email, phone, macAddress.
- **TTL index na Notification** — Mongo automaticky maže notifikace starší než 365 dní.

### [src/middleware/](../src/middleware/) — Express middleware

- [errorHandler.js](../src/middleware/errorHandler.js) — centrální error handler (4 argumenty). Loguje s `req.id`, serializuje `AppError` do `{error:{code,message,details}}`.
- [requestId.js](../src/middleware/requestId.js) — přiřadí UUID každému requestu, echo v `X-Request-Id` headeru.
- [validateBody.js](../src/middleware/validateBody.js) — validace `req.body` proti schématu.
- [rateLimit.js](../src/middleware/rateLimit.js) — factory funkce (`notificationsRateLimit`, `writeRateLimit`) postavené na `express-rate-limit`. Aplikují se per-route.

### [src/errors/](../src/errors/) — Custom error classes

`AppError` base třída + specializace (`ValidationError`, `NotFoundError`). Každá třída nese `code`, `message`, `details`, `status`.

### [src/config/](../src/config/) — Configuration

Načtení env proměnných do jednoho typed objektu (`config.port`, `config.mongoUri`). Controllery a repositories importují `config`, nikdy nečtou `process.env` přímo.

### [src/utils/](../src/utils/) — Helper utility

Pure funkce napříč vrstvami. Obsahuje `mongoosePlugins.js` s `cleanJson` pluginem.

### [src/app.js](../src/app.js) a [src/server.js](../src/server.js)

- **`app.js`** — `createApp()` factory vytváří Express aplikaci, registruje middleware a routery. Nespouští server — je importovatelná pro testy.
- **`server.js`** — entry point: připojí MongoDB, importuje `createApp()`, spustí `app.listen()`, ošetří SIGINT/SIGTERM.

### [tests/](../tests/) — Testy

Vitest + supertest. Testy importují `createApp()` a hitují in-process. Konvence: `tests/<resource>.test.js`.

## Response shape

### Single resource

```json
{
  "id": "...",
  "firstName": "Jan",
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### List with pagination

```json
{
  "data": [ { }, { } ],
  "meta": { "page": 1, "pageSize": 50, "total": 137 }
}
```

### Error

```json
{
  "error": {
    "code": "notFound",
    "message": "User not found.",
    "details": { "id": "..." }
  }
}
```

## Pagination

Repository `findMany` přijímá `{ page, pageSize }` a vrací `{ data, meta: { page, pageSize, total } }`. Controller parsuje `page` a `pageSize` z `req.query`. Repository clampuje pageSize na max 200.

## Soft delete

User, Caregiver, Device používají soft delete:

- `remove(id)` nastaví `isActive: false`.
- `findById()`, `findMany()`, `update()` filtrují `{ isActive: true }`.
- Notifikace odkazující na deaktivovanou entitu zůstávají platné (historie neporušena).

Notification používá hard delete přes TTL index (365 dní).

## HTTP status kódy

- `200` — GET, PUT úspěch
- `201` — POST úspěch (create)
- `204` — DELETE úspěch (soft delete, no body)
- `400` — `ValidationError`
- `404` — `NotFoundError`
- `429` — rate limit exceeded
- `500` — nečekaná chyba
- `503` — DB odpojená (health check)

## Logging

Morgan format: `:id :method :url :status :response-time ms - :res[content-length]`. První pole je `req.id` z `requestId` middleware, umožňuje korelaci mezi access logem, error logem a `requestId` v 500 response.

## Validace

Validace probíhá na dvou místech:

1. **[src/validation/](../src/validation/)** — JSON schémata pro `req.body`, konzumuje `validateBody`.
2. **[src/models/](../src/models/)** — Mongoose validace (required, maxlength, enum, regex) jako poslední obrana na DB úrovni.

## Pojmenování

- **Soubory:** camelCase (`userController.js`, `userRepository.js`), PascalCase pro modely (`User.js`).
- **Exporty:** named (`export const userRepository = { ... }`), žádný `export default`.
- **Mongoose modely:** PascalCase singular (`User`, `Caregiver`).
- **Routes (URL + folder):** lowercase plural (`/users`, `/caregivers`).
- **DB kolekce:** Mongoose pluralizuje sám (`users`, `caregivers`).
- **Error třídy:** PascalCase s suffixem `Error`.
- **Test soubory:** `tests/<resource>.test.js`.
