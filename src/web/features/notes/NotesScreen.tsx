import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { NotesList } from '../../components/NotesList';
import { FloatingAddNoteButton } from '../../components/FloatingAddNoteButton';

export function NotesScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: notes, isLoading, isError } = useQuery({
    queryKey: ['notes', 'feed'],
    queryFn: () => api.notes.list({ limit: 50 })
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">{t('notes.title')}</h1>
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-w-xl mx-auto w-full">
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

        {notes && (
          <NotesList
            notes={notes}
            showContext={true}
            onNoteDeleted={handleRefresh}
            onNoteUpdated={handleRefresh}
          />
        )}
      </div>

      <FloatingAddNoteButton onNoteAdded={handleRefresh} />
    </div>
  );
}
