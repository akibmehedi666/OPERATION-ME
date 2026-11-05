-- OPERATION: ME - Seed Data for Categories & Class Schedule
-- Run this in Supabase SQL Editor after running schema.sql

-- 1. SEED DEFAULT CATEGORIES (system-wide template, user_id IS NULL)
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
('Tuition', 'CAT-TUITION', '#eab308', 'GraduationCap')
ON CONFLICT DO NOTHING;

-- 2. SEED AGENT SCHEDULE (SAT, SUN, MON, TUE, WED, THU, FRI)
INSERT INTO public.class_schedule (day_of_week, start_time, end_time, course_name, room, type) VALUES
-- Saturday
('SAT', '09:50', '11:10', 'Digital Image Processing (DIP)', '425', 'class'),
('SAT', '11:10', '13:50', 'Final Year Design Project (FYDP-I)', '626', 'class'),

-- Sunday
('SUN', '09:50', '11:10', 'Economics', '406', 'class'),
('SUN', '11:10', '12:30', 'Operating Systems', '406', 'class'),
('SUN', '12:30', '13:50', 'Probability & Statistics', '630', 'class'),

-- Monday
('MON', '18:00', '19:30', 'Tuition (I teach)', 'Remote/Home', 'tuition'),

-- Tuesday
('TUE', '09:50', '11:10', 'Digital Image Processing (DIP)', '425', 'class'),
('TUE', '11:10', '13:50', 'OS Lab', '827', 'class'),

-- Wednesday
('WED', '09:50', '11:10', 'Economics', '406', 'class'),
('WED', '11:10', '12:30', 'Operating Systems', '406', 'class'),
('WED', '12:30', '13:50', 'Probability & Statistics', '630', 'class'),

-- Thursday
('THU', '18:00', '19:30', 'Tuition (I teach)', 'Remote/Home', 'tuition'),

-- Friday
('FRI', '18:00', '19:30', 'Tuition (I teach)', 'Remote/Home', 'tuition')
ON CONFLICT DO NOTHING;

-- 3. OPTIONAL STARTER MISSIONS FOR AGENT AKIB
-- Sample tactical directives to get started immediately
INSERT INTO public.missions (title, codename, priority, deadline, notes, status, xp) VALUES
('Review Operating Systems Virtual Memory Slides', 'OP-PAGEFAULT-01', 'urgent', now() + interval '4 hours', 'Prepare for upcoming OS query and Lab exercise on page replacement algorithms.', 'active', 60),
('Implement DIP Sobel Filter Convolution', 'OP-VISION-02', 'high', now() + interval '1 day', 'Edge detection kernel testing on sample grayscale reconnaissance imagery.', 'locked', 50),
('Solve 2 Codeforces 1400-rated DP Problems', 'OP-ALGO-STRIKE', 'medium', now() + interval '2 days', 'Maintain tactical programming sharpness. Log in cf_log upon victory.', 'locked', 40),
('Draft FYDP Literature Review Section 2', 'OP-BLACKBIRD-04', 'high', now() - interval '2 hours', 'Overdue reconnaissance on existing defense architectures.', 'active', 75)
ON CONFLICT DO NOTHING;

