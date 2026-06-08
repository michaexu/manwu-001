/**
 * 商家后台管理系统 — 主应用控制器
 * 路由、认证、模态框、Toast、工具函数
 */
import { api, ApiError } from './api.js';
import { login, logout, getUser, isLoggedIn } from './auth.js';
import * as Dashboard from './pages/dashboard.js';
import * as Activities from './pages/activities.js';
import * as Members from './pages/members.js';
import * as Redemptions from './pages/redemptions.js';
import * as Points from './pages/points.js';
import * as Settings from './pages/settings.js';
import * as Merchants from './pages/merchants.js';

// ========== Page Map ==========
const pages = {
  dashboard:   { title: '数据概览', render: Dashboard.render },
  activities:  { title: '活动管理', render: Activities.render },
  members:     { title: '会员管理', render: Members.render },
  redemptions: { title: '核销记录', render: Redemptions.render },
  points:      { title: '积分管理', render: Points.render },
  merchants:   { title: '商家管理', render: Merchants.render },
  settings:    { title: '系统设置', render: Settings.render }
};

const defaultPage = 'dashboard';

// ========== Init ==========
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initNavigation();
  initLogout();
  updateClock();
  setInterval(updateClock, 30000);

  // Listen for auth logout events
  window.addEventListener('auth:logout', () => {
    showLoginOverlay();
  });

  // Check if already logged in
  if (isLoggedIn()) {
    showApp();
  }
});

// ========== Login ==========
function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('loginError');

    if (!phone || !password) {
      showLoginError('请输入手机号和密码');
      return;
    }

    btn.disabled = true;
    btn.textContent = '登录中...';
    errorEl.style.display = 'none';

    try {
      await login(phone, password);
      showApp();
    } catch (err) {
      showLoginError(err.message || '登录失败');
      btn.disabled = false;
      btn.textContent = '登 录';
    }
  });
}

function showLoginError(msg) {
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

function showLoginOverlay() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginBtn').disabled = false;
  document.getElementById('loginBtn').textContent = '登 录';
  document.getElementById('loginError').style.display = 'none';
}

function showApp() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  const user = getUser();
  if (user) {
    document.getElementById('sidebarName').textContent = user.nickName || user.phone || '管理员';
    document.getElementById('sidebarAvatar').textContent = (user.nickName || '管')[0];
  }

  // Navigate to current hash or default
  const hash = location.hash.replace('#', '') || defaultPage;
  navigateTo(hash);
}

// ========== Navigation ==========
function initNavigation() {
  // Sidebar nav clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        location.hash = page;
        navigateTo(page);
      }
    });
  });

  // Hash change
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '') || defaultPage;
    navigateTo(hash);
  });
}

async function navigateTo(pageName) {
  const page = pages[pageName];
  if (!page) {
    navigateTo(defaultPage);
    return;
  }

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  // Update title
  document.getElementById('pageTitle').textContent = page.title;
  document.title = `${page.title} - 商家后台管理`;

  // Render page
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div>加载中...</div>';

  try {
    await page.render(contentArea);
  } catch (err) {
    contentArea.innerHTML = `<div class="empty-state"><p>页面加载失败</p><span>${err.message}</span></div>`;
  }
}

// ========== Logout ==========
function initLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    logout();
    showLoginOverlay();
    location.hash = '';
  });
}

// ========== Clock ==========
function updateClock() {
  const el = document.getElementById('topbarTime');
  if (!el) return;
  const now = new Date();
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  el.textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${days[now.getDay()]} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

// ========== Modal ==========
export function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalOverlay').style.display = 'flex';
}

export function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});

// ========== Toast ==========
export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

// ========== Utility Functions ==========
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  const n = Number(num);
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return n.toLocaleString('zh-CN');
  return String(n);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export { getUser };
