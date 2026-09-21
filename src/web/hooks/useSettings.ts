import { useIdentity } from './useIdentity';

export function useSettings() {
  const { data: identity } = useIdentity();
  
  const isModuleEnabled = (moduleKey: string) => {
    if (!identity) return false;
    // According to SET-005, some modules are always on:
    const ALWAYS_ON = ['groups', 'learners', 'sessions', 'attendance', 'schedule'];
    if (ALWAYS_ON.includes(moduleKey)) return true;
    
    return (identity.enabledModules || []).includes(moduleKey);
  };
  
  return {
    identity,
    isModuleEnabled
  };
}
