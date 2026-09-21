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
