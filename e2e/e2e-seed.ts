import { Page } from '@playwright/test';
import { DEFAULT_CATEGORIES, DEFAULT_SCHEDULE } from '../src/lib/seeds';
import { Mission } from '../src/types/database';

export const E2E_SEEDED_MISSIONS: Mission[] = [
  // 1. Hero Active Mission
  {
    id: 'e2e-hero-1',
    title: 'Implement Virtual Memory Paging',
    codename: 'OP-VM-PAGE',
    category_id: 'cat-1', // Operating Systems
    priority: 'urgent',
    status: 'active',
    deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    notes: 'Implement two-level page table algorithm and benchmark TLB hits',
    xp: 75,
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  // 2. Overdue mission
  {
    id: 'e2e-overdue-1',
    title: 'OS Lab Fork & Execve Debugging',
    codename: 'OP-FORK-DBG',
    category_id: 'cat-2', // OS Lab
    priority: 'urgent',
    status: 'active',
    deadline: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), // 6 hours overdue
    notes: 'Investigate orphan process cleanup',
    xp: 60,
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
  },
  // 3. Due Later Today
  {
    id: 'e2e-today-1',
    title: 'Economics Microeconomics Problem Set',
    codename: 'OP-ECON-PS',
    category_id: 'cat-3', // Economics
    priority: 'high',
    status: 'active',
    deadline: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    notes: 'Chapter 4 consumer surplus problems',
    xp: 50,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  // 4. Due Tomorrow
  {
    id: 'e2e-tomorrow-1',
    title: 'Digital Image Processing Edge Detection Filter',
    codename: 'OP-DIP-EDGE',
    category_id: 'cat-4', // DIP
    priority: 'medium',
    status: 'active',
    deadline: new Date(Date.now() + 28 * 3600 * 1000).toISOString(),
    notes: 'Compare Sobel vs Laplacian kernels',
    xp: 50,
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  // 5. Due This Week
  {
    id: 'e2e-week-1',
    title: 'Probability & Statistics Hypothesis Testing',
    codename: 'OP-STAT-HYP',
    category_id: 'cat-5', // Prob & Stats
    priority: 'medium',
    status: 'active',
    deadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    notes: 'p-value computations for two-tailed tests',
    xp: 45,
    created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
  },
  // 6. Due Later
  {
    id: 'e2e-later-1',
    title: 'FYDP Project Phase 1 Architecture Proposal',
    codename: 'OP-FYDP-P1',
    category_id: 'cat-6', // FYDP
    priority: 'urgent',
    status: 'active',
    deadline: new Date(Date.now() + 180 * 3600 * 1000).toISOString(),
    notes: 'Draft complete system architecture diagram',
    xp: 120,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  // 7. Completed mission with debrief note
  {
    id: 'e2e-comp-1',
    title: 'Codeforces Div 2 Contest Participation',
    codename: 'OP-CF-DIV2',
    category_id: 'cat-10', // Codeforces
    priority: 'high',
    status: 'completed',
    completed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    completion_note: 'Solved problem A and B in 35 minutes, rating +42',
    time_spent_minutes: 90,
    xp: 60,
    created_at: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
  },
  // 8. Completed yesterday
  {
    id: 'e2e-comp-2',
    title: 'Tuition Preparation for HSC Physics',
    codename: 'OP-TUIT-PREP',
    category_id: 'cat-11', // Tuition
    priority: 'medium',
    status: 'completed',
    completed_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    completion_note: 'Prepared thermodynamics problem sets for student',
    time_spent_minutes: 45,
    xp: 40,
    created_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
  },
];

export async function seedTestState(
  page: Page,
  options?: {
    isAuthenticated?: boolean;
    theme?: 'dark' | 'light' | 'system';
    animationsEnabled?: boolean;
    missions?: Mission[];
  }
) {
  const isAuth = options?.isAuthenticated ?? true;
  const theme = options?.theme ?? 'dark';
  const animations = options?.animationsEnabled ?? false; // keep false for instant E2E speed & stability
  const missions = options?.missions ?? E2E_SEEDED_MISSIONS;

  await page.addInitScript(
    ({ isAuth, theme, animations, missions, categories, schedule }) => {
      localStorage.clear();
      sessionStorage.clear();

      if (isAuth) {
        localStorage.setItem('operation_me_auth', 'true');
      }
      localStorage.setItem('op_me_theme_preference', theme);
      localStorage.setItem('op_me_animations_enabled', String(animations));
      localStorage.setItem('op_me_missions', JSON.stringify(missions));
      localStorage.setItem('op_me_categories', JSON.stringify(categories));
      localStorage.setItem('op_me_schedule', JSON.stringify(schedule));
      localStorage.setItem('op_me_xp', '450');
      localStorage.setItem('op_me_streak', '4');
    },
    {
      isAuth,
      theme,
      animations,
      missions,
      categories: DEFAULT_CATEGORIES,
      schedule: DEFAULT_SCHEDULE,
    }
  );
}

