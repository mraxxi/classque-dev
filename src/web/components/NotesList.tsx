import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

export interface NoteItem {
  id: string;
  account_id: string;
  session_id: string | null;
  group_id: string | null;
  learner_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  group_name?: string | null;
  learner_name?: string | null;
  session_date?: string | null;
}

interface NotesListProps {
  notes: NoteItem[];
  onNoteDeleted?: () => void;
  onNoteUpdated?: () => void;
  emptyMessage?: string;
  showContext?: boolean;
}

export function NotesList({
  notes,
  onNoteDeleted,
  onNoteUpdated,
  emptyMessage,
  showContext = false
}: NotesListProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (note: NoteItem) => {
    setEditingId(note.id);
    setEditBody(note.body);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBody('');
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editBody.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.notes.update(id, { body: editBody.trim() });
      setEditingId(null);
      onNoteUpdated?.();
    } catch (err: any) {
      setError(err?.messageKey ? t(err.messageKey) : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await api.notes.delete(id);
      setDeletingId(null);
      onNoteDeleted?.();
    } catch (err: any) {
      alert(err?.messageKey ? t(err.messageKey) : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!notes || notes.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        <p className="text-sm">{emptyMessage || t('notes.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map(note => {
        const isEditing = editingId === note.id;

        return (
          <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {showContext && (
              <div className="flex flex-wrap gap-1.5 mb-2 text-xs">
                {note.group_name && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {note.group_name}
                  </span>
                )}
                {note.learner_name && (
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    {note.learner_name}
                  </span>
                )}
                {note.session_date && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {note.session_date}
                  </span>
                )}
              </div>
            )}

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="text-right text-xs text-gray-400">
                  {editBody.length}/2000
                </div>
                {error && <div className="text-xs text-red-600">{error}</div>}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelEdit}
                    disabled={isSubmitting}
                    className="min-h-[44px] px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={() => handleSaveEdit(note.id)}
                    disabled={isSubmitting || !editBody.trim()}
                    className="min-h-[44px] px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.body}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
                  <span>
                    {new Date(note.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(note)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-blue-600"
                      aria-label={t('common.edit')}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => setDeletingId(note.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-red-600"
                      aria-label={t('common.delete')}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Delete Confirmation Modal (NOT-004) */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">{t('notes.delete_confirm')}</h3>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isSubmitting}
                className="min-h-[44px] px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={isSubmitting}
                className="min-h-[44px] px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
