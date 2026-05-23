#include <application.h>
#include <string.h>

// Stavový automat firmware
typedef enum {
    STATE_IDLE,            // Čekání na stisk tlačítka
    STATE_COUNTDOWN,       // 5s odpočet před odesláním (lze zrušit)
    STATE_WAIT_RESPONSE,   // Notifikace odeslána, čekáme na odpověď z Gateway
    STATE_LED_FEEDBACK     // LED signalizuje výsledek (success/error)
} app_state_t;

// HW instance
static twr_led_t led;
static twr_button_t button;
static app_state_t state = STATE_IDLE;

// Scheduler tasky pro timeouty
static twr_scheduler_task_id_t countdown_task_id;
static twr_scheduler_task_id_t timeout_task_id;
static twr_scheduler_task_id_t led_off_task_id;

// UART RX — FIFO pro async čtení + řádkový buffer pro skládání JSON zpráv
static twr_fifo_t rx_fifo;
static uint8_t rx_fifo_buffer[128];
static char rx_line_buf[128];
static size_t rx_line_pos = 0;

// Odešle JSON notifikaci přes UART2 na Gateway
static void send_notification(const char *type)
{
    char buf[64];
    int len = snprintf(buf, sizeof(buf),
        "[\"button/-/event\",{\"type\":\"%s\"}]\n", type);
    twr_uart_write(TWR_UART_UART2, buf, len);
    twr_log_info("APP: Sent notification type=%s", type);
}

static void enter_idle(void)
{
    state = STATE_IDLE;
    twr_led_set_mode(&led, TWR_LED_MODE_OFF);
}

// Po LED feedbacku se vrátí do IDLE
static void led_off_handler(void *param)
{
    enter_idle();
}

// 15s timeout — Gateway neodpověděla
static void response_timeout_handler(void *param)
{
    if (state != STATE_WAIT_RESPONSE)
        return;

    twr_log_warning("APP: Response timeout");
    state = STATE_LED_FEEDBACK;
    twr_led_blink(&led, 5);
    led_off_task_id = twr_scheduler_register(led_off_handler, NULL,
        twr_tick_get() + 2000);
}

// 5s countdown vypršel → odeslat standardní notifikaci
static void countdown_timeout_handler(void *param)
{
    if (state != STATE_COUNTDOWN)
        return;

    twr_log_info("APP: Countdown expired, sending standard");
    twr_led_set_mode(&led, TWR_LED_MODE_BLINK_FAST);
    send_notification("standard");
    state = STATE_WAIT_RESPONSE;
    timeout_task_id = twr_scheduler_register(response_timeout_handler, NULL,
        twr_tick_get() + 15000);
}

// Zpracování odpovědi z Gateway: ["led/-/set",{"state":"success"}]
static void process_rx_line(const char *line)
{
    if (state != STATE_WAIT_RESPONSE)
        return;

    if (strstr(line, "\"success\""))
    {
        twr_log_info("APP: Gateway confirmed success");
        twr_scheduler_unregister(timeout_task_id);
        state = STATE_LED_FEEDBACK;
        twr_led_set_mode(&led, TWR_LED_MODE_ON);
        led_off_task_id = twr_scheduler_register(led_off_handler, NULL,
            twr_tick_get() + 3000);
    }
    else if (strstr(line, "\"error\""))
    {
        twr_log_warning("APP: Gateway reported error");
        twr_scheduler_unregister(timeout_task_id);
        state = STATE_LED_FEEDBACK;
        twr_led_blink(&led, 5);
        led_off_task_id = twr_scheduler_register(led_off_handler, NULL,
            twr_tick_get() + 2000);
    }
}

// Async UART čtení — skládá příchozí bajty do řádků ukončených \n
static void uart_event_handler(twr_uart_channel_t channel, twr_uart_event_t event, void *param)
{
    if (event == TWR_UART_EVENT_ASYNC_READ_DATA)
    {
        uint8_t byte;
        while (twr_uart_async_read(TWR_UART_UART2, &byte, 1) > 0)
        {
            if (byte == '\n')
            {
                rx_line_buf[rx_line_pos] = '\0';
                process_rx_line(rx_line_buf);
                rx_line_pos = 0;
            }
            else if (rx_line_pos < sizeof(rx_line_buf) - 1)
            {
                rx_line_buf[rx_line_pos++] = (char)byte;
            }
        }
        twr_uart_async_read_start(TWR_UART_UART2, 500);
    }

    // Po timeoutu restartovat čtení (jinak by se async read zastavil)
    if (event == TWR_UART_EVENT_ASYNC_READ_TIMEOUT)
    {
        twr_uart_async_read_start(TWR_UART_UART2, 500);
    }
}

// Obsluha tlačítka — krátký stisk = countdown, dlouhý = urgent
static void button_event_handler(twr_button_t *self, twr_button_event_t event, void *event_param)
{
    if (event == TWR_BUTTON_EVENT_CLICK)
    {
        if (state == STATE_IDLE)
        {
            // Krátký stisk → spustit 5s countdown
            twr_log_info("APP: Short press → countdown");
            state = STATE_COUNTDOWN;
            twr_led_set_mode(&led, TWR_LED_MODE_BLINK);
            countdown_task_id = twr_scheduler_register(countdown_timeout_handler, NULL,
                twr_tick_get() + 5000);
        }
        else if (state == STATE_COUNTDOWN)
        {
            // Druhý stisk během countdown → zrušit
            twr_log_info("APP: Cancel");
            twr_scheduler_unregister(countdown_task_id);
            enter_idle();
        }
    }
    else if (event == TWR_BUTTON_EVENT_HOLD)
    {
        if (state == STATE_COUNTDOWN)
        {
            twr_scheduler_unregister(countdown_task_id);
        }

        if (state == STATE_IDLE || state == STATE_COUNTDOWN)
        {
            // Dlouhý stisk (3s) → okamžitá urgentní notifikace
            twr_log_info("APP: Long press → urgent");
            twr_led_set_mode(&led, TWR_LED_MODE_BLINK_FAST);
            send_notification("urgent");
            state = STATE_WAIT_RESPONSE;
            timeout_task_id = twr_scheduler_register(response_timeout_handler, NULL,
                twr_tick_get() + 15000);
        }
    }
}

void application_init(void)
{
    // Debug log — sdílí UART2 s JSON komunikací, v release buildu se vypne
    twr_log_init(TWR_LOG_LEVEL_DUMP, TWR_LOG_TIMESTAMP_ABS);
    twr_log_info("APP: IoT Node init");

    twr_led_init(&led, TWR_GPIO_LED, false, 0);

    twr_button_init(&button, TWR_GPIO_BUTTON, TWR_GPIO_PULL_DOWN, 0);
    twr_button_set_event_handler(&button, button_event_handler, NULL);
    twr_button_set_hold_time(&button, 3000);

    // UART2 async read — pro příjem odpovědí z Gateway
    twr_fifo_init(&rx_fifo, rx_fifo_buffer, sizeof(rx_fifo_buffer));
    twr_uart_set_async_fifo(TWR_UART_UART2, NULL, &rx_fifo);
    twr_uart_set_event_handler(TWR_UART_UART2, uart_event_handler, NULL);
    twr_uart_async_read_start(TWR_UART_UART2, 500);

    twr_log_info("APP: Ready");
}
