import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function GroupDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'learners' | 'rules'>('learners');

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
      </div>
    </div>
  );
}
