# NSDC Website — Live karne ke steps (Cloudflare, free, ek hi project)

Frontend + backend + database sab ek jagah. Koi MongoDB / alag server nahi.

## Local chalana (computer pe)
1. Node.js (LTS) install karo.
2. `START.bat` double-click karo (Windows) — ya terminal me `npm install` phir `npm start`.
3. Browser: http://localhost:8788 — Admin: http://localhost:8788/admin (password = `.dev.vars` file me `ADMIN_PASSWORD`).
4. Admin → Team members → "Load demo data" se sample data aa jayega (sirf local pe).

Design badalna ho to: `npm run dev` (UI http://localhost:5173, live reload) — `src/` folder me files edit karo.

## Live (internet pe) — 10 minute
1. GitHub pe naya repo banao, is folder ko push karo (`.dev.vars`, `node_modules` apne aap ignore hote hain).
2. https://dash.cloudflare.com → sign up (free, card nahi chahiye).
3. **Workers & Pages → Create → Pages → Connect to Git** → repo choose karo.
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Save and Deploy.
4. **Storage & Databases → D1 → Create database** → naam `nsdc`.
5. Pages project → **Settings → Bindings → Add → D1 database** → Variable name **`DB`** → apna `nsdc` database choose karo. (Production me add karo.)
6. Pages project → **Settings → Variables and Secrets → Add** → `ADMIN_PASSWORD` = apna strong password (type: Secret). `DEMO` mat add karna.
7. **Deployments → Retry deployment** (settings apply hone ke liye). Ho gaya!
   Site: `https://<project>.pages.dev` , Admin: `/admin`.

Tables apne aap ban jati hain pehli request pe.

## Admin se kya kya hota hai
- Team members: photo upload, name, role, LinkedIn/GitHub, lead/member, up/down order, edit, delete (8 teams).
- Events: poster upload, date, link, status auto/manual, registration open/close, registrations list + CSV (Excel) download, delete.
- Stars of the Month: lead + member, photo/name/course/month.
- Logo & Site: logo upload, LinkedIn link, about text, "Delete unused photos".

## Dhyan rakho
- Free limit: 100,000 requests/day (photo views bhi count hote hain, par browser cache karta hai) — college site ke liye bahut hai.
- Photos upload pe browser khud chhoti kar deta hai (max ~1000px).
- Purana MongoDB data is version me nahi aata; admin se dubara daalna padega.
