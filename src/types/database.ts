export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type MissionStatus = 'locked' | 'active' | 'completed' | 'failed';
export type ScheduleType = 'class' | 'tuition';
export type DayOfWeek = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  codename?: string;
  color: string;
  icon?: string;
  created_at?: string;
}

export type RecurringRuleType =
  | 'class_review'
  | 'tuition_prep'
  | 'cp_daily'
  | 'cyber_daily'
  | 'weekly_review'
  | 'paper_weekly'
  | 'project_step'
  | 'custom';

export interface RecurringRule {
  id: string;
  user_id?: string;
  title: string;
  rule_type: RecurringRuleType;
  category_id?: string | null;
  priority: Priority;
  frequency: 'daily' | 'weekly' | 'custom_n_days';
  interval: number;
  days_of_week?: number[]; // 0=Sunday ... 6=Saturday
  time_of_day?: string;    // HH:MM e.g. "23:59", "16:00"
  xp: number;
  is_active: boolean;
  config?: Record<string, unknown>;
  last_generated_date?: string | null; // "YYYY-MM-DD"
  created_at?: string;
}

export interface Mission {
  id: string;
  user_id?: string;
  title: string;
  codename: string;
  category_id?: string | null;
  priority: Priority;
  deadline?: string | null;
  notes?: string | null;
  status: MissionStatus;
  xp: number;
  recurring_rule_id?: string | null;
  auto_generated_date?: string | null;
  course_id?: string | null;
  project_id?: string | null;
  paper_id?: string | null;
  cf_log_id?: string | null;
  created_at: string;
  completed_at?: string | null;
  completion_note?: string | null;
  time_spent_minutes?: number | null;
  category?: Category;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  scheduled_block_id?: string | null;
  is_auto_scheduled?: boolean;
}

export type TimeBlockType = 'class' | 'tuition' | 'project' | 'study' | 'cp' | 'break';

export interface TimeBlock {
  id: string;
  user_id?: string | null;
  weekday: DayOfWeek;
  start_time: string; // "HH:MM" e.g. "09:50"
  end_time: string;   // "HH:MM" e.g. "11:10"
  type: TimeBlockType;
  label: string;
  default_category?: string | null;
  is_fixed: boolean;
  is_active?: boolean;
  override_date?: string | null; // "YYYY-MM-DD" for single-day template override
  created_at?: string;
}

export type AcademicEventType = 'class_override' | 'holiday' | 'exam' | 'deadline' | 'payment';

export interface AcademicEvent {
  id: string;
  user_id?: string | null;
  date: string; // "YYYY-MM-DD"
  end_date?: string | null; // "YYYY-MM-DD" for ranges
  title: string;
  type: AcademicEventType;
  details?: string | null;
  created_at?: string;
}

export interface TuitionException {
  id: string;
  user_id?: string | null;
  date: string; // "YYYY-MM-DD"
  slot_id?: string | null;
  action: "moved" | "cancelled";
  new_start?: string | null; // "HH:MM" e.g. "18:00"
  new_end?: string | null;   // "HH:MM" e.g. "19:30"
  note?: string | null;
  created_at?: string;
}

export interface ResolvedTimeBlock extends TimeBlock {
  isOnline?: boolean;
  isOverridden?: boolean;
  overrideReason?: string;
  isSkipped?: boolean;
  skipReason?: string;
  isCancelled?: boolean;
  tuitionException?: TuitionException;
  date: string; // "YYYY-MM-DD"
  scheduledMissions?: Mission[];
}

export interface ClassScheduleItem {
  id: string;
  user_id?: string | null;
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  course_name: string;
  room?: string | null;
  type: ScheduleType;
  created_at?: string;
}

export interface CourseResource {
  id: string;
  title: string;
  url: string;
  type: 'syllabus' | 'slides' | 'notes' | 'book' | 'drive' | 'link';
}

export interface Course {
  id: string;
  user_id?: string | null;
  code: string;
  name: string;
  section?: string;
  room?: string;
  category_id?: string;
  color?: string;
  class_times?: string;
  credits?: number;
  resources?: CourseResource[];
  created_at?: string;
}

export interface LectureLog {
  id: string;
  user_id?: string;
  course_name: string;
  course_id?: string;
  date: string; // YYYY-MM-DD
  topic?: string;
  notes?: string;
  studied: boolean;
  lecture_number?: number;
  created_at?: string;
}

export interface CodeforcesLog {
  id: string;
  user_id?: string;
  problem_key?: string;
  handle?: string;
  problem_name: string;
  problem_url?: string;
  rating?: number;
  verdict?: string;
  tags?: string[];
  status: 'solved' | 'tried' | 'upsolve';
  time_taken_minutes?: number;
  date?: string; // YYYY-MM-DD
  notes?: string;
  solved_at?: string;
  xp: number;
  is_gym?: boolean;
  created_at?: string;
}

export type CfLog = CodeforcesLog;

export type CyberTopicStatus = 'not_started' | 'learning' | 'done';

export interface CyberLearningLink {
  title: string;
  url: string;
}

export interface CyberTopic {
  id: string;
  user_id?: string;
  section: string;
  title: string;
  status: CyberTopicStatus;
  goal?: string;
  learning_links?: CyberLearningLink[];
  hands_on_task?: string;
  hands_on_url?: string;
  hands_on_platform?: string;
  hands_on_completed?: boolean;
  takeaway?: string;
  resources?: string[];
  notes?: string;
  time_spent_minutes?: number;
  order_index: number;
  completed_at?: string | null;
  created_at?: string;
}

export interface ResearchPaper {
  id: string;
  user_id?: string;
  title: string;
  authors?: string;
  venue?: string;
  status: 'to-read' | 'reading' | 'done';
  notes?: string;
  url?: string;
  tags?: string[];
  summary?: string;
  takeaway?: string;
  date_read?: string | null; // YYYY-MM-DD
  created_at?: string;
}

export interface SideProject {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  next_step?: string;
  last_worked_at?: string | null;
  repo_url?: string;
  live_url?: string;
  created_at?: string;
}

export interface WeeklyReview {
  id: string;
  user_id?: string;
  week_start_date: string; // YYYY-MM-DD
  completed_count: number;
  overdue_count: number;
  time_spent_minutes: number;
  cf_solved_count: number;
  papers_read_count: number;
  lectures_missed_count: number;
  what_went_well?: string;
  what_to_fix?: string;
  next_week_focus?: string;
  created_at?: string;
}

export interface NotificationSettings {
  class_reminder: boolean;
  tuition_reminder: boolean;
  morning_digest: boolean;
  morning_digest_time: string; // "08:00"
  streak_reminder: boolean;
  exam_reminder: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "23:00"
  quiet_hours_end: string;   // "07:00"
}

export interface XpEvent {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  source_id?: string | null;
  created_at: string;
}

export interface Streak {
  id?: string;
  user_id?: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string | null;
  updated_at?: string;
}

export type AgentRank = 'Recruit' | 'Field Agent' | 'Elite' | 'Director';

export interface AgentProfile {
  name: string;
  callsign: string;
  rank: AgentRank;
  totalXp: number;
  currentRankXp: number;
  nextRankXp: number;
  rankProgress: number; // 0 to 100
  streak: number;
  longestStreak: number;
}

export interface FeatureFlags {
  dashboard: boolean;
  missions: boolean;
  planner: boolean;
  courses: boolean;
  codeforces: boolean;
  cyber: boolean;
  research: boolean;
  projects: boolean;
  review: boolean;
  history: boolean;
  notifications: boolean;
  auto_missions: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  dashboard: true,
  missions: true,
  planner: true,
  courses: true,
  codeforces: false,
  cyber: false,
  research: false,
  projects: false,
  review: false,
  history: false,
  notifications: false,
  auto_missions: false,
};

export interface UserSetting {
  id?: string;
  user_id: string;
  default_theme?: 'dark' | 'light' | 'system';
  animations_enabled?: boolean;
  sound_enabled?: boolean;
  cf_handle?: string;
  notification_settings?: NotificationSettings;
  features?: FeatureFlags;
  updated_at?: string;
}

