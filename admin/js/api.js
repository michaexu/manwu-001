/**
 * API 客户端 — 统一请求封装、Token管理、错误处理
 */
const API_BASE = '/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('admin_token') || '';
    this.refreshToken = localStorage.getItem('admin_refresh_token') || '';
  }

  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem('admin_token', token);
    if (refreshToken) localStorage.setItem('admin_refresh_token', refreshToken);
  }

  clearTokens() {
    this.token = '';
    this.refreshToken = '';
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
  }

  async request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let res;
    try {
      res = await fetch(url, {
        ...options,
        headers
      });
    } catch (err) {
      throw new ApiError('网络连接失败，请检查网络', -1);
    }

    // Handle 401 - try refresh
    if (res.status === 401 && this.refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: this.refreshToken })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          this.setTokens(refreshData.data.access_token, refreshData.data.refresh_token);
          headers['Authorization'] = `Bearer ${this.token}`;
          res = await fetch(url, { ...options, headers });
        } else {
          this.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:logout'));
          throw new ApiError('登录已过期，请重新登录', 401);
        }
      } catch {
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new ApiError('登录已过期，请重新登录', 401);
      }
    }

    if (res.status === 401) {
      this.clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw new ApiError('登录已过期，请重新登录', 401);
    }

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(data.message || '请求失败', res.status, data);
    }

    return data;
  }

  get(path, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    return this.request(`${path}${qs ? '?' + qs : ''}`);
  }

  post(path, body = {}) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(path, body = {}) {
    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  del(path) {
    return this.request(path, { method: 'DELETE' });
  }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const api = new ApiClient();
export { ApiError };
