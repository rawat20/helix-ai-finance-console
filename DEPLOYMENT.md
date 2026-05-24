# Deployment: Railway (backend) + Vercel (frontend)

Auth runs on **Vercel** (NextAuth). The REST API runs on **Railway** (Express). The browser calls Railway using `NEXT_PUBLIC_API_BASE_URL`.

## Architecture

```
Browser → Vercel (Next.js + /api/auth/*) → Google OAuth
Browser → Railway (Express /api/*) → PostgreSQL + Gemini
```

---

## 1. Railway — Express API

### Create services

1. [Railway](https://railway.app) → **New Project** → deploy from GitHub repo.
2. **Add PostgreSQL** (optional if you keep Supabase): New → Database → PostgreSQL. Link `DATABASE_URL` to the API service.
3. **API service** settings:
   - **Root directory:** `backend/express`
   - Build/start are defined in [`backend/express/railway.toml`](backend/express/railway.toml)

### Environment variables (API service)

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | From Railway Postgres or Supabase |
| `NODE_ENV` | Yes | `production` |
| `FRONTEND_URL` | Yes | `https://your-app.vercel.app` |
| `FRONTEND_URL_PREVIEW` | No | Comma-separated Vercel preview URLs |
| `GEMINI_API_KEY` | No | Google AI Studio key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-lite` |

`PORT` is set automatically by Railway.

### Public URL

After deploy, copy the public URL (e.g. `https://helix-api-production.up.railway.app`). Use it as `NEXT_PUBLIC_API_BASE_URL` on Vercel.

### Verify API

```bash
curl -s https://YOUR_RAILWAY_HOST/api/health
curl -s https://YOUR_RAILWAY_HOST/api/transactions
```

---

## 2. Vercel — Next.js frontend

### Project settings

1. [Vercel](https://vercel.com) → **Add New Project** → import repo.
2. **Root directory:** `frontend`
3. Framework: Next.js (auto-detected).

### Environment variables

| Variable | Environments | Value |
|----------|--------------|--------|
| `NEXTAUTH_URL` | Production | `https://your-app.vercel.app` |
| `NEXTAUTH_URL` | Preview | Each preview URL (or skip OAuth on previews) |
| `NEXTAUTH_SECRET` | Production, Preview | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Production, Preview | Google Cloud OAuth client |
| `GOOGLE_CLIENT_SECRET` | Production, Preview | Google Cloud OAuth secret |
| `NEXT_PUBLIC_API_BASE_URL` | Production | Railway URL (no trailing slash) |

**Important:** `NEXT_PUBLIC_API_BASE_URL` is only the host, e.g. `https://helix-api-production.up.railway.app`. The app appends `/api/transactions`, etc.

Redeploy after changing `NEXT_PUBLIC_*` variables.

---

## 3. Google Cloud — OAuth (production)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID (Web application).
2. **Authorized redirect URIs** — add:
   - `https://your-app.vercel.app/api/auth/callback/google`
3. For **Vercel preview** deploys, add each preview URL separately (Google does not support wildcards):
   - `https://your-branch-yourteam.vercel.app/api/auth/callback/google`
4. Copy **Client ID** and **Client secret** into Vercel env vars.

Local redirect URI (development):

`http://localhost:3000/api/auth/callback/google`

---

## 4. Wire platforms (order)

1. Deploy **Railway** backend; confirm `/api/health` and `/api/transactions`.
2. Set `FRONTEND_URL` on Railway to your **final Vercel production URL**; redeploy if needed.
3. Set Vercel env vars including `NEXT_PUBLIC_API_BASE_URL` = Railway URL.
4. Add Google production redirect URI.
5. Deploy **Vercel** frontend.
6. Test: sign in → dashboard → upload CSV → insights → export.

---

## 5. End-to-end checklist

| Step | Check |
|------|--------|
| Railway health | `GET /api/health` returns `{"success":true,"status":"ok"}` |
| Railway data | `GET /api/transactions` returns JSON |
| CORS | Browser Network tab: no CORS error on `/api/transactions` from Vercel origin |
| Auth | Google sign-in works; email shown in nav |
| Upload | CSV upload succeeds; rows appear on dashboard |
| Insights | Insights modal loads |
| Export | CSV download works |

---

## Known limitations (v1)

- **API is public:** Railway `/api/*` does not require a login session. Protect with API keys or JWT in a follow-up.
- **Preview OAuth:** Each Vercel preview domain needs its own Google redirect URI, or test OAuth on production only.
- **Upload timeouts:** Large files + Gemini may hit HTTP timeouts on synchronous `/upload`.

---

## Local development

See [README.md](README.md). Use `frontend/.env.local` and `backend/express/.env` with localhost URLs.
