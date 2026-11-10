import { beforeEach, describe, expect, it } from 'vitest';
import { createLoginStorage, EMAIL_KEY, REMEMBER_KEY, saveLoginPreference } from '@/lib/auth-storage';
import { isRecoveryLink, validateNewPassword } from '@/lib/password-recovery';

describe('Owner login persistence', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('keeps an unchecked login only for the browser session, including refreshes', async () => {
    saveLoginPreference(false, 'owner@example.com', localStorage);
    const storage = createLoginStorage(localStorage, sessionStorage, localStorage);
    await storage.setItem('auth-session', 'test-session');
    expect(localStorage.getItem('auth-session')).toBeNull();
    expect(localStorage.getItem(EMAIL_KEY)).toBeNull();
    expect(await createLoginStorage(localStorage, sessionStorage, localStorage).getItem('auth-session')).toBe('test-session');
    sessionStorage.clear();
    expect(await storage.getItem('auth-session')).toBeNull();
  });

  it('remembers an opted-in login and email across browser sessions', async () => {
    saveLoginPreference(true, 'owner@example.com', localStorage);
    const storage = createLoginStorage(localStorage, sessionStorage, localStorage);
    await storage.setItem('auth-session', 'test-session');
    sessionStorage.clear();
    expect(await storage.getItem('auth-session')).toBe('test-session');
    expect(localStorage.getItem(EMAIL_KEY)).toBe('owner@example.com');
    expect(localStorage.getItem(REMEMBER_KEY)).toBe('true');
  });

  it('clears both storage locations on logout', async () => {
    localStorage.setItem('auth-session', 'old');
    sessionStorage.setItem('auth-session', 'old');
    await createLoginStorage(localStorage, sessionStorage, localStorage).removeItem('auth-session');
    expect(localStorage.getItem('auth-session')).toBeNull();
    expect(sessionStorage.getItem('auth-session')).toBeNull();
  });

  it('preserves pre-existing remembered logins and delegates broker storage', async () => {
    const calls: string[] = [];
    const broker = { getItem: async () => 'broker-session', setItem: async () => { calls.push('set'); }, removeItem: async () => { calls.push('remove'); } };
    const storage = createLoginStorage(broker, sessionStorage, localStorage);
    expect(await storage.getItem('auth-session')).toBe('broker-session');
    await storage.setItem('auth-session', 'new');
    expect(calls).toEqual(['set']);
  });
});

describe('Password recovery', () => {
  it('distinguishes recovery links from ordinary signed-in sessions', () => {
    expect(isRecoveryLink('#access_token=test&type=recovery')).toBe(true);
    expect(isRecoveryLink('#type=signup')).toBe(false);
    expect(isRecoveryLink('')).toBe(false);
  });
  it('rejects passwords shorter than six characters', () => {
    expect(validateNewPassword('12345', '12345')).not.toBe('');
    expect(validateNewPassword('123456', '123456')).toBe('');
  });
  it('rejects confirmation that differs from the password', () => {
    expect(validateNewPassword('123456', '654321')).not.toBe('');
  });
});