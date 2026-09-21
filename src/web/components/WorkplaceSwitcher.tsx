import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function WorkplaceSwitcher({ activeId, onChange }: { activeId: string | null; onChange: (id: string) => void }) {
  const { t } = useTranslation();
  
  const { data: workplaces, isLoading } = useQuery({
    queryKey: ['workplaces'],
    queryFn: () => api.workplaces.list(false),
  });

  if (isLoading || !workplaces || workplaces.length <= 1) {
    return null; // Don't show switcher if only 1 workplace
  }

  return (
    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
      <select 
        value={activeId || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        aria-label={t('workplaces.switch')}
      >
        {workplaces.map((wp: any) => (
          <option key={wp.id} value={wp.id}>
            {wp.name}
          </option>
        ))}
      </select>
    </div>
  );
}
