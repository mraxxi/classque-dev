import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { Settings, FileText, Briefcase, Info, ChevronRight } from 'lucide-react';

export function MoreScreen() {
  const { t } = useTranslation();
  const { isModuleEnabled } = useSettings();

  const links = [
    ...(isModuleEnabled('notes') ? [{ to: '/notes', icon: <FileText size={20} />, label: t('more.notes') }] : []),
    { to: '/workplaces', icon: <Briefcase size={20} />, label: t('more.workplaces') },
    { to: '/settings', icon: <Settings size={20} />, label: t('more.settings') },
    { to: '/about', icon: <Info size={20} />, label: t('more.about') }
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      <h1 className="text-2xl font-bold mb-6 px-2">{t('nav.more')}</h1>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {links.map((link, i) => (
          <NavLink 
            key={link.to} 
            to={link.to}
            className={`flex items-center justify-between p-4 bg-white active:bg-gray-50 ${i !== links.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="flex items-center space-x-3 text-gray-800">
              <div className="text-gray-400">{link.icon}</div>
              <span className="font-medium">{link.label}</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </NavLink>
        ))}
      </div>
    </div>
  );
}
