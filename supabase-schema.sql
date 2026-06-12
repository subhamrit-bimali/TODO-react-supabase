-- ============================================================
-- Supabase Schema for Focus Todo App
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 280),
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  priority    TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for fast per-user queries
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS todos_user_created_idx ON public.todos(user_id, created_at DESC);

-- 3. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Row Level Security — users can only access their own todos
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own todos"
  ON public.todos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own todos"
  ON public.todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
  ON public.todos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos"
  ON public.todos FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
