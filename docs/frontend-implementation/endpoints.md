# API Endpoints — Frontend Integration Guide

## Base URL

```
http://localhost:3000  (development)
```

## Response Format

All responses use consistent JSON format:

- `_id` is renamed to `id` (string)
- MongoDB `__v` field is removed
- Timestamps are ISO 8601 strings

### Success responses

Single object:
```json
{ "id": "...", "firstName": "...", ... }
```

Paginated list:
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "pageSize": 50, "total": 100 }
}
```

### Error responses

```json
{
  "error": {
    "code": "errorCode",
    "message": "Human-readable message.",
    "details": {}
  }
}
```

## Pagination

Endpoints returning lists accept query parameters:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | - | Page number (min 1) |
| `pageSize` | 50 | 200 | Items per page |

Example: `GET /devices/all?page=2&pageSize=10`

---

## Endpoint Reference

### Health

#### GET /health

Public endpoint. No authentication required.

**Response (200 / 503):**
```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-04-29T10:00:00.000Z"
}
```

---

### Auth

All auth endpoints are rate-limited to **20 requests per 15 minutes** per IP.

#### POST /auth/register

Register a new caregiver with an invitation code.

**Request:**
```json
{
  "firstName": "Marie",
  "lastName": "Nováková",
  "email": "marie@example.com",
  "password": "securePass123",
  "phone": "+420123456789",
  "invitationCode": "A1B2C3D4"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `firstName` | yes | |
| `lastName` | yes | |
| `email` | yes | Must be unique, auto-lowercased |
| `password` | yes | Min 8 characters |
| `phone` | no | |
| `invitationCode` | yes | 8-char hex code from admin |

**Response (201):**
```json
{
  "accessToken": "eyJ...",
  "caregiver": {
    "id": "...",
    "firstName": "Marie",
    "lastName": "Nováková",
    "email": "marie@example.com",
    "phone": "+420123456789",
    "role": "caregiver",
    "notificationPreferences": {
      "sound": true,
      "vibration": true,
      "doNotDisturb": false
    },
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Also sets `refreshToken` httpOnly cookie.

**Errors:**
| Code | Status | Cause |
|------|--------|-------|
| `invitationRequired` | 400 | No invitation code provided |
| `invitationInvalid` | 400 | Code is invalid, expired, or already used |
| `weakPassword` | 400 | Password shorter than 8 characters |
| `emailTaken` | 409 | Email already registered |

---

#### POST /auth/login

**Request:**
```json
{
  "email": "marie@example.com",
  "password": "securePass123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJ..."
}
```

Also sets `refreshToken` httpOnly cookie.

**Errors:**
| Code | Status | Cause |
|------|--------|-------|
| `invalidCredentials` | 401 | Wrong email or password |

---

#### POST /auth/refresh

No request body. Uses the `refreshToken` cookie automatically.

**Response (200):**
```json
{
  "accessToken": "eyJ..."
}
```

Sets new `refreshToken` cookie (token rotation).

**Errors:**
| Code | Status | Cause |
|------|--------|-------|
| `noRefreshToken` | 401 | Cookie missing |
| `refreshTokenInvalid` | 401 | Token expired or invalid |
| `refreshTokenReuse` | 401 | Reuse detected — all sessions revoked |

---

#### POST /auth/logout

No request body.

**Response:** 204 No Content

Clears `refreshToken` cookie and removes token from DB.

---

### Users (Patients)

Users represent patients — people with IoT buttons. They do not log into the system.

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/users/create` | POST | admin | Create a patient |
| `/users/all` | GET | admin | List all patients |
| `/users/get/:id` | GET | admin, caregiver | Get patient detail |
| `/users/edit/:id` | PUT | admin | Update patient |
| `/users/delete/:id` | DELETE | admin | Soft-delete patient |

#### POST /users/create

**Auth:** Bearer token (admin only)

**Request:**
```json
{
  "firstName": "Jan",
  "lastName": "Novák",
  "notes": "Diabetik, špatně slyší"
}
```

| Field | Required | Max length |
|-------|----------|------------|
| `firstName` | yes | 50 |
| `lastName` | yes | 50 |
| `notes` | no | 500 |

**Response (201):**
```json
{
  "id": "...",
  "firstName": "Jan",
  "lastName": "Novák",
  "notes": "Diabetik, špatně slyší",
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### GET /users/all

**Auth:** Bearer token (admin only)

**Query:** `?page=1&pageSize=10`

**Response (200):** Paginated list of users.

#### GET /users/get/:id

**Auth:** Bearer token (admin or caregiver)

Caregiver can only access users linked to their devices. Returns 403 if the caregiver has no device assigned to this user.

**Response (200):** Single user object.

#### PUT /users/edit/:id

**Auth:** Bearer token (admin only)

All fields optional (partial update):
```json
{
  "notes": "Updated notes"
}
```

#### DELETE /users/delete/:id

**Auth:** Bearer token (admin only)

Soft delete — sets `isActive: false`. **Response:** 204 No Content.

---

### Caregivers

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/caregivers/all` | GET | admin | List all caregivers |
| `/caregivers/get/:id` | GET | admin | Get caregiver detail |
| `/caregivers/edit/:id` | PUT | admin | Update caregiver |
| `/caregivers/delete/:id` | DELETE | admin | Soft-delete caregiver |

Caregivers are created via `/auth/register` with an invitation code. There is no direct create endpoint.

#### GET /caregivers/all

**Auth:** Bearer token (admin only)

**Query:** `?page=1&pageSize=10`

**Response (200):** Paginated list. Fields: `id`, `firstName`, `lastName`, `email`, `phone`, `role`, `notificationPreferences`, `isActive`, `createdAt`, `updatedAt`.

Sensitive fields (`passwordHash`, `refreshTokens`, `pushSubscription`) are never returned.

#### PUT /caregivers/edit/:id

**Auth:** Bearer token (admin only)

All fields optional:
```json
{
  "firstName": "Eva",
  "phone": "+420111222333",
  "role": "admin",
  "notificationPreferences": {
    "doNotDisturb": true
  }
}
```

Updatable fields: `firstName`, `lastName`, `email`, `phone`, `pushSubscription`, `notificationPreferences`, `isActive`, `role`.

---

### Devices

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/devices/create` | POST | admin | Create device |
| `/devices/all` | GET | admin, caregiver | List devices |
| `/devices/get/:id` | GET | admin, caregiver | Get device detail |
| `/devices/edit/:id` | PUT | admin | Update device |
| `/devices/delete/:id` | DELETE | admin | Soft-delete device |

#### POST /devices/create

**Auth:** Bearer token (admin only)

**Request:**
```json
{
  "name": "Tlačítko obývák",
  "userId": "...",
  "caregiverId": "..."
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | Device display name |
| `userId` | no* | Patient this device belongs to |
| `caregiverId` | no* | Caregiver receiving notifications |

*Both `userId` and `caregiverId` are required for the device to send notifications. Without them, `POST /notifications/create` will fail.

**Response (201):** Device object. A `deviceSecret` is generated server-side for HMAC authentication but is **not returned** in the response. Retrieve it from the database for gateway configuration.

#### GET /devices/all

**Auth:** Bearer token

- **Admin:** returns all devices
- **Caregiver:** returns only devices assigned to them

**Query:** `?page=1&pageSize=10`

#### GET /devices/get/:id

**Auth:** Bearer token

- **Admin:** can access any device
- **Caregiver:** can only access their own devices (403 otherwise)

#### PUT /devices/edit/:id

**Auth:** Bearer token (admin only)

All fields optional:
```json
{
  "caregiverId": "new-caregiver-id"
}
```

Updatable fields: `name`, `userId`, `caregiverId`, `macAddress`, `firmwareVersion`, `lastSeenAt`.

---

### Notifications

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/notifications/create` | POST | HMAC | device | Create notification (gateway only) |
| `/notifications/all` | GET | JWT | caregiver, admin | List own notifications |
| `/notifications/stream` | GET | JWT/query | caregiver | SSE real-time stream |

#### POST /notifications/create

**Auth:** HMAC-SHA256 (IoT gateway only). Rate limited to 10 req/min.

**Headers:**
```
X-Device-Id: <device_id>
X-Timestamp: <unix_seconds>
X-Signature: <hmac_sha256_hex>
```

**Request:**
```json
{
  "type": "standard"
}
```

`type` must be `"standard"` or `"urgent"`.

The HMAC signature is computed as: `HMAC-SHA256(deviceSecret, "POST|/notifications/create|<unix_timestamp>|<JSON.stringify(body)>")`

Example payload string: `POST|/notifications/create|1714400000|{"type":"standard"}`

**Response (201):** Notification object with `status`, `sentAt`, etc.

#### GET /notifications/all

**Auth:** Bearer token (caregiver or admin)

Always filtered to the authenticated caregiver's notifications. Optional device filter.

**Query:** `?page=1&pageSize=10&deviceId=<optional>`

**Response (200):** Paginated list. Each notification includes populated device name:
```json
{
  "data": [
    {
      "id": "...",
      "deviceId": { "id": "...", "name": "Tlačítko obývák" },
      "userId": "...",
      "caregiverId": "...",
      "type": "urgent",
      "status": "sent",
      "sentAt": "...",
      "createdAt": "..."
    }
  ],
  "meta": { "page": 1, "pageSize": 50, "total": 5 }
}
```

#### GET /notifications/stream

**Auth:** JWT via query parameter (EventSource doesn't support headers)

```
GET /notifications/stream?token=<accessToken>
```

Server-Sent Events stream. Sends real-time events when new notifications arrive:
```
data: {"id":"...","type":"urgent","deviceName":"Tlačítko obývák","createdAt":"..."}
```

See [notifications.md](notifications.md) for full SSE integration guide.

---

### Push Notifications

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/push/subscribe` | POST | caregiver, admin | Save push subscription |
| `/push/unsubscribe` | DELETE | caregiver, admin | Remove push subscription |
| `/push/vapid-public-key` | GET | caregiver, admin | Get VAPID public key |

See [notifications.md](notifications.md) for full Web Push integration guide.

#### POST /push/subscribe

**Auth:** Bearer token

**Request:** (Web Push subscription object from `PushManager.subscribe()`)
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "base64url...",
    "auth": "base64url..."
  }
}
```

**Response (200):** `{ "ok": true }`

#### DELETE /push/unsubscribe

**Auth:** Bearer token

**Response (200):** `{ "ok": true }`

#### GET /push/vapid-public-key

**Auth:** Bearer token

**Response (200):**
```json
{
  "vapidPublicKey": "BCQYVw..."
}
```

---

### Invitations

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/invitations/create` | POST | admin | Create invitation code |
| `/invitations/all` | GET | admin | List unused invitations |
| `/invitations/revoke/:id` | DELETE | admin | Revoke an invitation |

#### POST /invitations/create

**Auth:** Bearer token (admin only)

**Request:**
```json
{
  "ttlHours": 24,
  "role": "caregiver"
}
```

| Field | Default | Notes |
|-------|---------|-------|
| `ttlHours` | 24 | Hours until expiry |
| `role` | `"caregiver"` | `"caregiver"` or `"admin"` |

**Response (201):**
```json
{
  "id": "...",
  "code": "A1B2C3D4",
  "role": "caregiver",
  "createdBy": "...",
  "expiresAt": "...",
  "usedAt": null,
  "usedBy": null,
  "createdAt": "..."
}
```

#### GET /invitations/all

**Auth:** Bearer token (admin only)

Returns only unused invitations, sorted newest first. **Note:** This endpoint returns a plain JSON array, not a paginated `{ data, meta }` object.

#### DELETE /invitations/revoke/:id

**Auth:** Bearer token (admin only)

Hard-deletes the invitation. Cannot revoke already-used invitations.

**Response:** 204 No Content.

---

## Error Code Reference

| Code | Status | Description |
|------|--------|-------------|
| `unauthorized` | 401 | Missing or malformed Authorization header |
| `tokenExpired` | 401 | JWT access token has expired |
| `tokenInvalid` | 401 | JWT access token is invalid |
| `forbidden` | 403 | Insufficient permissions for this resource |
| `notFound` | 404 | Resource not found or inactive |
| `validationError` | 400 | Request body validation failed |
| `invitationRequired` | 400 | No invitation code provided |
| `invitationInvalid` | 400 | Invitation invalid, expired, or used |
| `weakPassword` | 400 | Password shorter than 8 characters |
| `emailTaken` | 409 | Email already registered |
| `invalidCredentials` | 401 | Wrong email or password |
| `noRefreshToken` | 401 | Refresh token cookie missing |
| `refreshTokenInvalid` | 401 | Refresh token expired or invalid |
| `refreshTokenReuse` | 401 | Token reuse detected, all sessions revoked |
| `deviceAuthMissing` | 401 | Missing HMAC headers |
| `timestampExpired` | 401 | Timestamp outside ±5 min window |
| `deviceNotFound` | 401 | Device not found or inactive |
| `signatureInvalid` | 401 | HMAC signature mismatch |
| `caregiverNotFound` | 422 | Target caregiver not found or inactive |
| `rateLimitExceeded` | 429 | Too many requests |
