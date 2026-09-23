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
    <div className="flex flex-col h-full bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white border-b border-gray-200">
        <WorkplaceSwitcher 
          activeId={activeWorkplaceId} 
          onChange={setActiveWorkplaceId} 
        />
      </div>
      
      <div className="p-4 md:p-6 flex-1 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{groupLabel || t('nav.groups')}</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 min-h-[44px] shadow-sm">
            + {t('groups.add')}
          </button>
        </div>
        
        {isLoading && <div className="text-gray-500 py-8 text-center">{t('common.loading')}</div>}
        
        {isError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            {t('common.error')}
          </div>
        )}

        {!isLoading && !isError && groups?.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-lg mx-auto mt-6">
            <div className="text-gray-400 mb-3 text-5xl">👥</div>
            <h3 className="text-lg font-semibold text-gray-900">{t('groups.empty.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('groups.empty.description')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups?.map((group: any) => (
            <Link 
              key={group.id} 
              to={`/groups/${group.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-blue-400 active:bg-gray-50 transition-colors"
            >
              <div className="font-bold text-gray-900 text-lg mb-1">{group.name}</div>
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                {t(`groups.kind.${group.kind}`)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
