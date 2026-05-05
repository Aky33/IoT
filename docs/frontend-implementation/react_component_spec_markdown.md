# React Component Specification

Tento dokument slouží jako zdrojová specifikace komponent pro aplikaci s IoT tlačítkem pro přivolání pomoci. Markdown je strukturovaný tak, aby z něj bylo možné později generovat technickou dokumentaci, UU5 component blocks nebo React komponenty.

---

## 1. Kontext aplikace

Aplikace umožňuje zobrazovat a spravovat notifikace vytvořené fyzickým IoT zařízením s tlačítkem.

Zařízení podporuje dva typy notifikací:

- **Standardní notifikace** vzniká krátkým stiskem tlačítka. Před odesláním běží 5sekundové odpočítávání s možností zrušení.
- **Urgentní notifikace** vzniká dlouhým stiskem tlačítka. Odesílá se okamžitě bez možnosti zrušení.

Aplikace rozlišuje dvě základní role:

- **user** – běžný uživatel nebo pečující osoba. Má omezené možnosti manipulace se zařízením a notifikacemi.
- **admin** – administrátor. Má přístup ke správě zařízení, CRUD operacím, párování a širší historii.

---

## 2. Doporučená struktura složek

```txt
src/
  components/
    layout/
      AppLayout.tsx
      Navbar.tsx

    notifications/
      NotificationList.tsx
      NotificationItem.tsx
      NotificationBadge.tsx
      NotificationDetailModal.tsx
      UrgentNotificationAlert.tsx
      NotificationFilters.tsx
      NotificationCountdown.tsx
      CancelNotificationButton.tsx

    devices/
      DeviceList.tsx
      DeviceCard.tsx
      DeviceStatusIndicator.tsx
      DeviceActionsMenu.tsx
      DeviceForm.tsx
      LedStatusPreview.tsx
      LedStatusLegend.tsx

    auth/
      ProtectedRoute.tsx
      RoleBasedAction.tsx
      PermissionTooltip.tsx

    common/
      EmptyState.tsx
      ErrorState.tsx
      LoadingState.tsx

  pages/
    DashboardPage.tsx
    NotificationHistoryPage.tsx
    DeviceDetailPage.tsx
    PairDevicePage.tsx
    SettingsPage.tsx

  pages/admin/
    AdminDevicesPage.tsx

  types/
    device.ts
    notification.ts
    user.ts
    dashboard.ts
```

---

## 3. Základní datové typy

```ts
type UserRole = "admin" | "user";

type NotificationType = "standard" | "urgent";

type NotificationStatus = "pending" | "resolved" | "cancelled" | "failed";

type DeviceStatus = "online" | "offline" | "error" | "unpaired";

type PairingStatusType = "idle" | "pending" | "success" | "error";

type LedStatus = "idle" | "sending" | "success" | "error" | "urgent";

type Notification = {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  deviceId: string;
  deviceName: string;
  createdAt: string;
  resolvedAt?: string;
  assignedUserId?: string;
};

type Device = {
  id: string;
  name: string;
  serialNumber: string;
  status: DeviceStatus;
  assignedUserId?: string;
  location?: string;
  lastSeenAt?: string;
  createdAt: string;
};

type User = {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
};

type NotificationFilters = {
  type?: NotificationType;
  status?: NotificationStatus;
  deviceId?: string;
  dateFrom?: string;
  dateTo?: string;
};

type DeviceFormValues = {
  name: string;
  serialNumber: string;
  assignedUserId?: string;
  location?: string;
  note?: string;
};

type DashboardSummary = {
  activeDevicesCount: number;
  offlineDevicesCount: number;
  pendingNotificationsCount: number;
  urgentNotificationsCount: number;
};

type LedStatusLegendItem = {
  status: LedStatus;
  label: string;
  description: string;
};
```

---

## 4. Komponenty

### 4.1 `AppLayout`

#### Kategorie

`layout`

#### Popis

Hlavní layout aplikace zobrazovaný po přihlášení uživatele. Komponenta obaluje obsah aplikace, zajišťuje společnou strukturu obrazovky, navigaci podle role uživatele a prostor pro renderování konkrétních stránek aplikace.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `children` | `React.ReactNode` | `-` | Obsah, který má být vykreslen uvnitř layoutu. Typicky konkrétní stránka aplikace. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |

#### Render rules

- Display after successful login.
- Display as wrapper for all protected application pages.
- Do not display if user is not authenticated.
- Do not display while authentication state is loading.

---

### 4.2 `Navbar`

#### Kategorie

`layout`

#### Popis

Navigační komponenta aplikace zobrazovaná v hlavním layoutu po přihlášení uživatele. Obsahuje odkazy na hlavní části aplikace a přizpůsobuje viditelnost položek podle role uživatele.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `activeRoute` | `string` | `-` | Aktuálně aktivní stránka nebo route. |
| `onNavigate` | `(route: string) => void` | `-` | Callback po kliknutí na položku navigace. |
| `notificationCount` | `number` | `0` | Počet nevyřízených notifikací. |
| `urgentNotificationCount` | `number` | `0` | Počet nevyřízených urgentních notifikací. |

#### Render rules

- Display if user is authenticated.
- Display inside `AppLayout`.
- Do not display if `userRole` is not defined.
- Display admin navigation items only if `userRole === 'admin'`.
- Display notification badge if `notificationCount > 0`.
- Highlight notification navigation item if `urgentNotificationCount > 0`.

---

### 4.3 `ProtectedRoute`

#### Kategorie

`auth`

#### Popis

Komponenta pro ochranu stránek nebo částí aplikace podle role uživatele. Ověřuje, zda má aktuálně přihlášený uživatel oprávnění zobrazit daný obsah.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `allowedRoles` | `Array<'admin' \| 'user'>` | `-` | Seznam rolí, které mají povolený přístup. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `children` | `React.ReactNode` | `-` | Obsah, který se vykreslí při splnění oprávnění. |
| `fallback` | `React.ReactNode` | `null` | Obsah zobrazený uživateli bez oprávnění. |
| `redirectTo` | `string` | `-` | Route pro přesměrování při chybějícím oprávnění. |

#### Render rules

- Display children if `userRole` is included in `allowedRoles`.
- Do not display children if `userRole` is not included in `allowedRoles`.
- Display `fallback` if user is unauthorized and `fallback` is provided.
- Redirect to `redirectTo` if user is unauthorized and `redirectTo` is provided.

---

### 4.4 `DashboardPage`

#### Kategorie

`page`

#### Popis

Výchozí stránka aplikace po přihlášení uživatele. Slouží jako hlavní přehled aktuálního stavu systému. Pro pečující osobu zobrazuje poslední notifikace, urgentní požadavky a stav přiřazených zařízení. Pro admina může zobrazovat systémové metriky a přehled všech zařízení.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `summary` | `DashboardSummary` | `-` | Souhrnná data pro přehledové karty. |
| `latestNotifications` | `Notification[]` | `[]` | Seznam posledních notifikací. |
| `urgentNotifications` | `Notification[]` | `[]` | Seznam aktuálně nevyřízených urgentních notifikací. |
| `devices` | `Device[]` | `[]` | Seznam zařízení relevantních pro aktuálního uživatele. |
| `isLoading` | `boolean` | `false` | Určuje, zda se dashboardová data načítají. |
| `error` | `string \| null` | `null` | Chybová zpráva při neúspěšném načtení. |

#### Render rules

- Display after successful login.
- Display inside `AppLayout` as default protected page.
- Display `LoadingState` if `isLoading` is true.
- Display `ErrorState` if `error` is not null.
- Display `StatusSummaryCards` if `summary` data is available.
- Display `UrgentNotificationAlert` if `urgentNotifications` contains pending urgent notification.
- Display latest notifications section if `latestNotifications.length > 0`.
- Display admin quick actions only if `userRole === 'admin'`.

---

### 4.5 `StatusSummaryCards`

#### Kategorie

`dashboard`

#### Popis

Komponenta zobrazující sadu přehledových karet s hlavními metrikami aplikace. Slouží pro rychlou orientaci ve stavu systému.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `activeDevicesCount` | `number` | `0` | Počet zařízení, která jsou aktivní nebo online. |
| `offlineDevicesCount` | `number` | `0` | Počet zařízení, která jsou aktuálně offline. |
| `pendingNotificationsCount` | `number` | `0` | Počet notifikací čekajících na reakci. |
| `urgentNotificationsCount` | `number` | `0` | Počet urgentních notifikací. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `onCardClick` | `(cardType: string) => void` | `-` | Callback po kliknutí na kartu. |

#### Render rules

- Display on `DashboardPage` after summary data is loaded.
- Do not display while dashboard data is loading.
- Highlight offline devices card if `offlineDevicesCount > 0`.
- Highlight pending notifications card if `pendingNotificationsCount > 0`.
- Strongly highlight urgent notifications card if `urgentNotificationsCount > 0`.
- Display admin-only metrics only if `userRole === 'admin'`.

---

### 4.6 `NotificationList`

#### Kategorie

`notifications`

#### Popis

Komponenta pro zobrazení seznamu notifikací odeslaných z IoT zařízení. Zobrazuje standardní i urgentní notifikace, jejich stav, zdrojové zařízení a dostupné akce podle role uživatele.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `notifications` | `Notification[]` | `[]` | Seznam notifikací k vykreslení. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `isLoading` | `boolean` | `false` | Určuje, zda se seznam načítá. |
| `error` | `string \| null` | `null` | Chybová zpráva při neúspěšném načtení. |
| `onResolve` | `(notificationId: string) => void` | `-` | Callback pro označení notifikace jako vyřešené. |
| `onDelete` | `(notificationId: string) => void` | `-` | Callback pro smazání notifikace. |
| `onOpenDetail` | `(notificationId: string) => void` | `-` | Callback pro otevření detailu notifikace. |

#### Render rules

- Display if notifications are loaded and array is not empty.
- Display `LoadingState` if `isLoading` is true.
- Display `ErrorState` if `error` is not null.
- Display `EmptyState` if notifications array is empty.
- Render `NotificationItem` once for each notification.
- Display delete action only if `userRole === 'admin'` and `onDelete` is provided.

---

### 4.7 `NotificationItem`

#### Kategorie

`notifications`

#### Popis

Komponenta reprezentující jednu konkrétní notifikaci v seznamu. Zobrazuje typ notifikace, stav, čas vytvoření, zdrojové zařízení, případně přiřazeného uživatele a dostupné akce.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `notification` | `Notification` | `-` | Notifikace, jejíž data se zobrazují. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `onResolve` | `(notificationId: string) => void` | `-` | Callback pro označení notifikace jako vyřešené. |
| `onDelete` | `(notificationId: string) => void` | `-` | Callback pro smazání notifikace. |
| `onOpenDetail` | `(notificationId: string) => void` | `-` | Callback pro otevření detailu notifikace. |
| `onOpenDeviceDetail` | `(deviceId: string) => void` | `-` | Callback pro otevření detailu zařízení. |
| `isProcessing` | `boolean` | `false` | Určuje, zda právě probíhá akce nad notifikací. |

#### Render rules

- Display for each notification in `NotificationList`.
- Highlight if `notification.type === 'urgent'` and `notification.status === 'pending'`.
- Display `NotificationBadge` if type and status are available.
- Display resolve button only if notification status is `pending` and `onResolve` is provided.
- Display delete button only if `userRole === 'admin'` and `onDelete` is provided.
- Display open device detail button only if `userRole === 'admin'` and `onOpenDeviceDetail` is provided.

---

### 4.8 `NotificationBadge`

#### Kategorie

`notifications`

#### Popis

Vizuální štítek pro rychlé rozlišení typu a stavu notifikace. Pomáhá uživateli poznat, zda jde o standardní nebo urgentní notifikaci a zda je požadavek stále nevyřízený, vyřešený, zrušený nebo selhal.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `type` | `'standard' \| 'urgent'` | `-` | Typ notifikace. |
| `status` | `'pending' \| 'resolved' \| 'cancelled' \| 'failed'` | `-` | Aktuální stav notifikace. |
| `size` | `'s' \| 'm' \| 'l'` | `'m'` | Velikost štítku. |
| `showIcon` | `boolean` | `true` | Určuje, zda se má zobrazit ikona. |
| `label` | `string` | `-` | Volitelný vlastní text štítku. |

#### Render rules

- Display if notification type and status are available.
- Use urgent visual style if `type === 'urgent'`.
- Use pending visual style if `status === 'pending'`.
- Use resolved visual style if `status === 'resolved'`.
- Use error visual style if `status === 'failed'`.
- Display icon only if `showIcon === true`.

---

### 4.9 `NotificationDetailModal`

#### Kategorie

`notifications`

#### Popis

Modalové okno zobrazující detail konkrétní notifikace. Obsahuje informace o typu notifikace, aktuálním stavu, čase vytvoření, zdrojovém zařízení, přiřazeném uživateli a technické informace o doručení.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `notification` | `Notification \| null` | `null` | Notifikace, jejíž detail se má zobrazit. |
| `isOpen` | `boolean` | `false` | Určuje, zda je modal otevřený. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `onClose` | `() => void` | `-` | Callback pro zavření modalu. |
| `onResolve` | `(notificationId: string) => void` | `-` | Callback pro označení jako vyřešené. |
| `onDelete` | `(notificationId: string) => void` | `-` | Callback pro smazání notifikace. |
| `onOpenDeviceDetail` | `(deviceId: string) => void` | `-` | Callback pro otevření detailu zařízení. |
| `isProcessing` | `boolean` | `false` | Určuje, zda probíhá akce nad notifikací. |

#### Render rules

- Display if `isOpen === true` and `notification !== null`.
- Do not display if `isOpen === false` or `notification === null`.
- Display `NotificationBadge` if type and status are available.
- Display resolve button only if notification status is `pending`.
- Display delete button only if `userRole === 'admin'` and `onDelete` is provided.
- Display close button always when modal is open.

---

### 4.10 `UrgentNotificationAlert`

#### Kategorie

`notifications`

#### Popis

Výrazná komponenta pro zobrazení urgentní notifikace, která vznikla dlouhým stiskem tlačítka na IoT zařízení. Urgentní notifikace se odesílá okamžitě bez odpočítávání, proto má být v aplikaci vizuálně dominantní.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `notification` | `Notification` | `-` | Urgentní notifikace k zobrazení. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `onAcknowledge` | `(notificationId: string) => void` | `-` | Callback pro potvrzení převzetí. |
| `onResolve` | `(notificationId: string) => void` | `-` | Callback pro označení jako vyřešené. |
| `onOpenDetail` | `(notificationId: string) => void` | `-` | Callback pro otevření detailu. |
| `onOpenDeviceDetail` | `(deviceId: string) => void` | `-` | Callback pro otevření detailu zařízení. |
| `isProcessing` | `boolean` | `false` | Určuje, zda probíhá akce nad urgentní notifikací. |

#### Render rules

- Display if notification type is `urgent` and status is `pending`.
- Do not display for standard notifications.
- Do not display after notification status changes to `resolved` or `cancelled`.
- Display acknowledge button if `onAcknowledge` is provided.
- Display resolve button if `onResolve` is provided.
- Display open device detail button only if `userRole === 'admin'`.

---

### 4.11 `NotificationHistoryPage`

#### Kategorie

`page`

#### Popis

Stránka zobrazující historii notifikací odeslaných z IoT zařízení. Slouží pro zpětný přehled, dohledání událostí a analytické účely.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `notifications` | `Notification[]` | `[]` | Historické notifikace odpovídající filtrům. |
| `filters` | `NotificationFilters` | `{}` | Aktuální filtry historie. |
| `devices` | `Device[]` | `[]` | Zařízení dostupná pro filtrování. |
| `isLoading` | `boolean` | `false` | Určuje, zda se historie načítá. |
| `error` | `string \| null` | `null` | Chybová zpráva při načítání historie. |
| `onFilterChange` | `(filters: NotificationFilters) => void` | `-` | Callback při změně filtrů. |
| `onOpenDetail` | `(notificationId: string) => void` | `-` | Callback pro otevření detailu notifikace. |

#### Render rules

- Display if user is authenticated.
- Display inside `AppLayout` as protected page.
- Display `LoadingState` if `isLoading` is true.
- Display `ErrorState` if `error` is not null.
- Display `NotificationFilters` above list.
- Display `NotificationList` if notifications are loaded and not empty.
- Display `EmptyState` if no notification matches current filters.
- Admin sees broader history scope than regular user.

---

### 4.12 `NotificationFilters`

#### Kategorie

`notifications`

#### Popis

Filtrační komponenta pro seznam nebo historii notifikací. Umožňuje zúžit zobrazené notifikace podle typu, stavu, zařízení a časového období.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `filters` | `NotificationFilters` | `{}` | Aktuálně nastavené filtry. |
| `devices` | `Device[]` | `[]` | Seznam zařízení dostupných pro filtrování. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `onChange` | `(filters: NotificationFilters) => void` | `-` | Callback při změně filtru. |
| `onReset` | `() => void` | `-` | Callback pro reset filtrů. |
| `isDisabled` | `boolean` | `false` | Určuje, zda jsou filtry neaktivní. |

#### Render rules

- Display on `NotificationHistoryPage` above `NotificationList`.
- Display type filter if filtering by type is available.
- Display status filter if filtering by status is available.
- Display device filter if `devices.length > 0`.
- Display reset button if at least one filter is active and `onReset` is provided.
- Disable filter controls if `isDisabled === true`.

---

### 4.13 `DeviceList`

#### Kategorie

`devices`

#### Popis

Komponenta pro zobrazení seznamu IoT zařízení registrovaných v aplikaci. Admin vidí všechna zařízení a může provádět CRUD operace. Běžný uživatel vidí pouze zařízení, ke kterým má přístup.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `devices` | `Device[]` | `[]` | Seznam zařízení k vykreslení. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `isLoading` | `boolean` | `false` | Určuje, zda se seznam zařízení načítá. |
| `error` | `string \| null` | `null` | Chybová zpráva při načítání zařízení. |
| `onEdit` | `(deviceId: string) => void` | `-` | Callback pro úpravu zařízení. |
| `onDelete` | `(deviceId: string) => void` | `-` | Callback pro smazání zařízení. |
| `onPair` | `(deviceId: string) => void` | `-` | Callback pro párování zařízení. |
| `onOpenDetail` | `(deviceId: string) => void` | `-` | Callback pro otevření detailu zařízení. |

#### Render rules

- Display if devices are loaded and array is not empty.
- Display `LoadingState` if `isLoading` is true.
- Display `ErrorState` if `error` is not null.
- Display `EmptyState` if devices array is empty.
- Render `DeviceCard` once for each device.
- Display edit, delete and pair actions only for admin.

---

### 4.14 `DeviceCard`

#### Kategorie

`devices`

#### Popis

Karta reprezentující jedno IoT zařízení v seznamu zařízení. Zobrazuje základní informace, stav, umístění, přiřazeného uživatele a poslední aktivitu.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `device` | `Device` | `-` | Zařízení, jehož informace se zobrazují. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `onOpenDetail` | `(deviceId: string) => void` | `-` | Callback pro otevření detailu zařízení. |
| `onEdit` | `(deviceId: string) => void` | `-` | Callback pro úpravu zařízení. |
| `onDelete` | `(deviceId: string) => void` | `-` | Callback pro smazání zařízení. |
| `onPair` | `(deviceId: string) => void` | `-` | Callback pro párování zařízení. |
| `onDeactivate` | `(deviceId: string) => void` | `-` | Callback pro deaktivaci zařízení. |
| `isProcessing` | `boolean` | `false` | Určuje, zda nad zařízením probíhá akce. |

#### Render rules

- Display for each device in `DeviceList`.
- Highlight if device status is `offline` or `error`.
- Display `DeviceStatusIndicator` if device status is available.
- Display open detail button if `onOpenDetail` is provided.
- Display edit, delete, pair and deactivate buttons only for admin.
- Disable actions while `isProcessing === true`.

---

### 4.15 `DeviceStatusIndicator`

#### Kategorie

`devices`

#### Popis

Vizuální indikátor aktuálního stavu IoT zařízení. Slouží k rychlému rozpoznání, zda je zařízení online, offline, v chybovém stavu nebo zatím nespárované.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `status` | `'online' \| 'offline' \| 'error' \| 'unpaired'` | `-` | Aktuální stav zařízení. |
| `showLabel` | `boolean` | `true` | Určuje, zda se zobrazí textový popisek. |
| `size` | `'s' \| 'm' \| 'l'` | `'m'` | Velikost indikátoru. |
| `lastSeenAt` | `string` | `-` | Čas poslední aktivity zařízení. |
| `tooltip` | `string` | `-` | Volitelný text tooltipu. |

#### Render rules

- Display wherever device status should be visible.
- Use online style if `status === 'online'`.
- Use warning style if `status === 'offline'` or `status === 'unpaired'`.
- Use error style if `status === 'error'`.
- Display `lastSeenAt` for offline device if available.
- Display label only if `showLabel === true`.

---

### 4.16 `DeviceDetailPage`

#### Kategorie

`page`

#### Popis

Detailní stránka konkrétního IoT zařízení. Zobrazuje základní a technické informace o zařízení, aktuální stav připojení, přiřazeného uživatele, umístění, poslední aktivitu, LED signalizaci a historii notifikací.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `deviceId` | `string` | `-` | Identifikátor zařízení z route parametru. |
| `device` | `Device \| null` | `null` | Načtený detail zařízení. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `notificationHistory` | `Notification[]` | `[]` | Historie notifikací zařízení. |
| `isLoading` | `boolean` | `false` | Určuje, zda se detail načítá. |
| `error` | `string \| null` | `null` | Chybová zpráva při načtení detailu. |
| `onEdit` | `(deviceId: string) => void` | `-` | Callback pro úpravu zařízení. |
| `onDelete` | `(deviceId: string) => void` | `-` | Callback pro smazání zařízení. |
| `onPair` | `(deviceId: string) => void` | `-` | Callback pro párování zařízení. |

#### Render rules

- Display if `deviceId` is present in route.
- Display `LoadingState` if `isLoading` is true.
- Display `ErrorState` if `error` is not null.
- Display `DeviceStatusIndicator` if device status is available.
- Display `LedStatusPreview` if LED status information is available.
- Display notification history section if `notificationHistory.length > 0`.
- Display admin actions only if `userRole === 'admin'`.

---

### 4.17 `AdminDevicesPage`

#### Kategorie

`page/admin`

#### Popis

Administrační stránka pro správu IoT zařízení. Umožňuje adminovi zobrazit všechna zařízení, přidat nové zařízení, upravit existující zařízení, smazat zařízení, spárovat zařízení s uživatelem a sledovat aktuální stav zařízení.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `devices` | `Device[]` | `[]` | Seznam všech zařízení. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `isLoading` | `boolean` | `false` | Určuje, zda se zařízení načítají. |
| `error` | `string \| null` | `null` | Chybová zpráva. |
| `onCreateDevice` | `() => void` | `-` | Callback pro otevření vytvoření zařízení. |
| `onEditDevice` | `(deviceId: string) => void` | `-` | Callback pro úpravu zařízení. |
| `onDeleteDevice` | `(deviceId: string) => void` | `-` | Callback pro smazání zařízení. |
| `onPairDevice` | `(deviceId: string) => void` | `-` | Callback pro párování zařízení. |
| `onOpenDeviceDetail` | `(deviceId: string) => void` | `-` | Callback pro otevření detailu. |

#### Render rules

- Display only if `userRole === 'admin'`.
- Display inside `AppLayout` as protected admin page.
- Display `LoadingState` if `isLoading` is true.
- Display `ErrorState` if `error` is not null.
- Display create device button if `onCreateDevice` is provided.
- Display `DeviceList` if devices array is not empty.
- Display `EmptyState` if devices array is empty.

---

### 4.18 `DeviceForm`

#### Kategorie

`devices`

#### Popis

Formulářová komponenta pro vytvoření nebo úpravu IoT zařízení. Používá se v administrační části aplikace, typicky uvnitř `CreateDeviceModal` nebo `EditDeviceModal`.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `mode` | `'create' \| 'edit'` | `'create'` | Režim formuláře. |
| `initialValues` | `Partial<DeviceFormValues>` | `{}` | Výchozí hodnoty formuláře. |
| `users` | `User[]` | `[]` | Seznam uživatelů pro přiřazení zařízení. |
| `onSubmit` | `(values: DeviceFormValues) => void` | `-` | Callback po odeslání validního formuláře. |
| `onCancel` | `() => void` | `-` | Callback pro zrušení formuláře. |
| `isSubmitting` | `boolean` | `false` | Určuje, zda se formulář ukládá. |
| `error` | `string \| null` | `null` | Chybová zpráva. |
| `disabled` | `boolean` | `false` | Určuje, zda je formulář neaktivní. |

#### Render rules

- Display inside `CreateDeviceModal` or `EditDeviceModal`.
- Display name input always and require it for submit.
- Display serial number input always and require it for submit.
- Disable serial number input in edit mode if it must remain immutable.
- Display assigned user select if users array is available.
- Display error message if `error` is not null.
- Disable submit if required fields are missing, `disabled` is true or `isSubmitting` is true.

---

### 4.19 `CreateDeviceModal`

#### Kategorie

`devices`

#### Popis

Modalové okno pro přidání nového IoT zařízení do systému. Komponenta je dostupná pouze adminovi a obsahuje `DeviceForm` v režimu `create`.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `isOpen` | `boolean` | `false` | Určuje, zda je modal otevřený. |
| `users` | `User[]` | `[]` | Uživatelé, ke kterým lze zařízení přiřadit. |
| `onClose` | `() => void` | `-` | Callback pro zavření modalu. |
| `onCreate` | `(values: DeviceFormValues) => void` | `-` | Callback pro vytvoření zařízení. |
| `isSubmitting` | `boolean` | `false` | Určuje, zda probíhá ukládání. |
| `error` | `string \| null` | `null` | Chybová zpráva. |

#### Render rules

- Display if `isOpen === true`.
- Display only for admin in parent component.
- Display `DeviceForm` in create mode.
- Pass users, `isSubmitting` and `error` to form.
- Disable submit action while `isSubmitting === true`.

---

### 4.20 `EditDeviceModal`

#### Kategorie

`devices`

#### Popis

Modalové okno pro úpravu existujícího IoT zařízení. Obsahuje `DeviceForm` v režimu `edit` s předvyplněnými hodnotami vybraného zařízení.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `device` | `Device \| null` | `null` | Zařízení, které má být upraveno. |
| `isOpen` | `boolean` | `false` | Určuje, zda je modal otevřený. |
| `users` | `User[]` | `[]` | Uživatelé, ke kterým lze zařízení přiřadit. |
| `onClose` | `() => void` | `-` | Callback pro zavření modalu. |
| `onUpdate` | `(deviceId: string, values: DeviceFormValues) => void` | `-` | Callback pro uložení změn. |
| `isSubmitting` | `boolean` | `false` | Určuje, zda probíhá ukládání. |
| `error` | `string \| null` | `null` | Chybová zpráva. |

#### Render rules

- Display if `isOpen === true` and `device !== null`.
- Display only for admin in parent component.
- Display `DeviceForm` in edit mode.
- Use device data as `initialValues`.
- Do not display if `device === null`.

---

### 4.21 `DeleteDeviceConfirmDialog`

#### Kategorie

`devices`

#### Popis

Potvrzovací dialog zobrazený před smazáním IoT zařízení. Slouží jako ochrana proti nechtěnému odstranění zařízení ze systému.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `device` | `Device \| null` | `null` | Zařízení, které má být smazáno. |
| `isOpen` | `boolean` | `false` | Určuje, zda je dialog otevřený. |
| `onClose` | `() => void` | `-` | Callback pro zavření dialogu. |
| `onConfirm` | `(deviceId: string) => void` | `-` | Callback po potvrzení smazání. |
| `isDeleting` | `boolean` | `false` | Určuje, zda probíhá mazání. |
| `error` | `string \| null` | `null` | Chybová zpráva. |

#### Render rules

- Display if `isOpen === true` and `device !== null`.
- Display only for admin in parent component.
- Display warning message always when dialog is open.
- Display confirm delete button if `onConfirm` is provided.
- Disable confirm and cancel while `isDeleting === true`, pokud je potřeba blokovat zavření.
- Display error message if `error` is not null.

---

### 4.22 `DeviceActionsMenu`

#### Kategorie

`devices`

#### Popis

Menu s dostupnými akcemi nad konkrétním IoT zařízením. Seskupuje akce jako otevření detailu, úprava, smazání, spárování nebo deaktivace zařízení.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `device` | `Device` | `-` | Zařízení, nad kterým se akce provádí. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `onOpenDetail` | `(deviceId: string) => void` | `-` | Callback pro otevření detailu. |
| `onEdit` | `(deviceId: string) => void` | `-` | Callback pro úpravu zařízení. |
| `onDelete` | `(deviceId: string) => void` | `-` | Callback pro smazání zařízení. |
| `onPair` | `(deviceId: string) => void` | `-` | Callback pro párování zařízení. |
| `onDeactivate` | `(deviceId: string) => void` | `-` | Callback pro deaktivaci zařízení. |
| `isProcessing` | `boolean` | `false` | Určuje, zda probíhá akce. |

#### Render rules

- Display if at least one action is available for current user.
- Display inside `DeviceCard` or `DeviceDetailPage`.
- Display open detail action if `onOpenDetail` is provided.
- Display edit, delete, pair and deactivate actions only if `userRole === 'admin'`.
- Display pair action if device status is `unpaired` or re-pairing is allowed.
- Disable all actions if `isProcessing === true`.

---

### 4.23 `PairDevicePage`

#### Kategorie

`page`

#### Popis

Stránka pro spárování fyzického IoT zařízení s účtem pečující osoby nebo konkrétním uživatelem. Umožňuje zadat párovací kód nebo sériové číslo, spustit proces párování a zobrazit jeho stav.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `pairingCode` | `string` | `''` | Aktuálně zadaný párovací kód. |
| `pairingStatus` | `'idle' \| 'pending' \| 'success' \| 'error'` | `'idle'` | Aktuální stav párování. |
| `pairingMessage` | `string` | `-` | Zpráva popisující stav párování. |
| `onPairingCodeChange` | `(value: string) => void` | `-` | Callback při změně kódu. |
| `onPair` | `(pairingCode: string) => void` | `-` | Callback pro spuštění párování. |
| `onCancel` | `() => void` | `-` | Callback pro zrušení párování. |
| `onRetry` | `() => void` | `-` | Callback pro opakování po chybě. |

#### Render rules

- Display if user has permission to pair devices.
- Display inside `AppLayout` as protected page.
- Display `PairingCodeInput` if pairing status is `idle` or `error`.
- Display `PairingStatus` if status is `pending`, `success` or `error`.
- Disable pair button if `pairingCode` is empty or status is `pending`.
- Display retry button only if status is `error` and `onRetry` is provided.

---

### 4.24 `PairingCodeInput`

#### Kategorie

`devices`

#### Popis

Vstupní komponenta pro zadání párovacího kódu nebo sériového čísla IoT zařízení. Umožňuje validovat zadanou hodnotu, zobrazit chybu a spustit proces párování.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `value` | `string` | `''` | Aktuálně zadaný párovací kód. |
| `onChange` | `(value: string) => void` | `-` | Callback při změně hodnoty. |
| `onSubmit` | `() => void` | `-` | Callback pro potvrzení kódu. |
| `error` | `string` | `-` | Chybová zpráva. |
| `disabled` | `boolean` | `false` | Určuje, zda je vstup neaktivní. |
| `placeholder` | `string` | `'Zadejte párovací kód'` | Placeholder vstupu. |
| `submitLabel` | `string` | `'Spárovat zařízení'` | Text potvrzovacího tlačítka. |

#### Render rules

- Display when user starts pairing process.
- Display inside `PairDevicePage`.
- Do not display after pairing succeeds unless user starts another pairing.
- Disable submit if value is empty or `disabled === true`.
- Display error message if `error` is defined and not empty.

---

### 4.25 `PairingStatus`

#### Kategorie

`devices`

#### Popis

Komponenta zobrazující aktuální stav procesu párování IoT zařízení. Informuje uživatele, zda se čeká, párování probíhá, bylo úspěšné nebo skončilo chybou.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `status` | `'idle' \| 'pending' \| 'success' \| 'error'` | `'idle'` | Aktuální stav párování. |
| `message` | `string` | `-` | Doplňující zpráva. |
| `deviceName` | `string` | `-` | Název zařízení. |
| `onRetry` | `() => void` | `-` | Callback pro opakování párování. |
| `onContinue` | `() => void` | `-` | Callback pro pokračování po úspěchu. |

#### Render rules

- Display inside `PairDevicePage`.
- Do not display if status is `idle` and no status message is needed.
- Display pending state if `status === 'pending'`.
- Display success state if `status === 'success'`.
- Display error state if `status === 'error'`.
- Display retry button only if status is `error` and `onRetry` is provided.
- Display continue button only if status is `success` and `onContinue` is provided.

---

### 4.26 `DeviceButtonSimulator`

#### Kategorie

`devices`

#### Popis

Vývojová nebo administrační komponenta pro simulaci fyzického tlačítka IoT zařízení. Umožňuje otestovat krátký stisk pro standardní notifikaci a dlouhý stisk pro urgentní notifikaci bez reálného hardwaru.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `deviceId` | `string` | `-` | Identifikátor simulovaného zařízení. |
| `deviceName` | `string` | `-` | Název zařízení. |
| `onStandardPress` | `(deviceId: string) => void` | `-` | Callback pro simulaci krátkého stisku. |
| `onUrgentPress` | `(deviceId: string) => void` | `-` | Callback pro simulaci dlouhého stisku. |
| `disabled` | `boolean` | `false` | Určuje, zda jsou tlačítka neaktivní. |
| `isProcessing` | `boolean` | `false` | Určuje, zda probíhá simulace. |
| `mode` | `'development' \| 'demo' \| 'admin'` | `'development'` | Režim použití simulátoru. |

#### Render rules

- Display only in development, demo, testing or admin diagnostic mode.
- Do not display for regular production users by default.
- Do not display if `deviceId` is missing.
- Display standard press button if `onStandardPress` is provided.
- Display urgent press button if `onUrgentPress` is provided.
- Disable buttons if `disabled` or `isProcessing` is true.

---

### 4.27 `NotificationCountdown`

#### Kategorie

`notifications`

#### Popis

Komponenta zobrazující 5sekundové odpočítávání před odesláním standardní notifikace. Používá se po krátkém stisku tlačítka na IoT zařízení.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `seconds` | `number` | `5` | Počet sekund zbývajících do odeslání. |
| `initialSeconds` | `number` | `5` | Výchozí délka odpočítávání. |
| `isActive` | `boolean` | `true` | Určuje, zda odpočítávání běží. |
| `onCancel` | `() => void` | `-` | Callback pro zrušení notifikace. |
| `onComplete` | `() => void` | `-` | Callback po dokončení odpočítávání. |
| `deviceName` | `string` | `-` | Název zařízení. |
| `disabled` | `boolean` | `false` | Určuje, zda jsou akce neaktivní. |

#### Render rules

- Display after standard short button press.
- Display only for standard notification flow.
- Do not display for urgent long button press.
- Do not display after countdown completes or is cancelled.
- Display `CancelNotificationButton` while countdown is active and `onCancel` is provided.
- Trigger `onComplete` when seconds reaches 0 unless countdown was cancelled.

---

### 4.28 `CancelNotificationButton`

#### Kategorie

`notifications`

#### Popis

Tlačítko pro zrušení standardní notifikace během 5sekundového odpočítávání. Používá se pouze u standardní notifikace, protože urgentní notifikace se odesílá okamžitě bez možnosti zrušení.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `onCancel` | `() => void` | `-` | Callback po kliknutí na tlačítko. |
| `disabled` | `boolean` | `false` | Určuje, zda je tlačítko neaktivní. |
| `label` | `string` | `'Zrušit notifikaci'` | Text tlačítka. |
| `isProcessing` | `boolean` | `false` | Určuje, zda probíhá zrušení. |
| `remainingSeconds` | `number` | `-` | Počet zbývajících sekund. |

#### Render rules

- Display only during standard notification countdown.
- Display inside `NotificationCountdown` if `onCancel` is provided.
- Do not display for urgent notification flow.
- Do not display after countdown completes or notification is sent.
- Disable if `disabled` or `isProcessing` is true.

---

### 4.29 `LedStatusPreview`

#### Kategorie

`devices`

#### Popis

Komponenta pro vizuální náhled LED signalizace IoT zařízení v aplikaci. Pomáhá uživateli nebo adminovi pochopit, co zařízení fyzicky signalizuje pomocí jedné LED diody.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `status` | `'idle' \| 'sending' \| 'success' \| 'error' \| 'urgent'` | `'idle'` | Aktuální stav LED signalizace. |
| `animated` | `boolean` | `true` | Určuje, zda se má LED náhled animovat. |
| `showLabel` | `boolean` | `true` | Určuje, zda se zobrazí textový popis. |
| `size` | `'s' \| 'm' \| 'l'` | `'m'` | Velikost náhledu. |
| `description` | `string` | `-` | Doplňující popis stavu. |

#### Render rules

- Display on `DeviceDetailPage` if LED status information is available.
- Display in help, settings or diagnostic section if LED behavior should be explained.
- Use neutral style for `idle`.
- Use animated style for `sending` if `animated === true`.
- Use success style for `success`.
- Use error style for `error`.
- Use strong visual style for `urgent`.
- Display label only if `showLabel === true`.

---

### 4.30 `LedStatusLegend`

#### Kategorie

`devices`

#### Popis

Legenda vysvětlující význam jednotlivých stavů LED diody na IoT zařízení. Protože zařízení komunikuje pouze pomocí jedné LED diody bez displeje a zvuku, komponenta pomáhá uživateli pochopit jednotlivé stavy.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `items` | `LedStatusLegendItem[]` | `default LED legend items` | Položky legendy. |
| `compact` | `boolean` | `false` | Určuje, zda se zobrazí kompaktní varianta. |
| `showTitle` | `boolean` | `true` | Určuje, zda se zobrazí nadpis. |
| `title` | `string` | `'Význam LED signalizace'` | Nadpis legendy. |
| `showDescription` | `boolean` | `true` | Určuje, zda se zobrazí úvodní popis. |

#### Render rules

- Display on `DeviceDetailPage`, `SettingsPage` or help section.
- Do not display if LED signalization is not relevant for current view.
- Display title if `showTitle === true`.
- Display description if `showDescription === true`.
- Render one legend item for each item in `items`.
- Use compact layout if `compact === true`.

---

### 4.31 `RoleBasedAction`

#### Kategorie

`auth`

#### Popis

Pomocná komponenta pro podmíněné zobrazení konkrétní akce nebo části UI podle role aktuálně přihlášeného uživatele. Používá se zejména pro administrační tlačítka a akce.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `allowedRoles` | `Array<'admin' \| 'user'>` | `-` | Role, kterým je obsah povolen. |
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `children` | `React.ReactNode` | `-` | Obsah zobrazený autorizovanému uživateli. |
| `fallback` | `React.ReactNode` | `null` | Obsah pro uživatele bez oprávnění. |
| `hideIfUnauthorized` | `boolean` | `true` | Určuje, zda se má obsah bez oprávnění skrýt. |

#### Render rules

- Display children if `userRole` is included in `allowedRoles`.
- Do not display children if user is unauthorized and `hideIfUnauthorized === true`.
- Display `fallback` if user is unauthorized and fallback is provided.
- Use for buttons, menu actions, form sections or admin-only controls.

---

### 4.32 `PermissionTooltip`

#### Kategorie

`auth`

#### Popis

Tooltip komponenta vysvětlující, proč uživatel nemá dostupnou určitou akci. Používá se hlavně u tlačítek nebo menu položek, které jsou viditelné, ale zakázané kvůli nedostatečným oprávněním.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `message` | `string` | `-` | Text vysvětlující důvod nedostupnosti. |
| `children` | `React.ReactNode` | `-` | Obalený prvek. |
| `enabled` | `boolean` | `true` | Určuje, zda je tooltip aktivní. |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Umístění tooltipu. |
| `showIcon` | `boolean` | `true` | Určuje, zda se zobrazí informační ikona. |

#### Render rules

- Display around an action if user can see the action but cannot use it.
- Display tooltip if `enabled === true` and `message` is provided.
- Do not display tooltip if `enabled === false` or message is empty.
- Display information icon only if `showIcon === true`.

---

### 4.33 `SettingsPage`

#### Kategorie

`page`

#### Popis

Stránka nastavení aplikace. Umožňuje spravovat nastavení související s doručováním notifikací, zejména povolení push notifikací a urgentního prioritního kanálu.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `userRole` | `'admin' \| 'user'` | `-` | Role aktuálně přihlášeného uživatele. |
| `pushEnabled` | `boolean` | `false` | Zda jsou povolené push notifikace. |
| `urgentChannelEnabled` | `boolean` | `false` | Zda je povolen urgentní prioritní kanál. |
| `canBypassDnd` | `boolean` | `false` | Zda platforma umožňuje obejít režim Nerušit. |
| `isLoading` | `boolean` | `false` | Určuje, zda se nastavení načítají. |
| `isSaving` | `boolean` | `false` | Určuje, zda se změny ukládají. |
| `error` | `string \| null` | `null` | Chybová zpráva. |
| `onEnablePush` | `() => void` | `-` | Callback pro povolení push notifikací. |
| `onToggleUrgentChannel` | `(enabled: boolean) => void` | `-` | Callback pro změnu urgentního kanálu. |
| `onOpenSystemSettings` | `() => void` | `-` | Callback pro otevření systémového nastavení. |

#### Render rules

- Display if user is authenticated.
- Display inside `AppLayout` as protected page.
- Display `LoadingState` if `isLoading` is true.
- Display `ErrorState` if `error` is not null.
- Display `PushNotificationSettings` if notification settings are supported.
- Display `DoNotDisturbWarning` if urgent channel is disabled or DND bypass is unavailable.
- Display admin settings section only if `userRole === 'admin'` and admin-specific settings exist.

---

### 4.34 `PushNotificationSettings`

#### Kategorie

`settings`

#### Popis

Sekce nastavení push notifikací. Uživatel zde vidí, zda jsou push notifikace povolené, a může zapnout urgentní prioritní kanál pro důležité notifikace.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `pushEnabled` | `boolean` | `false` | Zda jsou push notifikace povolené. |
| `urgentChannelEnabled` | `boolean` | `false` | Zda je aktivní urgentní kanál. |
| `canEnablePush` | `boolean` | `true` | Zda lze push notifikace zapnout. |
| `isSaving` | `boolean` | `false` | Určuje, zda se změny ukládají. |
| `error` | `string \| null` | `null` | Chybová zpráva. |
| `onEnablePush` | `() => void` | `-` | Callback pro vyžádání oprávnění. |
| `onToggleUrgentChannel` | `(enabled: boolean) => void` | `-` | Callback pro změnu urgentního kanálu. |
| `onOpenSystemSettings` | `() => void` | `-` | Callback pro otevření systémového nastavení. |

#### Render rules

- Display on `SettingsPage` if notification settings are supported.
- Display push notification status always.
- Display enable push button if `pushEnabled === false` and `onEnablePush` is provided.
- Disable enable button if `canEnablePush === false` or `isSaving === true`.
- Display urgent channel toggle if `pushEnabled === true`.
- Display error message if `error` is not null.

---

### 4.35 `DoNotDisturbWarning`

#### Kategorie

`settings`

#### Popis

Upozornění na možné omezení doručování notifikací v režimu Nerušit. Informuje uživatele, že běžné push notifikace mohou být systémem zpožděny nebo potlačeny.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `urgentChannelEnabled` | `boolean` | `false` | Zda je aktivní urgentní prioritní kanál. |
| `canBypassDnd` | `boolean` | `false` | Zda lze obejít režim Nerušit. |
| `pushEnabled` | `boolean` | `false` | Zda jsou push notifikace povolené. |
| `onOpenSettings` | `() => void` | `-` | Callback pro otevření nastavení. |
| `showAction` | `boolean` | `true` | Určuje, zda se zobrazí akční tlačítko. |
| `compact` | `boolean` | `false` | Určuje, zda se zobrazí zkrácená varianta. |

#### Render rules

- Display if `pushEnabled === false`.
- Display if `urgentChannelEnabled === false`.
- Display if `canBypassDnd === false`.
- Do not display if push notifications are enabled, urgent channel is enabled and DND bypass is available.
- Display open settings button if `showAction === true` and `onOpenSettings` is provided.
- Use compact text if `compact === true`.

---

### 4.36 `EmptyState`

#### Kategorie

`common`

#### Popis

Univerzální komponenta pro zobrazení prázdného stavu. Používá se v situacích, kdy nejsou dostupná žádná data k zobrazení, například žádné notifikace, žádná zařízení nebo žádné výsledky filtrů.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `title` | `string` | `-` | Hlavní text prázdného stavu. |
| `description` | `string` | `-` | Doplňující popis. |
| `actionLabel` | `string` | `-` | Text akčního tlačítka. |
| `onAction` | `() => void` | `-` | Callback po kliknutí na tlačítko. |
| `icon` | `React.ReactNode` | `-` | Ikona nebo ilustrace. |
| `isActionDisabled` | `boolean` | `false` | Určuje, zda je akce neaktivní. |

#### Render rules

- Display if requested data array is empty and loading has finished.
- Display if no results match current filters.
- Do not display while data is loading.
- Do not display if error state should be shown instead.
- Display action button only if `actionLabel` and `onAction` are provided.

---

### 4.37 `ErrorState`

#### Kategorie

`common`

#### Popis

Univerzální komponenta pro zobrazení chybového stavu. Používá se v situacích, kdy se nepodaří načíst data, uložit změny nebo provést požadovanou akci.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `title` | `string` | `-` | Hlavní text chyby. |
| `description` | `string` | `-` | Doplňující popis chyby. |
| `errorCode` | `string` | `-` | Volitelný technický kód chyby. |
| `onRetry` | `() => void` | `-` | Callback pro opakování akce. |
| `retryLabel` | `string` | `'Zkusit znovu'` | Text retry tlačítka. |
| `icon` | `React.ReactNode` | `-` | Ikona nebo ilustrace. |
| `isRetrying` | `boolean` | `false` | Určuje, zda probíhá opakování. |

#### Render rules

- Display if data loading, saving or requested action fails.
- Display instead of main content when content cannot be safely shown.
- Do not display if error is resolved and valid data is available.
- Display retry button if `onRetry` is provided.
- Disable retry button if `isRetrying === true`.
- Display error code if `errorCode` is provided.

---

### 4.38 `LoadingState`

#### Kategorie

`common`

#### Popis

Univerzální komponenta pro zobrazení načítacího stavu v aplikaci. Používá se v situacích, kdy aplikace čeká na data z API nebo provádí delší operaci.

#### Props

| Name | Type | Default value | Description |
|---|---|---:|---|
| `message` | `string` | `'Načítám data...'` | Text zobrazený během načítání. |
| `description` | `string` | `-` | Doplňující text. |
| `size` | `'s' \| 'm' \| 'l'` | `'m'` | Velikost načítacího indikátoru. |
| `fullPage` | `boolean` | `false` | Určuje, zda se zobrazí celostránkově. |
| `showSpinner` | `boolean` | `true` | Určuje, zda se zobrazí spinner. |
| `delayMs` | `number` | `0` | Zpoždění před zobrazením loading stavu. |

#### Render rules

- Display while data or action is loading.
- Display instead of main content if required data is not ready yet.
- Do not display if loading has finished successfully.
- Do not display if error state should be shown instead.
- Display spinner only if `showSpinner === true`.
- Use full page variant if `fullPage === true`.
- Use section variant if `fullPage === false`.
- Display after `delayMs` if greater than 0.

---

## 5. Doporučené pořadí implementace

1. `AppLayout`
2. `Navbar`
3. `ProtectedRoute`
4. `RoleBasedAction`
5. `LoadingState`
6. `ErrorState`
7. `EmptyState`
8. `NotificationBadge`
9. `NotificationItem`
10. `NotificationList`
11. `UrgentNotificationAlert`
12. `DeviceStatusIndicator`
13. `DeviceCard`
14. `DeviceList`
15. `DashboardPage`
16. `AdminDevicesPage`
17. `DeviceForm`
18. `CreateDeviceModal`
19. `EditDeviceModal`
20. `DeleteDeviceConfirmDialog`
21. `DeviceActionsMenu`
22. `NotificationFilters`
23. `NotificationHistoryPage`
24. `DeviceDetailPage`
25. `PairingCodeInput`
26. `PairingStatus`
27. `PairDevicePage`
28. `NotificationCountdown`
29. `CancelNotificationButton`
30. `DeviceButtonSimulator`
31. `LedStatusPreview`
32. `LedStatusLegend`
33. `SettingsPage`
34. `PushNotificationSettings`
35. `DoNotDisturbWarning`
36. `PermissionTooltip`

---

## 6. Generační poznámky

Při generování React komponent z tohoto markdownu platí:

- Každá sekce `###` představuje jednu komponentu.
- Hodnota v části `Kategorie` určuje cílovou složku.
- Tabulka `Props` určuje TypeScript interface komponenty.
- Sekce `Render rules` slouží pro podmíněné vykreslování, disabled stavy a role-based logiku.
- Popis komponenty může být použit do technické dokumentace nebo jako komentář ke komponentě.
- Komponenty s kategorií `page` nebo `page/admin` reprezentují routovatelné stránky.
- Komponenty s kategorií `common` mají být univerzálně znovupoužitelné a neměly by obsahovat business logiku.
- Komponenty s kategorií `auth` řeší role, oprávnění a viditelnost.
- Komponenty s kategorií `devices`, `notifications` a `settings` mohou obsahovat doménovou logiku nebo callbacky související s danou oblastí.

