export interface SupabaseConfigStatus {
  isConfigured: boolean;
  status: 'valid' | 'missing' | 'malformed_url' | 'secret_key_blocked' | 'invalid_key';
  message: string;
  url?: string;
}

export const validateSupabaseConfig = (): SupabaseConfigStatus => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (
    !url ||
    !key ||
    url === 'https://your-project.supabase.co' ||
    key === 'your-anon-key-here' ||
    url.includes('placeholder')
  ) {
    return {
      isConfigured: false,
      status: 'missing',
      message: 'Local mode: data stays on this device',
    };
  }

  // Security Guard: Block secret / service_role keys from ever executing in the browser client
  if (key.startsWith('sb_secret_') || key.toLowerCase().includes('service_role')) {
    return {
      isConfigured: false,
      status: 'secret_key_blocked',
      message: 'SECURITY ALERT: A secret / service_role key was provided in NEXT_PUBLIC_SUPABASE_ANON_KEY. Browser clients must only use the public anon key (starts with sb_publishable_ or eyJ...).',
    };
  }

  // Malformed URL checks
  if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
    return {
      isConfigured: false,
      status: 'malformed_url',
      message: 'Supabase URL is malformed: Must start with https:// (e.g. https://your-project-id.supabase.co)',
    };
  }

  if (url.includes('/rest/v1')) {
    return {
      isConfigured: false,
      status: 'malformed_url',
      message: 'Supabase URL contains /rest/v1. Please use the base project URL (e.g. https://your-project-id.supabase.co).',
    };
  }

  // Short/truncated key check
  if (key.length < 20) {
    return {
      isConfigured: false,
      status: 'invalid_key',
      message: 'Supabase API key is invalid or truncated.',
    };
  }

  return {
    isConfigured: true,
    status: 'valid',
    message: 'Supabase Cloud Connected (Email/Password Auth)',
    url,
  };
};

export const isSupabaseConfigured = (): boolean => {
  return validateSupabaseConfig().isConfigured;
};
