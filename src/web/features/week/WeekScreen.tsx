import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { SessionCard } from '../../components/SessionCard';
import { WorkplaceSwitcher } from '../../components/WorkplaceSwitcher';
import { useState } from 'react';
import { useIdentity } from '../../hooks/useIdentity';
import { addDays, format, startOfWeek } from 'date-fns';

export function WeekScreen() {
  const { t } = useTranslation();
  const { data: identity } = useIdentity();
  const [activeWorkplaceId, setActiveWorkplaceId] = useState<string | null>(identity?.accountId || null);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: identity?.weekStart === 'monday' ? 1 : 0 });
  
  const fromDate = format(weekStart, 'yyyy-MM-dd');
  const toDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  const { data: sessions, isLoading, isError } = useQuery({
    queryKey: ['sessions', 'week', activeWorkplaceId, fromDate, toDate],
    queryFn: () => api.sessions.list(fromDate, toDate, activeWorkplaceId || undefined),
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white border-b border-gray-200">
        <WorkplaceSwitcher 
          activeId={activeWorkplaceId} 
          onChange={setActiveWorkplaceId} 
        />
      </div>
      
      <div className="p-4 md:p-6 flex-1 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('nav.week')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        
        {isLoading && <div className="text-gray-500 py-8 text-center">{t('common.loading')}</div>}
        
        {isError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            {t('common.error')}
          </div>
        )}

        {/* 7-column calendar grid on laptop (lg:), vertical agenda on phone/tablet (< lg) */}
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-7 lg:gap-3 lg:items-start">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(weekStart, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const daySessions = sessions?.filter((s: any) => s.session_date === dateStr) || [];
            const isToday = format(today, 'yyyy-MM-dd') === dateStr;
            
            return (
              <div
                key={dateStr}
                className={`flex flex-col lg:bg-white lg:border lg:rounded-xl lg:p-3 lg:min-h-[380px] lg:shadow-sm ${
                  isToday ? 'lg:border-blue-400 lg:ring-1 lg:ring-blue-400' : 'lg:border-gray-200'
                }`}
              >
                {/* Day Header */}
                <div className="flex lg:flex-col items-baseline justify-between lg:items-center pb-2 mb-2 border-b border-gray-200">
                  <span className={`font-semibold text-sm ${isToday ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                    {format(date, 'EEEE')}
                  </span>
                  <span className={`text-xs ${isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {format(date, 'MMM d')}
                  </span>
                </div>

                {/* Day Sessions */}
                {daySessions.length === 0 ? (
                  <div className="text-gray-400 text-xs italic py-4 text-center lg:mt-6">
                    {t('week.no_sessions')}
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    {daySessions.map((session: any) => (
                      <SessionCard 
                        key={session.id} 
                        session={session} 
                        group={{ name: session.group_name }}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
