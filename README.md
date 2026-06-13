# Focus — Todo App

A clean, real-time todo app built with **React + Vite** and **Supabase**. Includes auth, row-level security, live updates, priorities, and filtering.

---

## Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
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
