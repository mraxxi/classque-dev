import { useTranslation } from 'react-i18next';
import { useIdentity, useUpdateMe } from '../../hooks/useIdentity';

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { data: identity } = useIdentity();
  const updateMe = useUpdateMe();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    updateMe.mutate({ locale: newLang });
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateMe.mutate({ timezone: e.target.value });
  };

  const handleToggleModule = (moduleKey: string, checked: boolean) => {
    const currentModules: string[] = identity?.enabledModules || [];
    let nextModules: string[];
    if (checked) {
      nextModules = Array.from(new Set([...currentModules, moduleKey]));
    } else {
      nextModules = currentModules.filter(m => m !== moduleKey);
    }
    updateMe.mutate({ enabled_modules: nextModules });
  };

  const timezones = Intl.supportedValuesOf('timeZone');

  if (!identity) return null;

  const isModuleActive = (key: string) => (identity.enabledModules || []).includes(key);

  return (
    <div className="p-4 space-y-6 pb-20">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.language')}</label>
          <select 
            value={identity.locale} 
            onChange={handleLanguageChange}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white min-h-[44px]"
          >
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.timezone.label')}</label>
          <select 
            value={identity.timezone} 
            onChange={handleTimezoneChange}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white min-h-[44px]"
          >
            {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">{t('settings.timezone.notice')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.week_start.label')}</label>
          <select 
            value={identity.weekStart} 
            onChange={e => updateMe.mutate({ week_start: parseInt(e.target.value) })}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white min-h-[44px]"
          >
            <option value="0">{t('settings.week_start.sunday')}</option>
            <option value="1">{t('settings.week_start.monday')}</option>
            <option value="6">{t('settings.week_start.saturday')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.group_label.label')}</label>
          <select 
            value={identity.groupLabel} 
            onChange={e => updateMe.mutate({ group_label: e.target.value })}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white min-h-[44px]"
          >
            <option value="group">{t('settings.group_label.group')}</option>
            <option value="class">{t('settings.group_label.class')}</option>
          </select>
        </div>
      </div>
      
      {/* Module Toggles (SET-005) */}
      <div className="pt-4 border-t border-gray-200 space-y-3">
        <h2 className="text-lg font-bold text-gray-900">{t('settings.modules.title')}</h2>
        <p className="text-xs text-gray-500">{t('settings.modules.description')}</p>

        <div className="space-y-2 pt-1">
          <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer min-h-[44px]">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-gray-900">{t('settings.modules.plans')}</span>
              <p className="text-xs text-gray-400">Lesson planning and templates</p>
            </div>
            <input
              type="checkbox"
              checked={isModuleActive('plans')}
              onChange={e => handleToggleModule('plans', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer min-h-[44px]">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-gray-900">{t('settings.modules.notes')}</span>
              <p className="text-xs text-gray-400">Teacher observations and notes</p>
            </div>
            <input
              type="checkbox"
              checked={isModuleActive('notes')}
              onChange={e => handleToggleModule('notes', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
