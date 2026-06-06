/**
 * 活动管理页面
 * 活动列表 + 搜索筛选 + 状态管理
 */
import { api } from '../api.js';
import { formatNumber, formatDate, showToast, openModal, closeModal } from '../app.js';

let currentPage = 1;
let currentStatus = '';
let currentKeyword = '';

export async function render(container) {
  container.innerHTML = `
    <!-- Toolbar -->
    <div class="toolbar">
      <input type="text" class="search-input" id="activitySearch" placeholder="搜索活动名称...">
      <select id="activityStatusFilter">
        <option value="">全部状态</option>
        <option value="active">进行中</option>
        <option value="paused">已暂停</option>
        <option value="ended">已结束</option>
      </select>
      <span class="results-count" id="activityCount"></span>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>活动名称</th>
              <th>所需积分</th>
              <th>VIP名额</th>
              <th>普通名额</th>
              <th>已兑换</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="activityTableBody">
            <tr><td colspan="8"><div class="loading-state"><div class="loading-spinner"></div>加载中...</div></td></tr>
          </tbody>
        </table>
      </div>
      <div id="activityPagination" class="pagination"></div>
    </div>
  `;

  // Bind events
  document.getElementById('activitySearch').addEventListener('input', debounce(onSearch, 400));
  document.getElementById('activityStatusFilter').addEventListener('change', onFilterChange);

  await loadActivities();
}

async function loadActivities() {
  const body = document.getElementById('activityTableBody');
  if (!body) return;

  body.innerHTML = '<tr><td colspan="8"><div class="loading-state"><div class="loading-spinner"></div>加载中...</div></td></tr>';

  try {
    const params = { page: currentPage, page_size: 15 };
    if (currentStatus) params.status = currentStatus;
    if (currentKeyword) params.keyword = currentKeyword;

    // Use merchant endpoint for activity list
    const { data } = await api.get('/merchant/activities', params);
    const activities = data.activities || data || [];
    const total = data.total || activities.length;

    document.getElementById('activityCount').textContent = `共 ${total} 个活动`;

    if (activities.length === 0) {
      body.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>暂无活动数据</p></div></td></tr>`;
      document.getElementById('activityPagination').innerHTML = '';
      return;
    }

    body.innerHTML = activities.map(a => `
      <tr>
        <td style="font-weight:600;">${escapeHtml(a.title)}</td>
        <td>${formatNumber(a.points_required)}</td>
        <td>${a.vip_quota || 0}</td>
        <td>${a.regular_quota || 0}</td>
        <td>${a.total_redeems || 0}</td>
        <td>${renderStatusBadge(a.status)}</td>
        <td style="color:#64748B;font-size:13px;">${formatDate(a.created_at)}</td>
        <td>
          <div class="table-actions">
            ${a.status === 'active' ? `<button class="btn btn-sm btn-outline" onclick="window._pauseActivity('${a.id}')">暂停</button>` : ''}
            ${a.status === 'paused' ? `<button class="btn btn-sm btn-outline" onclick="window._activateActivity('${a.id}')">恢复</button>` : ''}
            ${a.status !== 'ended' ? `<button class="btn btn-sm btn-outline" onclick="window._endActivity('${a.id}')">结束</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    renderPagination(total);
  } catch (err) {
    body.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>加载失败</p><span>${err.message}</span></div></td></tr>`;
  }
}

function renderStatusBadge(status) {
  const map = {
    active: '<span class="badge badge-success">进行中</span>',
    paused: '<span class="badge badge-warning">已暂停</span>',
    ended: '<span class="badge badge-neutral">已结束</span>'
  };
  return map[status] || `<span class="badge badge-neutral">${status}</span>`;
}

function renderPagination(total) {
  const container = document.getElementById('activityPagination');
  if (!container) return;
  const totalPages = Math.ceil(total / 15);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window._activityPage(${currentPage - 1})">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="window._activityPage(${i})">${i}</button>`;
  }
  html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window._activityPage(${currentPage + 1})">›</button>`;
  container.innerHTML = html;
}

// Global handlers
window._activityPage = (page) => { currentPage = page; loadActivities(); };
window._pauseActivity = async (id) => {
  try { await api.put(`/merchant/activities/${id}/status`, { status: 'paused' }); showToast('活动已暂停', 'success'); loadActivities(); }
  catch (err) { showToast(err.message, 'error'); }
};
window._activateActivity = async (id) => {
  try { await api.put(`/merchant/activities/${id}/status`, { status: 'active' }); showToast('活动已恢复', 'success'); loadActivities(); }
  catch (err) { showToast(err.message, 'error'); }
};
window._endActivity = async (id) => {
  try { await api.put(`/merchant/activities/${id}/status`, { status: 'ended' }); showToast('活动已结束', 'success'); loadActivities(); }
  catch (err) { showToast(err.message, 'error'); }
};

function onSearch() {
  currentKeyword = document.getElementById('activitySearch').value.trim();
  currentPage = 1;
  loadActivities();
}

function onFilterChange() {
  currentStatus = document.getElementById('activityStatusFilter').value;
  currentPage = 1;
  loadActivities();
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
