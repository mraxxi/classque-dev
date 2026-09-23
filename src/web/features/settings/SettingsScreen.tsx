
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

  const timezones = Intl.supportedValuesOf('timeZone');

  if (!identity) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.language')}</label>
          <select 
            value={identity.locale} 
            onChange={handleLanguageChange}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
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
            className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
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
            className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
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
            className="w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
          >
            <option value="group">{t('settings.group_label.group')}</option>
            <option value="class">{t('settings.group_label.class')}</option>
          </select>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-lg font-bold mb-3">{t('settings.modules.title')}</h2>
        {/* Module toggles are read-only for Phase 0 as they require endpoint support we'll build fully later or we can add local toggles */}
        <p className="text-sm text-gray-500">Modules configuration will be fully active in later phases.</p>
      </div>
    </div>
  );
}
