import type { PreviewAuthStorage } from '@/integrations/supabase/previewAuthStorage';

export const REMEMBER_KEY = 'garotinho-remember-login';
export const EMAIL_KEY = 'garotinho-login-email';

// No preference preserves existing logins; an explicit choice applies to future logins.
export function createLoginStorage(durable: PreviewAuthStorage, temporary: Storage, preferences: Storage): PreviewAuthStorage {
  const remembered = () => preferences.getItem(REMEMBER_KEY) !== 'false';
  return {
    getItem: (key) => remembered() ? durable.getItem(key) : temporary.getItem(key),
    setItem: async (key, value) => {
      if (remembered()) {
        temporary.removeItem(key);
        await durable.setItem(key, value);
      } else {
        await durable.removeItem(key);
        temporary.setItem(key, value);
      }
    },
    removeItem: async (key) => {
      temporary.removeItem(key);
      await durable.removeItem(key);
    },
  };
}

export function saveLoginPreference(remember: boolean, email: string, storage: Storage) {
  storage.setItem(REMEMBER_KEY, String(remember));
  if (remember) storage.setItem(EMAIL_KEY, email.trim());
  else storage.removeItem(EMAIL_KEY);
}