# Focus — Todo App

A clean, real-time todo app built with **React + Vite** and **Supabase**. Includes auth, row-level security, live updates, priorities, and filtering.

---

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | React 18, Vite 5, CSS Modules |
| Backend    | Supabase (Postgres + Auth)    |
| Realtime   | Supabase Realtime             |
| Deployment | Vercel                        |

---

## Features

- Email/password authentication
- Create, edit (double-click), complete, and delete tasks
- Task priorities: Low / Medium / High
- Filter: All / Active / Done
- Real-time sync across tabs
- Row Level Security — users only see their own data
- Responsive design

---

## Project Structure

```
todo-app/
├── index.html
├── vite.config.js
├── package.json
├── .env.example          ← copy to .env.local
├── supabase-schema.sql   ← run this in Supabase
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.module.css
    ├── index.css
    ├── lib/
    │   └── supabase.js
    └── components/
        ├── Auth.jsx
        ├── Auth.module.css
        ├── TodoItem.jsx
        └── TodoItem.module.css
```

---

## Step 1 — Supabase Setup

### 1.1 Create a project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Choose a name, password, and region — click **Create new project**
4. Wait ~2 minutes for provisioning

### 1.2 Run the schema

1. In your Supabase project, go to **SQL Editor** → **New query**
2. Paste the contents of `supabase-schema.sql`
3. Click **Run**

This creates:
- `todos` table with all columns
- Indexes for performance
- Row Level Security policies (users only access their own rows)
- Realtime publication for live updates
- Auto-updating `updated_at` trigger

### 1.3 Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled (it is by default)
3. For production, configure **SMTP** under **Authentication** → **SMTP Settings** to send real emails

### 1.4 Get your API keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public** key → `VITE_SUPABASE_ANON_KEY`

---

## Step 2 — Local Development

```bash
# Clone / enter project
cd todo-app

# Install dependencies
npm install

# Create your env file
cp .env.example .env.local
# Then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Step 3 — Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Deploy from the project root
vercel

# Follow the prompts:
#   Set up and deploy? → Y
#   Which scope? → your account
#   Link to existing project? → N
#   Project name? → focus-todo (or anything)
#   Directory? → ./  (press Enter)
#   Override build settings? → N

# Set environment variables
vercel env add VITE_SUPABASE_URL
# → paste your Supabase project URL, select all environments

vercel env add VITE_SUPABASE_ANON_KEY
# → paste your anon key, select all environments

# Deploy to production
vercel --prod
```

### Option B — Vercel Dashboard (GUI)

1. Push your project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Framework preset: **Vite** (auto-detected)
5. Build command: `npm run build` ✓
6. Output directory: `dist` ✓
7. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
8. Click **Deploy**

### Option C — GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Add secrets in GitHub: **Settings → Secrets → Actions**

---

## Step 4 — Post-Deployment

### Update Supabase allowed URLs

After deploying, add your Vercel URL to Supabase:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to `https://your-app.vercel.app`
3. Under **Redirect URLs**, add `https://your-app.vercel.app/**`

This ensures auth emails link to your production app.

### Custom domain (optional)

In Vercel: **Project Settings → Domains → Add Domain**

---

## Environment Variables Reference

| Variable               | Where to find it                            | Required |
|------------------------|---------------------------------------------|----------|
| `VITE_SUPABASE_URL`    | Supabase → Settings → API → Project URL     | ✓        |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public   | ✓        |

> **Security note:** The `anon` key is safe to expose client-side. It has no permissions beyond what your Row Level Security policies allow. Never expose the `service_role` key in frontend code.

---

## Extending the App

### Add due dates
```sql
ALTER TABLE public.todos ADD COLUMN due_date DATE DEFAULT NULL;
```

### Add categories/lists
```sql
CREATE TABLE public.lists (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name    TEXT NOT NULL,
  color   TEXT DEFAULT '#7C3AED'
);
ALTER TABLE public.todos ADD COLUMN list_id UUID REFERENCES public.lists(id) ON DELETE SET NULL;
```

### Add drag-and-drop ordering
```sql
ALTER TABLE public.todos ADD COLUMN position FLOAT DEFAULT 0;
```
Use a library like `@dnd-kit/core` on the frontend.
