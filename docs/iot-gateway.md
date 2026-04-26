# IoT Gateway

## Popis

Gateway je softwarová komponenta běžící na PC (nebo RaspberryPi), která slouží jako prostředník mezi IoT Node a cloud backendem. Přijímá button eventy z IoT zařízení přes MQTT, okamžitě je přeposílá do cloudu přes HTTPS a vrací potvrzení o doručení zpět na IoT Node (LED feedback).

## Platforma

Gateway běží v rámci HARDWARIO Playground, který bundluje:

| Komponenta              | Účel                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| bcg service             | Bridge: USB serial ↔ MQTT (překládá zprávy z IoT Node na MQTT topics) |
| MQTT broker (Mosquitto) | Message broker pro interní komunikaci                                 |
| Node-RED                | Flow-based runtime pro zpracování eventů                              |
| Firmware flasher        | Nahrávání firmware do IoT Node                                        |

## Komunikační řetězec (obousměrný)

```text
ODESÍLÁNÍ (IoT Node → Cloud):
  IoT Node ──USB/UART──▶ bcg ──▶ MQTT broker ──▶ Node-RED ──HTTPS──▶ Cloud

POTVRZENÍ (Cloud → IoT Node):
  Cloud ──HTTP response──▶ Node-RED ──MQTT pub──▶ bcg ──serial──▶ IoT Node (LED)
```

Node-RED nečte serial port přímo. Používá MQTT In node s topic `node/#`.

## MQTT topics

### Vstupní (z IoT Node přes bcg)

| Topic                      | Payload                | Popis                                   |
| -------------------------- | ---------------------- | --------------------------------------- |
| `node/{id}/button/-/event` | `{"type": "standard"}` | Standardní notifikace (po 5s countdown) |
| `node/{id}/button/-/event` | `{"type": "urgent"}`   | Urgentní notifikace (okamžitá)          |

### Výstupní (zpět na IoT Node přes bcg)

| Topic                 | Payload                | Popis                                  |
| --------------------- | ---------------------- | -------------------------------------- |
| `node/{id}/led/-/set` | `{"state": "success"}` | Cloud přijal notifikaci → LED solid 3s |
| `node/{id}/led/-/set` | `{"state": "error"}`   | Odeslání selhalo → LED 5× blink        |

## Node-RED rozšíření

```text
node-red-node-mongodb      Lokální persistence (audit log, offline queue)
node-red-dashboard         Dashboard UI na :1880/ui
```

## Flow architektura

Gateway funguje jako **real-time forwarder** s obousměrnou komunikací. Button eventy se odesílají okamžitě (bez fronty), aby uživatel dostal LED feedback co nejdříve.

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Node-RED flows                                                       │
│                                                                       │
│  ┌──────────────┐                                                    │
│  │ MQTT In      │                                                    │
│  │ node/#       │                                                    │
│  │ button/event │                                                    │
│  └──────┬───────┘                                                    │
│         │                                                             │
│         ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Button handler (okamžitý)                                    │    │
│  │                                                                │    │
│  │  1. Parse type (standard / urgent)                            │    │
│  │  2. Function: sestavit HMAC-SHA256 podpis                     │    │
│  │  3. HTTP Request: POST /notifications/create → cloud          │    │
│  │  4. Switch (HTTP status):                                      │    │
│  │     ├── 201 → MQTT Out: node/{id}/led/-/set → "success"      │    │
│  │     └── error → MQTT Out: node/{id}/led/-/set → "error"      │    │
│  │  5. MongoDB: uložit event (audit + offline backup)            │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Retry queue (inject node, 30s interval)                      │    │
│  │                                                                │    │
│  │  Při offline stavu se neodeslaný event uloží do MongoDB       │    │
│  │  se status: "pending". Retry job periodicky:                  │    │
│  │  1. MongoDB find: events { status: "pending" }                │    │
│  │  2. HTTPS POST na cloud (HMAC podpis)                         │    │
│  │  3. Úspěch → status: "synced"                                │    │
│  │  4. Chyba → ponechat, retry příště                            │    │
│  │                                                                │    │
│  │  LED feedback u retry: žádný (uživatel už viděl error LED     │    │
│  │  při prvním pokusu a mohl stisknout znovu)                    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Cleanup (1h interval): smazat synced záznamy starší 24h     │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Dashboard (:1880/ui)                                         │    │
│  │  • Cloud status: connected / disconnected / last sync time   │    │
│  │  • Historie stisků tlačítka (posledních 20, typ + čas)       │    │
│  │  • Počet pending záznamů (neodeslaných)                      │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

## Obousměrná komunikace — potvrzení doručení

### Primární flow (cloud dostupný)

```text
1. IoT Node stiskne tlačítko
   → UART ["button/-/event", {"type":"standard"}]
   → bcg → MQTT

2. Node-RED Button handler přijme MQTT event

3. Node-RED okamžitě: HTTPS POST /notifications/create (HMAC signed)
   → Cloud backend

4. Cloud backend:
   a) authenticateDevice (ověří HMAC)
   b) notificationService: vytvoří Notification
   c) (budoucí) FCM push na telefon pečující osoby
   d) vrátí HTTP 201

5. Node-RED přijme HTTP 201
   → MQTT publish: node/{id}/led/-/set → {"state": "success"}

6. bcg přeloží MQTT → serial → IoT Node firmware
   → LED: trvalé svícení 3s → zhasne

7. MongoDB: uložit event jako "synced" (audit trail)
```

### Fallback flow (cloud nedostupný)

```text
1–3. Stejné jako výše

4. HTTPS POST selže (timeout / connection refused)

5. Node-RED:
   → MQTT publish: node/{id}/led/-/set → {"state": "error"}
   → MongoDB: uložit event jako "pending"

6. IoT Node firmware → LED: 5× krátké bliknutí → zhasne
   → uživatel ví, že musí stisknout znovu

7. Retry queue (30s interval):
   → najde pending events → zkusí HTTPS POST znovu
   → úspěch → status: "synced" (bez LED — uživatel už viděl error)
```

### Delivery confirmation chain

```text
Fáze                    Potvrzení              Kdo vidí          Kde se sleduje
─────────────────────   ────────────────────   ────────────────  ─────────────────
1. Node → Gateway       MQTT přijetí           —                Gateway log
2. Gateway → Cloud      HTTP 201               LED: solid 3s    Gateway MongoDB
3. Cloud → FCM          FCM message_id         —                Notification.status = "sent"
4. FCM → telefon        delivery receipt       —                Notification.status = "delivered"
5. Pečovatel přečetl    (budoucí: tap)         mobilní app      Notification.status = "acknowledged"
```

**LED informuje o fázi 2** (cloud přijal). Fáze 3–5 jsou asynchronní a sledují se v `Notification.status` v cloud databázi. Mobilní app zobrazuje stav z fáze 4–5.

## Lokální persistence (MongoDB)

### events collection

```text
{
  _id:        ObjectId,
  type:       "standard" | "urgent",
  status:     "pending" | "synced",
  createdAt:  Date,
  syncedAt:   Date | null
}
```

### Retence

| Typ záznamu               | Retence                               |
| ------------------------- | ------------------------------------- |
| Neodeslaná data (pending) | Neomezená — retry queue se o ně stará |
| Odeslaná data (synced)    | 24 hodin, pak smazat (Cleanup job)    |

## Autentizace ke cloudu (HMAC-SHA256)

Gateway se identifikuje jako Device v cloud backendu. Registrace je jednorázová:

```text
1. Admin v cloudu: POST /devices/create → získá deviceId + deviceSecret
2. deviceId + deviceSecret se nakonfigurují v Node-RED (env proměnné)
```

Každý HTTPS request na cloud obsahuje 3 hlavičky:

```text
X-Device-Id:    <deviceId>
X-Timestamp:    <unix timestamp v sekundách>
X-Signature:    HMAC-SHA256(deviceSecret, "METHOD|URL|TIMESTAMP|BODY")
```

Backend ověří: timestamp v okně ±5 min, device existuje, HMAC sedí (constant-time porovnání).

### HMAC generování v Node-RED (function node)

```javascript
const crypto = global.get('crypto') || require('crypto');
const deviceId = env.get('DEVICE_ID');
const deviceSecret = env.get('DEVICE_SECRET');
const timestamp = Math.floor(Date.now() / 1000).toString();
const body = JSON.stringify(msg.payload);
const url = '/notifications/create';

const payload = `POST|${url}|${timestamp}|${body}`;
const signature = crypto.createHmac('sha256', deviceSecret).update(payload).digest('hex');

msg.headers = {
  'Content-Type': 'application/json',
  'X-Device-Id': deviceId,
  'X-Timestamp': timestamp,
  'X-Signature': signature,
};
return msg;
```

## Dashboard

Dashboard běží na `http://localhost:1880/ui` a zobrazuje:

| Panel           | Data                                        | Účel                     |
| --------------- | ------------------------------------------- | ------------------------ |
| Cloud status    | connected / disconnected / last sync time   | Stav připojení ke cloudu |
| Historie stisků | Posledních 20 button eventů s typem a časem | Přehled aktivity         |
| Pending fronta  | Počet neodeslaných záznamů                  | Indikátor offline stavu  |

## Auto-start

### PC (Docker)

```dockerfile
FROM nodered/node-red:latest
RUN npm install node-red-node-mongodb node-red-dashboard
COPY flows.json /data/flows.json
COPY settings.js /data/settings.js
```

```bash
docker run -d --restart unless-stopped \
  --name iot-gateway \
  --device=/dev/ttyUSB0 \
  -p 1880:1880 \
  -e DEVICE_ID=<id> \
  -e DEVICE_SECRET=<secret> \
  iot-gateway
```

Na macOS: `--device=/dev/cu.usbmodem*` místo `/dev/ttyUSB0`.

### RaspberryPi (systemd)

```bash
sudo systemctl enable nodered.service
```

## Endpointy cloud backendu využívané Gateway

| Metoda | URL                     | Účel                                     | Auth |
| ------ | ----------------------- | ---------------------------------------- | ---- |
| POST   | `/notifications/create` | Odeslání button eventu (standard/urgent) | HMAC |
| GET    | `/notifications/all`    | Načtení historie notifikací              | HMAC |

## Mapování na Business Use Cases

| Business Use Case               | Gateway role                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Odeslání standardní notifikace  | Přijme MQTT event → okamžitý HTTPS POST → vrátí LED feedback (success/error)  |
| Odeslání urgentní notifikace    | Stejný flow jako standardní (IoT Node rozlišuje typ)                          |
| Zrušení odesílání               | Gateway se neúčastní — zrušení probíhá na IoT Node před odesláním UART eventu |
| Potvrzení odeslání (LED)        | Přeloží HTTP response na MQTT publish → bcg → serial → IoT Node LED           |
| Přijmutí notifikace na telefonu | Gateway se neúčastní — řeší cloud backend + FCM                               |
| Zobrazení seznamu notifikací    | Gateway se neúčastní — řeší cloud backend + mobilní app                       |
