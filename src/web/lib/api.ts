export async function fetchApi(path: string, options: RequestInit = {}) {
  const url = `/api/v1${path}`;
  const headers = new Headers(options.headers || {});
  
  // Set JSON content-type for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    if (res.status === 401) {
      // Cloudflare Access should prevent this, but just in case
      window.location.reload();
      return null;
    }
    
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      throw new Error(`API Error: ${res.status}`);
    }
    throw errorData.error || new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  me: {
    get: () => fetchApi('/me'),
    update: (data: any) => fetchApi('/me', { method: 'PATCH', body: JSON.stringify(data) })
  },
  workplaces: {
    list: (includeArchived = false) => fetchApi(`/workplaces?includeArchived=${includeArchived}`),
    create: (data: any) => fetchApi('/workplaces', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`/workplaces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    archive: (id: string) => fetchApi(`/workplaces/${id}/archive`, { method: 'POST' }),
    restore: (id: string) => fetchApi(`/workplaces/${id}/restore`, { method: 'POST' }),
    listTerms: (id: string, includeArchived = false) => fetchApi(`/workplaces/${id}/terms?includeArchived=${includeArchived}`),
    createTerm: (id: string, data: any) => fetchApi(`/workplaces/${id}/terms`, { method: 'POST', body: JSON.stringify(data) })
  },
  terms: {
    update: (id: string, data: any) => fetchApi(`/terms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    archive: (id: string) => fetchApi(`/terms/${id}/archive`, { method: 'POST' }),
    restore: (id: string) => fetchApi(`/terms/${id}/restore`, { method: 'POST' })
  },
  groups: {
    list: (workplaceId?: string, limit = 50, includeArchived = false) => fetchApi(`/groups?limit=${limit}&includeArchived=${includeArchived}${workplaceId ? `&workplaceId=${workplaceId}` : ''}`),
    create: (data: any) => fetchApi('/groups', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi(`/groups/${id}`),
    update: (id: string, data: any) => fetchApi(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    archive: (id: string) => fetchApi(`/groups/${id}/archive`, { method: 'POST' }),
    restore: (id: string) => fetchApi(`/groups/${id}/restore`, { method: 'POST' }),
    listLearners: (id: string, includeLeft = false) => fetchApi(`/groups/${id}/learners?includeLeft=${includeLeft}`),
    addLearners: (id: string, data: any) => fetchApi(`/groups/${id}/learners`, { method: 'POST', body: JSON.stringify(data) }),
    removeLearner: (id: string, learnerId: string) => fetchApi(`/groups/${id}/learners/${learnerId}/remove`, { method: 'POST' }),
    listRules: (id: string) => fetchApi(`/groups/${id}/schedule-rules`),
    createRule: (id: string, data: any) => fetchApi(`/groups/${id}/schedule-rules`, { method: 'POST', body: JSON.stringify(data) }),
    getAttendanceSummary: (id: string, from: string, to: string) => fetchApi(`/groups/${id}/attendance-summary?from=${from}&to=${to}`)
  },
  learners: {
    get: (id: string) => fetchApi(`/learners/${id}`),
    update: (id: string, data: any) => fetchApi(`/learners/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    archive: (id: string) => fetchApi(`/learners/${id}/archive`, { method: 'POST' }),
    getAttendanceSummary: (id: string, from: string, to: string) => fetchApi(`/learners/${id}/attendance-summary?from=${from}&to=${to}`)
  },
  sessions: {
    list: (from: string, to: string, workplaceId?: string, groupId?: string) => fetchApi(`/sessions?from=${from}&to=${to}${workplaceId ? `&workplaceId=${workplaceId}` : ''}${groupId ? `&groupId=${groupId}` : ''}`),
    create: (data: any) => fetchApi('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi(`/sessions/${id}`),
    update: (id: string, data: any) => fetchApi(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    cancel: (id: string) => fetchApi(`/sessions/${id}/cancel`, { method: 'POST' }),
    undoHeld: (id: string) => fetchApi(`/sessions/${id}/undo-held`, { method: 'POST' }),
    reschedule: (id: string, data: any) => fetchApi(`/sessions/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
    setPlan: (sessionId: string, planId: string | null) => fetchApi(`/sessions/${sessionId}/plan`, { method: 'PUT', body: JSON.stringify({ planId }) }),
    getAttendance: (id: string) => fetchApi(`/sessions/${id}/attendance`),
    saveAttendance: (id: string, data: any) => fetchApi(`/sessions/${id}/attendance`, { method: 'PUT', body: JSON.stringify(data) })
  },
  plans: {
    list: (params: { q?: string; packId?: string; includeArchived?: boolean; cursor?: string; limit?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.q) q.set('q', params.q);
      if (params.packId) q.set('packId', params.packId);
      if (params.includeArchived) q.set('includeArchived', 'true');
      if (params.cursor) q.set('cursor', params.cursor);
      if (params.limit) q.set('limit', String(params.limit));
      const str = q.toString();
      return fetchApi(`/plans${str ? `?${str}` : ''}`);
    },
    get: (id: string) => fetchApi(`/plans/${id}`),
    create: (data: { title: string; packId?: string; content?: Record<string, any> }) => fetchApi('/plans', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { title?: string; content?: Record<string, any> }) => fetchApi(`/plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    duplicate: (id: string) => fetchApi(`/plans/${id}/duplicate`, { method: 'POST' }),
    archive: (id: string) => fetchApi(`/plans/${id}/archive`, { method: 'POST' }),
    restore: (id: string) => fetchApi(`/plans/${id}/restore`, { method: 'POST' })
  },
  notes: {
    list: (params: { learnerId?: string; groupId?: string; sessionId?: string; cursor?: string; limit?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.learnerId) q.set('learnerId', params.learnerId);
      if (params.groupId) q.set('groupId', params.groupId);
      if (params.sessionId) q.set('sessionId', params.sessionId);
      if (params.cursor) q.set('cursor', params.cursor);
      if (params.limit) q.set('limit', String(params.limit));
      const str = q.toString();
      return fetchApi(`/notes${str ? `?${str}` : ''}`);
    },
    get: (id: string) => fetchApi(`/notes/${id}`),
    create: (data: { body: string; sessionId?: string | null; groupId?: string | null; learnerId?: string | null }) => fetchApi('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { body: string }) => fetchApi(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/notes/${id}`, { method: 'DELETE' })
  },
  schedule: {
    topUp: (localToday: string) => fetchApi('/schedule/top-up', { method: 'POST', body: JSON.stringify({ localToday }) })
  },
  scheduleRules: {
    update: (id: string, data: any) => fetchApi(`/schedule-rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    archive: (id: string) => fetchApi(`/schedule-rules/${id}`, { method: 'DELETE' })
  }
};
