import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function GroupDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'learners' | 'rules' | 'sessions'>('learners');

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.groups.get(id as string),
    enabled: !!id
  });

  const { data: learners } = useQuery({
    queryKey: ['group', id, 'learners'],
    queryFn: () => api.groups.listLearners(id as string),
    enabled: !!id && activeTab === 'learners'
  });

  const { data: rules } = useQuery({
    queryKey: ['group', id, 'rules'],
    queryFn: () => api.groups.listRules(id as string),
    enabled: !!id && activeTab === 'rules'
  });

  const [dateRange] = useState(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const next14 = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
    return { today, next14 };
  });

  const { data: sessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['group', id, 'sessions'],
    queryFn: () => api.sessions.list(dateRange.today, dateRange.next14, undefined, id as string),
    enabled: !!id && activeTab === 'sessions'
  });

  if (isLoading) return <div className="p-4 text-gray-500">{t('common.loading')}</div>;
  if (!group) return <div className="p-4 text-red-500">{t('common.error')}</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <p className="text-sm text-gray-500">{t(`groups.kind.${group.kind}`)}</p>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        <button 
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'learners' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('learners')}
        >
          {t('groups.tabs.learners')}
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'rules' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('rules')}
        >
          {t('groups.tabs.schedule')}
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium ${activeTab === 'sessions' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('sessions')}
        >
          {t('groups.tabs.upcoming_sessions')}
        </button>
      </div>

      <div className="p-4 flex-1">
        {activeTab === 'learners' && (
          <div className="space-y-3">
            {learners?.map((learner: any) => (
              <div key={learner.id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                {learner.display_name}
              </div>
            ))}
            {learners?.length === 0 && <div className="text-gray-500 italic">{t('groups.empty_learners')}</div>}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-3">
            {rules?.map((rule: any) => (
              <div key={rule.id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                <div className="font-medium">{rule.start_time} ({rule.duration_min} {t('common.minutes')})</div>
                <div className="text-sm text-gray-500">{t('common.days')}: {JSON.parse(rule.weekdays as string).join(', ')}</div>
              </div>
            ))}
            {rules?.length === 0 && <div className="text-gray-500 italic">{t('groups.empty_rules')}</div>}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-3">
            {isSessionsLoading && <div className="text-gray-500">{t('common.loading')}</div>}
            {!isSessionsLoading && sessions?.map((session: any) => (
              <div key={session.id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{session.session_date} · {session.start_time}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{session.duration_min} {t('common.minutes')}{session.room ? ` · ${session.room}` : ''}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${session.status === 'held' ? 'bg-green-100 text-green-800' : session.status === 'cancelled' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>
                    {t(`sessions.status.${session.status}`)}
                  </span>
                </div>
              </div>
            ))}
            {!isSessionsLoading && sessions?.length === 0 && <div className="text-gray-500 italic">{t('groups.empty_sessions')}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
