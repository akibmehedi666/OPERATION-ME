# 🕵️‍♂️ OPERATION: ME // MISSION CONTROL (PHASE 1)

> **CLASSIFIED // LEVEL 5 CLEARANCE REQUIRED**  
> Personal tactical task & objective tracker built exclusively for **Agent Akib**.

---

## ⚡ TECH STACK & DESIGN SYSTEM
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Custom Spy Design System
- **Aesthetic**:
  - Near-black espionage backdrop (`#06080c`)
  - Neon radar green (`#00ff66`), tactical amber (`#ffb700`), threat red (`#ff2a44`)
  - Monospace typography (`JetBrains Mono` / `Share Tech Mono`)
  - CRT scanlines overlay, tactical HUD corner brackets, and distressed "TOP SECRET / CLASSIFIED" stamps
- **Audio FX**: Procedural Web Audio API tactical sound synthesis (target acquire, mission accomplished chime, radar warnings)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Email Auth)
- **Animations**: Framer Motion + Canvas Confetti

---

## 🏛️ DATABASE ARCHITECTURE (ALL 9 TABLES INCLUDED)

All 9 tables required for Phase 1 and future phases are defined with strict Postgres schemas and Row Level Security (RLS) enabled:

1. **`missions`**: Directives tracking with codenames, category links, priorities (`urgent` OMEGA, `high`, `medium`, `low`), deadlines, notes, status (`locked`, `active`, `completed`, `failed`), and XP rewards.
2. **`categories`**: System & user mission departments (`Operating Systems`, `OS Lab`, `Economics`, `Digital Image Processing`, `Probability & Statistics`, `FYDP`, `Cybersecurity`, `Side Projects`, `Research Papers`, `Codeforces`, `Tuition`).
3. **`recurring_rules`**: Future-proofed rule engine schema (frequency, interval, days of week).
4. **`class_schedule`**: Agent Akib's academic timetable and tuition commitments with day-of-week indexes and room designations.
5. **`lecture_logs`**: Lecture notes, dates, and course syllabi records.
6. **`cf_log`**: Codeforces competitive programming telemetry (problem links, rating, verdict, XP).
7. **`papers`**: Academic research paper repository and reading pipeline.
8. **`xp_events`**: Immutable audit log of all XP awards and operational achievements.
9. **`streaks`**: Operational activity streak tracker and milestone history.

---

## 🗄️ SUPABASE SETUP INSTRUCTIONS

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **New Project**, choose a region closest to you, and set a database password.

### Step 2: Run the SQL Schema & Seed
1. In your Supabase Dashboard, go to the **SQL Editor** tab (left sidebar).
2. Open the file [`supabase/full_setup.sql`](file:///c:/Users/USER/Desktop/Personal%20Tracker/supabase/full_setup.sql) from this project.
3. Paste the entire content into the SQL Editor and click **Run**.
4. This will:
   - Enable `uuid-ossp` extension
   - Create all 9 tables with proper primary keys and foreign keys
   - Enable **Row Level Security (RLS)** on all tables
   - Create RLS security policies allowing authenticated operatives full access to their data
   - Seed all 11 official categories with custom colors and codenames
   - Seed Agent Akib's official class timetable & tuition schedule:
     - **SAT**: `09:50-11:10 DIP (Room 425)` | `11:10-13:50 FYDP-I (Room 626)`
     - **SUN & WED**: `09:50-11:10 Economics (Room 406)` | `11:10-12:30 OS (Room 406)` | `12:30-13:50 Prob & Stats (Room 630)`
     - **TUE**: `09:50-11:10 DIP (Room 425)` | `11:10-13:50 OS Lab (Room 827)`
     - **MON, THU, FRI**: `18:00-19:30 Tuition (I teach)`

### Step 3: Configure Environment Variables
1. In your Supabase Project Settings, go to **API**.
2. Copy your **Project URL** and **anon / public key**.
3. Create a `.env.local` file in your project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

*(Note: The app also features an automatic resilient offline cache fallback, so you can test all features and workflows immediately even before supplying Supabase keys).*

---

## 🚀 VERCEL DEPLOYMENT STEPS

### 1. Initialize Git & Push to GitHub
```bash
git add .
git commit -m "feat: Operation Me Phase 1 complete tactical implementation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/operation-me.git
git push -u origin main
```

### 2. Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your `operation-me` repository.
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
5. Framework preset: **Next.js** (detected automatically).
6. Click **Deploy**.

---

## 🎯 PHASE 1 FEATURES INCLUDED

### 1. Themed Spy Agency Login Portal
- Holographic scanlines, terminal diagnostics status, and "TOP SECRET // LEVEL 5" stamp.
- Secure email & passcode authentication via Supabase Auth.
- Fast Recon Bypass option for direct local session inspection.

### 2. Headquarters Dashboard
- **Daily Briefing**:
  - Live schedule parsing for the current day.
  - Interactive day selector (`SAT`, `SUN`, `MON`, `TUE`, `WED`, `THU`, `FRI`).
  - **Live Countdown Timer** to the next class or tuition session (`T-MINUS 01:24:15`).
  - Real-time status indicators (`UPCOMING`, `IN PROGRESS`, `CONCLUDED`).
- **Hero Active Mission**:
  - Large glowing tactical card with radiant green border and corner accents.
  - Objective codename (`OP-PAGEFAULT-01`), department tag, priority badge (`OMEGA / URGENT`), cutoff deadline, and notes.
- **Today's Mission Checklist**:
  - Instant checkbox access to today's pending directives.

### 3. Mission Flow Engine
- **Add Mission**: Authorize new directives with randomized tactical codename generator (`OP-NIGHTFALL-42`), category selector, priority, deadline date/time, and XP bounty.
- **Edit / Abort**: Modify instructions or expunge missions with safety confirmations.
- **Quick-Add Floating Button**: Tactical green FAB button permanently fixed for rapid deployment on both mobile and desktop.
- **Complete Mission Trigger**:
  - Triggers the **"MISSION ACCOMPLISHED"** slam animation with green/gold celebratory confetti and retro audio fanfare.
  - Awards XP and logs the event to `xp_events`.
  - Increments operational daily streak.
  - **Auto-assigns the next mission**: Evaluates all queued directives, sorts by highest priority (`Urgent > High > Medium > Low`), breaks ties with earliest deadline, and triggers a radar-locked **"NEXT TARGET ACQUIRED"** audio-visual notification!

### 4. Tactical Mission Queue
- Full directory of all missions.
- Overdue missions detected automatically and branded with glowing red **`FAILING`** / **`COMPROMISED`** stamps.
- Filter by status (`All`, `Active`, `Queued`, `Failing`, `Completed`) and department.
- Real-time text search across titles, codenames, and briefing notes.

### 5. XP, Rank Progression & Daily Streak
- Rank hierarchy:
  - 🔰 **Recruit**: 0 – 249 XP
  - 🟢 **Field Agent**: 250 – 999 XP
  - 🟡 **Elite**: 1000 – 2499 XP
  - 🔴 **Director**: 2500+ XP
- Tactical segmented progress bar displaying clearance progress and XP to next tier.
- Flame-powered daily streak tracker (`X DAYS ACTIVE`).
- Toggleable retro sci-fi sound effects module.

---

## 🛠️ LOCAL DEVELOPMENT

```bash
# Run local development server
npm run dev
```

Navigate to `http://localhost:3000` in your browser.
Operate with clearance, **Agent Akib**.
