import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { Settings, StickyNote, Briefcase, Info, ChevronRight } from 'lucide-react';

export function MoreScreen() {
  const { t } = useTranslation();
  const { isModuleEnabled } = useSettings();

  const links = [
    ...(isModuleEnabled('notes') ? [{ to: '/notes', icon: <StickyNote size={20} />, label: t('more.notes') }] : []),
    { to: '/workplaces', icon: <Briefcase size={20} />, label: t('more.workplaces') },
    { to: '/settings', icon: <Settings size={20} />, label: t('more.settings') },
    { to: '/about', icon: <Info size={20} />, label: t('more.about') }
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-full max-w-xl mx-auto w-full pb-20 md:pb-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 px-2 text-gray-900">{t('nav.more')}</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {links.map((link, i) => (
          <NavLink 
            key={link.to} 
            to={link.to}
            className={`flex items-center justify-between p-4 bg-white active:bg-gray-50 hover:bg-gray-50 transition-colors min-h-[44px] ${i !== links.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="flex items-center space-x-3 text-gray-800">
              <div className="text-gray-400">{link.icon}</div>
              <span className="font-semibold text-sm">{link.label}</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </NavLink>
        ))}
      </div>
    </div>
  );
}
