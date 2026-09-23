import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, CalendarDays, Users, FileText, StickyNote, Settings, Menu } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useLabel } from '../hooks/useLabel';

export function Navigation() {
  const { t } = useTranslation();
  const { isModuleEnabled } = useSettings();
  const groupLabel = useLabel('group');

  return (
    <>
      {/* Desktop Sidebar (Laptop / Tablet landscape >= 768px) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 sticky top-0 h-screen z-30">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              CQ
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg leading-tight block">ClassQue</span>
              <span className="text-[11px] text-gray-400 block font-normal">Planner</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Calendar size={20} className="shrink-0" />
            <span>{t('nav.today')}</span>
          </NavLink>

          <NavLink
            to="/week"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <CalendarDays size={20} className="shrink-0" />
            <span>{t('nav.week')}</span>
          </NavLink>

          <NavLink
            to="/groups"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Users size={20} className="shrink-0" />
            <span>{groupLabel || t('nav.groups')}</span>
          </NavLink>

          {isModuleEnabled('plans') && (
            <NavLink
              to="/plans"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <FileText size={20} className="shrink-0" />
              <span>{t('nav.plans')}</span>
            </NavLink>
          )}

          {isModuleEnabled('notes') && (
            <NavLink
              to="/notes"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <StickyNote size={20} className="shrink-0" />
              <span>{t('nav.notes')}</span>
            </NavLink>
          )}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Settings size={20} className="shrink-0" />
            <span>{t('nav.settings')}</span>
          </NavLink>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50 print:hidden">
        <div className="flex justify-around items-center h-16">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[44px] ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <Calendar size={22} />
            <span className="text-[10px] font-medium">{t('nav.today')}</span>
          </NavLink>

          <NavLink
            to="/week"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[44px] ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <CalendarDays size={22} />
            <span className="text-[10px] font-medium">{t('nav.week')}</span>
          </NavLink>

          <NavLink
            to="/groups"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[44px] ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <Users size={22} />
            <span className="text-[10px] font-medium">{groupLabel || t('nav.groups')}</span>
          </NavLink>

          {isModuleEnabled('plans') && (
            <NavLink
              to="/plans"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[44px] ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`
              }
            >
              <FileText size={22} />
              <span className="text-[10px] font-medium">{t('nav.plans')}</span>
            </NavLink>
          )}

          <NavLink
            to="/more"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[44px] ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <Menu size={22} />
            <span className="text-[10px] font-medium">{t('nav.more')}</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}
