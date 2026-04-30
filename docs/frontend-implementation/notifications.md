# Notifikace — Návod pro frontend

## Přehled

Systém doručuje notifikace pečovatelům dvěma komplementárními kanály:

| Kanál | Účel | Funguje při zavřeném prohlížeči? |
|-------|------|----------------------------------|
| **Web Push** | Systémová notifikace (zvuk, vibrace) | Ano |
| **SSE** | Okamžitá aktualizace v aplikaci (toast, badge) | Ne — pouze při otevřené aplikaci |

### Proč dva kanály?

- **Web Push** zajistí, že pečovatel dostane upozornění i když nemá aplikaci otevřenou
- **SSE** poskytne okamžitou aktualizaci UI bez čekání na push notification round-trip (~1-3s)

### Použité technologie

| Technologie | Strana | Popis |
|-------------|--------|-------|
| Web Push API | Frontend | `PushManager.subscribe()`, Service Worker |
| VAPID | Backend | Identifikace serveru bez třetí strany (žádné Firebase) |
| `web-push` | Backend | npm balíček pro odesílání push notifikací |
| Server-Sent Events | Obě | Jednosměrný stream z backendu do prohlížeče přes HTTP |
| EventSource | Frontend | Vestavěné browser API pro SSE |

## Architektura

```
Gateway (HMAC) → POST /notifications/create
                        ↓
              notificationService
              ├─→ MongoDB (uložení)
              ├─→ Web Push (web-push knihovna → Service Worker v prohlížeči)
              └─→ SSE emit (EventEmitter → otevřená spojení)
```

Když pacient stiskne tlačítko:
1. Gateway pošle HMAC-podepsaný POST na backend
2. Backend vytvoří notifikaci v DB
3. Backend pošle Web Push (pokud má pečovatel pushSubscription)
4. Backend emituje SSE event (pokud má pečovatel otevřenou aplikaci)
5. Pečovatel vidí notifikaci — buď jako systémovou (push) nebo v UI (SSE)

---

## 1. Registrace Service Workeru

Service Worker je základ pro Web Push — běží na pozadí i při zavřeném tabu.

```js
// main.js — při startu aplikace
let swRegistration = null;

if ('serviceWorker' in navigator) {
  swRegistration = await navigator.serviceWorker.register('/sw.js');
  console.log('Service Worker zaregistrován:', swRegistration.scope);
}
```

Soubor `sw.js` musí být v root adresáři webu (nebo na cestě odpovídající scope).

---

## 2. Získání VAPID veřejného klíče

VAPID klíč identifikuje backend server vůči push službě prohlížeče. Frontend ho potřebuje pro `PushManager.subscribe()`.

```js
const res = await fetch('/push/vapid-public-key', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
});
const { vapidPublicKey } = await res.json();
```

VAPID klíč se nemění — stačí ho získat jednou a uložit.

---

## 3. Přihlášení k push notifikacím

### 3.1 Vyžádání povolení

```js
const permission = await Notification.requestPermission();

if (permission === 'denied') {
  // Uživatel zakázal notifikace — zobrazit varování
  return;
}

if (permission === 'default') {
  // Uživatel se ještě nerozhodl
  return;
}
```

### 3.2 Vytvoření push subscription

```js
// Pomocná funkce pro konverzi VAPID klíče
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const subscription = await swRegistration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
});
```

### 3.3 Odeslání subscription na backend

```js
await fetch('/push/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  credentials: 'include',
  body: JSON.stringify(subscription),
});
```

Backend uloží subscription do `caregiver.pushSubscription` a při každé nové notifikaci pošle push přes `web-push` knihovnu.

---

## 4. Service Worker — zpracování push eventů

Soubor `sw.js` v root adresáři:

```js
// sw.js

// Příchozí push notifikace
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'Nová notifikace',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.notificationId,
    data: { notificationId: data.notificationId, type: data.type },
  };

  // Urgentní notifikace — vyžaduje interakci, vibruje
  if (data.type === 'urgent') {
    options.requireInteraction = true;
    options.vibrate = [200, 100, 200, 100, 200];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'IoT Care', options)
  );
});

// Kliknutí na notifikaci — otevře aplikaci
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/notifications')
  );
});
```

### Formát push payload (co přijde do `sw.js`)

```json
{
  "title": "URGENTNÍ ALERT",
  "body": "Zařízení: Tlačítko obývák",
  "type": "urgent",
  "notificationId": "664a1b..."
}
```

Pro `standard` typ je title `"Nová notifikace"`, pro `urgent` je `"URGENTNÍ ALERT"`.

---

## 5. SSE — Aktualizace v reálném čase

SSE poskytuje okamžité aktualizace, když má pečovatel aplikaci otevřenou. Připojit po přihlášení:

```js
// EventSource nepodporuje vlastní hlavičky.
// JWT token se předává jako query parametr.
const source = new EventSource(
  `/notifications/stream?token=${accessToken}`
);

source.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Zobrazit toast, aktualizovat počet nepřečtených, přehrát zvuk atd.
  console.log('Nová notifikace:', notification);
};

source.onerror = () => {
  // EventSource se automaticky pokusí o znovu připojení
  console.warn('SSE spojení přerušeno, znovu se připojuji...');
};
```

### Formát SSE eventu

```json
{
  "id": "664a1b...",
  "type": "urgent",
  "deviceName": "Tlačítko obývák",
  "createdAt": "2026-04-29T10:30:00.000Z"
}
```

### Jak SSE funguje

1. Frontend otevře HTTP spojení přes `EventSource`
2. Backend drží spojení otevřené
3. Když přijde nová notifikace, backend pošle data přes toto spojení
4. Frontend přijme event okamžitě (žádné pollování)
5. Při odpojení se `EventSource` automaticky pokusí o reconnect

### Omezení SSE

- Funguje pouze při otevřené aplikaci (zavřený tab = odpojení)
- Prohlížeč má limit ~6 souběžných HTTP/1.1 spojení na doménu (jedno zabere SSE)
- S HTTP/2 tento limit neplatí (multiplexing)

---

## 6. Odhlášení z notifikací

Při logoutu vyčistit oba kanály:

```js
// Zavřít SSE spojení
source.close();

// Odhlásit push subscription na backendu
await fetch('/push/unsubscribe', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  credentials: 'include',
});
```

---

## 7. Zpracování vypnutých notifikací

Kontrolovat stav povolení při každém načtení aplikace:

```js
if (Notification.permission === 'denied') {
  // Zobrazit trvalý banner:
  // "Notifikace jsou vypnuté. Můžete přijít o urgentní alerty."
  // + odkaz na návod jak je v prohlížeči znovu zapnout
}

if (Notification.permission === 'default') {
  // Uživatel se ještě nerozhodl — zobrazit vysvětlení
  // proč jsou notifikace důležité pro tento systém péče
}
```

### Doporučený UX flow

```
1. Uživatel se přihlásí
2. Kontrola Notification.permission
   ├─ 'granted' → registrace push subscription (automaticky)
   ├─ 'default' → zobrazit dialog s vysvětlením → requestPermission()
   └─ 'denied' → zobrazit trvalý banner s varováním
3. Otevření SSE spojení (nezávisle na push)
```

---

## 8. Kompletní inicializace notifikací

Příklad funkce, která inicializuje oba kanály po přihlášení:

```js
let sseSource = null;

async function initNotifications(accessToken) {
  // 1. SSE — vždy (pokud je aplikace otevřená, chceme live updates)
  sseSource = new EventSource(`/notifications/stream?token=${accessToken}`);
  sseSource.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    showToast(notification);
    updateBadgeCount();
  };

  // 2. Web Push — pokud je Service Worker podporován
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Web Push není podporován v tomto prohlížeči');
    return;
  }

  // 3. Registrace Service Workeru
  const registration = await navigator.serviceWorker.register('/sw.js');

  // 4. Kontrola existující subscription
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    // Subscription již existuje — synchronizovat s backendem
    await fetch('/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(existing),
    });
    return;
  }

  // 5. Vyžádat povolení a vytvořit novou subscription
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const res = await fetch('/push/vapid-public-key', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const { vapidPublicKey } = await res.json();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  await fetch('/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify(subscription),
  });
}

// Volat po úspěšném loginu
await initNotifications(accessToken);
```

---

## 9. Rozdíl mezi standard a urgent notifikacemi

| Vlastnost | Standard | Urgent |
|-----------|----------|--------|
| Push title | "Nová notifikace" | "URGENTNÍ ALERT" |
| Vibrace | Ne | Ano (200-100-200-100-200 ms) |
| Vyžaduje interakci | Ne (zmizí po chvíli) | Ano (`requireInteraction: true`) |
| SSE formát | Stejný | Stejný (typ je v poli `type`) |

Na frontendu můžete rozlišit typ a zobrazit jiný styl toastu:

```js
source.onmessage = (event) => {
  const notification = JSON.parse(event.data);

  if (notification.type === 'urgent') {
    showUrgentAlert(notification);
    playAlarmSound();
  } else {
    showInfoToast(notification);
  }
};
```

---

## Souhrn API endpointů pro notifikace

| Endpoint | Metoda | Popis |
|----------|--------|-------|
| `/push/vapid-public-key` | GET | Získání VAPID veřejného klíče |
| `/push/subscribe` | POST | Uložení push subscription |
| `/push/unsubscribe` | DELETE | Odebrání push subscription |
| `/notifications/stream` | GET | SSE stream (token přes `?token=`) |
| `/notifications/all` | GET | Seznam notifikací (stránkovaný, s filtrem `?deviceId=`) |
| `/notifications/create` | POST | Vytvoření notifikace (pouze gateway, HMAC) |

Detailní popis endpointů viz [endpoints.md](endpoints.md).
