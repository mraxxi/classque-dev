import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, CalendarDays, Users, FileText, Menu } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useLabel } from '../hooks/useLabel';

export function Navigation() {
  const { t } = useTranslation();
  const { isModuleEnabled } = useSettings();
  const groupLabel = useLabel('group');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50 print:hidden">
      <div className="flex justify-around items-center h-16">
        <NavLink 
          to="/" 
          className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}
        >
          <Calendar size={24} />
          <span className="text-[10px] font-medium">{t('nav.today')}</span>
        </NavLink>
        
        <NavLink 
          to="/week" 
          className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}
        >
          <CalendarDays size={24} />
          <span className="text-[10px] font-medium">{t('nav.week')}</span>
        </NavLink>

        <NavLink 
          to="/groups" 
          className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}
        >
          <Users size={24} />
          <span className="text-[10px] font-medium">{groupLabel || t('nav.groups')}</span>
        </NavLink>

        {isModuleEnabled('plans') && (
          <NavLink 
            to="/plans" 
            className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}
          >
            <FileText size={24} />
            <span className="text-[10px] font-medium">{t('nav.plans')}</span>
          </NavLink>
        )}

        <NavLink 
          to="/more" 
          className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}
        >
          <Menu size={24} />
          <span className="text-[10px] font-medium">{t('nav.more')}</span>
        </NavLink>
      </div>
    </nav>
  );
}
