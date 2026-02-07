# Building MMI from Figma (user-Figma MCP)

This app is wired to the **MMI** Figma file. Use the **user-Figma** MCP in Cursor to pull design context and variables into the codebase.

## Design files

- **MMI Login (Belong IRL):** [MMI-Login on Figma](https://www.figma.com/design/8yGQMV0q1Yg0XoNAQnFTEd/MMI-Login?t=zo59mquEiT3ZRmMO-0) — file key: `8yGQMV0q1Yg0XoNAQnFTEd`, nodeId: `0:1` — **implemented** in `public/index.html` and `public/css/login.css`
- **Dashboard (Belong IRL):** [Untitled / Belong IRL](https://www.figma.com/design/VywQr6kXMi3hPy2Gg76Ntx/Untitled?node-id=0-1) — file key: `VywQr6kXMi3hPy2Gg76Ntx`, nodeId: `0:1` — **implemented** in `public/app.html` (#page-dashboard) and `public/css/dashboard.css`
- **MMI (app / Community Helpers):** [MMI on Figma](https://www.figma.com/make/3lxU3TJjw61ENJyjDuKL1k/MMI?t=zo59mquEiT3ZRmMO-0&preview-route=%2Fdashboard) — file key: `3lxU3TJjw61ENJyjDuKL1k` — **Community Helpers** tab content in `#cc-panel-helpers`
- **Connection card:** [Untitled (connection card) on Figma](https://www.figma.com/design/D9qRk4jvNETxDc55TaQGJc/Untitled?node-id=0-1) — file key: `D9qRk4jvNETxDc55TaQGJc`, nodeId: `0:1` — **implemented** in `#cc-panel-connections`, `.cc-connection-card`, dynamic tab counts

## Getting node IDs from Figma

1. Open the file in Figma (browser or desktop).
2. Select a frame or component (e.g. the login screen, dashboard).
3. In the URL you’ll see `?node-id=123-456` (or in the “Share” link).
4. Convert to **nodeId**: replace the hyphen with a colon → `123:456`.

Example:  
`https://www.figma.com/make/3lxU3TJjw61ENJyjDuKL1k/MMI?node-id=1-2`  
→ **nodeId** = `1:2`, **fileKey** = `3lxU3TJjw61ENJyjDuKL1k`.

## MCP tools to use

| Tool | Use |
|------|-----|
| **get_design_context** | Get UI code (HTML/CSS/React, etc.) for a node. Use this to replace placeholders in `public/` (e.g. login, app shell, dashboard). |
| **get_metadata** | Get structure (node IDs, layer types, names, positions). Use with nodeId `0:1` for the root page, then call **get_design_context** on child node IDs. |
| **get_screenshot** | Get a PNG screenshot of a node. Useful to compare with your built UI. |
| **get_variable_defs** | Get design tokens (colors, spacing, etc.). Use to update `public/css/design-tokens.css`. |

## Suggested workflow

1. **Structure**  
   Call **get_metadata** with `fileKey: "3lxU3TJjw61ENJyjDuKL1k"`, `nodeId: "0:1"` to see pages/frames and their node IDs.

2. **Screens**  
   For each screen (login, home, dashboard, etc.):
   - Call **get_design_context** with that screen’s **nodeId** and `clientLanguages: "html,css,javascript"` (or `typescript` if you add a TS frontend).
   - Replace the matching placeholder in `public/` (e.g. `index.html`, `app.html`, or a section inside it) with the returned code. Adjust class names and paths so it fits the existing layout and tokens.

3. **Tokens**  
   Call **get_variable_defs** for a key frame (e.g. `0:1` or the login frame’s nodeId) and copy color/spacing values into `public/css/design-tokens.css` so the app matches Figma.

4. **Assets**  
   **get_design_context** can return asset URLs; download images and put them in `public/` (e.g. `public/images/`) and point the markup to `/images/...`.

## Implemented screens

- **Login** — Built from [MMI-Login Figma](https://www.figma.com/design/8yGQMV0q1Yg0XoNAQnFTEd/MMI-Login) (fileKey: `8yGQMV0q1Yg0XoNAQnFTEd`, nodeId: `0:1`). Layout: light blue-grey background, white card, purple circular logo (person icon), "Belong IRL" title, "Connecting clients with community helpers" tagline, Email Address and Password fields, Sign In button, "Don't have an account? Sign Up" link. See `public/index.html` and `public/css/login.css`.
- **Dashboard** — Built from [Belong IRL Figma](https://www.figma.com/design/VywQr6kXMi3hPy2Gg76Ntx/Untitled?node-id=0-1) (fileKey: `VywQr6kXMi3hPy2Gg76Ntx`, nodeId: `0:1`). Layout: Belong IRL header, "Clients Seeking Help" section, three client cards. See `public/css/dashboard.css` and `#page-dashboard` in `public/app.html`.
- **Community Helpers** — Design source: [MMI Figma (dashboard preview)](https://www.figma.com/make/3lxU3TJjw61ENJyjDuKL1k/MMI?t=zo59mquEiT3ZRmMO-0&preview-route=%2Fdashboard) (fileKey: `3lxU3TJjw61ENJyjDuKL1k`). Implemented as tab content in the same dashboard: "Community Helpers" section with four helper cards. See `#cc-panel-helpers` in `public/app.html`.
- **Connection card** — Built from [Untitled / Connection card Figma](https://www.figma.com/design/D9qRk4jvNETxDc55TaQGJc/Untitled?node-id=0-1) (fileKey: `D9qRk4jvNETxDc55TaQGJc`, nodeId: `0:1`). Layout: card with purple chain icon + "Connection" label, green "Active" badge, calendar icon + "Connected 2026-01-15", Client field (Margaret Thompson), chain icon, Helper field (Sarah Martinez), red "Disconnect" button. Tab numbers (Clients 3, Community Helpers 4, Connections 1) are dynamic and updated via `ccCounts` and `updateCcCounts()` in `public/js/app.js`. See `#cc-panel-connections`, `.cc-connection-card`, and `public/css/dashboard.css`.

## Current placeholders

- **`/` (index.html)** — Login screen is implemented from MMI-Login Figma; adjust `public/css/login.css` if design tokens change.
- **`/app.html`** — App shell (sidebar + main). Replace sidebar and content areas with Figma components.
- **`#home`, `#dashboard`, `#settings`** — Placeholder content divs. Replace with Figma-derived markup for each screen.

After you have the real node IDs from **get_metadata**, you can paste them into this doc next to each screen (e.g. “Login frame: nodeId `12:34`”) so the next build stays in sync with Figma.
