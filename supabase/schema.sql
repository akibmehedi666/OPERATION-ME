-- OPERATION: ME - Spy Mission Control Database Schema
-- Phase 1 - 9 Tables with Row Level Security (RLS) enabled

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    interval INTEGER DEFAULT 1,
    days_of_week INTEGER[], -- 0=Sunday ... 6=Saturday
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

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cf_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR AUTHENTICATED USERS (Isolated per user)
-- Categories Policy: Users can view their own or global system categories (user_id IS NULL)
CREATE POLICY "Users can manage their categories" 
ON public.categories FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- Recurring Rules Policy
CREATE POLICY "Users can manage their recurring rules" 
ON public.recurring_rules FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Missions Policy
CREATE POLICY "Users can manage their missions" 
ON public.missions FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Class Schedule Policy
CREATE POLICY "Users can manage their schedule" 
ON public.class_schedule FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- Lecture Logs Policy
CREATE POLICY "Users can manage lecture logs" 
ON public.lecture_logs FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Codeforces Log Policy
CREATE POLICY "Users can manage cf logs" 
ON public.cf_log FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Papers Policy
CREATE POLICY "Users can manage papers" 
ON public.papers FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- XP Events Policy
CREATE POLICY "Users can view and log xp events" 
ON public.xp_events FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Streaks Policy
CREATE POLICY "Users can view and update streaks" 
ON public.streaks FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 10. TIME BLOCKS TABLE (Weekly Planner)
CREATE TABLE IF NOT EXISTS public.time_blocks (
    id TEXT PRIMARY KEY,
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

-- 11. ACADEMIC EVENTS TABLE (Key Dates & Overrides)
CREATE TABLE IF NOT EXISTS public.academic_events (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    end_date DATE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('class_override', 'holiday', 'exam', 'deadline', 'payment')),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage time blocks" 
ON public.time_blocks FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage academic events" 
ON public.academic_events FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_missions_user_status ON public.missions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_missions_priority_deadline ON public.missions(priority, deadline);
CREATE INDEX IF NOT EXISTS idx_class_schedule_day ON public.class_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON public.xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_weekday ON public.time_blocks(weekday);
CREATE INDEX IF NOT EXISTS idx_academic_events_date ON public.academic_events(date);

