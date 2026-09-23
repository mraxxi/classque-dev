import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { NotesList } from '../../components/NotesList';
import { FloatingAddNoteButton } from '../../components/FloatingAddNoteButton';

export function GroupDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isModuleEnabled } = useSettings();
  const [activeTab, setActiveTab] = useState<'learners' | 'rules' | 'sessions' | 'notes'>('learners');

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

  const { data: notes } = useQuery({
    queryKey: ['notes', 'group', id],
    queryFn: () => api.notes.list({ groupId: id as string }),
    enabled: !!id && isModuleEnabled('notes') && activeTab === 'notes'
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>;
  if (!group) return <div className="p-8 text-center text-red-500">{t('common.error')}</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white p-4 md:p-6 border-b border-gray-200">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-1">
            <Link to="/groups" className="text-gray-400 hover:text-gray-600 text-sm font-medium">
              ← {t('nav.groups')}
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{t(`groups.kind.${group.kind}`)}</p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex overflow-x-auto">
          <button 
            className={`flex-1 md:flex-initial md:px-6 py-3.5 text-sm font-semibold transition-colors min-h-[44px] ${activeTab === 'learners' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('learners')}
          >
            {t('groups.tabs.learners')}
          </button>
          <button 
            className={`flex-1 md:flex-initial md:px-6 py-3.5 text-sm font-semibold transition-colors min-h-[44px] ${activeTab === 'rules' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('rules')}
          >
            {t('groups.tabs.schedule')}
          </button>
          <button 
            className={`flex-1 md:flex-initial md:px-6 py-3.5 text-sm font-semibold transition-colors min-h-[44px] ${activeTab === 'sessions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('sessions')}
          >
            {t('groups.tabs.upcoming_sessions')}
          </button>
          {isModuleEnabled('notes') && (
            <button 
              className={`flex-1 md:flex-initial md:px-6 py-3.5 text-sm font-semibold transition-colors min-h-[44px] ${activeTab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('notes')}
            >
              {t('notes.title')}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1 max-w-5xl mx-auto w-full">
        {activeTab === 'learners' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {learners?.map((learner: any) => (
                <Link
                  key={learner.id}
                  to={`/learners/${learner.id}`}
                  className="block bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 transition-colors"
                >
                  <div className="font-semibold text-gray-900">{learner.display_name}</div>
                </Link>
              ))}
            </div>
            {learners?.length === 0 && (
              <div className="text-gray-500 italic text-center py-12 bg-white rounded-xl border border-gray-200">
                {t('groups.empty_learners')}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rules?.map((rule: any) => (
              <div key={rule.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="font-semibold text-gray-900">{rule.start_time} ({rule.duration_min} {t('common.minutes')})</div>
                <div className="text-sm text-gray-500 mt-1">{t('common.days')}: {JSON.parse(rule.weekdays as string).join(', ')}</div>
              </div>
            ))}
            {rules?.length === 0 && (
              <div className="text-gray-500 italic text-center py-12 bg-white rounded-xl border border-gray-200 col-span-2">
                {t('groups.empty_rules')}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div>
            {isSessionsLoading && <div className="text-gray-500 py-8 text-center">{t('common.loading')}</div>}
            {!isSessionsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sessions?.map((session: any) => (
                  <Link
                    key={session.id}
                    to={`/sessions/${session.id}`}
                    className="block bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{session.session_date} · {session.start_time}</div>
                        <div className="text-xs text-gray-500 mt-1">{session.duration_min} {t('common.minutes')}{session.room ? ` · ${session.room}` : ''}</div>
                        {isModuleEnabled('plans') && session.plan_title && (
                          <div className="text-xs text-blue-600 mt-2 flex items-center gap-1 font-medium">
                            <span>📋</span> {session.plan_title}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${session.status === 'held' ? 'bg-green-100 text-green-800' : session.status === 'cancelled' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>
                        {t(`sessions.status.${session.status}`) || session.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {!isSessionsLoading && sessions?.length === 0 && (
              <div className="text-gray-500 italic text-center py-12 bg-white rounded-xl border border-gray-200">
                {t('groups.empty_sessions')}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && isModuleEnabled('notes') && (
          <div className="space-y-4">
            <NotesList
              notes={notes || []}
              onNoteDeleted={() => queryClient.invalidateQueries({ queryKey: ['notes', 'group', id] })}
              onNoteUpdated={() => queryClient.invalidateQueries({ queryKey: ['notes', 'group', id] })}
            />
          </div>
        )}
      </div>

      {isModuleEnabled('notes') && (
        <FloatingAddNoteButton
          groupId={id}
          onNoteAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['notes', 'group', id] });
          }}
        />
      )}
    </div>
  );
}
