import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { NotesList } from '../../components/NotesList';
import { FloatingAddNoteButton } from '../../components/FloatingAddNoteButton';

export function LearnerProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isModuleEnabled } = useSettings();

  const { data: learner, isLoading } = useQuery({
    queryKey: ['learner', id],
    queryFn: () => api.learners.get(id as string),
    enabled: !!id
  });

  const { data: notes, isLoading: isNotesLoading } = useQuery({
    queryKey: ['notes', 'learner', id],
    queryFn: () => api.notes.list({ learnerId: id as string }),
    enabled: !!id && isModuleEnabled('notes')
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>;
  if (!learner) return <div className="p-8 text-center text-red-500">{t('common.error')}</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white p-4 md:p-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-lg"
            aria-label="Back"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{learner.display_name}</h1>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1 max-w-4xl mx-auto w-full space-y-6">
        {isModuleEnabled('notes') && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📝</span> {t('notes.title')}
            </h2>

            {isNotesLoading ? (
              <div className="text-xs text-gray-400 py-6 text-center">{t('common.loading')}</div>
            ) : (
              <NotesList
                notes={notes || []}
                onNoteDeleted={() => queryClient.invalidateQueries({ queryKey: ['notes', 'learner', id] })}
                onNoteUpdated={() => queryClient.invalidateQueries({ queryKey: ['notes', 'learner', id] })}
              />
            )}
          </section>
        )}
      </div>

      {isModuleEnabled('notes') && (
        <FloatingAddNoteButton
          learnerId={id}
          onNoteAdded={() => queryClient.invalidateQueries({ queryKey: ['notes', 'learner', id] })}
        />
      )}
    </div>
  );
}
