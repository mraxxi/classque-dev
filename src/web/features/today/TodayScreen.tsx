import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { SessionCard } from '../../components/SessionCard';
import { WorkplaceSwitcher } from '../../components/WorkplaceSwitcher';
import { FloatingAddNoteButton } from '../../components/FloatingAddNoteButton';
import { useState, useEffect } from 'react';
import { useIdentity } from '../../hooks/useIdentity';
import { useSettings } from '../../hooks/useSettings';

export function TodayScreen() {
  const { t } = useTranslation();
  const { data: identity } = useIdentity();
  const { isModuleEnabled } = useSettings();
  const [activeWorkplaceId, setActiveWorkplaceId] = useState<string | null>(identity?.accountId || null);
  const queryClient = useQueryClient();

  // Local today date in YYYY-MM-DD
  const localToday = new Date().toLocaleDateString('en-CA');

  // TDY-001: List Sessions for today
  const { data: sessions, isLoading, isError } = useQuery({
    queryKey: ['sessions', 'today', activeWorkplaceId],
    queryFn: () => api.sessions.list(localToday, localToday, activeWorkplaceId || undefined),
    refetchOnWindowFocus: true, // "Refetch on window focus is allowed only for the Today view"
  });

  // TopUp mutation
  useEffect(() => {
    if (activeWorkplaceId) {
      api.schedule.topUp(localToday).then(() => {
        queryClient.invalidateQueries({ queryKey: ['sessions', 'today'] });
      }).catch(console.error);
    }
  }, [activeWorkplaceId, localToday, queryClient]);

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      <WorkplaceSwitcher 
        activeId={activeWorkplaceId} 
        onChange={setActiveWorkplaceId} 
      />
      
      <div className="p-4 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('nav.today')}</h1>
        
        {isLoading && <div className="text-gray-500">{t('common.loading')}</div>}
        
        {isError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {t('common.error')}
          </div>
        )}
        
        {!isLoading && !isError && sessions?.length === 0 && (
          <div className="text-center py-10">
            <div className="text-gray-400 mb-3 text-4xl">☕</div>
            <h3 className="text-lg font-medium text-gray-900">{t('today.empty.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('today.empty.description')}</p>
          </div>
        )}

        <div className="space-y-3">
          {sessions?.map((session: any) => (
            <SessionCard 
              key={session.id} 
              session={session} 
              group={{ name: session.group_name }} 
            />
          ))}
        </div>
      </div>

      {isModuleEnabled('notes') && (
        <FloatingAddNoteButton onNoteAdded={() => queryClient.invalidateQueries({ queryKey: ['notes'] })} />
      )}
    </div>
  );
}
