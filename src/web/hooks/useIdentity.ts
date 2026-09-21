import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function useIdentity() {
  const { i18n } = useTranslation();
  
  const query = useQuery({
    queryKey: ['identity'],
    queryFn: () => fetchApi('/me'),
    staleTime: Infinity,
  });

  // Sync language with backend user preference
  useEffect(() => {
    if (query.data && query.data.locale && query.data.locale !== i18n.language) {
      i18n.changeLanguage(query.data.locale);
    }
  }, [query.data?.locale, i18n]);

  return query;
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => fetchApi('/me', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identity'] });
    }
  });
}
