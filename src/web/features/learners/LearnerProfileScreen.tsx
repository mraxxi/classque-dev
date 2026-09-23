import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useParams } from 'react-router-dom';

export function LearnerProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: learner, isLoading } = useQuery({
    queryKey: ['learner', id],
    queryFn: () => api.learners.get(id as string),
    enabled: !!id
  });

  if (isLoading) return <div className="p-4 text-gray-500">{t('common.loading')}</div>;
  if (!learner) return <div className="p-4 text-red-500">{t('common.error')}</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{learner.display_name}</h1>
      </div>

      <div className="p-4 flex-1">
        <h3 className="font-semibold mb-4 text-gray-700">{t('nav.more')}</h3>
        {/* Placeholder for attendance summary etc */}
        <div className="text-gray-500 text-sm">
          {t('common.loading')}
        </div>
      </div>
    </div>
  );
}
