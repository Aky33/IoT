# IoT Node

## Popis

IoT Node je fyzické zařízení s tlačítkem umístěné v domácnosti hendikepovaného uživatele. Slouží k přivolání pomoci pečující osoby. Rozlišuje dva typy notifikací: standardní (krátký stisk s 5s odpočítáváním) a urgentní (dlouhý stisk, okamžité odeslání). Zpětnou vazbu poskytuje uživateli prostřednictvím LED diody.

## Hardware

Zařízení je postavené na platformě HARDWARIO TOWER.

| Komponent      | Typ           | Specifikace                                    |
| -------------- | ------------- | ---------------------------------------------- |
| Mikrokontrolér | STM32L083CZ   | ARM Cortex-M0+, 192 KB flash, 20 KB RAM        |
| Tlačítko       | Integrované   | Na Core Module                                 |
| LED dioda      | Integrovaná   | Na Core Module, řízena firmware                |
| Komunikace     | UART          | UART2 přes FTDI chip → USB virtual serial port |
| Napájení       | USB / baterie | USB nebo 2× AAA                                |

## Vývojové prostředí

| Nástroj                       | Účel                                      |
| ----------------------------- | ----------------------------------------- |
| HARDWARIO Code                | IDE pro vývoj firmware v jazyce C         |
| HARDWARIO TOWER SDK (twr-sdk) | Knihovny pro práci s tlačítkem, LED, UART |
| HARDWARIO Playground          | Flashování firmware do Core Module        |

## Firmware — stavový automat

Firmware řeší celou logiku stisku lokálně na zařízení. Gateway a cloud dostávají event až po rozhodnutí firmwaru. Zrušení probíhá na zařízení — žádná zpráva se neodesílá.

```text
                         ┌──────────────┐
           short press   │              │  long press (3s hold)
    ┌─────────────────── │    IDLE      │ ──────────────────────┐
    │                    │  (LED off)   │                       │
    │                    └──────────────┘                       │
    ▼                                                          ▼
┌──────────────────┐                              ┌──────────────────┐
│   COUNTDOWN      │                              │   URGENT_SEND    │
│   5s timer       │                              │   okamžité       │
│   LED: 1×/s blink│                              │   LED: 2×/s blink│
└────┬─────────┬───┘                              └────────┬─────────┘
     │         │                                           │
  2. stisk     timer vyprší                        UART: type=urgent
     │         │                                           │
     ▼         ▼                                           ▼
┌─────────┐  ┌──────────────┐                    ┌──────────────────┐
│ CANCEL  │  │ STANDARD_SEND│                    │  WAIT_RESPONSE   │
│ LED off │  │ LED: 3×/s    │                    │  (od Gateway)    │
│ žádný   │  │ UART: type=  │                    └────────┬─────────┘
│ event   │  │   standard   │                             │
└─────────┘  └──────┬───────┘                    success / failure
                    │                                     │
                    ▼                                     ▼
           ┌──────────────────┐                  ┌──────────────────┐
           │  WAIT_RESPONSE   │                  │  LED feedback    │
           │  (od Gateway)    │                  │  solid 3s = OK   │
           └────────┬─────────┘                  │  5× blink = fail│
                    │                            └──────────────────┘
           success / failure
                    │
                    ▼
           ┌──────────────────┐
           │  LED feedback    │
           │  solid 3s = OK   │
           │  5× blink = fail │
           └──────────────────┘
```

### Stavy

| Stav          | Trigger                       | Akce                                            | LED vzor                       |
| ------------- | ----------------------------- | ----------------------------------------------- | ------------------------------ |
| IDLE          | —                             | Čekání na stisk                                 | LED zhasnutá                   |
| COUNTDOWN     | Krátký stisk                  | 5s timer, možnost zrušení                       | Pomalé blikání (1×/s)          |
| CANCEL        | 2. stisk během countdown      | Zrušení, žádný UART event                       | Okamžité zhasnutí              |
| STANDARD_SEND | Timer vyprší                  | Odeslání standard eventu přes UART              | Rychlé blikání (3×/s)          |
| URGENT_SEND   | Dlouhý stisk (3s)             | Okamžité odeslání urgent eventu                 | Rychlé blikání (2×/s)          |
| WAIT_RESPONSE | Po odeslání                   | Čekání na potvrzení z Gateway (max 15s timeout) | Blikání pokračuje              |
| LED_SUCCESS   | Gateway potvrdí doručení      | Potvrzení úspěchu                               | Trvalé svícení 3s, pak zhasne  |
| LED_ERROR     | Gateway hlásí chybu / timeout | Signalizace chyby                               | 5× krátké bliknutí, pak zhasne |

## LED protokol

| Stav      | LED vzor                        | Trvání              | Význam pro uživatele                |
| --------- | ------------------------------- | ------------------- | ----------------------------------- |
| Countdown | Pomalé blikání, 1× za sekundu   | 5 sekund            | „Připravuji odeslání, můžeš zrušit" |
| Odesílání | Rychlé blikání, 2–3× za sekundu | Do přijetí odpovědi | „Odesílám notifikaci"               |
| Úspěch    | Trvalé svícení                  | 3 sekundy           | „Odesláno, pomoc je na cestě"       |
| Chyba     | 5× krátké bliknutí              | Pak zhasne          | „Nepodařilo se, zkus znovu"         |
| Zrušeno   | Okamžité zhasnutí               | —                   | „Zrušeno, notifikace neodeslána"    |

## Obousměrná komunikace

### Odesílání (IoT Node → Gateway)

Core Module posílá JSON zprávy přes USB serial port (UART2). Formát: JSON array `[topic, payload]` ukončený znakem `\n`.

```text
["button/-/event", {"type": "standard"}]     po 5s countdown
["button/-/event", {"type": "urgent"}]       okamžitě po long press
```

Gateway (Node-RED) čte tyto zprávy přímo z USB sériového portu pomocí Serial In node.

### Příjem potvrzení (Gateway → IoT Node)

Gateway po zpracování HTTP response z cloudu odesílá JSON zprávu zpět přes USB serial:

```text
["led/-/set", {"state": "success"}]   cloud přijal notifikaci
["led/-/set", {"state": "error"}]     odeslání selhalo
```

Firmware parsuje příchozí serial JSON a řídí LED.

Timeout: pokud firmware nedostane odpověď do 15 sekund, automaticky nastaví LED na error (5× blink). Prevence nekonečného čekání.

### Celý obousměrný cyklus

```text
1. Uživatel stiskne tlačítko
2. Firmware → UART JSON → USB kabel → Gateway (Node-RED Serial In)
3. Gateway → HTTPS POST → Cloud backend
4. Cloud → HTTP 201 (notifikace vytvořena)
5. Gateway → Serial Out: ["led/-/set",{"state":"success"}] → USB → Firmware
6. Firmware → LED solid 3s → uživatel ví, že odesláno
```

## Firmware implementace

```c
#include <twr.h>

static twr_button_t button;
static twr_led_t led;
static bool countdown_active = false;
static twr_scheduler_task_id_t countdown_task;

void send_notification(const char *type) {
    char buf[64];
    snprintf(buf, sizeof(buf), "[\"button/-/event\",{\"type\":\"%s\"}]\n", type);
    twr_uart_write(TWR_UART_UART2, buf, strlen(buf));
}

void countdown_timeout(void *param) {
    countdown_active = false;
    twr_led_set_mode(&led, TWR_LED_MODE_BLINK_FAST);
    send_notification("standard");
}

void led_off_after_3s(void *param) {
    twr_led_set_mode(&led, TWR_LED_MODE_OFF);
}

void button_event_handler(twr_button_t *self, twr_button_event_t event, void *param) {
    if (event == TWR_BUTTON_EVENT_PRESS) {
        if (countdown_active) {
            countdown_active = false;
            twr_scheduler_unregister(countdown_task);
            twr_led_set_mode(&led, TWR_LED_MODE_OFF);
        } else {
            countdown_active = true;
            twr_led_set_mode(&led, TWR_LED_MODE_BLINK);
            countdown_task = twr_scheduler_register(countdown_timeout, NULL,
                twr_tick_get() + 5000);
        }
    }

    if (event == TWR_BUTTON_EVENT_HOLD) {
        if (countdown_active) {
            twr_scheduler_unregister(countdown_task);
            countdown_active = false;
        }
        twr_led_set_mode(&led, TWR_LED_MODE_BLINK_FAST);
        send_notification("urgent");
    }
}

// Příjem LED příkazů z Gateway
static uint8_t uart_rx_buf[128];

void uart_handler(twr_uart_channel_t channel, twr_uart_event_t event, void *param) {
    if (event == TWR_UART_EVENT_ASYNC_READ_DATA) {
        size_t len = twr_uart_async_read(TWR_UART_UART2, uart_rx_buf, sizeof(uart_rx_buf));
        uart_rx_buf[len] = '\0';
        if (strstr((char *)uart_rx_buf, "success")) {
            twr_led_set_mode(&led, TWR_LED_MODE_ON);
            twr_scheduler_register(led_off_after_3s, NULL, twr_tick_get() + 3000);
        } else if (strstr((char *)uart_rx_buf, "error")) {
            twr_led_blink(&led, 5);
        }
    }
}

void application_init(void) {
    twr_led_init(&led, TWR_GPIO_LED, false, false);
    twr_button_init(&button, TWR_GPIO_BUTTON, TWR_GPIO_PULL_DOWN, false);
    twr_button_set_event_handler(&button, button_event_handler, NULL);
    twr_button_set_hold_time(&button, 3000);

    twr_uart_init(TWR_UART_UART2, TWR_UART_BAUDRATE_115200, TWR_UART_SETTING_8N1);
    twr_uart_set_event_handler(TWR_UART_UART2, uart_handler, NULL);
    twr_uart_async_read_start(TWR_UART_UART2, uart_rx_buf, sizeof(uart_rx_buf));
}
```

## Mapování na Business Use Cases

| Business Use Case              | Firmware stav                                                  | Popis                                                  |
| ------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------ |
| Odeslání standardní notifikace | IDLE → COUNTDOWN → STANDARD_SEND → WAIT_RESPONSE → LED_SUCCESS | Krátký stisk, 5s odpočítávání, odeslání, LED potvrzení |
| Odeslání urgentní notifikace   | IDLE → URGENT_SEND → WAIT_RESPONSE → LED_SUCCESS               | Dlouhý stisk 3s, okamžité odeslání, LED potvrzení      |
| Zrušení odesílání              | COUNTDOWN → CANCEL                                             | 2. stisk během 5s, LED zhasne, žádný event             |
| Potvrzení odeslání (LED)       | WAIT_RESPONSE → LED_SUCCESS / LED_ERROR                        | Gateway vrací výsledek přes USB serial → LED           |
