const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(
  /\/+$/,
  '',
);
let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;
async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (csrfRequest) return csrfRequest;
  csrfRequest = (async () => {
    const response = await fetch(`${API_URL}/auth/csrf`, { credentials: 'include' });
    if (!response.ok) throw new ApiError('Unable to initialize a secure session', response.status);
    const data = await response.json();
    if (!data.csrfToken) throw new Error('The server did not return a CSRF token');
    csrfToken = data.csrfToken;
    return data.csrfToken as string;
  })().finally(() => {
    csrfRequest = null;
  });
  return csrfRequest;
}

export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCsrf = true,
): Promise<T> {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase()))
    headers.set('X-CSRF-Token', await getCsrfToken());

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include session cookies for auth
    headers,
  });

  const data = await response.json().catch(() => ({}));

  const csrfRejected =
    response.status === 403 && data?.error?.message === 'A valid X-CSRF-Token header is required';
  if (csrfRejected || response.status === 401) csrfToken = null;
  if (csrfRejected && retryCsrf) return apiClient<T>(endpoint, options, false);
  if (response.ok && data.csrfToken) csrfToken = data.csrfToken;
  if (response.ok && endpoint === '/auth/logout') csrfToken = null;

  if (!response.ok) {
    throw new ApiError(
      data?.error?.message || data?.message || `Request failed with status ${response.status}`,
      response.status,
      data?.error?.details,
    );
  }

  return data;
}
