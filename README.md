# IoT Care Button — Monorepo

IoT asistenční tlačítko. Osoba se sníženou mobilitou zmáčkne fyzické tlačítko a systém odešle push notifikaci pečující osobě.

## Apps

- [apps/backend](apps/backend) — Node.js / Express backend API (user/caregiver/device management + notifikace)

Další aplikace (mobile, web admin, firmware) přidáváme pod `apps/`.

## Quick Start

Předpoklady: Node.js 18+, Docker Desktop (nebo OrbStack).

```bash
npm install
npm run setup   # vytvoří backend .env a nastartuje Mongo v Dockeru
npm run dev     # spustí backend server na http://localhost:3000
```

Všechny root scripty (`dev`, `test`, `db:up`, …) interně delegují na příslušný workspace.

Detail (env proměnné, porty, troubleshooting) v [apps/backend/docs/setup-guide.md](apps/backend/docs/setup-guide.md).

## Dokumentace

Repo-level:

- [docs/git-workflow.md](docs/git-workflow.md) — branching (Conventional Branch), commit messages (Conventional Commits), pull requesty

Backend-specific:

- [apps/backend/docs/setup-guide.md](apps/backend/docs/setup-guide.md) — setup, denní příkazy, env proměnné, porty, troubleshooting
- [apps/backend/docs/project-structure.md](apps/backend/docs/project-structure.md) — rozpis vrstev, tok requestu, response shapes, pojmenování

## Struktura repozitáře

```text
.
├── apps/
│   └── backend/            # Node.js/Express API
├── docs/                   # cross-cutting docs (git workflow, …)
├── .github/                # PR template, repo-level
├── eslint.config.js        # sdílené linting pro celý monorepo
├── .prettierrc.json        # sdílený formátovací styl
├── package.json            # npm workspaces root
└── README.md
```

## NPM workspaces

Repo používá nativní npm workspaces. Sdílené dev dependencies (ESLint, Prettier) jsou v root `package.json`. Per-app dependencies (express, mongoose, vitest, …) jsou v `apps/<app>/package.json`.

Konkrétní commandy pro jeden workspace:

```bash
npm run dev --workspace @iot/backend
npm install some-dep --workspace @iot/backend
```

Root commandy `npm run dev`, `npm test` atd. jsou delegace na backend workspace.
