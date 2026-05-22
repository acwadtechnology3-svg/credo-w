# Credo W

Full-stack ambassador platform — single repo, one `package.json`, React + Express.

## Development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173 (Vite proxies `/api` → backend)
- API: http://localhost:3001/api/health

## Production (VPS / dedicated server)

```bash
npm run build
npm start
```

Serves the Vite build from `dist/` and API on the same port (`PORT`, default `3001`).

## Vercel

Deploy the whole project. `vercel.json` routes:

- `/api/*` → serverless Express (`api/index.js`)
- everything else → SPA (`dist/index.html`)

Set environment variables in the Vercel dashboard (see `.env.example`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite + Express with watch |
| `npm run build` | Production frontend build |
| `npm start` | Express + static `dist` |
| `npm run preview` | Preview Vite build only |

## Design

UI uses the Credo W premium tokens from `project/styles/tokens.css` (dark glass, purple brand).
