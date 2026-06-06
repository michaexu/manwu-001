/**
 * 核销记录页面
 * 全量核销历史 + 搜索/日期筛选 + 状态统计
 */
import { api } from '../api.js';
import { formatNumber, formatDate, showToast } from '../app.js';

let currentPage = 1;
let currentStatus = '';
let currentKeyword = '';
const pageSize = 20;

export async function render(container) {
  container.innerHTML = `
    <!-- Stats Bar -->
    <div class="kpi-grid" id="redemptionStats">
      <div class="kpi-card">
        <div class="kpi-label">今日核销</div>
        <div class="kpi-value" id="statToday">-</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">本月核销</div>
        <div class="kpi-value" id="statMonth">-</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">累计核销</div>
        <div class="kpi-value" id="statTotal">-</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">消耗积分（累计）</div>
        <div class="kpi-value" id="statPoints">-</div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <input type="text" class="search-input" id="redemptionSearch" placeholder="搜索用户手机号 / 活动名称...">
      <select id="redemptionStatusFilter">
        <option value="">全部状态</option>
        <option value="confirmed">已核销</option>
        <option value="pending">待核销</option>
        <option value="cancelled">已取消</option>
      </select>
      <input type="date" class="date-input" id="redemptionDateStart" title="开始日期">
      <span style="color:var(--color-text-secondary);font-size:13px;">至</span>
      <input type="date" class="date-input" id="redemptionDateEnd" title="结束日期">
      <div class="toolbar-spacer"></div>
      <span class="results-count" id="redemptionCount"></span>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>兑换码</th>
              <th>用户</th>
              <th>活动名称</th>
              <th>类型</th>
              <th>消耗积分</th>
              <th>状态</th>
              <th>核销时间</th>
              <th>核销商家</th>
            </tr>
          </thead>
          <tbody id="redemptionTableBody">
            <tr><td colspan="8"><div class="loading-state"><div class="loading-spinner"></div>加载中...</div></td></tr>
          </tbody>
        </table>
      </div>
      <div id="redemptionPagination" class="pagination"></div>
    </div>
  `;

  // Bind events
  document.getElementById('redemptionSearch').addEventListener('input', debounce(onSearch, 400));
  document.getElementById('redemptionStatusFilter').addEventListener('change', onFilterChange);
  document.getElementById('redemptionDateStart').addEventListener('change', onFilterChange);
  document.getElementById('redemptionDateEnd').addEventListener('change', onFilterChange);

  await Promise.all([
    loadStats(),
    loadRedemptions()
  ]);
}

// ---- Load Stats ----
async function loadStats() {
  try {
    const res = await api.get('/admin/dashboard');
    const d = res.data || {};
    const el = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    el('statToday', formatNumber(d.today_redemptions ?? d.todayRedemptions ?? '-'));
    el('statMonth', formatNumber(d.month_redemptions ?? d.monthRedemptions ?? '-'));
    el('statTotal', formatNumber(d.total_redemptions ?? d.totalRedemptions ?? '-'));
    el('statPoints', formatNumber(d.total_points_spent ?? d.totalPointsSpent ?? '-'));
  } catch (e) {
    // Non-critical; ignore
  }
}

// ---- Load Redemptions ----
async function loadRedemptions() {
  const body = document.getElementById('redemptionTableBody');
  if (!body) return;

  const params = new URLSearchParams({
    page: currentPage,
    page_size: pageSize,
  });
  if (currentStatus) params.set('status', currentStatus);
  if (currentKeyword) params.set('keyword', currentKeyword);
  const dateStart = document.getElementById('redemptionDateStart')?.value;
  const dateEnd = document.getElementById('redemptionDateEnd')?.value;
  if (dateStart) params.set('date_start', dateStart);
  if (dateEnd) params.set('date_end', dateEnd);

  body.innerHTML = '<tr><td colspan="8"><div class="loading-state"><div class="loading-spinner"></div>加载中...</div></td></tr>';

  try {
    // 优先尝试 admin 全量核销记录，fallback 到 scan/history
    let res;
    try {
      res = await api.get(`/admin/redemptions?${params}`);
    } catch {
      res = await api.get(`/scan/history?${params}`);
    }

    const { items = [], total = 0, page = 1, total_pages = 1 } = res.data || {};

    const countEl = document.getElementById('redemptionCount');
    if (countEl) countEl.textContent = `共 ${total} 条记录`;

    if (items.length === 0) {
      body.innerHTML = '<tr><td colspan="8"><div class="empty-state"><p>暂无核销记录</p></td></div></td></tr>';
    } else {
      body.innerHTML = items.map(r => `
        <tr>
          <td><code class="code-mono">${(r.code || r.redemption_code || '-').slice(0, 8)}...</code></td>
          <td>
            <div class="user-cell">
              <div class="user-mini-avatar">${getInitial(r.user_name || r.phone || 'U')}</div>
              <div>
                <div class="user-cell-name">${r.user_name || r.nick_name || '未知用户'}</div>
                <div class="user-cell-sub">${r.phone || ''}</div>
              </div>
            </div>
          </td>
          <td>${r.activity_name || '-'}</td>
          <td>${renderTypeTag(r.type || r.redemption_type)}</td>
          <td><strong style="color:#DC2626">${r.points_cost ?? r.points ?? 0}</strong></td>
          <td>${renderStatusBadge(r.status)}</td>
          <td>${formatDate(r.confirmed_at || r.created_at)}</td>
          <td>${r.merchant_name || r.confirmed_by_name || '-'}</td>
        </tr>
      `).join('');
    }

    renderPagination(
      document.getElementById('redemptionPagination'),
      currentPage,
      total_pages,
      (p) => { currentPage = p; loadRedemptions(); }
    );
  } catch (err) {
    body.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>加载失败</p><span>${err.message}</span></div></td></tr>`;
    showToast(err.message, 'error');
  }
}

// ---- Events ----
function onSearch(e) {
  currentKeyword = e.target.value.trim();
  currentPage = 1;
  loadRedemptions();
}

function onFilterChange() {
  currentStatus = document.getElementById('redemptionStatusFilter')?.value || '';
  currentPage = 1;
  loadRedemptions();
}

// ---- Helpers ----
function getInitial(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function renderTypeTag(type) {
  const map = {
    vip_free: '<span class="badge badge-blue">VIP免费</span>',
    points: '<span class="badge badge-orange">积分兑换</span>',
    points_redemption: '<span class="badge badge-orange">积分兑换</span>',
  };
  return map[type] || `<span class="badge badge-gray">${type || '-'}</span>`;
}

function renderStatusBadge(status) {
  const map = {
    confirmed: '<span class="badge badge-green">已核销</span>',
    pending: '<span class="badge badge-orange">待核销</span>',
    cancelled: '<span class="badge badge-gray">已取消</span>',
  };
  return map[status] || `<span class="badge badge-gray">${status || '-'}</span>`;
}

function renderPagination(container, current, total, onPage) {
  if (!container || total <= 1) {
    if (container) container.innerHTML = '';
    return;
  }
  const pages = [];
  for (let i = 1; i <= total; i++) pages.push(i);

  container.innerHTML = pages.map(p => `
    <button class="page-btn ${p === current ? 'active' : ''}" data-page="${p}">${p}</button>
  `).join('');

  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => onPage(parseInt(btn.dataset.page)));
  });
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
