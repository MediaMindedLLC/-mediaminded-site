/* MediaMinded.ai - Shared JS */

const API_BASE = '/api';

// Auth helpers
function getToken() {
  return localStorage.getItem('mm_token');
}

function getUser() {
  const raw = localStorage.getItem('mm_user');
  return raw ? JSON.parse(raw) : null;
}

function getPartnerId() {
  return localStorage.getItem('mm_partner_id');
}

function setAuth(token, user, partnerId) {
  localStorage.setItem('mm_token', token);
  localStorage.setItem('mm_user', JSON.stringify(user));
  if (partnerId) localStorage.setItem('mm_partner_id', partnerId);
}

function clearAuth() {
  localStorage.removeItem('mm_token');
  localStorage.removeItem('mm_user');
  localStorage.removeItem('mm_partner_id');
}

function logout() {
  clearAuth();
  window.location.href = '/portal/';
}

function requireAuth(allowedRoles) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = '/portal/';
    return false;
  }
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      window.location.href = '/portal/';
      return false;
    }
  }
  return true;
}

// API fetch wrapper
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/portal/';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || res.statusText);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Format helpers
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatCurrency(val) {
  if (val == null) return '$0';
  return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatNumber(val) {
  if (val == null) return '0';
  return Number(val).toLocaleString('en-US');
}

function formatPercent(val) {
  if (val == null) return '0%';
  return Number(val).toFixed(1) + '%';
}

function statusBadge(status) {
  const map = {
    active: 'success', completed: 'success', signed: 'success', converted: 'success',
    pending: 'warning', processing: 'warning', in_progress: 'warning', called: 'warning',
    failed: 'danger', error: 'danger', churned: 'danger',
    new: 'info', interested: 'info', prospect: 'info',
    idle: 'neutral', uploaded: 'neutral',
  };
  const variant = map[(status || '').toLowerCase()] || 'neutral';
  return `<span class="badge badge-${variant}">${status || 'Unknown'}</span>`;
}

// DOM helpers
function $(sel, parent) {
  return (parent || document).querySelector(sel);
}

function $$(sel, parent) {
  return [...(parent || document).querySelectorAll(sel)];
}

function showAlert(container, message, type = 'error') {
  const el = document.createElement('div');
  el.className = `alert alert-${type}`;
  el.textContent = message;
  container.prepend(el);
  setTimeout(() => el.remove(), 5000);
}
