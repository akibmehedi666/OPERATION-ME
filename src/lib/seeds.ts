import {
  Category,
  ClassScheduleItem,
  Mission,
  TimeBlock,
  AcademicEvent,
  RecurringRule,
  Course,
  LectureLog,
  CyberTopic,
  ResearchPaper,
  SideProject,
  NotificationSettings,
  CodeforcesLog,
  WeeklyReview,
} from "@/types/database";

/* =====================================================================
 * ======================= 1. STRUCTURE (KEEP) =========================
 * Essential timetable, routine, courses, academic calendar, category
 * color tokens, time blocks, recurring rules, and full cybersecurity
 * roadmap structure (all set to "not_started" for fresh users).
 * ===================================================================== */

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
    type: "class",
  },
  {
    id: "sched-2",
    day_of_week: "SAT",
    start_time: "11:10",
    end_time: "13:50",
    course_name: "Final Year Design Project (FYDP-I)",
    room: "626",
    type: "class",
  },

  // SUN & WED: 09:50 Economics (406); 11:10 OS (406); 12:30-13:50 Prob & Stats (630)
  {
    id: "sched-3",
    day_of_week: "SUN",
    start_time: "09:50",
    end_time: "11:10",
    course_name: "Economics",
    room: "406",
    type: "class",
  },
  {
    id: "sched-4",
    day_of_week: "SUN",
    start_time: "11:10",
    end_time: "12:30",
    course_name: "Operating Systems",
    room: "406",
    type: "class",
  },
  {
    id: "sched-5",
    day_of_week: "SUN",
    start_time: "12:30",
    end_time: "13:50",
    course_name: "Probability & Statistics",
    room: "630",
    type: "class",
  },

  // MON: Tuition (I teach) 18:00-19:30
  {
    id: "sched-6",
    day_of_week: "MON",
    start_time: "18:00",
    end_time: "19:30",
    course_name: "Tuition (I teach)",
    room: "Remote/Home",
    type: "tuition",
  },

  // TUE: 09:50 DIP (425); 11:10-13:50 OS Lab (827)
  {
    id: "sched-7",
    day_of_week: "TUE",
    start_time: "09:50",
    end_time: "11:10",
    course_name: "Digital Image Processing (DIP)",
    room: "425",
    type: "class",
  },
  {
    id: "sched-8",
    day_of_week: "TUE",
    start_time: "11:10",
    end_time: "13:50",
    course_name: "OS Lab",
    room: "827",
    type: "class",
  },

  // WED: 09:50 Economics (406); 11:10 OS (406); 12:30-13:50 Prob & Stats (630)
  {
    id: "sched-9",
    day_of_week: "WED",
    start_time: "09:50",
    end_time: "11:10",
    course_name: "Economics",
    room: "406",
    type: "class",
  },
  {
    id: "sched-10",
    day_of_week: "WED",
    start_time: "11:10",
    end_time: "12:30",
    course_name: "Operating Systems",
    room: "406",
    type: "class",
  },
  {
    id: "sched-11",
    day_of_week: "WED",
    start_time: "12:30",
    end_time: "13:50",
    course_name: "Probability & Statistics",
    room: "630",
    type: "class",
  },

  // THU: Tuition (I teach) 18:00-19:30
  {
    id: "sched-12",
    day_of_week: "THU",
    start_time: "18:00",
    end_time: "19:30",
    course_name: "Tuition (I teach)",
    room: "Remote/Home",
    type: "tuition",
  },

  // FRI: Tuition (I teach) 18:00-19:30
  {
    id: "sched-13",
    day_of_week: "FRI",
    start_time: "18:00",
    end_time: "19:30",
    course_name: "Tuition (I teach)",
    room: "Remote/Home",
    type: "tuition",
  },
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
  { id: "tb-fri-5", weekday: "FRI", start_time: "18:00", end_time: "19:30", type: "tuition", label: "TUITION", default_category: "cat-11", is_fixed: true, is_active: true },
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
  { id: "ae-17", date: "2027-02-04", title: "Last day of grade submission", type: "deadline", details: "Grade submission deadline" },
];

export const DEFAULT_RECURRING_RULES: RecurringRule[] = [
  {
    id: "rr-class-review",
    title: "Review lecture: <course>",
    rule_type: "class_review",
    category_id: "cat-1",
    priority: "medium",
    frequency: "daily",
    interval: 1,
    time_of_day: "23:59",
    xp: 40,
    is_active: true,
  },
  {
    id: "rr-tuition-prep",
    title: "Prepare tuition lesson",
    rule_type: "tuition_prep",
    category_id: "cat-11",
    priority: "high",
    frequency: "weekly",
    interval: 1,
    days_of_week: [1, 4, 5], // MON, THU, FRI
    time_of_day: "16:00", // 2 hours before 18:00
    xp: 35,
    is_active: true,
  },
  {
    id: "rr-cp-daily",
    title: "Solve 1 Codeforces problem",
    rule_type: "cp_daily",
    category_id: "cat-10",
    priority: "medium",
    frequency: "daily",
    interval: 1,
    time_of_day: "21:00",
    xp: 30,
    is_active: true,
  },
  {
    id: "rr-cyber-daily",
    title: "Cybersecurity: 30-60 min",
    rule_type: "cyber_daily",
    category_id: "cat-7",
    priority: "medium",
    frequency: "weekly",
    interval: 1,
    days_of_week: [1, 2, 4, 5], // 4 days a week (MON, TUE, THU, FRI)
    time_of_day: "17:30",
    xp: 40,
    is_active: true,
  },
  {
    id: "rr-weekly-review",
    title: "Weekly review",
    rule_type: "weekly_review",
    category_id: "cat-1",
    priority: "high",
    frequency: "weekly",
    interval: 1,
    days_of_week: [5], // FRI
    time_of_day: "15:00",
    xp: 50,
    is_active: true,
  },
  {
    id: "rr-paper-weekly",
    title: "Read 1 research paper",
    rule_type: "paper_weekly",
    category_id: "cat-9",
    priority: "medium",
    frequency: "weekly",
    interval: 1,
    days_of_week: [0, 6], // SUN, SAT
    time_of_day: "16:00",
    xp: 60,
    is_active: true,
  },
  {
    id: "rr-project-step",
    title: "Side project: one small step",
    rule_type: "project_step",
    category_id: "cat-8",
    priority: "high",
    frequency: "weekly",
    interval: 1,
    days_of_week: [6, 1, 4], // SAT, MON, THU
    time_of_day: "18:30",
    xp: 50,
    is_active: true,
  },
];

// Clean Course Structure with empty resources for fresh users
export const DEFAULT_COURSES: Course[] = [
  {
    id: "course-os",
    code: "CSE-406",
    name: "Operating Systems",
    section: "A",
    room: "406",
    faculty: "Dr. Tariqul Islam",
    category_id: "cat-1",
    color: "#10b981",
    class_times: "SUN & WED 11:10 AM - 12:30 PM",
    credits: 3,
    resources: [],
  },
  {
    id: "course-os-lab",
    code: "CSE-827",
    name: "OS Lab",
    section: "A",
    room: "827",
    faculty: "Md. Mahmudul Hasan",
    category_id: "cat-2",
    color: "#06b6d4",
    class_times: "TUE 11:10 AM - 1:50 PM",
    credits: 1.5,
    resources: [],
  },
  {
    id: "course-econ",
    code: "ECO-406",
    name: "Economics",
    section: "B",
    room: "406",
    faculty: "Prof. Farzana Rahman",
    category_id: "cat-3",
    color: "#f59e0b",
    class_times: "SUN & WED 9:50 AM - 11:10 AM",
    credits: 3,
    resources: [],
  },
  {
    id: "course-dip",
    code: "CSE-425",
    name: "Digital Image Processing",
    section: "A",
    room: "425",
    faculty: "Dr. Kazi Sakib",
    category_id: "cat-4",
    color: "#8b5cf6",
    class_times: "SAT & TUE 9:50 AM - 11:10 AM",
    credits: 3,
    resources: [],
  },
  {
    id: "course-stat",
    code: "STAT-630",
    name: "Probability & Statistics",
    section: "C",
    room: "630",
    faculty: "Dr. Mahbubul Alam",
    category_id: "cat-5",
    color: "#ec4899",
    class_times: "SUN & WED 12:30 PM - 1:50 PM",
    credits: 3,
    resources: [],
  },
  {
    id: "course-fydp",
    code: "CSE-626",
    name: "Final Year Design Project (FYDP-I)",
    section: "1",
    room: "626",
    faculty: "Prof. Hasan Sarwar",
    category_id: "cat-6",
    color: "#ef4444",
    class_times: "SAT 11:10 AM - 1:50 PM",
    credits: 3,
    resources: [],
  },
];

// Cybersecurity Tactical Syllabus Topics - All set to not_started for fresh users
export const DEFAULT_CYBER_TOPICS: CyberTopic[] = [
  // Section 1: Foundations (Linux, Networking, Python/Bash scripting)
  {
    id: "ct-01",
    section: "Foundations (Linux, Networking, Python/Bash scripting)",
    title: "OSI Model & TCP/IP Stack Encapsulation",
    status: "not_started",
    goal: "Understand layer-by-layer packet encapsulation, PDU naming (Data, Segment, Packet, Frame, Bits), and traffic flow through switches and routers.",
    learning_links: [
      { title: "Cloudflare: What is the OSI Model?", url: "https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/" },
      { title: "Professor Messer: Network+ OSI Video", url: "https://www.professormesser.com/network-plus/n10-008/n10-008-video/the-osi-model/" },
    ],
    hands_on_task: "TryHackMe Introductory Networking: Complete OSI & TCP/IP packet traversal questions",
    hands_on_url: "https://tryhackme.com/room/introductorynetworking",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 1,
  },
  {
    id: "ct-02",
    section: "Foundations (Linux, Networking, Python/Bash scripting)",
    title: "TCP 3-Way Handshake & Flags (SYN, ACK, FIN, RST)",
    status: "not_started",
    goal: "Master TCP session establishment, sequence/acknowledgment numbers, reset mechanics, and teardown states.",
    learning_links: [
      { title: "Wireshark Wiki: TCP Analysis", url: "https://wiki.wireshark.org/TCP" },
      { title: "GeeksforGeeks: TCP 3-Way Handshake", url: "https://www.geeksforgeeks.org/tcp-3-way-handshake-process/" },
    ],
    hands_on_task: "Wireshark Packet Analysis: Filter 'tcp.flags.syn == 1' and inspect 3-way handshake seq/ack numbers",
    hands_on_url: "https://tryhackme.com/room/wiresharkthebasics",
    hands_on_platform: "Wireshark / THM",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 2,
  },
  {
    id: "ct-03",
    section: "Foundations (Linux, Networking, Python/Bash scripting)",
    title: "DNS Hierarchy, Records & DHCP Leases",
    status: "not_started",
    goal: "Understand root DNS servers, TLDs, authoritative resolvers, DNS record types (A, AAAA, CNAME, MX, TXT), and DHCP DORA process.",
    learning_links: [
      { title: "Cloudflare: How DNS Works", url: "https://www.cloudflare.com/learning/dns/what-is-dns/" },
      { title: "Professor Messer: DNS Record Types", url: "https://www.professormesser.com/network-plus/n10-008/n10-008-video/dns-records/" },
    ],
    hands_on_task: "TryHackMe DNS in Detail: Perform nslookup and dig commands to query DNS records and zone transfers",
    hands_on_url: "https://tryhackme.com/room/dnsindetail",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 3,
  },
  {
    id: "ct-04",
    section: "Foundations (Linux, Networking, Python/Bash scripting)",
    title: "Subnetting (CIDR), Routing Tables & NAT",
    status: "not_started",
    goal: "Calculate network addresses, broadcast addresses, and usable host ranges using CIDR notations (/24, /27) and understand RFC 1918 private IP ranges and NAT.",
    learning_links: [
      { title: "Subnetting Practice & Tutorial", url: "https://www.subnetting.net/Tutorial.aspx" },
      { title: "Practical Networking: Subnetting Mastery", url: "https://www.practicalnetworking.net/index/subnetting-mastery/" },
    ],
    hands_on_task: "Subnetting.net: Complete 10 CIDR to host/network address calculations without a calculator",
    hands_on_url: "https://www.subnetting.net/SubnetQuestions.aspx",
    hands_on_platform: "Subnetting.net",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 4,
  },
  {
    id: "ct-05",
    section: "Foundations (Linux, Networking, Python/Bash scripting)",
    title: "Linux File Permissions, Octals & SUID/SGID Bits",
    status: "not_started",
    goal: "Master Linux rwx permissions, octal representations, ownership, sticky bits, and SUID execution risks.",
    learning_links: [
      { title: "Linux Journey: File Permissions", url: "https://linuxjourney.com/lesson/file-permissions" },
      { title: "Red Hat: Guide to Linux File Permissions", url: "https://www.redhat.com/sysadmin/linux-file-permissions" },
    ],
    hands_on_task: "OverTheWire Bandit: Complete Levels 0 through 5 (Navigation, hidden files, and readable file perms)",
    hands_on_url: "https://overthewire.org/wargames/bandit/bandit0.html",
    hands_on_platform: "OverTheWire",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 5,
  },
  {
    id: "ct-06",
    section: "Foundations (Linux, Networking, Python/Bash scripting)",
    title: "Bash Scripting & Piping Automation",
    status: "not_started",
    goal: "Automate security tasks using Bash loops, xargs, grep/awk/sed parsing, and background process management.",
    learning_links: [
      { title: "Ryans Tutorials: Bash Scripting Guide", url: "https://ryanstutorials.net/bash-scripting-tutorial/" },
      { title: "DevDocs: Bash Command Reference", url: "https://devdocs.io/bash/" },
    ],
    hands_on_task: "OverTheWire Bandit: Complete Levels 6 through 12 (Find commands, owner filtering, and uncompressing)",
    hands_on_url: "https://overthewire.org/wargames/bandit/bandit6.html",
    hands_on_platform: "OverTheWire",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 6,
  },
  {
    id: "ct-07",
    section: "Foundations (Linux, Networking, Python/Bash scripting)",
    title: "Python Socket Programming & Port Scanner",
    status: "not_started",
    goal: "Write a multi-threaded Python TCP port scanner using the standard socket module to scan active hosts.",
    learning_links: [
      { title: "Python Official Docs: Socket Programming HOWTO", url: "https://docs.python.org/3/howto/sockets.html" },
      { title: "Real Python: Python Sockets Tutorial", url: "https://realpython.com/python-sockets/" },
    ],
    hands_on_task: "TryHackMe Python Basics: Build a script to connect to a target TCP port and grab the service banner",
    hands_on_url: "https://tryhackme.com/room/pythonbasics",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 7,
  },

  // Section 2: Cryptography basics
  {
    id: "ct-08",
    section: "Cryptography basics",
    title: "Symmetric Encryption (AES, ChaCha20) & Block Modes",
    status: "not_started",
    goal: "Understand stream vs block ciphers, why ECB mode leaks patterns, CBC initialization vectors, and GCM authentication.",
    learning_links: [
      { title: "Crypto101: A Tutorial on Modern Cryptography", url: "https://www.crypto101.io/" },
      { title: "Cloudflare: Why AES-GCM?", url: "https://blog.cloudflare.com/padding-oracles-and-the-decline-of-cbc-mode-ciphersuites/" },
    ],
    hands_on_task: "CryptoHack: Complete Introduction & Modular XOR Challenges",
    hands_on_url: "https://cryptohack.org/challenges/introduction/",
    hands_on_platform: "CryptoHack",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 8,
  },
  {
    id: "ct-09",
    section: "Cryptography basics",
    title: "Asymmetric Cryptography (RSA, ECC) & Key Exchanges",
    status: "not_started",
    goal: "Grasp public/private key pairs, prime factorisation hardness (RSA), and Diffie-Hellman key exchange mechanics.",
    learning_links: [
      { title: "Khan Academy: Journey into Cryptography", url: "https://www.khanacademy.org/computing/computer-science/cryptography" },
      { title: "Computerphile: How RSA Encryption Works", url: "https://www.youtube.com/watch?v=4zahvcJ9glg" },
    ],
    hands_on_task: "CryptoHack: Complete RSA Starter 1 and Starter 2 (Modular Arithmetic & Euler totient)",
    hands_on_url: "https://cryptohack.org/challenges/rsa/",
    hands_on_platform: "CryptoHack",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 9,
  },
  {
    id: "ct-10",
    section: "Cryptography basics",
    title: "Cryptographic Hashing, Salts & Rainbow Tables",
    status: "not_started",
    goal: "Understand SHA-256 vs slow KDFs (bcrypt, Argon2), collision resistance, pre-image resistance, and salt defenses.",
    learning_links: [
      { title: "OWASP: Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" },
      { title: "Troy Hunt: Everything You Need to Know About Passwords", url: "https://www.troyhunt.com/" },
    ],
    hands_on_task: "OverTheWire Bandit: Complete Level 13 to 14 (SSH key auth and netcat localhost password submission)",
    hands_on_url: "https://overthewire.org/wargames/bandit/bandit13.html",
    hands_on_platform: "OverTheWire",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 10,
  },
  {
    id: "ct-11",
    section: "Cryptography basics",
    title: "TLS 1.3 Handshake & Public Key Infrastructure (PKI)",
    status: "not_started",
    goal: "Learn how Certificate Authorities (CAs), X.509 certificates, and TLS 1.3 1-RTT handshakes secure web traffic.",
    learning_links: [
      { title: "The Illustrated TLS 1.3 Connection", url: "https://tls13.xargs.org/" },
      { title: "Cloudflare: What is TLS (Transport Layer Security)?", url: "https://www.cloudflare.com/learning/ssl/what-is-ssl/" },
    ],
    hands_on_task: "TryHackMe Encryption - Crypto 101: Complete TLS Handshake and Public Key Infrastructure Tasks",
    hands_on_url: "https://tryhackme.com/room/encryptioncrypto",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 11,
  },

  // Section 3: Web Security & OWASP Top 10
  {
    id: "ct-12",
    section: "Web Security & OWASP Top 10",
    title: "SQL Injection: Union-based & Error-based Payloads",
    status: "not_started",
    goal: "Understand SQL query concatenation flaws, extract table schemas via UNION SELECT, and apply parameterized queries.",
    learning_links: [
      { title: "PortSwigger: SQL Injection Vulnerabilities", url: "https://portswigger.net/web-security/sql-injection" },
      { title: "OWASP: SQL Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html" },
    ],
    hands_on_task: "PortSwigger Lab: SQL injection vulnerability in WHERE clause allowing retrieval of hidden data",
    hands_on_url: "https://portswigger.net/web-security/sql-injection/lab-retrieve-hidden-data",
    hands_on_platform: "PortSwigger Web Security Academy",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 12,
  },
  {
    id: "ct-13",
    section: "Web Security & OWASP Top 10",
    title: "Cross-Site Scripting (XSS): Reflected, Stored, DOM",
    status: "not_started",
    goal: "Distinguish between reflected, stored, and DOM-based XSS, craft benign proof-of-concept payloads, and configure CSP headers.",
    learning_links: [
      { title: "PortSwigger: Cross-site Scripting (XSS)", url: "https://portswigger.net/web-security/cross-site-scripting" },
      { title: "OWASP: XSS Filter Evasion Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html" },
    ],
    hands_on_task: "PortSwigger Lab: Reflected XSS into HTML context with nothing encoded",
    hands_on_url: "https://portswigger.net/web-security/cross-site-scripting/reflected/lab-html-context-nothing-encoded",
    hands_on_platform: "PortSwigger Web Security Academy",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 13,
  },
  {
    id: "ct-14",
    section: "Web Security & OWASP Top 10",
    title: "Cross-Site Request Forgery (CSRF) & SameSite Protection",
    status: "not_started",
    goal: "Understand cookie ambient authentication, CSRF PoC exploit generation, anti-CSRF token verification, and SameSite Lax/Strict.",
    learning_links: [
      { title: "PortSwigger: Cross-Site Request Forgery (CSRF)", url: "https://portswigger.net/web-security/csrf" },
      { title: "MDN: SameSite Cookie Attribute Guide", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value" },
    ],
    hands_on_task: "PortSwigger Lab: CSRF vulnerability with no defenses (Craft auto-submitting HTML form)",
    hands_on_url: "https://portswigger.net/web-security/csrf/lab-no-defenses",
    hands_on_platform: "PortSwigger Web Security Academy",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 14,
  },
  {
    id: "ct-15",
    section: "Web Security & OWASP Top 10",
    title: "Server-Side Request Forgery (SSRF) to Cloud Metadata",
    status: "not_started",
    goal: "Learn how servers can be coerced to request internal LAN services and AWS/GCP cloud metadata endpoints (169.254.169.254).",
    learning_links: [
      { title: "PortSwigger: Server-Side Request Forgery (SSRF)", url: "https://portswigger.net/web-security/ssrf" },
      { title: "OWASP: Server-Side Request Forgery Prevention", url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html" },
    ],
    hands_on_task: "PortSwigger Lab: Basic SSRF against the local server (Access /admin endpoint via stock check)",
    hands_on_url: "https://portswigger.net/web-security/ssrf/lab-basic-ssrf-against-localhost",
    hands_on_platform: "PortSwigger Web Security Academy",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 15,
  },
  {
    id: "ct-16",
    section: "Web Security & OWASP Top 10",
    title: "Broken Authentication, JWT Tampering & Session Hijacking",
    status: "not_started",
    goal: "Analyze JWT structure (Header.Payload.Signature), the 'none' algorithm bypass, key confusion, and session fixation.",
    learning_links: [
      { title: "PortSwigger: JWT Attacks & Vulnerabilities", url: "https://portswigger.net/web-security/jwt" },
      { title: "OWASP: Authentication & Session Management", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html" },
    ],
    hands_on_task: "PortSwigger Lab: JWT authentication bypass via unverified signature (Modify sub claim to administrator)",
    hands_on_url: "https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-unverified-signature",
    hands_on_platform: "PortSwigger Web Security Academy",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 16,
  },

  // Section 4: Tools (Nmap, Burp Suite, Wireshark, Metasploit)
  {
    id: "ct-17",
    section: "Tools (Nmap, Burp Suite, Wireshark, Metasploit)",
    title: "Nmap: Stealth SYN Scans, Service Probing (-sS, -sV, -sC)",
    status: "not_started",
    goal: "Master network discovery, SYN half-open scanning, banner grabbing, NSE script auditing, and OS detection.",
    learning_links: [
      { title: "Nmap Network Scanning Book (Official Fyodor)", url: "https://nmap.org/book/man.html" },
      { title: "SANS: Nmap Cheat Sheet", url: "https://www.sans.org/posters/nmap-cheat-sheet/" },
    ],
    hands_on_task: "TryHackMe Further Nmap: Complete full scan with service probing (-sV) and default scripts (-sC)",
    hands_on_url: "https://tryhackme.com/room/furthernmap",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 17,
  },
  {
    id: "ct-18",
    section: "Tools (Nmap, Burp Suite, Wireshark, Metasploit)",
    title: "Burp Suite: Intercept, Repeater & Intruder Automation",
    status: "not_started",
    goal: "Intercept HTTP traffic through loopback proxy, replay requests in Repeater, and execute fuzzing payloads with Intruder.",
    learning_links: [
      { title: "PortSwigger: Getting Started with Burp Suite", url: "https://portswigger.net/burp/documentation/desktop/getting-started" },
      { title: "TryHackMe: Burp Suite The Basics", url: "https://tryhackme.com/room/burpsuitebasics" },
    ],
    hands_on_task: "TryHackMe Burp Suite The Basics: Intercept browser request and modify header values in flight",
    hands_on_url: "https://tryhackme.com/room/burpsuitebasics",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 18,
  },
  {
    id: "ct-19",
    section: "Tools (Nmap, Burp Suite, Wireshark, Metasploit)",
    title: "Wireshark: Deep Packet Inspection, Streams & Display Filters",
    status: "not_started",
    goal: "Filter PCAP captures with display expressions (e.g. http.request.method == 'POST'), follow TCP streams, and extract objects.",
    learning_links: [
      { title: "Wireshark Official User Guide", url: "https://www.wireshark.org/docs/wsug_html_chunked/" },
      { title: "Malware Traffic Analysis: PCAP Exercise Archive", url: "https://www.malware-traffic-analysis.net/" },
    ],
    hands_on_task: "TryHackMe Wireshark The Basics: Follow TCP Stream to recover transmitted plaintext credentials",
    hands_on_url: "https://tryhackme.com/room/wiresharkthebasics",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 19,
  },
  {
    id: "ct-20",
    section: "Tools (Nmap, Burp Suite, Wireshark, Metasploit)",
    title: "Metasploit Framework: Modules, Payloads & Meterpreter",
    status: "not_started",
    goal: "Navigate msfconsole, select auxiliary scanners and exploit modules, configure multi/handler, and interact with Meterpreter.",
    learning_links: [
      { title: "OffSec: Metasploit Unleashed Free Course", url: "https://www.offsec.com/metasploit-unleashed/" },
      { title: "Rapid7: Metasploit Framework Documentation", url: "https://docs.metasploit.com/" },
    ],
    hands_on_task: "TryHackMe Metasploit Unleashed: Launch exploit against target VM and obtain a reverse meterpreter shell",
    hands_on_url: "https://tryhackme.com/room/rpmetasploit",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 20,
  },

  // Section 5: CTF Practice (ongoing, unlockable from the start)
  {
    id: "ct-21",
    section: "CTF Practice (ongoing, unlockable from the start)",
    title: "OverTheWire: Bandit Levels 0-15 (Linux & Network Fundamentals)",
    status: "not_started",
    goal: "Master Linux CLI security challenges: navigation, hidden files, SUID binaries, SSH keys, and compressed data parsing.",
    learning_links: [
      { title: "OverTheWire: Bandit Wargame Information", url: "https://overthewire.org/wargames/bandit/" },
      { title: "Bandit Walkthrough & Methodology Discussion", url: "https://mayadevbe.me/posts/overthewire/bandit/" },
    ],
    hands_on_task: "OverTheWire Bandit: Solve Level 0 to Level 15 using SSH keys, grep, find, and openssl s_client",
    hands_on_url: "https://overthewire.org/wargames/bandit/bandit0.html",
    hands_on_platform: "OverTheWire",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 21,
  },
  {
    id: "ct-22",
    section: "CTF Practice (ongoing, unlockable from the start)",
    title: "OverTheWire: Bandit Levels 16-25 (SSH Keys, Sockets, Cron)",
    status: "not_started",
    goal: "Master Linux CLI security challenges: submit passwords to SSL network daemons, exploit root cron jobs, and analyze SUIDs.",
    learning_links: [
      { title: "OverTheWire: Bandit Wargame Information", url: "https://overthewire.org/wargames/bandit/" },
      { title: "Bandit Walkthrough & Methodology Discussion", url: "https://mayadevbe.me/posts/overthewire/bandit/" },
    ],
    hands_on_task: "OverTheWire Bandit: Solve Level 16 to Level 25 without reading full spoiler walkthroughs",
    hands_on_url: "https://overthewire.org/wargames/bandit/bandit16.html",
    hands_on_platform: "OverTheWire",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 22,
  },
  {
    id: "ct-23",
    section: "CTF Practice (ongoing, unlockable from the start)",
    title: "picoCTF: Web Exploitation Category Challenges",
    status: "not_started",
    goal: "Develop practical intuition for client-side inspections, HTTP method manipulation, cookie tampering, and source reading.",
    learning_links: [
      { title: "picoCTF Learning Platform", url: "https://picoctf.org/" },
      { title: "picoPrimer: Getting Started with CTFs", url: "https://primer.picoctf.org/" },
    ],
    hands_on_task: "picoCTF: Solve 3 Web Exploitation challenges (e.g., 'Insp3ct0r', 'GET aHEAD', 'Cookies')",
    hands_on_url: "https://play.picoctf.org/practice",
    hands_on_platform: "picoCTF",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 23,
  },
  {
    id: "ct-24",
    section: "CTF Practice (ongoing, unlockable from the start)",
    title: "TryHackMe: Complete Beginner Pathway & Boot2Root Machines",
    status: "not_started",
    goal: "Synthesize reconnaissance, port scanning, web enumeration, and exploitation into a full target machine compromise.",
    learning_links: [
      { title: "TryHackMe: Complete Beginner Path", url: "https://tryhackme.com/path/outline/beginner" },
      { title: "TryHackMe: Blue Room (MS17-010 EternalBlue)", url: "https://tryhackme.com/room/blue" },
    ],
    hands_on_task: "TryHackMe Blue Room: Compromise Windows target utilizing EternalBlue exploit and dump hash dump",
    hands_on_url: "https://tryhackme.com/room/blue",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 24,
  },

  // Section 6: Advanced (Reverse Engineering, Binary Exploitation, Privilege Escalation)
  {
    id: "ct-25",
    section: "Advanced (Reverse Engineering, Binary Exploitation, Privilege Escalation)",
    title: "x86_64 Assembly, Registers & Calling Conventions",
    status: "not_started",
    goal: "Learn Intel assembly registers (RAX, RDI, RSI, RDX, RSP, RBP, RIP), stack push/pop operations, and System V AMD64 ABI.",
    learning_links: [
      { title: "Intel: Introduction to x64 Assembly", url: "https://www.intel.com/content/www/us/en/developer/articles/technical/introduction-to-x64-assembly.html" },
      { title: "Stanford CS107: Guide to x86-64", url: "https://web.stanford.edu/class/cs107/guide/x86-64.html" },
    ],
    hands_on_task: "picoCTF: Solve 'ARMssembly 0' or 'transformation' reverse engineering challenge",
    hands_on_url: "https://play.picoctf.org/practice",
    hands_on_platform: "picoCTF",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 25,
  },
  {
    id: "ct-26",
    section: "Advanced (Reverse Engineering, Binary Exploitation, Privilege Escalation)",
    title: "Stack Frames, Function Prologs & Buffer Overflows",
    status: "not_started",
    goal: "Understand caller/callee stack frames, saved frame pointer (EBP/RBP), return instruction pointer (RIP) overwrite, and shellcode execution.",
    learning_links: [
      { title: "LiveOverflow: Buffer Overflow Video Series", url: "https://www.youtube.com/playlist?list=PLhixgUqwRTjxglIswKp9mpkfPNxnHFEzy" },
      { title: "Smashing The Stack For Fun And Profit (Aleph One)", url: "http://phrack.org/issues/49/14.html" },
    ],
    hands_on_task: "picoCTF: Complete 'buffer overflow 0' challenge to overwrite return pointer and trigger win() function",
    hands_on_url: "https://play.picoctf.org/practice",
    hands_on_platform: "picoCTF",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 26,
  },
  {
    id: "ct-27",
    section: "Advanced (Reverse Engineering, Binary Exploitation, Privilege Escalation)",
    title: "Static & Dynamic Analysis with Ghidra and GDB-GEF",
    status: "not_started",
    goal: "Decompile stripped Linux binaries with Ghidra, locate the main function, set hardware breakpoints in GDB, and trace execution.",
    learning_links: [
      { title: "Ghidra SRE: Official Documentation (NSA)", url: "https://ghidra-sre.org/" },
      { title: "GEF: GDB Enhanced Features for Exploit Dev", url: "https://hugsy.github.io/gef/" },
    ],
    hands_on_task: "TryHackMe Intro to Ghidra: Load sample binary, analyze decompiled C output, and extract hardcoded password",
    hands_on_url: "https://tryhackme.com/room/ghidra",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 27,
  },
  {
    id: "ct-28",
    section: "Advanced (Reverse Engineering, Binary Exploitation, Privilege Escalation)",
    title: "Linux Privilege Escalation: SUID, Cron & Capabilities",
    status: "not_started",
    goal: "Enumerate Linux targets for misconfigured SUID binaries, writable root cron jobs, vulnerable sudoers rules, and Linux capabilities.",
    learning_links: [
      { title: "GTFOBins: Unix Binaries for Privilege Escalation", url: "https://gtfobins.github.io/" },
      { title: "PayloadsAllTheThings: Linux Privilege Escalation", url: "https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Linux%20-%20Privilege%20Escalation.md" },
    ],
    hands_on_task: "TryHackMe Linux PrivEsc: Exploit misconfigured SUID binary using GTFOBins payload to spawn root shell",
    hands_on_url: "https://tryhackme.com/room/linuxprivesc",
    hands_on_platform: "TryHackMe",
    hands_on_completed: false,
    time_spent_minutes: 0,
    order_index: 28,
  },
];

/**
 * Merges the updated structured syllabus with existing user progress.
 * Preserves user statuses ('learning', 'done'), custom notes, time spent,
 * takeaways, and any custom user-added topics.
 */
export function mergeCyberTopicsWithExisting(
  newSyllabus: CyberTopic[],
  existingTopics: CyberTopic[] = []
): CyberTopic[] {
  if (!existingTopics || existingTopics.length === 0) {
    return newSyllabus;
  }

  const existingMap = new Map<string, CyberTopic>();
  const existingByTitle = new Map<string, CyberTopic>();

  for (const item of existingTopics) {
    if (item.id) existingMap.set(item.id, item);
    if (item.title) existingByTitle.set(item.title.trim().toLowerCase(), item);
  }

  const merged = newSyllabus.map((baseTopic) => {
    // 1. Match by ID
    let matched = existingMap.get(baseTopic.id);
    // 2. Fallback to match by title
    if (!matched && baseTopic.title) {
      matched = existingByTitle.get(baseTopic.title.trim().toLowerCase());
    }
    // 3. Fallback to partial title match
    if (!matched) {
      const baseKey = baseTopic.title.toLowerCase();
      const entries = Array.from(existingByTitle.entries());
      for (const [key, val] of entries) {
        if (key.includes(baseKey) || baseKey.includes(key)) {
          matched = val;
          break;
        }
      }
    }

    if (matched) {
      return {
        ...baseTopic,
        user_id: matched.user_id,
        status: matched.status || baseTopic.status,
        notes: matched.notes || baseTopic.notes,
        time_spent_minutes: matched.time_spent_minutes ?? baseTopic.time_spent_minutes,
        takeaway: matched.takeaway ?? baseTopic.takeaway,
        hands_on_completed: matched.hands_on_completed ?? baseTopic.hands_on_completed,
        completed_at: matched.completed_at ?? baseTopic.completed_at,
        created_at: matched.created_at ?? baseTopic.created_at,
      };
    }
    return baseTopic;
  });

  // Preserve any purely custom topics the user may have created
  const syllabusIds = new Set(newSyllabus.map((t) => t.id));
  const customTopics = existingTopics.filter((t) => !syllabusIds.has(t.id));
  return [...merged, ...customTopics];
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  class_reminder: true,
  tuition_reminder: true,
  morning_digest: true,
  morning_digest_time: "08:00",
  streak_reminder: true,
  exam_reminder: true,
  quiet_hours_enabled: false,
  quiet_hours_start: "23:00",
  quiet_hours_end: "07:00",
};

/* =====================================================================
 * ======================= FRESH USER BASELINES ========================
 * New users / fresh installs start with 0 missions and 0 progress logs.
 * Real missions are subsequently dispatched or scheduled via generator.
 * ===================================================================== */

export const INITIAL_STARTER_MISSIONS: Mission[] = [];
export const DEFAULT_MISSIONS: Mission[] = [];
export const DEFAULT_LECTURE_LOGS: LectureLog[] = [];
export const DEFAULT_PAPERS: ResearchPaper[] = [];
export const DEFAULT_SIDE_PROJECTS: SideProject[] = [];
export const DEFAULT_CF_LOGS: CodeforcesLog[] = [];
export const DEFAULT_WEEKLY_REVIEWS: WeeklyReview[] = [];

/* =====================================================================
 * ======================= 2. DEMO / SAMPLE DATA =======================
 * Preserved for test harnesses, E2E specs, and offline demonstration.
 * Never seeded into fresh user accounts.
 * ===================================================================== */

export const DEMO_STARTER_MISSIONS: Mission[] = [
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
    deadline: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
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
    completed_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
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
    completed_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
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
    completed_at: new Date(Date.now() - (3 * 86400) * 1000).toISOString(),
    notes: "Deep dive into multi-head self-attention mechanisms and query-key-value vectors.",
    status: "completed",
    xp: 60,
    created_at: new Date(Date.now() - 6 * 86400 * 1000).toISOString(),
  },
];

export const DEMO_COURSES: Course[] = [
  {
    ...DEFAULT_COURSES[0],
    resources: [
      { id: "res-os-1", title: "xv6 RISC-V Operating System Book", url: "https://pdos.csail.mit.edu/6.828/2020/xv6/book-riscv-rev1.pdf", type: "book" },
      { id: "res-os-2", title: "Operating System Concepts (Silberschatz)", url: "https://os-book.com/", type: "book" },
      { id: "res-os-3", title: "Virtual Memory & Page Table Handouts", url: "https://drive.google.com/drive/folders/os-lecture-slides", type: "drive" },
    ],
  },
  {
    ...DEFAULT_COURSES[1],
    resources: [
      { id: "res-osl-1", title: "xv6-riscv GitHub Repository", url: "https://github.com/mit-pdos/xv6-riscv", type: "link" },
      { id: "res-osl-2", title: "GDB & QEMU Debugging Cheat Sheet", url: "https://pdos.csail.mit.edu/6.828/2020/labs/gdb.html", type: "notes" },
      { id: "res-osl-3", title: "Lab 01-04 Assignment Specifications", url: "https://drive.google.com/drive/folders/os-lab-specs", type: "drive" },
    ],
  },
  {
    ...DEFAULT_COURSES[2],
    resources: [
      { id: "res-eco-1", title: "Principles of Microeconomics (Mankiw)", url: "https://cengage.com/economics/mankiw", type: "book" },
      { id: "res-eco-2", title: "Demand, Elasticity & Market Structure Slides", url: "https://drive.google.com/drive/folders/economics-slides", type: "slides" },
      { id: "res-eco-3", title: "Midterm Formula Sheet & Practice Set", url: "https://drive.google.com/file/d/eco-formula-sheet", type: "notes" },
    ],
  },
  {
    ...DEFAULT_COURSES[3],
    resources: [
      { id: "res-dip-1", title: "Digital Image Processing 4th Ed. (Gonzalez & Woods)", url: "http://imageprocessingplace.com/", type: "book" },
      { id: "res-dip-2", title: "OpenCV Python Image Filtering Notebooks", url: "https://github.com/opencv/opencv-python", type: "link" },
      { id: "res-dip-3", title: "Spatial Filtering & Fourier Transform Slides", url: "https://drive.google.com/drive/folders/dip-slides", type: "slides" },
    ],
  },
  {
    ...DEFAULT_COURSES[4],
    resources: [
      { id: "res-stat-1", title: "Probability & Statistics for Engineers (Walpole)", url: "https://pearson.com/en-us/walpole", type: "book" },
      { id: "res-stat-2", title: "Z-Table, T-Table & Chi-Square Statistical Tables", url: "https://drive.google.com/file/d/statistical-tables", type: "notes" },
      { id: "res-stat-3", title: "Hypothesis Testing & Regression Lecture Slides", url: "https://drive.google.com/drive/folders/stat-slides", type: "slides" },
    ],
  },
  {
    ...DEFAULT_COURSES[5],
    resources: [
      { id: "res-fydp-1", title: "FYDP Proposal & Architectural Blueprint", url: "https://docs.google.com/document/d/fydp-architecture-doc", type: "syllabus" },
      { id: "res-fydp-2", title: "Weekly Progress Log & Milestone Timeline", url: "https://docs.google.com/spreadsheets/d/fydp-weekly-log", type: "link" },
      { id: "res-fydp-3", title: "Supervisor Meeting Minutes & Action Items", url: "https://drive.google.com/drive/folders/fydp-meeting-minutes", type: "notes" },
    ],
  },
];

export const DEMO_LECTURE_LOGS: LectureLog[] = [
  {
    id: "ll-1",
    course_name: "Operating Systems",
    course_id: "course-os",
    date: "2026-11-01",
    topic: "Virtual Memory & Paging Mechanisms",
    notes: "Analyzed TLB miss penalties, multi-level page tables, and page fault handling routines.",
    studied: true,
    lecture_number: 1,
  },
  {
    id: "ll-2",
    course_name: "Operating Systems",
    course_id: "course-os",
    date: "2026-11-04",
    topic: "Page Replacement Algorithms (LRU, Clock, FIFO)",
    notes: "Belady's anomaly proof and optimal MIN replacement benchmark.",
    studied: true,
    lecture_number: 2,
  },
  {
    id: "ll-3",
    course_name: "Economics",
    course_id: "course-econ",
    date: "2026-11-01",
    topic: "Market Equilibrium and Price Elasticity of Demand",
    notes: "Total revenue test, cross-price elasticity, and supply curve shifts.",
    studied: true,
    lecture_number: 1,
  },
  {
    id: "ll-4",
    course_name: "Digital Image Processing",
    course_id: "course-dip",
    date: "2026-10-31",
    topic: "Spatial Filtering & Convolution Kernels",
    notes: "Sobel gradient masks, Gaussian smoothing filter, and zero-padding border conditions.",
    studied: false,
    lecture_number: 1,
  },
  {
    id: "ll-5",
    course_name: "Probability & Statistics",
    course_id: "course-stat",
    date: "2026-11-04",
    topic: "Hypothesis Testing & Z-Score Significance",
    notes: "Type I vs Type II errors, p-value decision boundaries, and rejection regions.",
    studied: true,
    lecture_number: 1,
  },
  {
    id: "ll-6",
    course_name: "OS Lab",
    course_id: "course-os-lab",
    date: "2026-11-03",
    topic: "xv6 System Calls & Kernel Traps",
    notes: "Implemented custom trace and sys_waitpid system calls in RISC-V kernel.",
    studied: true,
    lecture_number: 1,
  },
];

export const DEMO_CYBER_TOPICS: CyberTopic[] = [
  { id: "ct-01", section: "Networking Basics", title: "OSI Model & TCP/IP Stack Encapsulation", status: "done", time_spent_minutes: 60, order_index: 1, notes: "Mastered L2 frames, L3 packets, L4 segments and headers." },
  { id: "ct-02", section: "Networking Basics", title: "TCP 3-Way Handshake & Flags (SYN, ACK, FIN, RST)", status: "done", time_spent_minutes: 45, order_index: 2, notes: "Wireshark packet capture analysis of connection teardown." },
  { id: "ct-03", section: "Networking Basics", title: "DNS Hierarchy, Records & DHCP Leases", status: "learning", time_spent_minutes: 30, order_index: 3, notes: "Inspecting A, AAAA, CNAME, MX records and zone transfers." },
  { id: "ct-04", section: "Networking Basics", title: "Subnetting (CIDR), Routing Tables & NAT", status: "not_started", time_spent_minutes: 0, order_index: 4 },
  { id: "ct-05", section: "Networking Basics", title: "Packet Analysis & Deep Inspection with Wireshark", status: "not_started", time_spent_minutes: 0, order_index: 5 },
  { id: "ct-06", section: "Linux Security", title: "File Permissions, Octals, and SUID/SGID Bits", status: "done", time_spent_minutes: 50, order_index: 6, notes: "Exploiting vulnerable SUID binaries for local privilege escalation." },
  { id: "ct-07", section: "Linux Security", title: "Process Isolation, cgroups, namespaces & systemd", status: "learning", time_spent_minutes: 40, order_index: 7 },
  { id: "ct-08", section: "Linux Security", title: "Bash Automation, Cron Jobs & PrivEsc Vectors", status: "not_started", time_spent_minutes: 0, order_index: 8 },
  { id: "ct-09", section: "Linux Security", title: "Linux Hardening, SSH Keys, UFW & AppArmor", status: "not_started", time_spent_minutes: 0, order_index: 9 },
  { id: "ct-10", section: "Web Security / OWASP", title: "SQL Injection: Union-based & Error-based Payloads", status: "done", time_spent_minutes: 90, order_index: 10, notes: "Bypassed authentication filters and extracted database schemas." },
  { id: "ct-11", section: "Web Security / OWASP", title: "Cross-Site Scripting (XSS): Reflected, Stored, DOM", status: "learning", time_spent_minutes: 60, order_index: 11 },
  { id: "ct-12", section: "Web Security / OWASP", title: "Cross-Site Request Forgery (CSRF) & SameSite Tokens", status: "not_started", time_spent_minutes: 0, order_index: 12 },
  { id: "ct-13", section: "Web Security / OWASP", title: "Server-Side Request Forgery (SSRF) to Cloud Metadata", status: "not_started", time_spent_minutes: 0, order_index: 13 },
  { id: "ct-14", section: "Web Security / OWASP", title: "Broken Authentication & JWT Token Tampering", status: "not_started", time_spent_minutes: 0, order_index: 14 },
  { id: "ct-15", section: "Cryptography", title: "Symmetric (AES, ChaCha20) vs Asymmetric (RSA, ECC)", status: "done", time_spent_minutes: 60, order_index: 15, notes: "Block cipher modes (CBC, GCM) and IV uniqueness." },
  { id: "ct-16", section: "Cryptography", title: "Cryptographic Hashing, Salts & Rainbow Tables", status: "done", time_spent_minutes: 45, order_index: 16 },
  { id: "ct-17", section: "Cryptography", title: "Diffie-Hellman Key Exchange & Discrete Logarithms", status: "not_started", time_spent_minutes: 0, order_index: 17 },
  { id: "ct-18", section: "Cryptography", title: "TLS 1.3 Handshake & Public Key Infrastructure (PKI)", status: "not_started", time_spent_minutes: 0, order_index: 18 },
  { id: "ct-19", section: "CTF Practice", title: "OverTheWire: Bandit Levels 0-15 (Linux Mastery)", status: "done", time_spent_minutes: 120, order_index: 19, notes: "Solved up to level 15 using openssl s_client and base64 rot13." },
  { id: "ct-20", section: "CTF Practice", title: "PicoCTF: Web Exploitation & Forensics Challenges", status: "learning", time_spent_minutes: 75, order_index: 20 },
  { id: "ct-21", section: "CTF Practice", title: "TryHackMe: Pre-Security & Complete Beginner Paths", status: "not_started", time_spent_minutes: 0, order_index: 21 },
  { id: "ct-22", section: "Tools & Recon", title: "Nmap: Stealth SYN Scan, Service Probing (-sV -sC)", status: "done", time_spent_minutes: 60, order_index: 22, notes: "NSE scripting engine for vulnerability detection." },
  { id: "ct-23", section: "Tools & Recon", title: "Burp Suite: Intercept, Repeater & Intruder Automation", status: "learning", time_spent_minutes: 50, order_index: 23 },
  { id: "ct-24", section: "Tools & Recon", title: "Content Discovery with Gobuster & ffuf", status: "not_started", time_spent_minutes: 0, order_index: 24 },
  { id: "ct-25", section: "Tools & Recon", title: "Ghidra: Decompiling Binaries & Static Analysis", status: "not_started", time_spent_minutes: 0, order_index: 25 },
  { id: "ct-26", section: "Reverse Engineering", title: "x86_64 Assembly: Registers, Instructions & Calling Conventions", status: "learning", time_spent_minutes: 45, order_index: 26 },
  { id: "ct-27", section: "Reverse Engineering", title: "Stack Frames, Function Prologs & Buffer Overflows", status: "not_started", time_spent_minutes: 0, order_index: 27 },
  { id: "ct-28", section: "Reverse Engineering", title: "GDB & PEDA/GEF Dynamic Debugging", status: "not_started", time_spent_minutes: 0, order_index: 28 },
];

export const DEMO_PAPERS: ResearchPaper[] = [
  {
    id: "paper-1",
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    venue: "NeurIPS 2017",
    status: "done",
    url: "https://arxiv.org/abs/1706.03762",
    tags: ["Transformers", "Attention", "Deep Learning"],
    summary: "Replaces recurrent and convolutional structures with multi-head self-attention mechanisms. Enables massive parallelization during training while retaining sequence-to-sequence expressiveness. Foundation architecture for all modern large language models.",
    takeaway: "Self-attention computes dynamic global weights between all token pairs in O(1) sequential operations.",
    date_read: "2026-11-01",
    notes: "Crucial understanding of Q, K, V dot-product projection matrices and sinusoidal positional encodings.",
  },
  {
    id: "paper-2",
    title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
    authors: "Dao et al.",
    venue: "NeurIPS 2022",
    status: "reading",
    url: "https://arxiv.org/abs/2205.14135",
    tags: ["GPU Optimization", "Attention", "SRAM"],
    summary: "Tiles attention computation across GPU SRAM blocks without materializing the quadratic N x N intermediate matrix into slow HBM memory.",
    takeaway: "Memory I/O bottlenecks dominate compute costs in modern GPU architectures.",
    date_read: null,
    notes: "Tiling algorithm with online softmax normalization.",
  },
  {
    id: "paper-3",
    title: "Deep Residual Learning for Image Recognition",
    authors: "He et al.",
    venue: "CVPR 2016",
    status: "to-read",
    url: "https://arxiv.org/abs/1512.03385",
    tags: ["Computer Vision", "Residuals", "CNN"],
    summary: "Solves vanishing gradient problem in very deep neural networks via skip connections.",
    takeaway: "Reformulating layers as learning residual functions F(x) = H(x) - x makes identity mapping trivial.",
    date_read: null,
  },
  {
    id: "paper-4",
    title: "A Fast and Scalable Key-Value Store for Flash Storage",
    authors: "Lim et al.",
    venue: "SOSP",
    status: "to-read",
    url: "https://www.usenix.org",
    tags: ["Storage Systems", "LSM-Tree", "Key-Value"],
    summary: "Optimizes log-structured merge trees for write amplification and SSD wear leveling.",
    takeaway: "Decoupling sorting keys from large values drastically reduces write amplification.",
    date_read: null,
  },
];

export const DEMO_SIDE_PROJECTS: SideProject[] = [
  {
    id: "proj-1",
    name: "OPERATION: ME (Mission Control)",
    description: "Spy-themed personal mission tracker, time-block planner, and academic intelligence command hub.",
    status: "active",
    next_step: "Implement Phase 2 recurring generator and Course HQ views",
    last_worked_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    repo_url: "https://github.com/akib-agency/operation-me",
    live_url: "http://localhost:3000",
  },
  {
    id: "proj-2",
    name: "RISC-V xv6 Kernel Extension",
    description: "Operating Systems kernel playground: virtual memory paging, lottery scheduler, and copy-on-write fork.",
    status: "active",
    next_step: "Write user-space benchmark verifying memory savings for COW fork",
    last_worked_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    repo_url: "https://github.com/akib-agency/xv6-riscv-enhanced",
  },
  {
    id: "proj-3",
    name: "Distributed Raft Consensus KV Store",
    description: "Go-based distributed key-value store implementing Raft leader election, log replication, and snapshotting.",
    status: "paused",
    next_step: "Fix partitioned network split-brain edge case in heartbeat test",
    last_worked_at: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
    repo_url: "https://github.com/akib-agency/raft-kv",
  },
];

export const DEMO_WEEKLY_REVIEWS: WeeklyReview[] = [
  {
    id: "wr-1",
    week_start_date: "2026-10-25",
    completed_count: 14,
    overdue_count: 1,
    time_spent_minutes: 840,
    cf_solved_count: 6,
    papers_read_count: 1,
    lectures_missed_count: 0,
    what_went_well: "Implemented xv6 user-space system calls and maintained daily Codeforces momentum.",
    what_to_fix: "Need to start FYDP literature survey earlier instead of postponing to the weekend.",
    next_week_focus: "Finish economics midterms notes and solve 5 dynamic programming problems.",
    created_at: "2026-10-31T15:00:00.000Z",
  },
];

export const DEMO_CF_LOGS: CodeforcesLog[] = [
  {
    id: "cf-1",
    handle: "akib_agent",
    problem_name: "Watermelon (4A)",
    problem_url: "https://codeforces.com/problemset/problem/4/A",
    rating: 800,
    tags: ["math", "brute force"],
    status: "solved",
    time_taken_minutes: 10,
    date: "2026-11-01",
    notes: "Trivial parity check; ensure w > 2.",
    verdict: "OK",
    xp: 25,
  },
  {
    id: "cf-2",
    handle: "akib_agent",
    problem_name: "Way Too Long Words (71A)",
    problem_url: "https://codeforces.com/problemset/problem/71/A",
    rating: 800,
    tags: ["strings"],
    status: "solved",
    time_taken_minutes: 12,
    date: "2026-11-02",
    notes: "Abbreviation if length > 10.",
    verdict: "OK",
    xp: 25,
  },
  {
    id: "cf-3",
    handle: "akib_agent",
    problem_name: "Team (231A)",
    problem_url: "https://codeforces.com/problemset/problem/231/A",
    rating: 800,
    tags: ["brute force", "greedy"],
    status: "solved",
    time_taken_minutes: 8,
    date: "2026-11-03",
    notes: "Count rows where sum >= 2.",
    verdict: "OK",
    xp: 25,
  },
  {
    id: "cf-4",
    handle: "akib_agent",
    problem_name: "Theatre Square (1A)",
    problem_url: "https://codeforces.com/problemset/problem/1/A",
    rating: 1000,
    tags: ["math"],
    status: "solved",
    time_taken_minutes: 20,
    date: "2026-11-04",
    notes: "Ceil division using integer arithmetic.",
    verdict: "OK",
    xp: 30,
  },
  {
    id: "cf-5",
    handle: "akib_agent",
    problem_name: "Registration System (4C)",
    problem_url: "https://codeforces.com/problemset/problem/4/C",
    rating: 1300,
    tags: ["data structures", "hashing"],
    status: "upsolve",
    time_taken_minutes: 40,
    date: "2026-11-05",
    notes: "Hash map with username frequency counter.",
    verdict: "OK",
    xp: 40,
  },
];
