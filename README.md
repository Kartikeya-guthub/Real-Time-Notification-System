# Real-Time Notification System

A Node.js backend that persists user notifications in MongoDB and delivers them in real-time over Socket.IO when possible.

## Overview

This system solves the “notify a user reliably” problem: every notification is written to the database first, then delivered over WebSockets as a best-effort optimization. If the recipient is offline, the notification remains in MongoDB and is replayed when they reconnect.

## Architecture (High Level)

- Data flow: HTTP request → MongoDB write → WebSocket emit (if online)
- MongoDB is the source of truth: notifications are never “only in memory”
- WebSockets are best-effort delivery: emits can fail or be unavailable without losing data

## Core Features

- Authentication (HTTP + WebSocket)
- Notification persistence (MongoDB)
- Real-time delivery to online users
- Offline delivery on reconnect
- Time-window deduplication
- Rate limiting

## Delivery Semantics

### Notification lifecycle

- `created` — persisted in MongoDB and ready to deliver
- `delivered` — emitted to at least one active socket; `deliveredAt` set
- `read` — explicitly marked via HTTP; `readAt` set

### Online delivery

- Condition: recipient has at least one active socket in the in-memory `onlineUsers` map
- “Online” means: `onlineUsers.get(userId)` returns a `Set` with one or more socket IDs
- Multiple sockets: the same notification is emitted to every socket ID in the set

### Offline delivery

- If recipient is offline at creation time: nothing is emitted; the notification stays `created` in MongoDB
- On reconnect: the server queries `created` notifications for that user and emits them
- Ordering: replay is attempted in ascending `createdAt` order

### Deduplication

- Application-level, time-window deduplication to reduce obvious notification spam
- Not a guarantee of exactly-once delivery

## Guarantees & Non-Goals

### Guarantees

- Persistence before delivery (DB write happens before any emit)
- Best-effort real-time delivery when recipient is online
- Offline replay on reconnect (pending `created` notifications are emitted)
- Reduced duplicate notifications using time-window dedupe

### Non-goals

- Exactly-once delivery
- Business-state enforcement (e.g., enforcing unique follows/likes)
- Distributed scaling (Redis adapters, queues, cross-instance online state)

## Authentication

### HTTP

- JWT is issued at login and stored in an `httpOnly` cookie named `token`
- Protected routes require the cookie

### WebSocket

- JWT is passed in the Socket.IO handshake: `auth: { token: "<JWT>" }`
- Socket connections are rejected if unauthenticated

## API Reference (Minimal)

### Auth

- `POST /signup` — create a new user
- `POST /login` — sets the `token` cookie
- `POST /logout` — clears the `token` cookie
- `GET /me` — returns current user

### Actions (generate notifications)

- `POST /users/:id/follow`
  - Creates a `follow` notification for user `:id`
  - Delivers instantly if the recipient is online
  - Uses deduplication to block rapid repeats

- `POST /users/:id/like`
  - Creates a `like` notification for user `:id`
  - Delivers instantly if the recipient is online
  - Uses deduplication to block rapid repeats

### Notifications

- `GET /notifications` — list notifications for the current user
  - Filters: `?status=created|delivered|read`
  - Pagination: `?page=1&limit=20`
- `PATCH /notifications/:id/read` — mark one notification as read
- `PATCH /notifications/read-all` — mark all as read

## Real-Time Events

### Emitted events

- `notification`

Payload example:

```json
{
  "id": "6972261a16cce909e53a652e",
  "type": "follow",
  "data": { "message": "user@example.com started following you." },
  "createdAt": "2026-01-22T12:34:56.789Z"
}
```

## Rate Limiting

- Auth endpoints are rate limited to reduce brute-force attempts
- Action endpoints are rate limited to reduce spam (follow/like storms)

## Project Structure

- `src/` — application code (routes, models, services, middleware)
- `test/` — local Socket.IO client for manual testing

## Local Development

### Setup

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://127.0.0.1:27017/notifications
JWT_SECRET=replace_me
PORT=3000
NODE_ENV=development
```

### Run

```bash
npm run dev
```

### Local Socket.IO test

1) Put a valid JWT into `test/socketClient.js`
2) Run:

```bash
cd test
node socketClient.js
```

To receive notifications in the socket client, the client must be connected as the recipient user.

## Design Notes

- Socket.IO instance is initialized at startup and injected into delivery services to avoid circular dependencies
- Persistence is decoupled from delivery: MongoDB write is the primary operation; WebSocket emit is an optimization
- No Redis/queue in the baseline: keeps the system simple and single-instance focused

## Known Limitations

- `onlineUsers` is in-memory: server restarts forget online state
- Not designed for multi-instance horizontal scaling without a shared Socket.IO adapter and shared online state
- Delivery is best-effort: emits may be missed during transient disconnects

## Possible Extensions

- Socket.IO Redis adapter for multi-instance delivery
- Push notifications (FCM/APNS)
- Retry queue / background worker for more robust delivery attempts
