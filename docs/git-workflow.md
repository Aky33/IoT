# Git Workflow

Pravidla pro týmovou spolupráci nad repozitářem. Vychází ze dvou standardů:

- **Conventional Commits v1.0.0** — [conventionalcommits.org](https://www.conventionalcommits.org/en/v1.0.0/)
- **Conventional Branch** — [conventional-branch.github.io](https://conventional-branch.github.io/)

## Branching strategy

Pracujeme v jednoduchém **GitHub Flow** modelu:

- `main` je vždy stabilní a nasaditelná.
- Žádná práce se na `main` necommituje přímo — veškeré změny jdou přes feature větev a pull request.
- Feature větev = krátkodobá (typicky do týdne), po merge se mazat.

### Pojmenování větví

Formát: `<prefix>/<krátký-popis-kebab-case>`

Povolené prefixy:

- `feature/` (nebo `feat/`) — nová funkčnost
- `bugfix/` (nebo `fix/`) — oprava chyby
- `hotfix/` — urgentní oprava produkce
- `release/` — přípravná větev pro release (`release/v1.2.0`)
- `chore/` — údržba, závislosti, konfigurace, dokumentace bez změny chování

Pravidla názvu:

- pouze malá písmena, číslice, pomlčky a tečky
- bez podtržítek, bez velkých písmen
- bez počátečních a koncových pomlček/teček
- bez dvou pomlček/teček za sebou

Příklady:

```text
feature/user-crud
feat/notifications-create-endpoint
fix/mongoose-validation-error
bugfix/device-battery-range
hotfix/mongo-connection-leak
chore/update-mongoose-v8
release/v0.2.0
```

Neplatné:

```text
Feature/UserCrud          # velká písmena
fix_memory_leak           # podtržítka
feat/-login               # začíná pomlčkou
feat/user--login          # dvě pomlčky vedle sebe
```

## Commit messages

Formát dle Conventional Commits:

```text
<type>[(scope)]: <popis>

[nepovinné body]

[nepovinný footer]
```

### Typy

- `feat` — nová funkčnost (inkrementuje MINOR verzi)
- `fix` — oprava bugu (inkrementuje PATCH verzi)
- `docs` — změny pouze v dokumentaci
- `style` — formátování, bez dopadu na chování (whitespace, středníky)
- `refactor` — refactoring bez změny chování
- `perf` — optimalizace výkonu
- `test` — přidání nebo úprava testů
- `chore` — build, tooling, závislosti
- `revert` — revert předchozího commitu

### Scope

Nepovinný kontext v závorkách — obvykle resource nebo modul:

- `feat(users): add dtoIn validation for create endpoint`
- `fix(notifications): correct status enum value`
- `chore(deps): bump mongoose to 8.9.0`

### Popis

- rozkaz v přítomném čase, malým písmenem (`add`, `fix`, `remove` — ne `added`, `fixing`)
- max ~72 znaků na první řádek
- bez tečky na konci první řádky


## Pracovní tok

1. **Sync s `main`**

   ```bash
   git switch main
   git pull --ff-only
   ```

2. **Vytvoř feature větev**

   ```bash
   git switch -c feat/users-create
   ```

3. **Commituj po malých logických celcích** — každý commit má dávat smysl i samostatně.

4. **Sync `main` do větve průběžně** (pokud tam padají změny):

   ```bash
   git fetch origin
   git rebase origin/main    # přepiš historii větve nad aktuální main
   ```

   > Rebase jen na _vlastních_ větvích, co ještě nikdo jiný nepoužívá. Na sdílených větvích používej `git merge`.

5. **Pushni a otevři Pull Request**

   ```bash
   git push -u origin feat/users-create
   ```

6. **Code review** — minimálně 1 schválení před merge. Review reaguje na:
   - funkčnost proti zadání projektu
   - validační vzor dodržen (validateDtoIn, error formát)
   - žádné commitnuté secrets ani `.env`
   - commit messages dle konvence

7. **Merge do `main`** — preferovaně **Squash & Merge** (jeden čistý commit v historii main). Po mergi smaž vzdálenou větev.

## Zakázané operace

- `git push --force` na `main` — nikdy.
- `git push --force` na sdílené větvě — jen pokud je domluveno s týmem.
- Přímý commit do `main` — vždy přes PR.
- Commit `.env`, credentials, binárních buildů, `node_modules/`.

## Konvence PR

Titulek PR kopíruje formát Conventional Commit (usnadní to Squash & Merge):

```text
feat(notifications): implement create endpoint with FCM stub
```

Tělo PR má mít alespoň:

- **Co se mění** — stručný popis v bodech
- **Proč** — odkaz na user story nebo issue
- **Jak to testovat** — curl příkazy nebo postup v UI

## Lokální nastavení (doporučené)

### Konfigurace jména a emailu

```bash
git config user.name "Jméno Příjmení"
git config user.email "email@example.com"
```

### Rychlé aliasy

```bash
git config alias.st "status -sb"
git config alias.co "switch"
git config alias.cob "switch -c"
git config alias.last "log -1 HEAD --stat"
```

### Pre-push hook (volitelné)

Pro lokální validaci jména větve a commit message — viz příklad na [conventional-branch.github.io](https://conventional-branch.github.io/).
