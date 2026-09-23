import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface AttachPlanModalProps {
  sessionId: string;
  groupId: string;
  currentPlanId?: string | null;
  onClose: () => void;
  onPlanAttached: () => void;
}

export function AttachPlanModal({
  sessionId,
  groupId,
  currentPlanId,
  onClose,
  onPlanAttached
}: AttachPlanModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(currentPlanId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'earlier'>('all');

  // Load all plans
  const { data: plans, isLoading: isPlansLoading } = useQuery({
    queryKey: ['plans', 'all', search],
    queryFn: () => api.plans.list({ q: search || undefined })
  });

  // Load past sessions for this group to reuse plan
  const { data: pastSessions, isLoading: isPastLoading } = useQuery({
    queryKey: ['sessions', 'past-plans', groupId],
    queryFn: async () => {
      // Look back 14 days
      const to = new Date().toISOString().split('T')[0];
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 14);
      const from = fromDate.toISOString().split('T')[0];
      const res = await api.sessions.list(from, to, undefined, groupId);
      return (res || []).filter((s: any) => s.plan_id && s.id !== sessionId);
    },
    enabled: activeTab === 'earlier'
  });

  const handleAttach = async (planId: string | null) => {
    setIsSubmitting(true);
    try {
      await api.sessions.setPlan(sessionId, planId);
      onPlanAttached();
      onClose();
    } catch (err: any) {
      alert(err?.messageKey ? t(err.messageKey) : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{t('plans.attach')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('common.cancel')}
          >
            ✕
          </button>
        </div>

        {/* Tab switch: All plans vs Earlier sessions */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`min-h-[44px] flex-1 pb-2 text-sm font-medium border-b-2 text-center ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('plans.choose_existing')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('earlier')}
            className={`min-h-[44px] flex-1 pb-2 text-sm font-medium border-b-2 text-center ${
              activeTab === 'earlier'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('plans.reuse_earlier')}
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('plans.search_placeholder')}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isPlansLoading && (
                <div className="text-center py-6 text-sm text-gray-400">
                  {t('common.loading')}
                </div>
              )}

              {plans && plans.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-400">
                  {t('plans.empty.title')}
                </div>
              )}

              {plans?.map((plan: any) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-colors flex items-center justify-between min-h-[44px] ${
                    selectedPlanId === plan.id
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{plan.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="capitalize">{plan.pack_id}</span>
                      <span>•</span>
                      <span>{t('plans.used_in_sessions', { count: plan.used_count || 0 })}</span>
                    </div>
                  </div>
                  {selectedPlanId === plan.id && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/plans/new');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium min-h-[44px] flex items-center"
              >
                + {t('plans.new')}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleAttach(selectedPlanId)}
                  disabled={isSubmitting || !selectedPlanId}
                  className="min-h-[44px] px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {isSubmitting ? t('common.loading') : t('plans.attach')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'earlier' && (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {isPastLoading && (
              <div className="text-center py-6 text-sm text-gray-400">
                {t('common.loading')}
              </div>
            )}

            {pastSessions && pastSessions.length === 0 && (
              <div className="text-center py-6 text-sm text-gray-400">
                {t('plans.empty.title')}
              </div>
            )}

            {pastSessions?.map((s: any) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleAttach(s.plan_id)}
                disabled={isSubmitting}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm transition-colors flex items-center justify-between min-h-[44px]"
              >
                <div>
                  <div className="font-medium text-gray-900">{s.plan_title || 'Attached Plan'}</div>
                  <div className="text-xs text-gray-500">
                    {s.session_date} {s.start_time}
                  </div>
                </div>
                <span className="text-blue-600 text-xs font-medium">
                  {t('plans.attach')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
