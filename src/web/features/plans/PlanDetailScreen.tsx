import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSubjectPack } from '../../../shared/packs/registry';
import type { SubjectPack, PlanSection } from '../../../shared/packs/types';

export function PlanDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const draftKey = `classque:draft:plan:${id || 'new'}`;

  const [title, setTitle] = useState(() => {
    if (isNew) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          return JSON.parse(savedDraft).title || '';
        } catch {
          // ignore
        }
      }
    }
    return '';
  });

  const [packId, setPackId] = useState(() => {
    if (isNew) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          return JSON.parse(savedDraft).packId || 'generic';
        } catch {
          // ignore
        }
      }
    }
    return 'generic';
  });

  const [content, setContent] = useState<Record<string, any>>(() => {
    if (isNew) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          return JSON.parse(savedDraft).content || {};
        } catch {
          // ignore
        }
      }
    }
    return {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(() => {
    if (isNew) {
      return Boolean(localStorage.getItem(draftKey));
    }
    return false;
  });
  const [error, setError] = useState<string | null>(null);
  const [showMultiSessionModal, setShowMultiSessionModal] = useState(false);

  // Sync state when editing an existing plan
  const [syncedPlanId, setSyncedPlanId] = useState<string | null>(null);

  // Fetch plan if editing
  const { data: plan, isLoading: isPlanLoading } = useQuery({
    queryKey: ['plans', id],
    queryFn: () => api.plans.get(id!),
    enabled: !isNew
  });

  if (!isNew && plan && syncedPlanId !== plan.id) {
    setSyncedPlanId(plan.id);
    setTitle(plan.title);
    setPackId(plan.pack_id);
    let parsedContent: Record<string, any> = {};
    try {
      parsedContent = typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content;
    } catch {
      parsedContent = {};
    }
    setContent(parsedContent);

    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draftObj = JSON.parse(savedDraft);
        if (draftObj.title !== plan.title || JSON.stringify(draftObj.content) !== JSON.stringify(parsedContent)) {
          setHasDraft(true);
        }
      } catch {
        // ignore
      }
    }
  }

  const pack: SubjectPack = getSubjectPack(packId);

  // Save draft on edit
  const saveDraft = (newTitle: string, newPackId: string, newContent: Record<string, any>) => {
    setIsDirty(true);
    localStorage.setItem(draftKey, JSON.stringify({
      title: newTitle,
      packId: newPackId,
      content: newContent
    }));
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    if (!isNew && plan) {
      setTitle(plan.title);
      setPackId(plan.pack_id);
      try {
        setContent(typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content);
      } catch {
        setContent({});
      }
      setIsDirty(false);
    } else if (isNew) {
      setTitle('');
      setPackId('generic');
      setContent({});
      setIsDirty(false);
    }
  };

  const handleApplyDraft = () => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draftObj = JSON.parse(savedDraft);
        if (draftObj.title !== undefined) setTitle(draftObj.title);
        if (draftObj.packId !== undefined) setPackId(draftObj.packId);
        if (draftObj.content !== undefined) setContent(draftObj.content);
        setHasDraft(false);
      } catch {
        // ignore
      }
    }
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // PLN-005: If plan is used in more than 1 session, prompt teacher
    if (!isNew && plan && (plan.used_count || 0) > 1) {
      setShowMultiSessionModal(true);
      return;
    }

    performSave('edit_all');
  };

  const performSave = async (mode: 'edit_all' | 'duplicate_edit') => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (isNew) {
        const created = await api.plans.create({
          title: title.trim(),
          packId,
          content
        });
        localStorage.removeItem(draftKey);
        setIsDirty(false);
        queryClient.invalidateQueries({ queryKey: ['plans'] });
        navigate(`/plans/${created.id}`, { replace: true });
      } else {
        if (mode === 'duplicate_edit') {
          // Duplicate original and apply update to new one
          const dup = await api.plans.duplicate(id!);
          await api.plans.update(dup.id, {
            title: title.trim(),
            content
          });
          localStorage.removeItem(draftKey);
          setIsDirty(false);
          queryClient.invalidateQueries({ queryKey: ['plans'] });
          navigate(`/plans/${dup.id}`, { replace: true });
        } else {
          // Edit for all
          await api.plans.update(id!, {
            title: title.trim(),
            content
          });
          localStorage.removeItem(draftKey);
          setIsDirty(false);
          queryClient.invalidateQueries({ queryKey: ['plans'] });
          setShowMultiSessionModal(false);
        }
      }
    } catch (err: any) {
      setError(err?.messageKey ? t(err.messageKey) : t('common.error'));
      setShowMultiSessionModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic field helpers
  const handleTextChange = (key: string, val: string) => {
    const updated = { ...content, [key]: val };
    setContent(updated);
    saveDraft(title, packId, updated);
  };

  const handleListItemChange = (key: string, index: number, val: string) => {
    const list = [...(content[key] || [])];
    list[index] = val;
    const updated = { ...content, [key]: list };
    setContent(updated);
    saveDraft(title, packId, updated);
  };

  const handleAddListItem = (key: string) => {
    const list = [...(content[key] || []), ''];
    const updated = { ...content, [key]: list };
    setContent(updated);
    saveDraft(title, packId, updated);
  };

  const handleRemoveListItem = (key: string, index: number) => {
    const list = [...(content[key] || [])];
    list.splice(index, 1);
    const updated = { ...content, [key]: list };
    setContent(updated);
    saveDraft(title, packId, updated);
  };

  const handlePairChange = (key: string, index: number, field: 'term' | 'definition', val: string) => {
    const pairs = [...(content[key] || [])];
    pairs[index] = { ...pairs[index], [field]: val };
    const updated = { ...content, [key]: pairs };
    setContent(updated);
    saveDraft(title, packId, updated);
  };

  const handleAddPair = (key: string) => {
    const pairs = [...(content[key] || []), { term: '', definition: '' }];
    const updated = { ...content, [key]: pairs };
    setContent(updated);
    saveDraft(title, packId, updated);
  };

  const handleRemovePair = (key: string, index: number) => {
    const pairs = [...(content[key] || [])];
    pairs.splice(index, 1);
    const updated = { ...content, [key]: pairs };
    setContent(updated);
    saveDraft(title, packId, updated);
  };

  if (!isNew && isPlanLoading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isDirty) {
                  if (confirm(t('plans.unsaved_warning'))) {
                    navigate('/plans');
                  }
                } else {
                  navigate('/plans');
                }
              }}
              className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
              aria-label="Back"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {isNew ? t('plans.new') : t('plans.edit')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                type="button"
                onClick={() => navigate(`/plans/${id}/print`)}
                className="min-h-[44px] px-3 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                🖨️ {t('plans.print')}
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={isSubmitting || !title.trim()}
              className="min-h-[44px] px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>

        {/* Draft Notification banner (PLN-009) */}
        {hasDraft && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
            <span>{t('plans.draft_notice')}</span>
            <div className="flex gap-2">
              <button
                onClick={handleApplyDraft}
                className="text-blue-700 font-semibold underline min-h-[32px] px-1"
              >
                {t('plans.load_draft')}
              </button>
              <button
                onClick={handleDiscardDraft}
                className="text-gray-500 hover:text-gray-700 min-h-[32px] px-1"
              >
                {t('plans.discard_draft')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-w-2xl mx-auto w-full">
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveClick} className="space-y-6">
          {/* Metadata Section */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('plans.form.title')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  saveDraft(e.target.value, packId, content);
                }}
                placeholder={t('plans.form.title_placeholder')}
                maxLength={120}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            {isNew ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('plans.form.pack')}
                </label>
                <select
                  value={packId}
                  onChange={e => {
                    setPackId(e.target.value);
                    saveDraft(title, e.target.value, content);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px]"
                >
                  <option value="generic">{t('pack.generic.name')}</option>
                  <option value="english">{t('pack.english.name')}</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span className="capitalize">
                  {t('plans.form.pack')}: {pack.labelKey ? t(pack.labelKey) : packId}
                </span>
                <span>
                  {plan?.used_count === 1
                    ? t('plans.used_in_sessions_one')
                    : t('plans.used_in_sessions_other', { count: plan?.used_count || 0 })}
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Pack Template Sections (PLN-002) */}
          <div className="space-y-4">
            {pack.planTemplate.map((section: PlanSection) => {
              const label = t(section.labelKey);

              if (section.kind === 'text') {
                const val = content[section.key] || '';
                return (
                  <div key={section.key} className="bg-white p-4 rounded-xl border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {label} {section.required && '*'}
                    </label>
                    <textarea
                      value={val}
                      onChange={e => handleTextChange(section.key, e.target.value)}
                      maxLength={4000}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {val.length}/4000
                    </div>
                  </div>
                );
              }

              if (section.kind === 'list') {
                const items: string[] = content[section.key] || [];
                return (
                  <div key={section.key} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">
                        {label} {section.required && '*'}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddListItem(section.key)}
                        disabled={items.length >= 30}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium min-h-[44px] px-2 flex items-center"
                      >
                        + {t('plans.form.add_item')}
                      </button>
                    </div>

                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item}
                          onChange={e => handleListItemChange(section.key, index, e.target.value)}
                          maxLength={200}
                          placeholder={`Item ${index + 1}`}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveListItem(section.key, index)}
                          className="text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center text-sm"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-xs text-gray-400 italic">{t('plans.no_items')}</p>
                    )}
                  </div>
                );
              }

              if (section.kind === 'pairs') {
                const pairs: Array<{ term: string; definition: string }> = content[section.key] || [];
                return (
                  <div key={section.key} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">
                        {label} {section.required && '*'}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddPair(section.key)}
                        disabled={pairs.length >= 60}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium min-h-[44px] px-2 flex items-center"
                      >
                        + {t('plans.form.add_pair')}
                      </button>
                    </div>

                    {pairs.map((pair, index) => (
                      <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            {t('plans.pair_number', { number: index + 1 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePair(section.key, index)}
                            className="text-gray-400 hover:text-red-500 min-h-[32px] min-w-[32px] flex items-center justify-center text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          value={pair.term}
                          onChange={e => handlePairChange(section.key, index, 'term', e.target.value)}
                          maxLength={200}
                          placeholder={t('plans.form.term')}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white min-h-[40px]"
                        />
                        <textarea
                          value={pair.definition}
                          onChange={e => handlePairChange(section.key, index, 'definition', e.target.value)}
                          maxLength={2000}
                          rows={2}
                          placeholder={t('plans.form.definition')}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                        />
                      </div>
                    ))}
                    {pairs.length === 0 && (
                      <p className="text-xs text-gray-400 italic">{t('plans.no_pairs')}</p>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </form>
      </div>

      {/* Multi-Session Edit Prompt Modal (PLN-005) */}
      {showMultiSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">
              {t('plans.multi_session.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('plans.multi_session.description', { count: plan?.used_count || 0 })}
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => performSave('edit_all')}
                disabled={isSubmitting}
                className="w-full min-h-[44px] px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                {t('plans.multi_session.edit_all')}
              </button>
              <button
                type="button"
                onClick={() => performSave('duplicate_edit')}
                disabled={isSubmitting}
                className="w-full min-h-[44px] px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg"
              >
                {t('plans.multi_session.duplicate_edit')}
              </button>
              <button
                type="button"
                onClick={() => setShowMultiSessionModal(false)}
                disabled={isSubmitting}
                className="w-full min-h-[44px] px-4 py-2 text-sm text-gray-500 hover:text-gray-700 text-center"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
