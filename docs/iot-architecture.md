# IoT Architecture — Technické řešení IoT části

Hlavní přehled IoT architektury projektu asistenčního tlačítka. Detailní spec jednotlivých komponent viz [IoT Node](iot-node.md) a [IoT Gateway](iot-gateway.md).

## Přehled systému

```text
Hendikepovaný       HARDWARIO           HARDWARIO Playground         Express.js         Mobilní app
  uživatel          Core Module                (PC)                  Backend            pečující osoby
                    (IoT Node)               (Gateway)               (Cloud)            (React.js)

    ┌─┐          ┌──────────────┐     ┌────────────────────┐    ┌──────────────┐    ┌──────────────┐
    │ │──stisk──▶│  Firmware    │ USB │  bcg → MQTT        │    │              │    │              │
    │ │          │  (twr-sdk)   │────▶│  Node-RED flows    │───▶│  /notif.     │───▶│  Push (FCM)  │
    │ │◀──LED───│  LED řízení  │◀────│  MongoDB (lokální) │◀───│  /devices   │    │  Seznam      │
    └─┘          │  Countdown   │MQTT │  Dashboard         │HTTP│  /auth      │    │  notifikací  │
                 └──────────────┘     └────────────────────┘    └──────────────┘    └──────────────┘
```

## Business aktéři

| Aktér                  | Role                                                        | Rozhraní                              |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------- |
| Hendikepovaný uživatel | Přivolává pomoc stiskem tlačítka                            | Fyzické IoT zařízení (tlačítko + LED) |
| Pečující osoba         | Přijímá notifikace, poskytuje pomoc                         | Mobilní aplikace (React.js)           |
| IoT zařízení           | Snímá stisk, řídí LED, odesílá event přes UART              | HARDWARIO Core Module                 |
| Gateway                | Přijímá MQTT eventy, přeposílá na cloud, vrací LED feedback | Node-RED v HARDWARIO Playground       |
| Backend systém         | Zpracovává notifikace, odesílá push, uchovává historii      | Express.js + MongoDB (cloud)          |
| Mobilní aplikace       | Zobrazuje push notifikace a seznam/historii                 | React.js (budoucí)                    |

## Business use cases → technické mapování

| Business Use Case               | Kde se řeší         | Technické řešení                                           |
| ------------------------------- | ------------------- | ---------------------------------------------------------- |
| Odeslání standardní notifikace  | IoT Node firmware   | Krátký stisk → 5s countdown → UART event → Gateway → Cloud |
| Odeslání urgentní notifikace    | IoT Node firmware   | Dlouhý stisk (3s) → okamžitý UART event → Gateway → Cloud  |
| Zrušení odesílání notifikace    | IoT Node firmware   | Druhý stisk během 5s countdown → LED zhasne → žádný event  |
| Potvrzení odeslání (LED)        | Gateway + IoT Node  | Cloud HTTP response → Gateway MQTT → IoT Node LED          |
| Přijmutí notifikace na telefonu | Cloud + FCM         | Backend vytvoří Notification → FCM push → mobilní app      |
| Zobrazení seznamu notifikací    | Cloud + mobilní app | `GET /notifications/all` → React.js seznam                 |

## Obousměrná komunikace

```text
ODESÍLÁNÍ:
  IoT Node ──UART──▶ bcg ──MQTT──▶ Node-RED ──HTTPS──▶ Cloud
                                                          │
POTVRZENÍ:                                                │ HTTP 201 / error
  IoT Node ◀──UART── bcg ◀──MQTT── Node-RED ◀────────────┘
     │
     └── LED: solid 3s (success) / 5× blink (error)
```

### Delivery confirmation chain

```text
Fáze                    Potvrzení              Vizualizace         Status v DB
─────────────────────   ────────────────────   ────────────────    ─────────────
1. Node → Gateway       MQTT přijetí           —                  —
2. Gateway → Cloud      HTTP 201               LED: solid 3s      Notification created
3. Cloud → FCM          FCM message_id         —                  status: "sent"
4. FCM → telefon        delivery receipt       —                  status: "delivered"
5. Pečovatel přečetl    (budoucí)              mobilní app        status: "acknowledged"
```

LED informuje o fázi 2 (cloud přijal notifikaci). Fáze 3–5 jsou asynchronní.

## End-to-end flow — standardní notifikace

```text
 1. Uživatel krátce stiskne tlačítko
 2. Firmware: COUNTDOWN, LED pomalé blikání (1×/s), 5s timer
    ├── [2nd press] → CANCEL: LED zhasne → KONEC
 3. Timer vyprší → STANDARD_SEND, LED rychlé blikání (3×/s)
 4. Firmware → UART: ["button/-/event", {"type":"standard"}]
 5. bcg → MQTT: node/{id}/button/-/event → {"type":"standard"}
 6. Node-RED → HTTPS POST /notifications/create (HMAC signed)
 7. Cloud: authenticateDevice → notificationService → Notification created
 8. Cloud → HTTP 201
 9. Node-RED → MQTT: node/{id}/led/-/set → {"state":"success"}
10. bcg → serial → Firmware → LED solid 3s → zhasne
11. (budoucí) Cloud → FCM push → telefon pečující osoby
```

## End-to-end flow — urgentní notifikace

```text
1. Uživatel drží tlačítko 3s
2. Firmware: URGENT_SEND, LED rychlé blikání (2×/s)
3. Firmware → UART: ["button/-/event", {"type":"urgent"}]
4–10. Stejný flow jako standardní
11. (budoucí) FCM push s high priority (obchází "Nerušit")
```

## Offline resilience

```text
Cloud dostupný:
  button event → okamžitý HTTPS → HTTP 201 → LED success

Cloud nedostupný:
  button event → okamžitý HTTPS → fail → LED error (uživatel ví)
  → event uložen do MongoDB (pending)
  → retry queue (30s) → HTTPS POST → po obnovení → synced

Restart Gateway:
  → Node-RED + MongoDB → pending eventy přetrvávají → retry pokračuje
```

## Nástroje

| Nástroj              | Účel                                                        |
| -------------------- | ----------------------------------------------------------- |
| HARDWARIO Code       | IDE pro vývoj firmware (C) na Core Module                   |
| HARDWARIO Playground | Desktop app: Node-RED + MQTT broker + bcg service + flasher |

## Technologie — souhrn

| Vrstva              | Technologie                     | Účel                                       |
| ------------------- | ------------------------------- | ------------------------------------------ |
| IoT Node firmware   | C + twr-sdk                     | Stavový automat tlačítka, LED řízení, UART |
| IoT Node HW         | HARDWARIO Core Module           | Tlačítko + LED                             |
| IDE                 | HARDWARIO Code                  | Vývoj + flash firmware                     |
| Gateway app         | HARDWARIO Playground            | Node-RED + MQTT + bcg                      |
| Gateway persistence | MongoDB (lokální)               | Audit log, offline queue, retence          |
| Gateway UI          | node-red-dashboard              | Cloud status, historie stisků              |
| Gateway → Cloud     | HTTPS + HMAC-SHA256             | Autentizovaná komunikace                   |
| Cloud backend       | Express.js + Mongoose + MongoDB | API, auth, notifikace                      |
| Mobilní app         | React.js (budoucí)              | Push notifikace, seznam notifikací         |
