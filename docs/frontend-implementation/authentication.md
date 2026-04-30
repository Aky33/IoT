# Autentizace a autorizace — Návod pro frontend

## Přehled

Backend používá dva autentizační mechanismy:

| Mechanismus | Kdo ho používá | Jak funguje |
|-------------|---------------|-------------|
| **JWT (Bearer token)** | Pečovatelé, Admini | Access token v hlavičce + refresh token v httpOnly cookie |
| **HMAC-SHA256** | IoT gateway | Device ID + timestamp + podpis v hlavičkách |

Frontend implementuje pouze **JWT autentizaci**. HMAC je záležitost gateway.

## Role

| Role | Popis | Jak vzniká |
|------|-------|------------|
| `admin` | Plný přístup — správa uživatelů, pečovatelů, zařízení, pozvánek | Seed script nebo invitation s `role: "admin"` |
| `caregiver` | Vidí svá zařízení, notifikace a přiřazené pacienty | Registrace s invitation kódem |

## Životní cyklus JWT tokenů

```
Login/Register
     ↓
Access token (15 min) + Refresh token cookie (7 dní)
     ↓ (access token vyprší)
POST /auth/refresh → nový access token + nový refresh cookie
     ↓ (refresh token vyprší po 7 dnech)
Uživatel se musí znovu přihlásit
```

### Access token

- Krátkodobý (výchozí 15 minut)
- Posílá se v hlavičce: `Authorization: Bearer <token>`
- Obsahuje: `sub` (ID caregivera), `email`, `role`
- **Nikdy neukládat do localStorage** (riziko XSS) — uchovávat v paměti (proměnná)

### Refresh token

- Dlouhodobý (7 dní)
- Uložen jako **httpOnly secure cookie** — JavaScript k němu nemá přístup
- Automaticky se posílá s požadavky na `/auth/*`
- **Rotuje se při každém refreshi** — starý token se zneplatní, vydá se nový
- **Detekce zneužití** — pokud někdo použije starý (rotovaný) token, VŠECHNY sessions se zruší

## Implementace

### 1. Přihlášení

```js
async function login(email, password) {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // DŮLEŽITÉ: odesílá a přijímá cookies
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error.message);
  }

  const { accessToken } = await res.json();
  // Uložit do paměti (NE do localStorage)
  setAccessToken(accessToken);
}
```

### 2. Registrace

```js
async function register(data) {
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      invitationCode: data.invitationCode,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    // Zpracování konkrétních chyb:
    // error.code === 'invitationInvalid' → neplatný kód
    // error.code === 'emailTaken' → email již existuje
    // error.code === 'weakPassword' → heslo příliš krátké
    throw new Error(error.message);
  }

  const { accessToken, caregiver } = await res.json();
  setAccessToken(accessToken);
  return caregiver;
}
```

### 3. Volání chráněných endpointů

```js
async function apiCall(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  });

  // Access token vypršel — zkusit refresh
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Zopakovat požadavek s novým tokenem
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });
    }
    // Refresh selhal — přesměrovat na login
    redirectToLogin();
    return;
  }

  return res;
}
```

### 4. Obnova tokenu (refresh)

```js
async function refreshToken() {
  const res = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include', // posílá refreshToken cookie
  });

  if (!res.ok) {
    // Refresh selhal — token expiroval nebo detekce zneužití
    setAccessToken(null);
    return false;
  }

  const { accessToken } = await res.json();
  setAccessToken(accessToken);
  return true;
}
```

### 5. Automatický refresh (interceptor)

Nastavte časovač pro obnovu tokenu před jeho expirací:

```js
// Dekódování JWT pro získání expirace (bez ověření — pouze čtení)
function getTokenExpiry(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000; // převod na ms
}

// Refresh 1 minutu před expirací
function scheduleRefresh(token) {
  const expiry = getTokenExpiry(token);
  const refreshAt = expiry - 60_000; // 1 min předem
  const delay = refreshAt - Date.now();

  if (delay > 0) {
    setTimeout(async () => {
      const success = await refreshToken();
      if (success) {
        scheduleRefresh(getAccessToken());
      }
    }, delay);
  }
}
```

### 6. Odhlášení

```js
async function logout() {
  // Zavřít SSE spojení (pokud je otevřené)
  if (sseSource) sseSource.close();

  // Odhlásit push notifikace
  await fetch('/push/unsubscribe', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Authorization': `Bearer ${getAccessToken()}` },
  });

  // Odhlásit se (smaže refresh cookie)
  await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  setAccessToken(null);
  redirectToLogin();
}
```

## Autorizace — co může která role

### Admin

| Zdroj | Vytvořit | Seznam | Detail | Editovat | Smazat |
|-------|----------|--------|--------|----------|--------|
| Uživatelé (pacienti) | ano | ano | ano | ano | ano |
| Pečovatelé | přes invitation | ano | ano | ano | ano |
| Zařízení | ano | ano (vše) | ano (vše) | ano | ano |
| Pozvánky | ano | ano | - | - | ano |
| Notifikace | - | ano (své) | - | - | - |
| Push subscription | ano | - | VAPID klíč | ano | - |

### Caregiver (pečovatel)

| Zdroj | Vytvořit | Seznam | Detail | Editovat | Smazat |
|-------|----------|--------|--------|----------|--------|
| Uživatelé (pacienti) | ne | ne | jen své | ne | ne |
| Pečovatelé | - | ne | ne | ne | ne |
| Zařízení | ne | jen svá | jen svá | ne | ne |
| Pozvánky | ne | ne | - | - | ne |
| Notifikace | - | jen své | - | - | - |
| Push subscription | ano | - | VAPID klíč | ano | - |
| SSE stream | ano | - | - | - | - |

"Jen své" znamená:
- **Zařízení:** filtrováno podle `caregiverId` přihlášeného uživatele
- **Uživatelé:** přístupné pouze pokud pečovatel má zařízení přiřazené k danému uživateli
- **Notifikace:** filtrováno podle `caregiverId`

### Rozlišení 401 vs 403 na frontendu

```js
if (res.status === 401) {
  // Neautentizovaný → zkusit refresh, pak přesměrovat na login
}

if (res.status === 403) {
  // Neautorizovaný → zobrazit "Přístup odepřen"
  // NEPŘESMĚROVÁVAT na login — uživatel JE přihlášen, nemá oprávnění
}
```

## Konfigurace refresh cookie

| Vlastnost | Hodnota | Účel |
|-----------|---------|------|
| `httpOnly` | `true` | JavaScript nemá přístup (ochrana proti XSS) |
| `secure` | `true` v produkci | Odesílá se pouze přes HTTPS |
| `sameSite` | `strict` | Neodesílá se při cross-site požadavcích (ochrana proti CSRF) |
| `path` | `/auth` | Odesílá se pouze na auth endpointy |
| `maxAge` | 7 dní | Automatická expirace |

## Bezpečnostní doporučení

1. **Nikdy neukládat access token do localStorage** — zranitelné vůči XSS. Používat proměnnou v paměti.
2. **Vždy používat `credentials: 'include'`** — nutné pro odesílání a přijímání cookies.
3. **Rozlišovat 401 a 403** — 401 = neautentizovaný (refresh/login), 403 = neautorizovaný (zobrazit hlášku).
4. **JWT dekódovat na klientu pouze pro UI** (zobrazení role, plánování refreshe) — nikdy na něm nezakládat autorizační rozhodnutí.
5. **Při odhlášení vyčistit vše** — access token, SSE spojení, push subscription.

## Zpracování chyb — rychlý přehled

```js
switch (error.code) {
  case 'unauthorized':
  case 'tokenExpired':
  case 'tokenInvalid':
    // Zkusit refresh, pak přesměrovat na login
    break;
  case 'refreshTokenReuse':
    // Bezpečnostní událost — vynutit okamžité přihlášení
    // Všechny sessions byly zrušeny
    break;
  case 'forbidden':
    // Zobrazit "Přístup odepřen" — uživatel je přihlášen, ale nemá oprávnění
    break;
  case 'invalidCredentials':
    // Zobrazit "Nesprávný email nebo heslo"
    break;
  case 'invitationInvalid':
    // Zobrazit "Neplatný invitation kód"
    break;
  case 'emailTaken':
    // Zobrazit "Email je již zaregistrován"
    break;
  case 'weakPassword':
    // Zobrazit "Heslo musí mít alespoň 8 znaků"
    break;
  case 'rateLimitExceeded':
    // Zobrazit "Příliš mnoho pokusů, zkuste to později"
    break;
}
```
