import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { WorkplaceSwitcher } from '../../components/WorkplaceSwitcher';
import { useState } from 'react';
import { useIdentity } from '../../hooks/useIdentity';
import { useLabel } from '../../hooks/useLabel';
import { Link } from 'react-router-dom';

export function GroupsScreen() {
  const { t } = useTranslation();
  const groupLabel = useLabel('group');
  const { data: identity } = useIdentity();
  const [activeWorkplaceId, setActiveWorkplaceId] = useState<string | null>(identity?.accountId || null);

  const { data: groups, isLoading, isError } = useQuery({
    queryKey: ['groups', activeWorkplaceId],
    queryFn: () => api.groups.list(activeWorkplaceId || undefined),
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <WorkplaceSwitcher 
        activeId={activeWorkplaceId} 
        onChange={setActiveWorkplaceId} 
      />
      
      <div className="p-4 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{groupLabel}</h1>
          <button className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700">
            {t('groups.add')}
          </button>
        </div>
        
        {isLoading && <div className="text-gray-500">{t('common.loading')}</div>}
        
        {isError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {t('common.error')}
          </div>
        )}

        {!isLoading && !isError && groups?.length === 0 && (
          <div className="text-center py-10">
            <div className="text-gray-400 mb-3 text-4xl">👥</div>
            <h3 className="text-lg font-medium text-gray-900">{t('groups.empty.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('groups.empty.description')}</p>
          </div>
        )}

        <div className="space-y-3">
          {groups?.map((group: any) => (
            <Link 
              key={group.id} 
              to={`/groups/${group.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50 transition-colors"
            >
              <div className="font-semibold text-gray-900 text-lg">{group.name}</div>
              <div className="text-gray-500 text-sm mt-1">
                {t(`groups.kind.${group.kind}`)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
