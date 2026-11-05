import { Category, ClassScheduleItem, Mission } from "@/types/database";

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

