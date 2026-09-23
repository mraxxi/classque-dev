import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { useIdentity } from '../hooks/useIdentity';
import { useTranslation } from 'react-i18next';

export function Shell() {
  const { isLoading, error } = useIdentity();
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center text-red-500">{t('common.error')}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <main className="flex-1 w-full max-w-md mx-auto bg-white shadow-sm min-h-screen">
        <Outlet />
      </main>
      <Navigation />
    </div>
  );
}
