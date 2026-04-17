# IoT Care Button Backend

Backend API pro IoT asistenční tlačítko. Osoba se sníženou mobilitou zmáčkne fyzické tlačítko a systém odešle push notifikaci pečující osobě do mobilní aplikace.

- **Standard** notifikace — krátký stisk, 5s odpočet s možností zrušení.
- **Urgent** notifikace — dlouhý stisk, okamžité odeslání prioritním kanálem.

## Tech Stack

Node.js (ES modules) · Express.js 5 · MongoDB (Mongoose) · Docker (pro lokální Mongo) · Vitest + supertest (testy).

Push-notifikační vrstva zatím není rozhodnuta — v kostře se neřeší.

## Quick Start

Předpoklady: Node.js 18+, Docker Desktop (nebo OrbStack).

```bash
npm install
npm run setup   # vytvoří .env a nastartuje Mongo v Dockeru
npm run dev     # spustí server na http://localhost:3000
```

Ověření běhu: `curl http://localhost:3000/health` → `{"status":"ok",...}`.

Podrobný popis příkazů, env proměnných a troubleshootingu je v [docs/setup-guide.md](docs/setup-guide.md).

## Co je v kostře — stav

**Datový model** (`src/models/`) je **finální**, odpovídá specifikaci projektu. User je jako jediný resource implementovaný end-to-end (route → controller → DAO → model) a slouží jako **referenční vzor** pro Caregiver, Device a Notification.

**Ostatní vrstvy** (service layer, rate limiting, testy, pagination helpers, dtoIn validace, …) jsou připravené jako **šablony** (soubory označené `TEMPLATE` v hlavičce) — ukazují best-practice strukturu. 

Kompletní mapa vrstev, kontraktů, patternů a návod „jak přidat nový resource" je v [docs/project-structure.md](docs/project-structure.md).

## Dokumentace

- [docs/setup-guide.md](docs/setup-guide.md) — setup, denní příkazy, env proměnné, porty, troubleshooting
- [docs/project-structure.md](docs/project-structure.md) — rozpis vrstev, tok requestu, template patterny (service, rate limit, pagination, soft delete, request ID, testy), návod na přidání resource
- [docs/git-workflow.md](docs/git-workflow.md) — branch naming (Conventional Branch), commit messages (Conventional Commits), pull requesty
