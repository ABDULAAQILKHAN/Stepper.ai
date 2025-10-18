# Stepper.ai

<img src="./image.png" alt="Stepper.ai" width="640" />

Modern AI-powered web application built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI primitives, Supabase auth, and a modular component system.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript / React 18
- **Styling**: Tailwind CSS + Custom utility/components + `tailwind-merge`
- **UI Primitives**: Radix UI + Headless component wrappers (`./frontend/components/ui/*`)
- **State**: Redux Toolkit (`store.ts`) + React hooks
- **Auth**: Supabase (email/password + password reset flows)
- **Forms & Validation**: `react-hook-form` + `zod`
- **Data Fetching / HTTP**: `axios`
- **Theming**: `next-themes` (light/dark) + custom `ThemeProvider`
- **Animations**: `framer-motion`, `tailwindcss-animate`
- **Charts / Viz**: `recharts`
- **Markdown Rendering**: `react-markdown`

## Getting Started

### 1. Install Dependencies
Using npm:
```bash
npm install
```

### 2. Environment Variables
Create `.env.local` in `frontend/` with (adjust as needed):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url
```
(Values read via helpers in `frontend/lib/env.ts`.)

### 3. Development Server
From `frontend/` directory:
```bash
npm run dev
```
App runs at `http://localhost:3000`.

### 4. Build & Start
```bash
npm run build
npm start
```

### 5. Lint
```bash
npm run lint
```

## Project Structure (Frontend)
```
frontend/
  app/                # Next.js app router pages
    login/            # Login page
    register/         # Registration page
    forgot-password/  # Request password reset
    reset-password/   # Perform password reset
    settings/         # User settings
    chat/             # Chat / AI interaction UI
    layout.tsx        # Root layout (providers, global styles)
    page.tsx          # Landing page
  components/         # Reusable components
    ui/               # Design system (Radix-based wrappers)
    auth-provider.tsx # Auth context / Supabase integration
    protected-route.tsx # Auth guard component
    theme-provider.tsx # Theme switcher logic
  lib/                # Utilities (env, store, hooks)
  public/             # Static assets
  styles/             # Global styles
  hooks/              # Custom hooks (`use-toast`, `use-mobile`)
```

## Key Components
- `components/ui/*`: Collection of composable UI building blocks (buttons, dialogs, forms, inputs, sheets, menus, etc.).
- `auth-provider.tsx`: Wraps Supabase auth and exposes session/user.
- `protected-route.tsx`: Simple route guard for authenticated views.
- `theme-provider.tsx`: Handles dark/light/system theme.
- `animated-background.tsx`: Visual flair component.
- `notification.tsx`: Toast/alert utilities.

## Auth Flow
1. User registers via `register/page.tsx` (Supabase email signup).
2. Logs in via `login/page.tsx` (session stored client-side).
3. Forgot password triggers Supabase reset email (`forgot-password/page.tsx`).
4. User follows email link to `reset-password/` route to set new password.
5. Protected pages/components use `protected-route.tsx` to check session.

## Forms & Validation
- `react-hook-form` handles form state/performance.
- `zod` schemas provide parsing + validation.
- Integrate with components via custom form wrappers in `components/ui/form.tsx`.

## State Management
Redux Toolkit store initialized in `lib/store.ts` (slices live under `lib/slices/`). Prefer RTK Query or hooks for async usage—add as project evolves.

## Styling & Theming
- Tailwind for utility-first styling (`globals.css`).
- Radix UI primitives wrapped for consistent design tokens.
- Theme switching with `next-themes` via `ThemeProvider`.

## Running Against Backend
Set `NEXT_PUBLIC_API_BASE_URL` to point to the Python backend (FastAPI or similar) in `./backend/`. Use `axios` for calls (add abstraction under `frontend/lib/api/`).


# Backend (FastAPI Service)

Python FastAPI service powering authentication sync, AI model management, and chat streaming.

## Backend Tech Stack
- **Framework**: FastAPI
- **Server**: Uvicorn
- **Database**: PostgreSQL (via SQLAlchemy)
- **ORM**: SQLAlchemy Declarative
- **Auth**: Supabase JWT validation (`supabase.py`)
- **AI Providers**: Pluggable architecture in `backend/ai_providers/` (e.g. Gemini via `google-generativeai`)
- **Streaming**: Server-Sent Events (SSE) for `/chats` endpoint
- **Env Management**: `python-dotenv`

## Backend Setup
From `backend/` directory:
```bash
pip install -r requirements.txt
```
(Consider using a virtual environment.)

Create `.env` in `backend/`:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_PROJECT_ID=your_project_id
```
Add any AI provider secrets (e.g. Gemini API key) when required.

## Running Backend
```bash
uvicorn main:app --reload --port 8000
```
Service at `http://localhost:8000`.

## CORS
Currently `allow_origins=["*"]` in `main.py`. Change to your deployed frontend origin before production:
```python
allow_origins=["https://your-frontend-domain"]
```

## Database
Tables created automatically on startup via:
```python
Base.metadata.create_all(bind=engine)
```
Models defined in `models.py`. Session helper in `database.py`.

## Core Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET    | /            | Health check |
| POST   | /sync        | Sync Supabase user into local DB |
| POST   | /ai-models   | Create/update user AI model entry |
| GET    | /ai-models   | List user's AI models |
| PATCH  | /ai-models/{model_id} | Update a model partial |
| DELETE | /models/{id} | Delete a model by internal id |
| PUT    | /models/selected | Set current selected model |
| GET    | /models/selected/details | Get selected model full info |
| GET    | /ai-providers | List available providers |
| POST   | /chat        | Non-stream chat response |
| POST   | /chats       | Streaming chat via SSE |

## Chat Streaming Flow
1. Client POSTs to `/chats` with messages JSON.
2. Backend validates Supabase token & selected model.
3. Starts async streaming task calling provider adapter.
4. Chunks queued & emitted as SSE until `isComplete`.

## AI Provider Abstraction
Implement new provider under `backend/ai_providers/`:
1. Create provider module (e.g. `openai.py`).
2. Implement required interface in `providers.py` / service expects `generate_response` & `stream_chat` pattern.
3. Register in provider map so `/ai-providers` lists it.

## Auth Integration
- Frontend sends `Authorization: Bearer <supabase_access_token>`.
- Backend validates with `validate_supabase_token` (decodes JWT, ensures integrity).
- User auto-provisioned in `/sync` if not present.

## Environment & Secrets
Never commit real secrets. Use `.env` locally and provisioning system / secret manager in production.

## Local Dev: Frontend + Backend
Frontend `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
Run both:
```bash
# Terminal 1
(cd backend && uvicorn main:app --reload --port 8000)

# Terminal 2
(cd frontend && npm run dev)
```
---

## License
The application is developed under Solutions with Aaqil.

---
