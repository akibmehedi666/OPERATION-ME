import { Page } from '@playwright/test';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SCHEDULE,
  DEFAULT_COURSES,
  DEFAULT_LECTURE_LOGS,
  DEFAULT_CYBER_TOPICS,
  DEFAULT_PAPERS,
  DEFAULT_SIDE_PROJECTS,
  DEFAULT_CF_LOGS,
  DEFAULT_TIME_BLOCKS,
  DEFAULT_ACADEMIC_EVENTS,
  DEFAULT_RECURRING_RULES,
} from '../src/lib/seeds';
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

  const mockSessionObj = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: 'e2e-test-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'agent.akib@agency.internal',
      app_metadata: { provider: 'email' },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
  const encodedCookie = 'base64-' + Buffer.from(JSON.stringify(mockSessionObj)).toString('base64url');

  if (isAuth) {
    await page.context().addCookies([
      {
        name: 'sb-kskcqopajrqebhcuepgo-auth-token',
        value: encodedCookie,
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'sb-test-isolation-auth-token',
        value: encodedCookie,
        domain: 'localhost',
        path: '/',
      },
    ]);
  } else {
    await page.context().clearCookies();
  }

  // Intercept outgoing Supabase requests so E2E test runs have zero network latency or external dependencies
  await page.route('**/*.supabase.co/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/auth/v1/')) {
      if (url.includes('/token')) {
        let postData: Record<string, string> = {};
        try {
          postData = route.request().postDataJSON() || {};
        } catch {
          // ignore
        }

        if (postData.password === 'wrong-password-999') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: 'e2e-test-user-id',
              aud: 'authenticated',
              role: 'authenticated',
              email: postData.email || 'agent.akib@agency.internal',
            },
          }),
        });
        return;
      }

      if (url.includes('/recover')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Password recovery email dispatched.' }),
        });
        return;
      }

      if (url.includes('/user') || url.includes('/session')) {
        if (isAuth) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 'e2e-test-user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'agent.akib@agency.internal',
              },
              session: {
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
                expires_in: 3600,
                token_type: 'bearer',
                user: {
                  id: 'e2e-test-user-id',
                  aud: 'authenticated',
                  role: 'authenticated',
                  email: 'agent.akib@agency.internal',
                },
              },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ session: null, user: null }),
          });
        }
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session: null, user: null }),
      });
      return;
    }

    // Supabase REST endpoints
    if (url.includes('/rest/v1/')) {
      if (method === 'POST') {
        try {
          const postData = route.request().postDataJSON();
          const returnItem = Array.isArray(postData) ? postData[0] : postData || {};
          const record = { id: 'm-' + Date.now(), ...returnItem };
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(record),
          });
          return;
        } catch {
          await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({}) });
          return;
        }
      }

      if (method === 'PATCH' || method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
        return;
      }

      if (method === 'GET') {
        if (url.includes('/missions')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(missions),
          });
          return;
        }
        if (url.includes('/categories')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_CATEGORIES),
          });
          return;
        }
        if (url.includes('/class_schedule')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_SCHEDULE),
          });
          return;
        }
        if (url.includes('/courses')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_COURSES),
          });
          return;
        }
        if (url.includes('/time_blocks')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_TIME_BLOCKS),
          });
          return;
        }
        if (url.includes('/academic_events')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_ACADEMIC_EVENTS),
          });
          return;
        }
        if (url.includes('/recurring_rules')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_RECURRING_RULES),
          });
          return;
        }
        if (url.includes('/lecture_logs')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_LECTURE_LOGS),
          });
          return;
        }
        if (url.includes('/cyber_topics')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_CYBER_TOPICS),
          });
          return;
        }
        if (url.includes('/research_papers')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_PAPERS),
          });
          return;
        }
        if (url.includes('/side_projects')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_SIDE_PROJECTS),
          });
          return;
        }
        if (url.includes('/cf_log')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(DEFAULT_CF_LOGS),
          });
          return;
        }
        if (url.includes('/xp_events')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ amount: 450 }]),
          });
          return;
        }
        if (url.includes('/streaks')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ current_streak: 4 }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.addInitScript(
    ({
      isAuth,
      encodedCookie,
      mockSessionObj,
      theme,
      animations,
      missions,
      categories,
      schedule,
      courses,
      lectureLogs,
      cyberTopics,
      papers,
      sideProjects,
      cfLogs,
    }) => {
      localStorage.clear();
      sessionStorage.clear();

      if (isAuth) {
        document.cookie = `sb-kskcqopajrqebhcuepgo-auth-token=${encodedCookie}; path=/;`;
        document.cookie = `sb-test-isolation-auth-token=${encodedCookie}; path=/;`;
        const mockSession = JSON.stringify(mockSessionObj);
        localStorage.setItem('sb-kskcqopajrqebhcuepgo-auth-token', mockSession);
        localStorage.setItem('sb-test-isolation-auth-token', mockSession);
      } else {
        document.cookie = 'sb-kskcqopajrqebhcuepgo-auth-token=; path=/; max-age=0;';
        document.cookie = 'sb-test-isolation-auth-token=; path=/; max-age=0;';
        localStorage.removeItem('sb-kskcqopajrqebhcuepgo-auth-token');
        localStorage.removeItem('sb-test-isolation-auth-token');
        localStorage.removeItem('operation_me_auth');
      }

      localStorage.setItem('op_me_theme_preference', theme);
      localStorage.setItem('op_me_animations_enabled', String(animations));
      localStorage.setItem('op_me_missions', JSON.stringify(missions));
      localStorage.setItem('op_me_categories', JSON.stringify(categories));
      localStorage.setItem('op_me_schedule', JSON.stringify(schedule));
      localStorage.setItem('op_me_courses', JSON.stringify(courses));
      localStorage.setItem('op_me_lecture_logs', JSON.stringify(lectureLogs));
      localStorage.setItem('op_me_cyber_topics', JSON.stringify(cyberTopics));
      localStorage.setItem('op_me_papers', JSON.stringify(papers));
      localStorage.setItem('op_me_side_projects', JSON.stringify(sideProjects));
      localStorage.setItem('op_me_cf_logs', JSON.stringify(cfLogs));
      localStorage.setItem('op_me_xp', '450');
      localStorage.setItem('op_me_streak', '4');
    },
    {
      isAuth,
      encodedCookie,
      mockSessionObj,
      theme,
      animations,
      missions,
      categories: DEFAULT_CATEGORIES,
      schedule: DEFAULT_SCHEDULE,
      courses: DEFAULT_COURSES,
      lectureLogs: DEFAULT_LECTURE_LOGS,
      cyberTopics: DEFAULT_CYBER_TOPICS,
      papers: DEFAULT_PAPERS,
      sideProjects: DEFAULT_SIDE_PROJECTS,
      cfLogs: DEFAULT_CF_LOGS,
    }
  );
}
