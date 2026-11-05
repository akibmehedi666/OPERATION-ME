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

export interface RecurringRule {
  id: string;
  user_id?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  days_of_week?: number[];
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

export interface ResolvedTimeBlock extends TimeBlock {
  isOnline?: boolean;
  isOverridden?: boolean;
  overrideReason?: string;
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

export interface LectureLog {
  id: string;
  user_id?: string;
  course_name: string;
  date: string;
  topic?: string;
  notes?: string;
  created_at?: string;
}

export interface CodeforcesLog {
  id: string;
  user_id?: string;
  handle?: string;
  problem_name: string;
  problem_url?: string;
  rating?: number;
  verdict?: string;
  solved_at?: string;
  xp: number;
  created_at?: string;
}

export interface ResearchPaper {
  id: string;
  user_id?: string;
  title: string;
  authors?: string;
  venue?: string;
  status: 'to-read' | 'reading' | 'annotated' | 'archived';
  notes?: string;
  url?: string;
  created_at?: string;
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

