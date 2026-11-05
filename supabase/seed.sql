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

-- 4. SEED WEEKLY TIME BLOCKS (Weekly Planner Template)
INSERT INTO public.time_blocks (id, weekday, start_time, end_time, type, label, default_category, is_fixed, is_active) VALUES
-- SAT
('tb-sat-1', 'SAT', '09:50', '11:10', 'class', 'DIP (425)', 'cat-4', true, true),
('tb-sat-2', 'SAT', '11:10', '13:50', 'class', 'FYDP-I (626)', 'cat-6', true, true),
('tb-sat-3', 'SAT', '14:00', '15:30', 'break', 'Lunch+rest', NULL, false, true),
('tb-sat-4', 'SAT', '16:00', '18:30', 'project', 'Project (backend)', 'cat-8', false, true),
('tb-sat-5', 'SAT', '20:00', '21:00', 'study', 'Revise DIP/FYDP', 'cat-4', false, true),
-- SUN
('tb-sun-1', 'SUN', '09:50', '11:10', 'class', 'Economics (406)', 'cat-3', true, true),
('tb-sun-2', 'SUN', '11:10', '12:30', 'class', 'Op. Systems (406)', 'cat-1', true, true),
('tb-sun-3', 'SUN', '12:30', '13:50', 'class', 'Prob & Stat (630)', 'cat-5', true, true),
('tb-sun-4', 'SUN', '14:00', '15:30', 'break', 'Lunch+rest', NULL, false, true),
('tb-sun-5', 'SUN', '16:00', '17:30', 'study', 'Study OS/Eco', 'cat-1', false, true),
('tb-sun-6', 'SUN', '20:00', '21:00', 'cp', 'CP 1-2 problems', 'cat-10', false, true),
-- MON
('tb-mon-1', 'MON', '10:00', '13:00', 'project', 'Project deep work', 'cat-8', false, true),
('tb-mon-2', 'MON', '13:00', '14:30', 'break', 'Lunch+rest', NULL, false, true),
('tb-mon-3', 'MON', '14:30', '16:30', 'study', 'Study Math/OS', 'cat-5', false, true),
('tb-mon-4', 'MON', '17:00', '18:00', 'break', 'Prep+travel', NULL, false, true),
('tb-mon-5', 'MON', '18:00', '19:30', 'tuition', 'TUITION', 'cat-11', true, true),
-- TUE
('tb-tue-1', 'TUE', '09:50', '11:10', 'class', 'DIP (425)', 'cat-4', true, true),
('tb-tue-2', 'TUE', '11:10', '13:50', 'class', 'OS Lab (827)', 'cat-2', true, true),
('tb-tue-3', 'TUE', '14:00', '15:30', 'break', 'Lunch+rest', NULL, false, true),
('tb-tue-4', 'TUE', '16:00', '17:30', 'study', 'Study DIP/OS Lab', 'cat-4', false, true),
('tb-tue-5', 'TUE', '20:00', '21:00', 'cp', 'SQL/backend learn', 'cat-8', false, true),
-- WED
('tb-wed-1', 'WED', '09:50', '11:10', 'class', 'Economics', 'cat-3', true, true),
('tb-wed-2', 'WED', '11:10', '12:30', 'class', 'Op. Systems', 'cat-1', true, true),
('tb-wed-3', 'WED', '12:30', '13:50', 'class', 'Prob & Stat', 'cat-5', true, true),
('tb-wed-4', 'WED', '14:00', '15:30', 'break', 'Lunch+rest', NULL, false, true),
('tb-wed-5', 'WED', '16:00', '17:30', 'study', 'Study Math practice', 'cat-5', false, true),
('tb-wed-6', 'WED', '20:00', '21:00', 'cp', 'CP 1-2 problems', 'cat-10', false, true),
-- THU
('tb-thu-1', 'THU', '10:00', '13:00', 'project', 'Project deep work', 'cat-8', false, true),
('tb-thu-2', 'THU', '13:00', '14:30', 'break', 'Lunch+rest', NULL, false, true),
('tb-thu-3', 'THU', '14:30', '16:30', 'study', 'Study weakest course', 'cat-1', false, true),
('tb-thu-4', 'THU', '17:00', '18:00', 'break', 'Prep+travel', NULL, false, true),
('tb-thu-5', 'THU', '18:00', '19:30', 'tuition', 'TUITION', 'cat-11', true, true),
-- FRI
('tb-fri-1', 'FRI', '10:00', '12:30', 'project', 'Project/ML/security', 'cat-7', false, true),
('tb-fri-2', 'FRI', '12:30', '15:00', 'break', 'Jumu''ah+lunch', NULL, false, true),
('tb-fri-3', 'FRI', '15:00', '16:30', 'study', 'Weekly review+CP', 'cat-10', false, true),
('tb-fri-4', 'FRI', '17:00', '18:00', 'break', 'Prep+travel', NULL, false, true),
('tb-fri-5', 'FRI', '18:00', '19:30', 'tuition', 'TUITION', 'cat-11', true, true)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED ACADEMIC EVENTS (Academic Key Dates & Overrides)
INSERT INTO public.academic_events (id, date, end_date, title, type, details) VALUES
('ae-01', '2026-10-27', NULL, 'Classes begin', 'deadline', 'Fall semester classes commence'),
('ae-02', '2026-10-31', NULL, 'Last day to drop, 100% refund', 'deadline', 'Full refund cutoff'),
('ae-03', '2026-11-05', NULL, 'Online Saturday class', 'class_override', '{"overrideWeekday":"SAT","isOnline":true}'),
('ae-04', '2026-11-07', NULL, 'Holiday (No class)', 'holiday', 'Holiday - classes suspended'),
('ae-05', '2026-11-12', NULL, 'Online Saturday class', 'class_override', '{"overrideWeekday":"SAT","isOnline":true}'),
('ae-06', '2026-11-22', NULL, '1st installment due', 'payment', 'Tuition installment 1 due'),
('ae-07', '2026-11-26', NULL, 'Online Sunday class', 'class_override', '{"overrideWeekday":"SUN","isOnline":true}'),
('ae-08', '2026-12-05', '2026-12-12', 'MID-TERM EXAM', 'exam', 'Mid-term examinations period'),
('ae-09', '2026-12-15', NULL, '2nd installment due', 'payment', 'Tuition installment 2 due'),
('ae-10', '2026-12-16', NULL, 'Holiday (Victory Day)', 'holiday', 'Victory Day - university closed'),
('ae-11', '2026-12-17', NULL, 'Online Wednesday class', 'class_override', '{"overrideWeekday":"WED","isOnline":true}'),
('ae-12', '2026-12-23', NULL, 'Last day of course withdrawal', 'deadline', 'Course withdrawal deadline'),
('ae-13', '2026-12-31', NULL, 'Online Saturday class', 'class_override', '{"overrideWeekday":"SAT","isOnline":true}'),
('ae-14', '2027-01-13', NULL, '3rd installment due', 'payment', 'Tuition installment 3 due'),
('ae-15', '2027-01-21', '2027-01-24', 'Classes suspended', 'holiday', 'Pre-finals study recess'),
('ae-16', '2027-01-25', '2027-02-01', 'FINAL EXAM', 'exam', 'Final examinations period'),
('ae-17', '2027-02-04', NULL, 'Last day of grade submission', 'deadline', 'Grade submission deadline')
ON CONFLICT (id) DO NOTHING;

