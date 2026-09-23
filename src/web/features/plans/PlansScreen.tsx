import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export function PlansScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [packId, setPackId] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);

  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ['plans', search, packId, showArchived],
    queryFn: () => api.plans.list({
      q: search || undefined,
      packId: packId || undefined,
      includeArchived: showArchived
    })
  });

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.plans.duplicate(id);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (err: any) {
      alert(err?.messageKey ? t(err.messageKey) : t('common.error'));
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.plans.archive(id);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (err: any) {
      alert(err?.messageKey ? t(err.messageKey) : t('common.error'));
    }
  };

  const handleRestore = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.plans.restore(id);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (err: any) {
      alert(err?.messageKey ? t(err.messageKey) : t('common.error'));
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('plans.title')}</h1>
          <button
            onClick={() => navigate('/plans/new')}
            className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm flex items-center gap-1 shadow-sm"
          >
            + {t('plans.new')}
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('plans.search_placeholder')}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={packId}
              onChange={e => setPackId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">{t('plans.all_packs')}</option>
              <option value="generic">{t('pack.generic.name')}</option>
              <option value="english">{t('pack.english.name')}</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer min-h-[32px]">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>{t('plans.show_archived')}</span>
          </label>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {isLoading && (
          <div className="text-center py-10 text-gray-500 text-sm">
            {t('common.loading')}
          </div>
        )}

        {isError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
            {t('common.error')}
          </div>
        )}

        {plans && plans.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {t('plans.empty.title')}
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
              {t('plans.empty.description')}
            </p>
            <button
              onClick={() => navigate('/plans/new')}
              className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm inline-flex items-center"
            >
              + {t('plans.new')}
            </button>
          </div>
        )}

        <div className="space-y-3">
          {plans?.map((plan: any) => {
            const isArchived = Boolean(plan.archived_at);
            return (
              <div
                key={plan.id}
                onClick={() => navigate(`/plans/${plan.id}`)}
                className={`bg-white border rounded-xl p-4 shadow-sm hover:border-blue-400 cursor-pointer transition-colors ${
                  isArchived ? 'opacity-60 bg-gray-50 border-dashed border-gray-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {plan.title}
                  </h3>
                  {isArchived && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-medium">
                      {t('plans.archived_tag')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium capitalize">
                    {plan.pack_id}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">
                    {plan.used_count === 1
                      ? t('plans.used_in_sessions_one')
                      : t('plans.used_in_sessions_other', { count: plan.used_count || 0 })}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <span>
                    {new Date(plan.updated_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => handleDuplicate(e, plan.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-blue-600"
                      aria-label={t('common.duplicate')}
                    >
                      {t('common.duplicate')}
                    </button>

                    {isArchived ? (
                      <button
                        onClick={e => handleRestore(e, plan.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-green-600"
                        aria-label={t('common.restore')}
                      >
                        {t('common.restore')}
                      </button>
                    ) : (
                      <button
                        onClick={e => handleArchive(e, plan.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-amber-600"
                        aria-label={t('common.archive')}
                      >
                        {t('common.archive')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
