import type { CartItem, Settings } from '@/types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('crepettoo_token');
}

function setToken(token: string) {
  localStorage.setItem('crepettoo_token', token);
}

function clearToken() {
  localStorage.removeItem('crepettoo_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent('crepettoo:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

async function upload<T>(path: string, body: Blob | ArrayBuffer, contentType: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': contentType };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: body as BodyInit, headers });
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent('crepettoo:unauthorized'));
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload,
  setToken,
  clearToken,
  getToken,
};

export function formatCurrency(amount: number, currency = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + currency;
}

export function formatDate(date: string | Date, lang = 'ar'): string {
  const d = new Date(date);
  const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return d.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatTime(date: string | Date, lang = 'ar'): string {
  const d = new Date(date);
  const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function generateOrderNumber(num: number): string {
  return `CRP-${String(num).padStart(4, '0')}`;
}

export function calcOrderTotals(items: CartItem[], _taxRate?: number) {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.menuItem.price * item.quantity - item.discount;
    return sum + Math.max(0, lineTotal);
  }, 0);
  const discountTotal = items.reduce((sum, item) => sum + item.discount, 0);
  const taxAmount = 0;
  const total = subtotal - discountTotal;
  return { subtotal, discountTotal, taxAmount, total };
}
