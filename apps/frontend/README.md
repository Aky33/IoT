# @iot/frontend

React + TypeScript frontend skeleton generated from component specification in docs/frontend-implementation/react_component_spec_markdown.md.

## Run

From repository root:

```bash
npm install
npm run dev:frontend
```

## Scope implemented

- Folder structure under src/components, src/pages, src/types
- 38 components/pages from specification (4.1 to 4.38)
- Basic protected routing and role-aware rendering
- Mock data for devices, notifications, users, and dashboard summary
- Service Worker skeleton for push notification events

## Notes

- Auth and API integration are prepared by component props and routing flow, but currently uses mock state.
- JWT/refresh/SSE/push handling can be wired using docs/frontend-implementation/authentication.md, endpoints.md, and notifications.md.
