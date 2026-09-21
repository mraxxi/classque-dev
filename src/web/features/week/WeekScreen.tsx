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
    <div className="flex flex-col h-full bg-gray-50">
      <WorkplaceSwitcher 
        activeId={activeWorkplaceId} 
        onChange={setActiveWorkplaceId} 
      />
      
      <div className="p-4 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('nav.week')}</h1>
        
        {isLoading && <div className="text-gray-500">{t('common.loading')}</div>}
        
        {isError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {t('common.error')}
          </div>
        )}

        <div className="space-y-6">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(weekStart, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const daySessions = sessions?.filter((s: any) => s.session_date === dateStr) || [];
            
            return (
              <div key={dateStr}>
                <h3 className="font-medium text-gray-700 mb-3">{format(date, 'EEEE, MMM d')}</h3>
                {daySessions.length === 0 ? (
                  <div className="text-gray-400 text-sm italic mb-4">{t('week.no_sessions')}</div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {daySessions.map((session: any) => (
                      <SessionCard 
                        key={session.id} 
                        session={session} 
                        group={{ name: session.group_name }} 
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
