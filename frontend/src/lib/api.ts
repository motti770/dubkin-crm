const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokenStore = {
  get: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null,
  set: (t: string) => localStorage.setItem('crm_token', t),
  clear: () => localStorage.removeItem('crm_token'),
};

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    tokenStore.clear();
    window.location.href = '/login';
    throw new Error('Unauthenticated');
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client';
}

export const authApi = {
  login: async (username: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('שם משתמש או סיסמה שגויים');
    const data = await res.json();
    tokenStore.set(data.token);
    // Also set a cookie so Next.js middleware can check it
    document.cookie = `crm_token=${data.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
    return data;
  },
  me: () => fetchApi<{ user: AuthUser }>('/auth/me'),
  logout: () => {
    tokenStore.clear();
    document.cookie = 'crm_token=; path=/; max-age=0';
    window.location.href = '/login';
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Contact {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  source?: string;
  notes?: string;
  created_at: string;
}

export interface Deal {
  id: number;
  title: string;
  contact_id?: number;
  contact_name?: string;
  value?: number;
  stage: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  deal_id?: number;
  contact_id?: number;
  deal_title?: string;
  contact_name?: string;
  type: string;
  description: string;
  created_at: string;
}

export interface PipelineStage {
  stage: string;
  deals: Deal[];
}

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contactsApi = {
  list: (search?: string) =>
    fetchApi<{ data: Contact[]; total: number }>(
      `/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`
    ),
  create: (data: Partial<Contact>) =>
    fetchApi<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Contact>) =>
    fetchApi<Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/contacts/${id}`, { method: 'DELETE' }),
};

// ─── Deals ────────────────────────────────────────────────────────────────────
export const dealsApi = {
  list: () => fetchApi<{ data: Deal[]; total: number }>('/deals'),
  create: (data: Partial<Deal>) =>
    fetchApi<Deal>('/deals', { method: 'POST', body: JSON.stringify(data) }),
  updateStage: (id: number, stage: string) =>
    fetchApi<Deal>(`/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
};

// ─── Pipeline ─────────────────────────────────────────────────────────────────
export const pipelineApi = {
  get: () => fetchApi<PipelineStage[]>('/pipeline'),
};

// ─── Activities ───────────────────────────────────────────────────────────────
export const activitiesApi = {
  list: (dealId?: number) =>
    fetchApi<{ data: Activity[]; total: number }>(
      `/activities${dealId ? `?deal_id=${dealId}` : ''}`
    ),
  create: (data: { deal_id?: number; contact_id?: number; type: string; description: string }) =>
    fetchApi<Activity>('/activities', { method: 'POST', body: JSON.stringify(data) }),
};
