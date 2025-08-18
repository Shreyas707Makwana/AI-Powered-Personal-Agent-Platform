# Deployment Guide: Vercel (Frontend) + Render (Backend)

This guide walks you from zero to a fully deployed app using Vercel for the Next.js frontend and Render for the FastAPI backend.

Repository layout (monorepo):

```
AI-Powered-Personal-Agent-Platform/
├── backend/                 # FastAPI service
│   ├── main.py
│   ├── requirements.txt
│   ├── runtime.txt          # (pin Python version)
│   ├── Dockerfile           # (optional; Render alternative)
│   ├── .env.example
│   └── ...
│
├── frontend/                # Next.js app
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── env.local.example
│   └── ...
│
├── render.yaml              # Render blueprint configured with rootDir: backend
├── vercel.json              # Vercel monorepo config targeting frontend
├── README.md
└── .gitignore
```

No changes were made to frontend UI/UX or backend functionality.

---

## 1) Prerequisites

- GitHub account with this repo pushed
- Render account (https://render.com/)
- Vercel account (https://vercel.com/)
- Supabase project and anon/public keys (if already using Supabase)
- Any required API keys referenced by `backend/.env.example`

---

## 2) Prepare environment variables

- Backend: copy `backend/.env.example` values into a real `.env` at runtime (Render Dashboard → Environment → add variables). Do NOT commit `.env`.
- Frontend: copy `frontend/env.local.example` to Vercel Project → Settings → Environment Variables.
  - Set `NEXT_PUBLIC_BACKEND_URL` to your Render backend URL (e.g., `https://your-backend.onrender.com`).
  - Set Supabase variables if used: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 3) Deploy the backend on Render

Option A: One‑click via render.yaml (recommended)
1. Push your code to GitHub.
2. In Render, click New → Blueprint → Connect this repository.
3. Render reads `render.yaml` and creates a Web Service with:
   - Root directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health check path: `/health` (ensure this endpoint exists; it does in `backend/main.py`).
4. In the service’s Settings → Environment, add environment variables from `backend/.env.example`.
5. Click Deploy. Wait for the app to be live and copy the URL, e.g., `https://ai-agent-backend.onrender.com`.

Option B: Manual service (if not using blueprint)
1. New → Web Service → Build from repo.
2. Root directory: `backend`.
3. Runtime: Python.
4. Build command: `pip install -r requirements.txt`.
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
6. Set environment variables.
7. Deploy and copy the live URL.

---

## 4) Deploy the frontend on Vercel

Monorepo setup is handled by `vercel.json` at repo root:
- Install: `cd frontend && npm install`
- Build: `cd frontend && npm run build`
- Dev: `cd frontend && npm run dev`
- Output: `frontend/.next`

Steps:
1. In Vercel, click New Project and import this GitHub repository.
2. Vercel will read `vercel.json` and configure the build to run inside the `frontend` folder.
3. Go to Project → Settings → Environment Variables, add values from `frontend/env.local.example`.
   - Set `NEXT_PUBLIC_BACKEND_URL` to the Render URL from step 3.
4. Deploy.

Notes:
- The frontend uses `process.env.NEXT_PUBLIC_BACKEND_URL` in `frontend/src/lib/api.ts` to call the backend. Ensure it matches your Render URL.
- `vercel.json` contains an example rewrite for `/api/*` to a Render URL. Your frontend code currently calls the backend directly via `NEXT_PUBLIC_BACKEND_URL`, so the rewrite is optional. You may update or remove the rewrite if you prefer env‑based calls only.

---

## 5) Verify

- Backend health: open `https://<your-render-domain>/health`.
- Frontend: visit the Vercel URL. Log in if required.
- Try:
  - List documents (calls `GET /api/ingest/documents`).
  - Upload a PDF (uses multipart/form-data; Content-Type is handled by the browser, already fixed in `frontend/src/lib/api.ts`).
  - Send a chat (POST `/api/llm/chat`).

If you see 401, authenticate via the UI and ensure Supabase keys are correctly set.

---

## 6) Common pitfalls

- Missing env vars on Render or Vercel → set all values from the example files.
- Wrong `NEXT_PUBLIC_BACKEND_URL` → ensure it points to the Render production domain (https, no trailing slash).
- Build fails on Render due to system libs → consider using the provided `backend/Dockerfile` and switch Render to Docker deployment if needed.

---

## 7) Updating after changes

- Push changes to the default branch → Vercel and Render will auto‑deploy.
- For environment changes, update variables in each platform and re‑deploy.

---

## 8) Rollbacks

- Vercel: Deployments → Promote a previous successful deployment.
- Render: Deploys → Roll back to a previous deploy.
