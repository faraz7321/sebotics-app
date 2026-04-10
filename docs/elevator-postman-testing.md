# Elevator System — Postman Testing Guide

Base URL: `http://localhost:4000`

---

## 1. Get a JWT token (for operator WS auth)

**POST** `http://localhost:4000/api/auth/login`

```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

Save the `accessToken` from the response — you'll need it for the operator WebSocket.

---

## 2. Create a transaction (robot REST call)

**POST** `http://localhost:4000/api/ed/take-elevator`

**Headers:**
```
Authorization: APPCODE e63f72531dd14ea2aa9959730861cb10
Content-Type: application/json
```

**Body:**
```json
{
  "deviceId": "robot-001",
  "buildingId": "building-A",
  "startFloorName": "1",
  "endFloorName": "5"
}
```

**Expected response:**
```json
{
  "status": 200,
  "message": "ok",
  "data": {
    "elevatorId": "A1B2C3D4E5F6",
    "transactionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "transactionUrl": "ws://localhost:4000/ws/elevator/transaction/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

Save `transactionId` and `transactionUrl` for the next steps.

---

## 3. Connect Robot WebSocket

Open a **WebSocket** tab in Postman.

**URL:** `ws://localhost:4000/ws/elevator/transaction/{transactionId}`

(Use the `transactionUrl` from step 2 — no auth needed for robot WS.)

**On connect, server sends two messages:**

```json
{"messageType":"transaction-step","step":"transaction-start"}
```
```json
{"messageType":"elevator-state","state":{"elevatorId":"...","currentFloor":1,"currentFloorName":"1","timestamp":1234567890}}
```

---

## 4. Connect Operator WebSocket

Open another **WebSocket** tab in Postman.

**URL:** `ws://localhost:4000/ws/elevator/operators?token={accessToken}`

(Use the JWT from step 1.)

**On connect, server sends:**

```json
{"type":"CONNECTION_READY","connectionId":"...","user":{"userId":"...","username":"...","role":"ADMIN"}}
```

Then for each active transaction:
```json
{"type":"ELEVATOR_REQUEST","transactionId":"...","robotId":"robot-001","buildingId":"building-A","from":"1","to":"5","state":"WAITING_FOR_OPERATOR"}
```

---

## 5. Full Happy-Path Flow (messages to send in order)

### Step 5a — Operator: Claim the transaction

**Send from operator WS:**
```json
{"type":"CLAIM_TRANSACTION","transactionId":"PASTE_TRANSACTION_ID"}
```

**Operator receives:**
```json
{"type":"CLAIM_ACCEPTED","transactionId":"...","transaction":{...}}
```
```json
{"type":"TRANSACTION_ASSIGNED","transactionId":"...","assignedUserId":"...","assignedUsername":"..."}
```

### Step 5b — Operator: Call elevator

**Send from operator WS:**
```json
{"type":"CALL_ELEVATOR","transactionId":"PASTE_TRANSACTION_ID"}
```

State: `WAITING_FOR_OPERATOR` → `WAITING_FOR_ELEVATOR`

**Robot receives:**
```json
{"messageType":"transaction-step","step":"wait-enter"}
```

**Operator receives:**
```json
{"type":"TRANSACTION_UPDATE","transactionId":"...","state":"WAITING_FOR_ELEVATOR","action":"CALL_ELEVATOR"}
```

### Step 5c — Operator: Elevator arrived at entry floor

**Send from operator WS:**
```json
{"type":"ARRIVED_ENTRY","transactionId":"PASTE_TRANSACTION_ID","currentFloorName":"1","currentFloor":1}
```

State: `WAITING_FOR_ELEVATOR` → `ARRIVED_ENTRY`

**Robot receives:**
```json
{"messageType":"transaction-step","step":"arrived-enter-floor"}
```
```json
{"messageType":"elevator-state","state":{"elevatorId":"...","currentFloor":1,"currentFloorName":"1","timestamp":...}}
```

### Step 5d — Robot: Start entering

**Send from robot WS:**
```json
{"action":"start-enter","timestamp":1712700000000}
``` 

State: `ARRIVED_ENTRY` → `ENTERING`

**Robot receives:**
```json
{"messageType":"affirm-action","action":"start-enter","actionTs":1712700000000}
```

**Operator receives:**
```json
{"type":"ROBOT_ACTION","transactionId":"...","action":"start-enter","state":"ENTERING"}
```

### Step 5e — Robot: Entered successfully

**Send from robot WS:**
```json
{"action":"enter-success","timestamp":1712700001000}
```

State: `ENTERING` → `INSIDE`

**Robot receives:**
```json
{"messageType":"affirm-action","action":"enter-success","actionTs":1712700001000}
```
```json
{"messageType":"transaction-step","step":"enter-success"}
```

### Step 5f — Operator: Dispatch elevator to exit floor

**Send from operator WS:**
```json
{"type":"DISPATCHED","transactionId":"PASTE_TRANSACTION_ID","currentFloorName":"5","currentFloor":5}
```

State: `INSIDE` → `ARRIVED_EXIT`

**Robot receives:**
```json
{"messageType":"transaction-step","step":"wait-exit"}
```
```json
{"messageType":"elevator-state","state":{"elevatorId":"...","currentFloor":5,"currentFloorName":"5","timestamp":...}}
```

### Step 5g — Operator: Elevator arrived at exit floor

**Send from operator WS:**
```json
{"type":"ARRIVED_EXIT","transactionId":"PASTE_TRANSACTION_ID","currentFloorName":"5","currentFloor":5}
```

State: `ARRIVED_EXIT` → `ARRIVED_EXIT` (stays, but sends `arrived-exit-floor` to robot)

**Robot receives:**
```json
{"messageType":"transaction-step","step":"arrived-exit-floor"}
```

### Step 5h — Robot: Start exiting

**Send from robot WS:**
```json
{"action":"start-exit","timestamp":1712700002000}
```

State: `ARRIVED_EXIT` → `EXITING`

**Robot receives:**
```json
{"messageType":"affirm-action","action":"start-exit","actionTs":1712700002000}
```

### Step 5i — Robot: Exited successfully

**Send from robot WS:**
```json
{"action":"exit-success","timestamp":1712700003000}
```

State: `EXITING` → `COMPLETED`

**Robot receives:**
```json
{"messageType":"affirm-action","action":"exit-success","actionTs":1712700003000}
```
```json
{"messageType":"transaction-step","step":"transaction-success"}
```

Both WebSocket connections close after ~1 second.

---

## 6. Alternative Flows

### Robot cancels mid-transaction

**Send from robot WS:**
```json
{"action":"cancel-transaction","timestamp":1712700000000}
```

### Operator fails transaction (from any active state)

**Send from operator WS:**
```json
{"type":"FAIL","transactionId":"PASTE_TRANSACTION_ID"}
```

### Robot cancel via REST (e.g. from AutoXing cloud)

**DELETE** `http://localhost:4000/api/ed/transaction/{transactionId}`

**Headers:**
```
Authorization: APPCODE e63f72531dd14ea2aa9959730861cb10
```

### Robot fails to enter

**Send from robot WS:**
```json
{"action":"enter-failed","timestamp":1712700000000}
```

### Robot gives up entering

**Send from robot WS:**
```json
{"action":"give-up-enter","timestamp":1712700000000}
```

### Robot fails to exit

**Send from robot WS:**
```json
{"action":"exit-failed","timestamp":1712700000000}
```

### Robot gives up exiting

**Send from robot WS:**
```json
{"action":"give-up-exit","timestamp":1712700000000}
```

---

## 7. State Machine Quick Reference

```
WAITING_FOR_OPERATOR
  ├─ operator CALL_ELEVATOR → WAITING_FOR_ELEVATOR
  └─ operator FAIL → FAILED

WAITING_FOR_ELEVATOR
  ├─ operator ARRIVED_ENTRY → ARRIVED_ENTRY
  └─ operator FAIL → FAILED

ARRIVED_ENTRY
  ├─ robot start-enter → ENTERING
  ├─ robot give-up-enter → FAILED
  └─ operator FAIL → FAILED

ENTERING
  ├─ robot enter-success → INSIDE
  ├─ robot enter-failed → FAILED
  ├─ robot give-up-enter → FAILED
  └─ operator FAIL → FAILED

INSIDE
  ├─ operator DISPATCHED → ARRIVED_EXIT
  └─ operator FAIL → FAILED

ARRIVED_EXIT
  ├─ operator ARRIVED_EXIT → ARRIVED_EXIT (re-sends step)
  ├─ operator COMPLETE → COMPLETED ✅
  ├─ robot start-exit → EXITING
  └─ operator FAIL → FAILED

EXITING
  ├─ robot exit-success → COMPLETED ✅
  ├─ robot exit-failed → FAILED
  ├─ robot give-up-exit → FAILED
  └─ operator FAIL → FAILED
```
