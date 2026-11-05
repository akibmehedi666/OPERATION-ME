import { Category, ClassScheduleItem, Mission, TimeBlock, AcademicEvent } from "@/types/database";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Operating Systems", codename: "CAT-OS", color: "#10b981", icon: "Cpu" },
  { id: "cat-2", name: "OS Lab", codename: "CAT-OS-LAB", color: "#06b6d4", icon: "Terminal" },
  { id: "cat-3", name: "Economics", codename: "CAT-ECON", color: "#f59e0b", icon: "TrendingUp" },
  { id: "cat-4", name: "Digital Image Processing", codename: "CAT-DIP", color: "#8b5cf6", icon: "Eye" },
  { id: "cat-5", name: "Probability & Statistics", codename: "CAT-STAT", color: "#ec4899", icon: "Percent" },
  { id: "cat-6", name: "FYDP", codename: "CAT-FYDP", color: "#ef4444", icon: "ShieldAlert" },
  { id: "cat-7", name: "Cybersecurity", codename: "CAT-CYBER", color: "#14b8a6", icon: "ShieldCheck" },
  { id: "cat-8", name: "Side Projects", codename: "CAT-SIDE", color: "#3b82f6", icon: "Code" },
  { id: "cat-9", name: "Research Papers", codename: "CAT-RESEARCH", color: "#a855f7", icon: "BookOpen" },
  { id: "cat-10", name: "Codeforces", codename: "CAT-CF", color: "#f97316", icon: "Trophy" },
  { id: "cat-11", name: "Tuition", codename: "CAT-TUITION", color: "#eab308", icon: "GraduationCap" },
];

export const DEFAULT_SCHEDULE: ClassScheduleItem[] = [
  // SAT: 09:50-11:10 DIP (425); 11:10-13:50 FYDP-I (626)
  {
    id: "sched-1",
    day_of_week: "SAT",
    start_time: "09:50",
    end_time: "11:10",
    course_name: "Digital Image Processing (DIP)",
    room: "425",
    type: "class"
  },
  {
    id: "sched-2",
    day_of_week: "SAT",
    start_time: "11:10",
    end_time: "13:50",
    course_name: "Final Year Design Project (FYDP-I)",
    room: "626",
    type: "class"
  },

  // SUN & WED: 09:50 Economics (406); 11:10 OS (406); 12:30-13:50 Prob & Stats (630)
  {
    id: "sched-3",
    day_of_week: "SUN",
    start_time: "09:50",
    end_time: "11:10",
    course_name: "Economics",
    room: "406",
    type: "class"
  },
  {
    id: "sched-4",
    day_of_week: "SUN",
    start_time: "11:10",
    end_time: "12:30",
    course_name: "Operating Systems",
    room: "406",
    type: "class"
  },
  {
    id: "sched-5",
    day_of_week: "SUN",
    start_time: "12:30",
    end_time: "13:50",
    course_name: "Probability & Statistics",
    room: "630",
    type: "class"
  },

  // MON: Tuition (I teach) 18:00-19:30
  {
    id: "sched-6",
    day_of_week: "MON",
    start_time: "18:00",
    end_time: "19:30",
    course_name: "Tuition (I teach)",
    room: "Remote/Home",
    type: "tuition"
  },

  // TUE: 09:50 DIP (425); 11:10-13:50 OS Lab (827)
  {
    id: "sched-7",
    day_of_week: "TUE",
    start_time: "09:50",
    end_time: "11:10",
    course_name: "Digital Image Processing (DIP)",
    room: "425",
    type: "class"
  },
  {
    id: "sched-8",
    day_of_week: "TUE",
    start_time: "11:10",
    end_time: "13:50",
    course_name: "OS Lab",
    room: "827",
    type: "class"
  },

  // WED: 09:50 Economics (406); 11:10 OS (406); 12:30-13:50 Prob & Stats (630)
  {
    id: "sched-9",
    day_of_week: "WED",
    start_time: "09:50",
    end_time: "11:10",
    course_name: "Economics",
    room: "406",
    type: "class"
  },
  {
    id: "sched-10",
    day_of_week: "WED",
    start_time: "11:10",
    end_time: "12:30",
    course_name: "Operating Systems",
    room: "406",
    type: "class"
  },
  {
    id: "sched-11",
    day_of_week: "WED",
    start_time: "12:30",
    end_time: "13:50",
    course_name: "Probability & Statistics",
    room: "630",
    type: "class"
  },

  // THU: Tuition (I teach) 18:00-19:30
  {
    id: "sched-12",
    day_of_week: "THU",
    start_time: "18:00",
    end_time: "19:30",
    course_name: "Tuition (I teach)",
    room: "Remote/Home",
    type: "tuition"
  },

  // FRI: Tuition (I teach) 18:00-19:30
  {
    id: "sched-13",
    day_of_week: "FRI",
    start_time: "18:00",
    end_time: "19:30",
    course_name: "Tuition (I teach)",
    room: "Remote/Home",
    type: "tuition"
  },
];

export const INITIAL_STARTER_MISSIONS: Mission[] = [
  {
    id: "m-001",
    title: "Review Operating Systems Virtual Memory & Paging",
    codename: "OP-PAGEFAULT-01",
    category_id: "cat-1",
    priority: "urgent",
    deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    notes: "Review TLB hits/misses, multi-level paging, and prepare 2 questions for lecture.",
    status: "active",
    xp: 60,
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: "m-002",
    title: "Implement DIP Sobel Edge Detection Filter",
    codename: "OP-VISION-02",
    category_id: "cat-4",
    priority: "high",
    deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    notes: "Apply 3x3 horizontal and vertical Sobel convolution kernels on aerial test images.",
    status: "locked",
    xp: 50,
    created_at: new Date(Date.now() - 7200 * 1000).toISOString(),
  },
  {
    id: "m-003",
    title: "Solve 2 Codeforces DP Targets (Rating 1400)",
    codename: "OP-ALGO-STRIKE",
    category_id: "cat-10",
    priority: "medium",
    deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    notes: "Focus on classical knapsack and longest common subsequence variations.",
    status: "locked",
    xp: 45,
    created_at: new Date(Date.now() - 86400 * 1000).toISOString(),
  },
  {
    id: "m-004",
    title: "Draft FYDP Literature Review Section 2",
    codename: "OP-BLACKBIRD-04",
    category_id: "cat-6",
    priority: "high",
    deadline: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // Overdue / FAILING demo
    notes: "Synthesize adversarial robustness benchmarks across contemporary vision models.",
    status: "active",
    xp: 75,
    created_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
  },
  {
    id: "m-005",
    title: "Prepare Tuition Problem Sets for High School Math",
    codename: "OP-ACADEMY-05",
    category_id: "cat-11",
    priority: "low",
    deadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    notes: "Print out calculus practice sheets and review previous homework submission.",
    status: "locked",
    xp: 30,
    created_at: new Date(Date.now() - 100000).toISOString(),
  },
  {
    id: "m-006",
    title: "Configure Operating Systems xv6 Kernel Build Environment",
    codename: "OP-KERNEL-INIT",
    category_id: "cat-1",
    priority: "urgent",
    deadline: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // Completed today
    notes: "Verified RISC-V cross-compilation toolchain on development machine.",
    status: "completed",
    xp: 50,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "m-007",
    title: "Submit Economics Assignment Problem Set 1",
    codename: "OP-ECON-01",
    category_id: "cat-3",
    priority: "medium",
    deadline: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(), // Completed yesterday
    notes: "Macroeconomic inflation modeling and monetary policy analysis.",
    status: "completed",
    xp: 40,
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: "m-008",
    title: "Read Transformer Attention Recon Paper",
    codename: "OP-PAPER-ATTN",
    category_id: "cat-9",
    priority: "high",
    deadline: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    completed_at: new Date(Date.now() - (3 * 86400) * 1000).toISOString(), // Completed late after deadline
    notes: "Deep dive into multi-head self-attention mechanisms and query-key-value vectors.",
    status: "completed",
    xp: 60,
    created_at: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
  }
];

export const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  // SAT: DIP (425) 9:50-11:10 AM; FYDP-I (626) 11:10 AM-1:50 PM; Lunch+rest 2:00-3:30 PM; Project (backend) 4:00-6:30 PM; Revise DIP/FYDP 8:00-9:00 PM
  { id: "tb-sat-1", weekday: "SAT", start_time: "09:50", end_time: "11:10", type: "class", label: "DIP (425)", default_category: "cat-4", is_fixed: true, is_active: true },
  { id: "tb-sat-2", weekday: "SAT", start_time: "11:10", end_time: "13:50", type: "class", label: "FYDP-I (626)", default_category: "cat-6", is_fixed: true, is_active: true },
  { id: "tb-sat-3", weekday: "SAT", start_time: "14:00", end_time: "15:30", type: "break", label: "Lunch+rest", is_fixed: false, is_active: true },
  { id: "tb-sat-4", weekday: "SAT", start_time: "16:00", end_time: "18:30", type: "project", label: "Project (backend)", default_category: "cat-8", is_fixed: false, is_active: true },
  { id: "tb-sat-5", weekday: "SAT", start_time: "20:00", end_time: "21:00", type: "study", label: "Revise DIP/FYDP", default_category: "cat-4", is_fixed: false, is_active: true },

  // SUN: Economics (406) 9:50-11:10 AM; Op. Systems (406) 11:10 AM-12:30 PM; Prob & Stat (630) 12:30-1:50 PM; Lunch+rest 2:00-3:30 PM; Study OS/Eco 4:00-5:30 PM; CP 1-2 problems 8:00-9:00 PM
  { id: "tb-sun-1", weekday: "SUN", start_time: "09:50", end_time: "11:10", type: "class", label: "Economics (406)", default_category: "cat-3", is_fixed: true, is_active: true },
  { id: "tb-sun-2", weekday: "SUN", start_time: "11:10", end_time: "12:30", type: "class", label: "Op. Systems (406)", default_category: "cat-1", is_fixed: true, is_active: true },
  { id: "tb-sun-3", weekday: "SUN", start_time: "12:30", end_time: "13:50", type: "class", label: "Prob & Stat (630)", default_category: "cat-5", is_fixed: true, is_active: true },
  { id: "tb-sun-4", weekday: "SUN", start_time: "14:00", end_time: "15:30", type: "break", label: "Lunch+rest", is_fixed: false, is_active: true },
  { id: "tb-sun-5", weekday: "SUN", start_time: "16:00", end_time: "17:30", type: "study", label: "Study OS/Eco", default_category: "cat-1", is_fixed: false, is_active: true },
  { id: "tb-sun-6", weekday: "SUN", start_time: "20:00", end_time: "21:00", type: "cp", label: "CP 1-2 problems", default_category: "cat-10", is_fixed: false, is_active: true },

  // MON: Project deep work 10:00 AM-1:00 PM; Lunch+rest 1:00-2:30 PM; Study Math/OS 2:30-4:30 PM; Prep+travel 5:00-6:00 PM; TUITION 6:00-7:30 PM
  { id: "tb-mon-1", weekday: "MON", start_time: "10:00", end_time: "13:00", type: "project", label: "Project deep work", default_category: "cat-8", is_fixed: false, is_active: true },
  { id: "tb-mon-2", weekday: "MON", start_time: "13:00", end_time: "14:30", type: "break", label: "Lunch+rest", is_fixed: false, is_active: true },
  { id: "tb-mon-3", weekday: "MON", start_time: "14:30", end_time: "16:30", type: "study", label: "Study Math/OS", default_category: "cat-5", is_fixed: false, is_active: true },
  { id: "tb-mon-4", weekday: "MON", start_time: "17:00", end_time: "18:00", type: "break", label: "Prep+travel", is_fixed: false, is_active: true },
  { id: "tb-mon-5", weekday: "MON", start_time: "18:00", end_time: "19:30", type: "tuition", label: "TUITION", default_category: "cat-11", is_fixed: true, is_active: true },

  // TUE: DIP (425) 9:50-11:10 AM; OS Lab (827) 11:10 AM-1:50 PM; Lunch+rest 2:00-3:30 PM; Study DIP/OS Lab 4:00-5:30 PM; SQL/backend learn 8:00-9:00 PM
  { id: "tb-tue-1", weekday: "TUE", start_time: "09:50", end_time: "11:10", type: "class", label: "DIP (425)", default_category: "cat-4", is_fixed: true, is_active: true },
  { id: "tb-tue-2", weekday: "TUE", start_time: "11:10", end_time: "13:50", type: "class", label: "OS Lab (827)", default_category: "cat-2", is_fixed: true, is_active: true },
  { id: "tb-tue-3", weekday: "TUE", start_time: "14:00", end_time: "15:30", type: "break", label: "Lunch+rest", is_fixed: false, is_active: true },
  { id: "tb-tue-4", weekday: "TUE", start_time: "16:00", end_time: "17:30", type: "study", label: "Study DIP/OS Lab", default_category: "cat-4", is_fixed: false, is_active: true },
  { id: "tb-tue-5", weekday: "TUE", start_time: "20:00", end_time: "21:00", type: "cp", label: "SQL/backend learn", default_category: "cat-8", is_fixed: false, is_active: true },

  // WED: Economics 9:50-11:10 AM; Op. Systems 11:10 AM-12:30 PM; Prob & Stat 12:30-1:50 PM; Lunch+rest 2:00-3:30 PM; Study Math practice 4:00-5:30 PM; CP 1-2 problems 8:00-9:00 PM
  { id: "tb-wed-1", weekday: "WED", start_time: "09:50", end_time: "11:10", type: "class", label: "Economics", default_category: "cat-3", is_fixed: true, is_active: true },
  { id: "tb-wed-2", weekday: "WED", start_time: "11:10", end_time: "12:30", type: "class", label: "Op. Systems", default_category: "cat-1", is_fixed: true, is_active: true },
  { id: "tb-wed-3", weekday: "WED", start_time: "12:30", end_time: "13:50", type: "class", label: "Prob & Stat", default_category: "cat-5", is_fixed: true, is_active: true },
  { id: "tb-wed-4", weekday: "WED", start_time: "14:00", end_time: "15:30", type: "break", label: "Lunch+rest", is_fixed: false, is_active: true },
  { id: "tb-wed-5", weekday: "WED", start_time: "16:00", end_time: "17:30", type: "study", label: "Study Math practice", default_category: "cat-5", is_fixed: false, is_active: true },
  { id: "tb-wed-6", weekday: "WED", start_time: "20:00", end_time: "21:00", type: "cp", label: "CP 1-2 problems", default_category: "cat-10", is_fixed: false, is_active: true },

  // THU: Project deep work 10:00 AM-1:00 PM; Lunch+rest 1:00-2:30 PM; Study weakest course 2:30-4:30 PM; Prep+travel 5:00-6:00 PM; TUITION 6:00-7:30 PM
  { id: "tb-thu-1", weekday: "THU", start_time: "10:00", end_time: "13:00", type: "project", label: "Project deep work", default_category: "cat-8", is_fixed: false, is_active: true },
  { id: "tb-thu-2", weekday: "THU", start_time: "13:00", end_time: "14:30", type: "break", label: "Lunch+rest", is_fixed: false, is_active: true },
  { id: "tb-thu-3", weekday: "THU", start_time: "14:30", end_time: "16:30", type: "study", label: "Study weakest course", default_category: "cat-1", is_fixed: false, is_active: true },
  { id: "tb-thu-4", weekday: "THU", start_time: "17:00", end_time: "18:00", type: "break", label: "Prep+travel", is_fixed: false, is_active: true },
  { id: "tb-thu-5", weekday: "THU", start_time: "18:00", end_time: "19:30", type: "tuition", label: "TUITION", default_category: "cat-11", is_fixed: true, is_active: true },

  // FRI: Project/ML/security 10:00 AM-12:30 PM; Jumu'ah+lunch 12:30-3:00 PM; Weekly review+CP 3:00-4:30 PM; Prep+travel 5:00-6:00 PM; TUITION 6:00-7:30 PM
  { id: "tb-fri-1", weekday: "FRI", start_time: "10:00", end_time: "12:30", type: "project", label: "Project/ML/security", default_category: "cat-7", is_fixed: false, is_active: true },
  { id: "tb-fri-2", weekday: "FRI", start_time: "12:30", end_time: "15:00", type: "break", label: "Jumu'ah+lunch", is_fixed: false, is_active: true },
  { id: "tb-fri-3", weekday: "FRI", start_time: "15:00", end_time: "16:30", type: "study", label: "Weekly review+CP", default_category: "cat-10", is_fixed: false, is_active: true },
  { id: "tb-fri-4", weekday: "FRI", start_time: "17:00", end_time: "18:00", type: "break", label: "Prep+travel", is_fixed: false, is_active: true },
  { id: "tb-fri-5", weekday: "FRI", start_time: "18:00", end_time: "19:30", type: "tuition", label: "TUITION", default_category: "cat-11", is_fixed: true, is_active: true }
];

export const DEFAULT_ACADEMIC_EVENTS: AcademicEvent[] = [
  { id: "ae-01", date: "2026-10-27", title: "Classes begin", type: "deadline", details: "Fall semester classes commence" },
  { id: "ae-02", date: "2026-10-31", title: "Last day to drop, 100% refund", type: "deadline", details: "Full tuition refund cutoff" },
  { id: "ae-03", date: "2026-11-05", title: "Online Saturday class", type: "class_override", details: JSON.stringify({ overrideWeekday: "SAT", isOnline: true }) },
  { id: "ae-04", date: "2026-11-07", title: "Holiday (No class)", type: "holiday", details: "Holiday - university classes suspended" },
  { id: "ae-05", date: "2026-11-12", title: "Online Saturday class", type: "class_override", details: JSON.stringify({ overrideWeekday: "SAT", isOnline: true }) },
  { id: "ae-06", date: "2026-11-22", title: "1st installment due", type: "payment", details: "Tuition installment 1 due" },
  { id: "ae-07", date: "2026-11-26", title: "Online Sunday class", type: "class_override", details: JSON.stringify({ overrideWeekday: "SUN", isOnline: true }) },
  { id: "ae-08", date: "2026-12-05", end_date: "2026-12-12", title: "MID-TERM EXAM", type: "exam", details: "Mid-term examinations period" },
  { id: "ae-09", date: "2026-12-15", title: "2nd installment due", type: "payment", details: "Tuition installment 2 due" },
  { id: "ae-10", date: "2026-12-16", title: "Holiday (Victory Day)", type: "holiday", details: "Victory Day - university closed" },
  { id: "ae-11", date: "2026-12-17", title: "Online Wednesday class", type: "class_override", details: JSON.stringify({ overrideWeekday: "WED", isOnline: true }) },
  { id: "ae-12", date: "2026-12-23", title: "Last day of course withdrawal", type: "deadline", details: "Course withdrawal deadline" },
  { id: "ae-13", date: "2026-12-31", title: "Online Saturday class", type: "class_override", details: JSON.stringify({ overrideWeekday: "SAT", isOnline: true }) },
  { id: "ae-14", date: "2027-01-13", title: "3rd installment due", type: "payment", details: "Tuition installment 3 due" },
  { id: "ae-15", date: "2027-01-21", end_date: "2027-01-24", title: "Classes suspended", type: "holiday", details: "Pre-finals study recess" },
  { id: "ae-16", date: "2027-01-25", end_date: "2027-02-01", title: "FINAL EXAM", type: "exam", details: "Final examinations period" },
  { id: "ae-17", date: "2027-02-04", title: "Last day of grade submission", type: "deadline", details: "Grade submission deadline" }
];


