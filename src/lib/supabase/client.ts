import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured } from './config';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const list: { name: string; value: string }[] = [];
            const seen = new Set<string>();

            // 1. Read document.cookie
            if (typeof document !== 'undefined' && document.cookie) {
              const parts = document.cookie.split(';');
              for (const part of parts) {
                const trimmed = part.trim();
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx > 0) {
                  const name = trimmed.slice(0, eqIdx);
                  const value = decodeURIComponent(trimmed.slice(eqIdx + 1));
                  list.push({ name, value });
                  seen.add(name);
                }
              }
            }

            // 2. Dual fallback: read localStorage (for iframes, Simple Browser, Electron webviews)
            if (typeof localStorage !== 'undefined') {
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('sb_')) {
                  const name = k.slice(3);
                  if (!seen.has(name)) {
                    const value = localStorage.getItem(k) || '';
                    list.push({ name, value });
                    seen.add(name);
                  }
                }
              }
            }

            return list;
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              // 1. Write to document.cookie
              if (typeof document !== 'undefined') {
                const maxAge = options?.maxAge !== undefined ? `; max-age=${options.maxAge}` : '; max-age=31536000';
                document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax${maxAge}`;
              }
              // 2. Dual fallback: write to localStorage
              if (typeof localStorage !== 'undefined') {
                if (value && options?.maxAge !== 0) {
                  localStorage.setItem(`sb_${name}`, value);
                } else {
                  localStorage.removeItem(`sb_${name}`);
                }
              }
            }
          },
        },
      }
    );
  }

  return browserClient;
}
