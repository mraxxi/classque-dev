import { describe, it, expect, vi } from 'vitest';
import { useSettings } from './useSettings';
import * as useIdentityModule from './useIdentity';

describe('useSettings & module toggles (SET-005)', () => {
  it('returns always-on modules as enabled regardless of identity.enabledModules', () => {
    vi.spyOn(useIdentityModule, 'useIdentity').mockReturnValue({
      data: { enabledModules: [] }
    } as any);

    const { isModuleEnabled } = useSettings();
    expect(isModuleEnabled('groups')).toBe(true);
    expect(isModuleEnabled('learners')).toBe(true);
    expect(isModuleEnabled('sessions')).toBe(true);
    expect(isModuleEnabled('attendance')).toBe(true);
    expect(isModuleEnabled('schedule')).toBe(true);
  });

  it('correctly reports plans and notes as enabled when present in enabledModules', () => {
    vi.spyOn(useIdentityModule, 'useIdentity').mockReturnValue({
      data: { enabledModules: ['plans', 'notes'] }
    } as any);

    const { isModuleEnabled } = useSettings();
    expect(isModuleEnabled('plans')).toBe(true);
    expect(isModuleEnabled('notes')).toBe(true);
  });

  it('correctly reports plans and notes as disabled when absent from enabledModules', () => {
    vi.spyOn(useIdentityModule, 'useIdentity').mockReturnValue({
      data: { enabledModules: [] }
    } as any);

    const { isModuleEnabled } = useSettings();
    expect(isModuleEnabled('plans')).toBe(false);
    expect(isModuleEnabled('notes')).toBe(false);
  });

  it('returns false for optional modules when identity is not loaded', () => {
    vi.spyOn(useIdentityModule, 'useIdentity').mockReturnValue({
      data: undefined
    } as any);

    const { isModuleEnabled } = useSettings();
    expect(isModuleEnabled('plans')).toBe(false);
    expect(isModuleEnabled('notes')).toBe(false);
  });
});
