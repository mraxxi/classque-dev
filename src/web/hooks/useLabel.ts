import { useTranslation } from 'react-i18next';
import { useIdentity } from './useIdentity';

export function useLabel(type: 'group') {
  const { t } = useTranslation();
  const { data: identity } = useIdentity();
  
  if (type === 'group') {
    const labelKey = identity?.groupLabel === 'class' ? 'class' : 'group';
    return t(`settings.group_label.${labelKey}`);
  }
  
  return '';
}
