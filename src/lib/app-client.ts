import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { brokeredPreviewStorage } from '@/integrations/supabase/previewAuthStorage';
import { createLoginStorage } from './auth-storage';

function makeClient() {
  const url = import.meta.env['VITE_SUPABASE_URL'];
  const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
  const durable = brokeredPreviewStorage();
  const storage = typeof window !== 'undefined' && durable
    ? createLoginStorage(durable, window.sessionStorage, window.localStorage)
    : undefined;
  return createClient<Database>(url, key, {
    auth: { storage, persistSession: typeof window !== 'undefined', autoRefreshToken: typeof window !== 'undefined' },
    global: { fetch: (input, init) => {
      const headers = new Headers(input instanceof Request ? input.headers : undefined);
      new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
      if (headers.get('Authorization') === `Bearer ${key}` && key.startsWith('sb_')) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
}

let client: ReturnType<typeof makeClient> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof makeClient>, {
  get(_, property) {
    client ??= makeClient();
    return Reflect.get(client, property, client);
  },
});