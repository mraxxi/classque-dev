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
    <div className="p-4 md:p-8 space-y-6 pb-20 md:pb-8 max-w-3xl mx-auto w-full">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('settings.subtitle', 'Preferences and application configuration')}</p>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settings.language')}</label>
          <select 
            value={identity.locale} 
            onChange={handleLanguageChange}
            className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 bg-white min-h-[44px] text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settings.timezone.label')}</label>
          <select 
            value={identity.timezone} 
            onChange={handleTimezoneChange}
            className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 bg-white min-h-[44px] text-sm focus:ring-2 focus:ring-blue-500"
          >
            {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">{t('settings.timezone.notice')}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settings.week_start.label')}</label>
          <select 
            value={identity.weekStart} 
            onChange={e => updateMe.mutate({ week_start: parseInt(e.target.value) })}
            className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 bg-white min-h-[44px] text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="0">{t('settings.week_start.sunday')}</option>
            <option value="1">{t('settings.week_start.monday')}</option>
            <option value="6">{t('settings.week_start.saturday')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settings.group_label.label')}</label>
          <select 
            value={identity.groupLabel} 
            onChange={e => updateMe.mutate({ group_label: e.target.value })}
            className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 bg-white min-h-[44px] text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="group">{t('settings.group_label.group')}</option>
            <option value="class">{t('settings.group_label.class')}</option>
          </select>
        </div>
      </div>
      
      {/* Module Toggles (SET-005) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('settings.modules.title')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('settings.modules.description')}</p>
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex items-center justify-between p-3.5 bg-gray-50/70 rounded-xl border border-gray-200 cursor-pointer min-h-[44px] hover:bg-gray-50 transition-colors">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-gray-900">{t('settings.modules.plans')}</span>
              <p className="text-xs text-gray-500">{t('settings.modules.plans_desc')}</p>
            </div>
            <input 
              type="checkbox"
              checked={isModuleActive('plans')}
              onChange={e => handleToggleModule('plans', e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-gray-50/70 rounded-xl border border-gray-200 cursor-pointer min-h-[44px] hover:bg-gray-50 transition-colors">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-gray-900">{t('settings.modules.notes')}</span>
              <p className="text-xs text-gray-500">{t('settings.modules.notes_desc')}</p>
            </div>
            <input 
              type="checkbox"
              checked={isModuleActive('notes')}
              onChange={e => handleToggleModule('notes', e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
