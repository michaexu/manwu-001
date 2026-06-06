/**
 * 认证模块 — 登录/登出/会话管理
 */
import { api } from './api.js';

export async function login(phone, password) {
  const res = await api.post('/auth/admin-login', { phone, password });
  if (res.success && res.data) {
    api.setTokens(res.data.access_token, res.data.refresh_token);
    // 存储管理员信息
    if (res.data.user) {
      localStorage.setItem('admin_user', JSON.stringify(res.data.user));
    }
    return res.data;
  }
  throw new Error('登录失败');
}

export function logout() {
  api.clearTokens();
  localStorage.removeItem('admin_user');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('admin_user'));
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!api.token;
}
