# 🕵️‍♂️ OPERATION: ME // Tactical Mission Control

> **A mission-control command terminal, academic planner, competitive programming tracker, and career acceleration engine engineered with Next.js 14, Supabase RLS, and Playwright E2E automation.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Playwright](https://img.shields.io/badge/Tested_with-Playwright-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Unit_Tests-Vitest-FCC72B?style=for-the-badge&logo=vitest&logoColor=black)](https://vitest.dev/)

---

## 📌 Problem It Solves

Computer science students and software engineers manage intensely fragmented daily routines: university lecture timetables, assignment deadlines, competitive programming practice logs, cybersecurity learning roadmaps, and personal development goals are typically scattered across disparate calendars, spreadsheets, static note documents, and third-party profiles.

Standard commercial productivity tools introduce three recurring friction points:
1. **Lack of Developer Workflows:** No native tracking for competitive programming handles (e.g. Codeforces API synchronization) or cybersecurity exploitation lab checklists.
2. **Fragility & Cloud Dependency:** Most cloud services break when internet access is absent, while local note applications lack secure multi-device synchronization.
3. **Absence of Rigorous Testing:** Personal side projects frequently ship without regression test suites, causing state corruption during refactors.

**OPERATION: ME** solves this by providing a unified, gamified command terminal backed by a **dual architecture** (100% offline-first `localStorage` operation with JSON import/export, alongside encrypted cloud synchronization with Supabase PostgreSQL and Row Level Security), live Codeforces API integration, a 7-day academic time-blocking scheduler, and an enterprise testing pyramid powered by Vitest and Playwright.

---

## ✨ Features

- **Tactical Command Dashboard:** Real-time hero Active Mission card, live XP progression bar, operative rank system (Recruit to Commander-in-Chief), consecutive daily habit streaks, and synchronized "Today's Plan" daily timeline.
- **Weekly Academic Planner & Calendar:** 7-day interactive time grid (Saturday to Friday, 9:00 AM – 10:00 PM) with category-coded scheduling (University class, Tuition, Career project, Course study, CP, Break), real-time "NOW" marker, and exam date override badges.
- **Codeforces Tracker & Live Sync:** Direct synchronization with the Codeforces public API (`user.status`), extracting unique problem counts (deduplicated by `contestId + index`), rating distributions, top tag statistics, and weekly solve velocities.
- **Cybersecurity Operations Roadmap:** Structured cybersecurity learning progression (Foundations, Cryptography, OWASP Web Security, Tooling with Nmap/Burp/Metasploit, and CTF challenges on PortSwigger, TryHackMe, and OverTheWire) with mandatory lab takeaways.
- **Academic Course HQ & Lecture Dossier:** Semester course tracking with midterm/final exam countdowns, study hour logging, and direct links to university slide decks and materials.
- **Research Papers & Side Projects Radar:** Literature review tracker cataloging arXiv papers, reading states, and synthesis notes, paired with project milestone tracking.
- **Dual Architecture (Offline-First & Cloud Mode):**
  - **Local Mode (Default):** Operates 100% offline using browser storage with zero external cloud dependencies and full JSON data backup/import.
  - **Cloud Mode (Supabase):** Secure PostgreSQL synchronization across 16 relational database tables protected by strict Row Level Security (RLS) policies and Supabase GoTrue authentication.
- **Automated Testing Pyramid:** Thoroughly tested using Vitest for unit coverage, Axe Core for automated accessibility (a11y) audits, and Playwright for cross-browser end-to-end regression specifications.
- **Dual Tactical Theme Engine:** High-contrast OLED dark palette (*Tactical Stealth*, `#06080c` with `#00ff66` cyber green) and warm archival paper (*Declassified Dossier*, `#f4f1ea` with `#1f7a4d` forest green), fully compliant with WCAG AA standards.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14.2.35 (App Router, React 18)
- **Language:** TypeScript 5 (Strict Mode, 100% typed)
- **Styling:** Tailwind CSS 3 (tactical design token system)
- **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`, PostgreSQL with Row Level Security)
- **Local Persistence:** Browser `localStorage` with JSON export/import schema validation
- **Animations & Visuals:** Framer Motion 14, Canvas Confetti, Lucide React
- **Testing & Quality Assurance:**
  - Unit & Integration: Vitest, Testing Library (`@testing-library/react`)
  - End-to-End Browser Automation: Playwright (`@playwright/test`)
  - Accessibility Audits: Axe Core (`@axe-core/playwright`)

---

## 📸 Screenshots

> _Visual demonstration of the tactical command interface, weekly academic planner, and analytics telemetry._

| Tactical Command Dashboard (Stealth Theme) | Weekly Academic Timeblock Planner |
| :---: | :---: |
| ![Command Dashboard Placeholder](docs/screenshots/dashboard_placeholder.png)<br>_Placeholder: Hero mission card, operative rank progression, and daily plan_ | ![Weekly Planner Placeholder](docs/screenshots/planner_placeholder.png)<br>_Placeholder: 7-day academic course schedule with real-time NOW marker_ |

| Codeforces Analytics & Problem Telemetry | Cybersecurity Ops Roadmap & Research Dossier |
| :---: | :---: |
| ![Codeforces Telemetry Placeholder](docs/screenshots/codeforces_tracker_placeholder.png)<br>_Placeholder: Rating distribution and live Codeforces API solve stats_ | ![Roadmap Placeholder](docs/screenshots/roadmap_placeholder.png)<br>_Placeholder: Cyber learning progression and research paper tracker_ |

---

## 🚀 How to Run

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20.0.0 or higher recommended)
- npm, yarn, or pnpm

### 2. Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/akibmehedi666/OPERATION-ME.git
cd OPERATION-ME

# Install dependencies
npm install
```

### 3. Environment Configuration

Copy the template configuration file:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local

# Linux / macOS
cp .env.example .env.local
```

- **Local Mode (Offline):** Leave `.env.local` with default/empty placeholders. The application automatically boots into zero-network local offline mode.
- **Cloud Mode (Supabase):** If using cloud synchronization, configure your Supabase project credentials in `.env.local`:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
  ```

### 4. Start Development Server

```bash
npm run dev
```

Open your browser and navigate to: **`http://localhost:3000`**

### 5. Automated Testing Commands

```bash
# Run unit tests with Vitest and view coverage report
npm run test:unit

# Run full cross-browser end-to-end specifications with Playwright
npm run test:e2e

# Run all test suites in unified sequence
npm run test
```

---

## 📂 Project Structure

```
OPERATION-ME/
├── e2e/                           # Playwright end-to-end test suites
│   ├── auth-flow.spec.ts          # Authentication and login isolation tests
│   ├── dashboard-missions.spec.ts # Mission status and streak tests
│   ├── mission-deadline.spec.ts   # Deadline and scheduling specifications
│   ├── planner-view.spec.ts       # 7-day academic planner verification
│   └── theme-settings-truth.spec.ts # Theme toggle and persistence tests
├── public/                        # Icons, manifest, vector badges, and visual assets
├── scripts/                       # Build helper scripts and test orchestration
├── src/
│   ├── app/                       # Next.js 14 App Router pages, layouts, and API routes
│   ├── components/                # Tactical UI components, mission cards, and modals
│   ├── context/                   # React context providers (Auth, Missions, Theme)
│   ├── lib/                       # Codeforces sync client, Supabase client, and helpers
│   ├── test/                      # Vitest test setup and unit specifications
│   └── types/                     # TypeScript data contracts and schema definitions
├── supabase/
│   └── schema.sql                 # 16-table PostgreSQL schema with strict RLS policies
├── playwright.config.ts           # Playwright cross-browser configuration
├── vitest.config.ts               # Vitest test runner configuration
├── package.json                   # Dependencies and npm script definitions
└── README.md                      # Documentation
```
