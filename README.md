# 🕵️‍♂️ OPERATION: ME // TACTICAL MISSION CONTROL

> **CLASSIFIED // LEVEL 5 CLEARANCE REQUIRED**  
> Personal tactical mission control, academic planner, competitive programming tracker, and career acceleration engine built exclusively for **Agent Akib**.

---

## ⚡ TECH STACK

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (strict mode, 100% typed)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) with tactical theme tokens
- **Animations**: [Framer Motion 14](https://www.framer.com/motion/) + [Canvas Confetti](https://github.com/catdad/canvas-confetti)
- **Icons**: [Lucide React](https://lucide.dev/) + custom vector SVG badges & icons
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with strict Row Level Security & Supabase Auth)
- **Offline / Local Engine**: Browser `localStorage` with JSON export/import and zero network dependency
- **Testing**: [Vitest](https://vitest.dev/) (unit & coverage) + [Playwright](https://playwright.dev/) (cross-browser desktop/mobile E2E) + [Axe Core](https://www.deque.com/axe/) (a11y)

---

## 🎯 CORE CAPABILITIES & FEATURES

1. **Tactical Command Dashboard**:
   - Hero Active Mission card with immediate status, codename, and priority stamp.
   - Live XP progression bar, operative rank system (Recruit to Commander-in-Chief), and consecutive CP streak counter.
   - Synchronized **Today's Plan** timeline merging scheduled university classes, recurring tasks, and mission deadlines.
   - Tactical debrief modal with completion notes, time spent tracking, and promotion overlays.

2. **Weekly Planner & Academic Calendar**:
   - Interactive 7-day grid (Saturday to Friday) with time block visualization (9:00 AM – 10:00 PM).
   - Category-coded blocks (University class, Tuition, Project/career, Course study, CP, Break).
   - Conflict-free auto-scheduler with academic date override badges (e.g., "Online Sat", "Last Day Drop").
   - Real-time "NOW" marker indicator and month inspection dossier.

3. **Codeforces Tracker & Automatic Sync**:
   - Live synchronization with Codeforces public API (`user.status` for operative handle).
   - Solved problem counting (deduplicated by `contestId + index`), rating distribution breakdown, top problem tags, and weekly/monthly velocity.
   - 1-click manual solve logger and daily CP mission integration.

4. **Cybersecurity Operations Roadmap**:
   - Structured learning pathway: Foundations, Cryptography Basics, Web Security & OWASP Top 10, Security Tools (Nmap, Burp, Wireshark, Metasploit), CTF Practice, and Advanced Exploitation.
   - Hands-on lab requirements (PortSwigger, TryHackMe, OverTheWire Bandit, picoCTF) with mandatory takeaways before completion.
   - Integrated "Legal Practice Only" operative reminder banner.

5. **Course HQ & Academic Dossier**:
   - Course manager with syllabus tracking, countdowns to exams/midterms, and study hours logging.
   - Lecture study logger with studied toggle and direct links to slide decks/resources.

6. **Research Papers & Side Projects**:
   - Research paper dossier with arXiv links, reading statuses, and core takeaway notes.
   - Side projects radar with tech stack badges, repository links, milestones, and active status indicators.

7. **Recurring Missions Engine & Notification System**:
   - Daily and weekly recurring mission rules with automatic morning schedule generation.
   - Time-sensitive audio and visual alerts with quiet hours enforcement and deadline warnings.

8. **Dual Theme Engine & Accessibility**:
   - **Tactical Stealth (Dark)**: High-contrast OLED dark palette (`#06080c`) with cyber green (`#00ff66`) accents.
   - **Declassified Dossier (Light)**: Warm archival paper (`#f4f1ea`) with case-file surfaces and deep forest green (`#1f7a4d`).
   - Strict 12-hour time format (`h:mm A`) across all interfaces.
   - Full WCAG AA contrast compliance and OS `prefers-reduced-motion` animation toggle.

9. **Dual Architecture Modes**:
   - **Local Mode (Default / Offline)**: Operates 100% offline in browser storage when Supabase is not configured.
   - **Cloud Mode (Supabase PostgreSQL)**: Authenticated, encrypted cloud synchronization across all 16 relational database tables.

---

## 🚀 LOCAL SETUP GUIDE

### Prerequisites
- [Node.js 18+](https://nodejs.org/) installed
- npm or yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/akibmehedi666/OPERATION-ME.git
cd OPERATION-ME
npm install
```

### 2. Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env.local
```

For **Local Mode (Offline)**:
Leave `.env.local` empty or keep placeholder values. The application will automatically boot in local offline mode.

For **Cloud Mode (Supabase)**:
Provide your Supabase project URL and public anon key in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ SUPABASE CLOUD DATABASE SETUP

Follow these steps to connect your cloud PostgreSQL database:

### Step 1: Create a Free Supabase Project
1. Log in to [supabase.com](https://supabase.com) and click **New Project**.
2. Name your project (e.g. `operation-me`), select your region, and set a strong database password.

### Step 2: Run the Database Schema
1. Open the Supabase dashboard and navigate to the **SQL Editor** tab (`>_`).
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this repository.
3. Paste the entire SQL schema into the editor and click **Run**.
4. All 16 tables will be initialized with strict Row Level Security (RLS) policies:
   - `categories`, `recurring_rules`, `missions`, `class_schedule`, `time_blocks`, `academic_events`, `courses`, `lecture_logs`, `cf_log`, `papers`, `side_projects`, `cyber_topics`, `weekly_reviews`, `xp_events`, `streaks`, `user_settings`.

### Step 3: Create Your User Account
1. In the Supabase dashboard, go to **Authentication** > **Users**.
2. Click **Add user** > **Create user**.
3. Enter your email and a secure password.
4. Keep **Auto Confirm User?** enabled and click **Create user**.

### Step 4: Lock Down Public Registrations
Since Operation ME is a single-operative mission tracker:
1. In the Supabase dashboard, navigate to **Authentication** > **Providers**.
2. Click **Email**.
3. Toggle **Enable Signup** to **OFF** (keep **Enable Email provider** ON).
4. Click **Save**. Only your provisioned account can access the terminal.

### Step 5: Migrate Existing Local Data (Optional)
When you log in for the first time in Cloud Mode, Operation ME will automatically detect any existing local device data and display an **"Import local data to cloud"** banner. Click it to seamlessly transfer your missions, courses, and logs to PostgreSQL without duplicates.

---

## 🌐 VERCEL PRODUCTION DEPLOYMENT

Deploy Operation ME to [Vercel](https://vercel.com) in 3 minutes:

1. **Push your code to GitHub**:
   Ensure your code is pushed to your GitHub repository:
   ```bash
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to your Vercel Dashboard and click **Add New...** > **Project**.
   - Select your `OPERATION-ME` repository.
   - Set the Project Name to `opme` (or `operation-me` if taken).
   - Framework preset: `Next.js`.

3. **Configure Environment Variables**:
   In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-supabase-anon-key`
   *(Ensure these are checked for Production, Preview, and Development)*.

4. **Click Deploy**:
   Vercel will compile the Next.js production build.

5. **Configure Supabase Auth Redirects**:
   - In your Supabase Dashboard, navigate to **Authentication** > **URL Configuration**.
   - Set **Site URL** to your Vercel URL (e.g. `https://opme.vercel.app`).
   - In **Redirect URLs**, add: `https://opme.vercel.app/**`.
   - Click **Save**.

---

## 🧪 TESTING & VERIFICATION

```bash
# Type check TypeScript without emitting files
npx tsc --noEmit

# Run Next.js production build
npm run build

# Run unit tests with Vitest and coverage
npm run test:unit

# Run full end-to-end verification with Playwright
npm run test:e2e

# Run all test suites through the unified runner
npm test
```

---

## 📄 LICENSE

Classified // Proprietary to Agent Akib. All rights reserved.
