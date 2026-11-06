import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// SECURITY GUARD: Ensure automated tests NEVER connect to a live Supabase project
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (
  envUrl.includes('.supabase.co') &&
  !envUrl.includes('test-isolation') &&
  !envUrl.includes('placeholder')
) {
  throw new Error(
    `[CRITICAL TEST SECURITY GUARD]: Automated test suite detected live Supabase project URL (${envUrl}). Tests must strictly run in isolated test mode against mock/test endpoints.`
  );
}

// Force test-isolated credentials
process.env.NEXT_PUBLIC_TEST_MODE = 'true';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-isolation.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-isolated-12345';

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('dark') ? false : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock audio / soundFX
vi.mock('@/lib/sound', () => ({
  soundFX: {
    playBlip: vi.fn(),
    playMissionAccomplished: vi.fn(),
    playTargetAcquired: vi.fn(),
    playWarning: vi.fn(),
    toggleSound: vi.fn(() => true),
    isEnabled: vi.fn(() => false),
  },
}));

