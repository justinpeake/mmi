# MMI

Nest.js backend scaffold for **MMI**, aligned with the Figma design.

## Figma design

- **Design file:** [MMI on Figma](https://www.figma.com/make/3lxU3TJjw61ENJyjDuKL1k/MMI?t=zo59mquEiT3ZRmMO-0)
- Use the **user-Figma** MCP in Cursor to pull design context and variables. See **[FIGMA.md](FIGMA.md)** for how to get node IDs and use `get_design_context` / `get_variable_defs` to build screens from the file.

## Setup

```bash
cp .env.example .env.local
npm install
npm run start:dev
```

- **Login (main page):** `http://localhost:3000/` — login screen
- **API base:** `http://localhost:3000/api`
- Root: `GET /api` — app info and design link
- Health: `GET /api/health` — status and uptime

## Scripts

| Command         | Description              |
|----------------|--------------------------|
| `npm run start` | Start once               |
| `npm run start:dev` | Start with watch     |
| `npm run build` | Build for production     |
| `npm run start:prod` | Run built app        |
| `npm run test`  | Run tests                |
| `npm run lint`  | Lint and fix             |

## Project layout

```
src/
├── main.ts              # Bootstrap, global pipe/filter/interceptor
├── app.module.ts
├── app.controller.ts
├── app.service.ts
├── common/              # Shared filters, interceptors
├── health/              # Health check module
└── (add feature modules under src/)
```

## Adding features

- Add new modules under `src/` (e.g. `src/users/`, `src/auth/`).
- Import them in `AppModule`.
- Use DTOs with `class-validator` and `class-transformer` for request validation.
