# NSDC Jamia Hamdard website
React (Vite) + Cloudflare Pages Functions + D1 (SQLite). One project, one command.
- `npm install` then `npm start` → http://localhost:8788
- `npm run dev` → live-reload UI at :5173 + API at :8788
- Live deploy: see DEPLOY.md
Frontend code: `src/`. API: `functions/api/[[path]].js`. DB schema: `functions/_lib/db.js`.
