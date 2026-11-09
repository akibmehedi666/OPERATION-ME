-- ====================================================================
-- OPERATION: ME - SPY MISSION CONTROL COMPLETE DATABASE SCHEMA
-- All 16 Application Tables with Row Level Security (RLS)
-- Fully Idempotent: Can be run cleanly on a fresh or existing Supabase project
-- ====================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. CATEGORIES TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    codename TEXT,
    color TEXT DEFAULT '#1f7a4d',
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 2. RECURRING RULES TABLE (Auto-Missions)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.recurring_rules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    rule_type TEXT NOT NULL DEFAULT 'custom',
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom_n_days')),
    interval INTEGER DEFAULT 1,
    days_of_week INTEGER[], -- 0=Sunday ... 6=Saturday
    time_of_day TEXT,       -- "HH:MM" e.g. "23:59", "16:00"
    xp INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    last_generated_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 3. MISSIONS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.missions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    codename TEXT,
    category_id TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    deadline TIMESTAMPTZ,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('locked', 'active', 'completed', 'failed')),
    xp INTEGER NOT NULL DEFAULT 50,
    recurring_rule_id TEXT,
    auto_generated_date DATE,
    course_id TEXT,
    project_id TEXT,
    paper_id TEXT,
    cf_log_id TEXT,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    scheduled_block_id TEXT,
    is_auto_scheduled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    completion_note TEXT,
    time_spent_minutes INTEGER
);

-- ====================================================================
-- 4. CLASS SCHEDULE TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.class_schedule (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_name TEXT NOT NULL,
    room TEXT,
    type TEXT NOT NULL DEFAULT 'class' CHECK (type IN ('class', 'tuition')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 5. TIME BLOCKS TABLE (Weekly Planner)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.time_blocks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    weekday TEXT NOT NULL CHECK (weekday IN ('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('class', 'tuition', 'project', 'study', 'cp', 'break')),
    label TEXT NOT NULL,
    default_category TEXT,
    is_fixed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    override_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 6. ACADEMIC EVENTS TABLE (Academic Calendar & Overrides)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.academic_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    end_date DATE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('class_override', 'holiday', 'exam', 'deadline', 'payment', 'quiz', 'ct')),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 7. COURSES TABLE (Course HQ)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    section TEXT,
    room TEXT,
    category_id TEXT,
    color TEXT,
    class_times TEXT,
    credits NUMERIC(3,1) DEFAULT 3.0,
    resources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 8. LECTURE LOGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.lecture_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    course_id TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    topic TEXT,
    notes TEXT,
    studied BOOLEAN DEFAULT false,
    lecture_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 9. CODEFORCES LOG TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.cf_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_key TEXT,
    handle TEXT,
    problem_name TEXT NOT NULL,
    problem_url TEXT,
    rating INTEGER,
    verdict TEXT,
    tags TEXT[],
    status TEXT DEFAULT 'solved' CHECK (status IN ('solved', 'tried', 'upsolve')),
    time_taken_minutes INTEGER,
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    solved_at TIMESTAMPTZ DEFAULT now(),
    xp INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_cf_log_user_problem UNIQUE (user_id, problem_key)
);

-- Idempotent column and constraint additions for existing Supabase databases
ALTER TABLE public.cf_log ADD COLUMN IF NOT EXISTS problem_key TEXT;
ALTER TABLE public.cf_log ALTER COLUMN xp SET DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_cf_log_user_problem'
    ) THEN
        ALTER TABLE public.cf_log ADD CONSTRAINT uq_cf_log_user_problem UNIQUE (user_id, problem_key);
    END IF;
END $$;

-- ====================================================================
-- 10. RESEARCH PAPERS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.papers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT,
    venue TEXT,
    status TEXT DEFAULT 'to-read' CHECK (status IN ('to-read', 'reading', 'done')),
    notes TEXT,
    url TEXT,
    tags TEXT[],
    summary TEXT,
    takeaway TEXT,
    date_read DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 11. SIDE PROJECTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.side_projects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    next_step TEXT,
    last_worked_at TIMESTAMPTZ,
    repo_url TEXT,
    live_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 12. CYBERSECURITY ROADMAP TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.cyber_topics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'learning', 'done')),
    goal TEXT,
    learning_links JSONB DEFAULT '[]'::jsonb,
    hands_on_task TEXT,
    hands_on_url TEXT,
    hands_on_platform TEXT,
    hands_on_completed BOOLEAN DEFAULT FALSE,
    takeaway TEXT,
    resources TEXT[],
    notes TEXT,
    time_spent_minutes INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cyber_topics ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE public.cyber_topics ADD COLUMN IF NOT EXISTS learning_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cyber_topics ADD COLUMN IF NOT EXISTS hands_on_task TEXT;
ALTER TABLE public.cyber_topics ADD COLUMN IF NOT EXISTS hands_on_url TEXT;
ALTER TABLE public.cyber_topics ADD COLUMN IF NOT EXISTS hands_on_platform TEXT;
ALTER TABLE public.cyber_topics ADD COLUMN IF NOT EXISTS hands_on_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cyber_topics ADD COLUMN IF NOT EXISTS takeaway TEXT;

-- ====================================================================
-- 13. WEEKLY REVIEWS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    completed_count INTEGER DEFAULT 0,
    overdue_count INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    cf_solved_count INTEGER DEFAULT 0,
    papers_read_count INTEGER DEFAULT 0,
    lectures_missed_count INTEGER DEFAULT 0,
    what_went_well TEXT,
    what_to_fix TEXT,
    next_week_focus TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 14. XP EVENTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.xp_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    source_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 15. STREAKS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.streaks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- 16. USER SETTINGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    default_theme TEXT DEFAULT 'dark' CHECK (default_theme IN ('dark', 'light', 'system')),
    animations_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    cf_handle TEXT DEFAULT '',
    notification_settings JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '{"dashboard":true,"missions":true,"planner":true,"courses":true,"codeforces":false,"cyber":false,"research":false,"projects":false,"review":false,"history":false,"notifications":false,"auto_missions":false}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS cf_handle TEXT DEFAULT '';
ALTER TABLE public.user_settings ALTER COLUMN cf_handle SET DEFAULT '';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"dashboard":true,"missions":true,"planner":true,"courses":true,"codeforces":false,"cyber":false,"research":false,"projects":false,"review":false,"history":false,"notifications":false,"auto_missions":false}'::jsonb;
UPDATE public.user_settings SET features = '{"dashboard":true,"missions":true,"planner":true,"courses":true,"codeforces":false,"cyber":false,"research":false,"projects":false,"review":false,"history":false,"notifications":false,"auto_missions":false}'::jsonb WHERE features IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_user_id_key'
    ) THEN
        ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ====================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to allow safe re-execution
DROP POLICY IF EXISTS "Users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage their recurring rules" ON public.recurring_rules;
DROP POLICY IF EXISTS "Users can manage their missions" ON public.missions;
DROP POLICY IF EXISTS "Users can manage their schedule" ON public.class_schedule;
DROP POLICY IF EXISTS "Users can manage time blocks" ON public.time_blocks;
DROP POLICY IF EXISTS "Users can manage academic events" ON public.academic_events;
DROP POLICY IF EXISTS "Users can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Users can manage lecture logs" ON public.lecture_logs;
DROP POLICY IF EXISTS "Users can manage cf logs" ON public.cf_log;
DROP POLICY IF EXISTS "Users can manage papers" ON public.papers;
DROP POLICY IF EXISTS "Users can manage side projects" ON public.side_projects;
DROP POLICY IF EXISTS "Users can manage cyber topics" ON public.cyber_topics;
DROP POLICY IF EXISTS "Users can manage weekly reviews" ON public.weekly_reviews;
DROP POLICY IF EXISTS "Users can view and log xp events" ON public.xp_events;
DROP POLICY IF EXISTS "Users can view and update streaks" ON public.streaks;
DROP POLICY IF EXISTS "Users can manage user settings" ON public.user_settings;

-- 1. Categories: user can read/write their own, plus read global defaults (user_id IS NULL)
CREATE POLICY "Users can manage categories" 
ON public.categories FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- 2. Recurring Rules: isolated per user
CREATE POLICY "Users can manage their recurring rules" 
ON public.recurring_rules FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- 3. Missions: strictly private to user
CREATE POLICY "Users can manage their missions" 
ON public.missions FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Class Schedule: user rows or global templates
CREATE POLICY "Users can manage their schedule" 
ON public.class_schedule FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- 5. Time Blocks: user rows or global templates
CREATE POLICY "Users can manage time blocks" 
ON public.time_blocks FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- 6. Academic Events: user rows or global templates
CREATE POLICY "Users can manage academic events" 
ON public.academic_events FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- 7. Courses: user courses or default courses
CREATE POLICY "Users can manage courses" 
ON public.courses FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- 8. Lecture Logs: strictly private
CREATE POLICY "Users can manage lecture logs" 
ON public.lecture_logs FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. Codeforces Log: strictly private
CREATE POLICY "Users can manage cf logs" 
ON public.cf_log FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 10. Research Papers: strictly private
CREATE POLICY "Users can manage papers" 
ON public.papers FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 11. Side Projects: strictly private
CREATE POLICY "Users can manage side projects" 
ON public.side_projects FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 12. Cybersecurity Topics: user topics or syllabus template
CREATE POLICY "Users can manage cyber topics" 
ON public.cyber_topics FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- 13. Weekly Reviews: strictly private
CREATE POLICY "Users can manage weekly reviews" 
ON public.weekly_reviews FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 14. XP Events: strictly private
CREATE POLICY "Users can view and log xp events" 
ON public.xp_events FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 15. Streaks: strictly private
CREATE POLICY "Users can view and update streaks" 
ON public.streaks FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 16. User Settings: strictly private
CREATE POLICY "Users can manage user settings" 
ON public.user_settings FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_missions_user_status ON public.missions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_missions_priority_deadline ON public.missions(priority, deadline);
CREATE INDEX IF NOT EXISTS idx_missions_category ON public.missions(category_id);
CREATE INDEX IF NOT EXISTS idx_class_schedule_day ON public.class_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_time_blocks_weekday ON public.time_blocks(weekday);
CREATE INDEX IF NOT EXISTS idx_academic_events_date ON public.academic_events(date);
CREATE INDEX IF NOT EXISTS idx_lecture_logs_user_course ON public.lecture_logs(user_id, course_name);
CREATE INDEX IF NOT EXISTS idx_cf_log_user_date ON public.cf_log(user_id, date);
CREATE INDEX IF NOT EXISTS idx_papers_user_status ON public.papers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_side_projects_user ON public.side_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_cyber_topics_user ON public.cyber_topics(user_id, section);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user ON public.weekly_reviews(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON public.xp_events(user_id);

-- ====================================================================
-- IDEMPOTENT CONSTRAINTS & COLUMNS CLEANUP MIGRATION
-- ====================================================================
ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_category_id_fkey;
ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_recurring_rule_id_fkey;
ALTER TABLE public.recurring_rules DROP CONSTRAINT IF EXISTS recurring_rules_category_id_fkey;
ALTER TABLE public.courses DROP COLUMN IF EXISTS faculty;

ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS scheduled_block_id TEXT;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS is_auto_scheduled BOOLEAN DEFAULT false;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS completion_note TEXT;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS course_id TEXT;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS paper_id TEXT;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS cf_log_id TEXT;

-- ====================================================================
-- 17. TUITION EXCEPTIONS TABLE (Per-session move / cancel)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.tuition_exceptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_id TEXT,
    action TEXT NOT NULL CHECK (action IN ('moved', 'cancelled')),
    new_start TIME,
    new_end TIME,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tuition_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage tuition exceptions" ON public.tuition_exceptions;

CREATE POLICY "Users can manage tuition exceptions" 
ON public.tuition_exceptions FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tuition_exceptions_user_date ON public.tuition_exceptions(user_id, date);

-- Seed default categories for global reference
INSERT INTO public.categories (id, user_id, name, codename, color, icon) VALUES
  ('cat-1', NULL, 'Operating Systems', 'CAT-OS', '#3b82f6', 'Cpu'),
  ('cat-2', NULL, 'Operating Systems Lab', 'CAT-OS-LAB', '#60a5fa', 'Terminal'),
  ('cat-3', NULL, 'Engineering Economics', 'CAT-ECON', '#f59e0b', 'TrendingUp'),
  ('cat-4', NULL, 'Digital Image Processing', 'CAT-DIP', '#8b5cf6', 'Camera'),
  ('cat-5', NULL, 'Mathematical Analysis & Statistics', 'CAT-STAT', '#ec4899', 'Calculator'),
  ('cat-6', NULL, 'Final Year Design Project I', 'CAT-FYDP', '#ef4444', 'Rocket'),
  ('cat-7', NULL, 'Codeforces / CP', 'CAT-CF', '#10b981', 'Code'),
  ('cat-8', NULL, 'Cybersecurity', 'CAT-CYBER', '#06b6d4', 'Shield'),
  ('cat-9', NULL, 'Research / Paper Writing', 'CAT-RESEARCH', '#84cc16', 'FileText'),
  ('cat-10', NULL, 'Side Projects', 'CAT-PROJECT', '#a855f7', 'FolderGit2'),
  ('cat-11', NULL, 'Tuition', 'CAT-TUITION', '#eab308', 'GraduationCap'),
  ('cat-12', NULL, 'General Routine', 'CAT-GENERAL', '#64748b', 'Clock')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  codename = EXCLUDED.codename,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;

