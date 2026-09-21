
import { useTranslation } from 'react-i18next';
import { useLabel } from '../../hooks/useLabel';

export function TodayScreen() {
  const { t } = useTranslation();
  return <div className="p-4"><h1 className="text-xl font-bold">{t('nav.today')}</h1><p className="mt-4 text-gray-500">Phase 0 placeholder</p></div>;
}

export function WeekScreen() {
  const { t } = useTranslation();
  return <div className="p-4"><h1 className="text-xl font-bold">{t('nav.week')}</h1><p className="mt-4 text-gray-500">Phase 0 placeholder</p></div>;
}

export function GroupsScreen() {
  const groupLabel = useLabel('group');
  return <div className="p-4"><h1 className="text-xl font-bold">{groupLabel}</h1><p className="mt-4 text-gray-500">Phase 0 placeholder</p></div>;
}

export function PlansScreen() {
  const { t } = useTranslation();
  return <div className="p-4"><h1 className="text-xl font-bold">{t('nav.plans')}</h1><p className="mt-4 text-gray-500">Phase 0 placeholder</p></div>;
}
