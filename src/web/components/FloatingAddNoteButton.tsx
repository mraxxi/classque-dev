import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

interface FloatingAddNoteButtonProps {
  sessionId?: string | null;
  groupId?: string | null;
  learnerId?: string | null;
  onNoteAdded?: () => void;
}

export function FloatingAddNoteButton({
  sessionId = null,
  groupId = null,
  learnerId = null,
  onNoteAdded
}: FloatingAddNoteButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftKey = `classque:draft:note:${sessionId || ''}_${groupId || ''}_${learnerId || ''}`;

  const handleOpen = () => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      setBody(savedDraft);
    }
    setIsOpen(true);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    if (value.trim()) {
      localStorage.setItem(draftKey, value);
    } else {
      localStorage.removeItem(draftKey);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.notes.create({
        body: body.trim(),
        sessionId,
        groupId,
        learnerId
      });
      localStorage.removeItem(draftKey);
      setBody('');
      setIsOpen(false);
      onNoteAdded?.();
    } catch (err: any) {
      setError(err?.messageKey ? t(err.messageKey) : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform active:scale-95"
        aria-label={t('notes.add')}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{t('notes.add')}</h2>
                {body.trim() && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {t('notes.draft_notice')}
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
                aria-label={t('common.cancel')}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  value={body}
                  onChange={e => handleBodyChange(e.target.value)}
                  placeholder={t('notes.placeholder')}
                  rows={4}
                  maxLength={2000}
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {body.length}/2000
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                {body.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(draftKey);
                      setBody('');
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 min-h-[44px] px-2 flex items-center"
                  >
                    {t('notes.clear_draft')}
                  </button>
                ) : <span />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="min-h-[44px] px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !body.trim()}
                    className="min-h-[44px] px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
