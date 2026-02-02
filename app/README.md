# Sebotics App (Client)

A single codebase client application for iOS, Android, and Windows that lets end users operate robots assigned to their account by Sebotics.

## Scope

### Operator experience
- Call a robot to a destination (table/zone/station)
- Send a robot to another destination (kitchen, bar, base)
- Auto-assign the next available robot or select a specific robot
- Queue tasks when robots are busy (with optional priority)
- See robot status (online/offline, idle/busy/charging/error)
- Optional: live location and path visualization if available from APIs

## Platform strategy
- **React Native** for iOS/Android
- **React Native Windows** for Windows desktop
- Shared TypeScript domain logic, API clients, and UI primitives

## Status

