-- =========================================================
-- OPERATION: ME - Full Supabase Setup Script (Single Execution)
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-running cleanly (optional, disabled by default)
-- DROP TABLE IF EXISTS public.missions, public.categories, public.recurring_rules, public.class_schedule, public.lecture_logs, public.cf_log, public.papers, public.xp_events, public.streaks CASCADE;

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    codename TEXT,
    color TEXT DEFAULT '#00ff66',
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RECURRING RULES TABLE
CREATE TABLE IF NOT EXISTS public.recurring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    frequency TEXT NOT NULL,
    interval INTEGER DEFAULT 1,
    days_of_week INTEGER[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    codename TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    deadline TIMESTAMPTZ,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('locked', 'active', 'completed', 'failed')),
    xp INTEGER NOT NULL DEFAULT 50,
    recurring_rule_id UUID REFERENCES public.recurring_rules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    completion_note TEXT,
    time_spent_minutes INTEGER
);

-- 4. CLASS SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS public.class_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_name TEXT NOT NULL,
    room TEXT,
    type TEXT NOT NULL DEFAULT 'class' CHECK (type IN ('class', 'tuition')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. LECTURE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.lecture_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    topic TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CODEFORCES LOG TABLE
CREATE TABLE IF NOT EXISTS public.cf_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    handle TEXT,
    problem_name TEXT NOT NULL,
    problem_url TEXT,
    rating INTEGER,
    verdict TEXT,
    solved_at TIMESTAMPTZ DEFAULT now(),
    xp INTEGER DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PAPERS TABLE
CREATE TABLE IF NOT EXISTS public.papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT,
    venue TEXT,
    status TEXT DEFAULT 'to-read',
    notes TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. XP EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    source_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- POLICIES (Users manage their own records, or see system defaults where user_id IS NULL)
DROP POLICY IF EXISTS "categories_policy" ON public.categories;
CREATE POLICY "categories_policy" ON public.categories FOR ALL TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "recurring_rules_policy" ON public.recurring_rules;
CREATE POLICY "recurring_rules_policy" ON public.recurring_rules FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "missions_policy" ON public.missions;
CREATE POLICY "missions_policy" ON public.missions FOR ALL TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "class_schedule_policy" ON public.class_schedule;
CREATE POLICY "class_schedule_policy" ON public.class_schedule FOR ALL TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lecture_logs_policy" ON public.lecture_logs;
CREATE POLICY "lecture_logs_policy" ON public.lecture_logs FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cf_log_policy" ON public.cf_log;
CREATE POLICY "cf_log_policy" ON public.cf_log FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "papers_policy" ON public.papers;
CREATE POLICY "papers_policy" ON public.papers FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "xp_events_policy" ON public.xp_events;
CREATE POLICY "xp_events_policy" ON public.xp_events FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "streaks_policy" ON public.streaks;
CREATE POLICY "streaks_policy" ON public.streaks FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SEED CATEGORIES
INSERT INTO public.categories (name, codename, color, icon) VALUES
('Operating Systems', 'CAT-OS', '#10b981', 'Cpu'),
('OS Lab', 'CAT-OS-LAB', '#06b6d4', 'Terminal'),
('Economics', 'CAT-ECON', '#f59e0b', 'TrendingUp'),
('Digital Image Processing', 'CAT-DIP', '#8b5cf6', 'Eye'),
('Probability & Statistics', 'CAT-STAT', '#ec4899', 'Percent'),
('FYDP', 'CAT-FYDP', '#ef4444', 'ShieldAlert'),
('Cybersecurity', 'CAT-CYBER', '#14b8a6', 'ShieldCheck'),
('Side Projects', 'CAT-SIDE', '#3b82f6', 'Code'),
('Research Papers', 'CAT-RESEARCH', '#a855f7', 'BookOpen'),
('Codeforces', 'CAT-CF', '#f97316', 'Trophy'),
('Tuition', 'CAT-TUITION', '#eab308', 'GraduationCap');

-- SEED CLASS SCHEDULE
INSERT INTO public.class_schedule (day_of_week, start_time, end_time, course_name, room, type) VALUES
('SAT', '09:50', '11:10', 'Digital Image Processing (DIP)', '425', 'class'),
('SAT', '11:10', '13:50', 'Final Year Design Project (FYDP-I)', '626', 'class'),
('SUN', '09:50', '11:10', 'Economics', '406', 'class'),
('SUN', '11:10', '12:30', 'Operating Systems', '406', 'class'),
('SUN', '12:30', '13:50', 'Probability & Statistics', '630', 'class'),
('MON', '18:00', '19:30', 'Tuition (I teach)', 'Remote/Home', 'tuition'),
('TUE', '09:50', '11:10', 'Digital Image Processing (DIP)', '425', 'class'),
('TUE', '11:10', '13:50', 'OS Lab', '827', 'class'),
('WED', '09:50', '11:10', 'Economics', '406', 'class'),
('WED', '11:10', '12:30', 'Operating Systems', '406', 'class'),
('WED', '12:30', '13:50', 'Probability & Statistics', '630', 'class'),
('THU', '18:00', '19:30', 'Tuition (I teach)', 'Remote/Home', 'tuition'),
('FRI', '18:00', '19:30', 'Tuition (I teach)', 'Remote/Home', 'tuition');

