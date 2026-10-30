# GoviRoute web client

React 19 + Vite app for the Agri-Tech Supply Chain Optimizer. See the main
[README](../README.md) for the full project.

## Run
```bash
copy .env.example .env     # VITE_API_BASE_URL=http://localhost:8080/api
npm install
npm run dev                # http://localhost:5173
npm run lint               # ESLint, including the React Hooks rules
npm run build              # production build in dist/
```

## Folders
| Folder | What is in it |
|---|---|
| `src/api` | Axios client: adds the JWT, logs out on 401, reads server error messages |
| `src/context`, `src/hooks` | Logged-in user, toast messages and the buyer's cart |
| `src/layouts` | `MarketLayout` (top bar, for the marketplace) and `AppLayout` (sidebar, for dashboards) |
| `src/pages` | One file per page; `pages/admin` holds the logistics admin pages |
| `src/components` | Shared pieces: badges, dialogs, pagination, order cards, price chart |
| `src/styles` | Design tokens (colours, type, spacing) and shared styles |
| `src/utils` | Formatting (LKR, kg, dates) and form validation that matches the backend rules |

Author: Ashmi Hettige
