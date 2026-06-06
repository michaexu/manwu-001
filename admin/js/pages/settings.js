/**
 * 系统设置页面
 * 管理员信息 + 操作日志 + 系统配置
 */
import { api } from '../api.js';
import { formatNumber, formatDate, showToast, getUser } from '../app.js';

let logPage = 1;

export async function render(container) {
  const user = getUser();

  container.innerHTML = `
    <div class="settings-grid">
      <!-- 管理员信息 -->
      <div class="card">
        <div class="card-header"><h3>管理员信息</h3></div>
        <div class="card-body">
          <div class="settings-item">
            <span class="settings-item-label">昵称</span>
            <span class="settings-item-value">${escapeHtml(user?.nick_name || '-')}</span>
          </div>
          <div class="settings-item">
            <span class="settings-item-label">手机号</span>
            <span class="settings-item-value mono">${user?.phone || '-'}</span>
          </div>
          <div class="settings-item">
            <span class="settings-item-label">角色</span>
            <span class="settings-item-value"><span class="badge badge-danger">超级管理员</span></span>
          </div>
          <div class="settings-item">
            <span class="settings-item-label">注册时间</span>
            <span class="settings-item-value">${formatDate(user?.created_at)}</span>
          </div>
        </div>
      </div>

      <!-- 系统配置 -->
      <div class="card">
        <div class="card-header"><h3>系统配置</h3></div>
        <div class="card-body">
          <div class="settings-item">
            <span class="settings-item-label">广告奖励积分</span>
            <span class="settings-item-value">20 积分/次</span>
          </div>
          <div class="settings-item">
            <span class="settings-item-label">每日广告上限</span>
            <span class="settings-item-value">5 次</span>
          </div>
          <div class="settings-item">
            <span class="settings-item-label">签到基础积分</span>
            <span class="settings-item-value">5 积分</span>
          </div>
          <div class="settings-item">
            <span class="settings-item-label">连续签到额外奖励</span>
            <span class="settings-item-value">第7天 +15 积分</span>
          </div>
          <div class="settings-item">
            <span class="settings-item-label">API版本</span>
            <span class="settings-item-value mono">v1</span>
          </div>
        </div>
      </div>

      <!-- 快捷统计 -->
      <div class="card">
        <div class="card-header"><h3>今日统计</h3></div>
        <div class="card-body" id="todayStats">
          <div class="loading-state"><div class="loading-spinner"></div>加载中...</div>
        </div>
      </div>

      <!-- 操作日志 -->
      <div class="card" style="grid-column: 1 / -1;">
        <div class="card-header">
          <h3>操作日志</h3>
          <button class="btn btn-sm btn-outline" onclick="window._refreshLogs()">刷新</button>
        </div>
        <div class="card-body">
          <div id="logList">
            <div class="loading-state"><div class="loading-spinner"></div>加载中...</div>
          </div>
          <div id="logPagination" class="pagination"></div>
        </div>
      </div>
    </div>
  `;

  loadTodayStats();
  loadLogs();
}

async function loadTodayStats() {
  const container = document.getElementById('todayStats');
  if (!container) return;

  try {
    const { data } = await api.get('/admin/dashboard');
    const ov = data?.overview;
    if (!ov) throw new Error('无数据');

    container.innerHTML = `
      <div class="settings-item">
        <span class="settings-item-label">今日新增用户</span>
        <span class="settings-item-value" style="color:#10B981;font-weight:600;">+${ov.new_users_today || 0}</span>
      </div>
      <div class="settings-item">
        <span class="settings-item-label">今日兑换</span>
        <span class="settings-item-value">${formatNumber(ov.redeems_today || 0)}</span>
      </div>
      <div class="settings-item">
        <span class="settings-item-label">今日签到</span>
        <span class="settings-item-value">${formatNumber(ov.checkins_today || 0)}</span>
      </div>
      <div class="settings-item">
        <span class="settings-item-label">今日广告观看</span>
        <span class="settings-item-value">${formatNumber(ov.ad_views_today || 0)}</span>
      </div>
      <div class="settings-item">
        <span class="settings-item-label">今日消耗积分</span>
        <span class="settings-item-value" style="color:#EF4444;">${formatNumber(ov.points_spent_today || 0)}</span>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>加载失败</p></div>`;
  }
}

async function loadLogs() {
  const container = document.getElementById('logList');
  if (!container) return;

  try {
    const { data } = await api.get('/admin/logs', { page: logPage, page_size: 15 });
    const logs = data.logs || [];
    const total = data.total || 0;

    if (logs.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无操作记录</p></div>';
      document.getElementById('logPagination').innerHTML = '';
      return;
    }

    container.innerHTML = `<div class="log-list">${logs.map(log => renderLogItem(log)).join('')}</div>`;
    renderLogPagination(total);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>加载失败</p><span>${err.message}</span></div>`;
  }
}

function renderLogItem(log) {
  const actionMap = {
    assign_vip: { label: '分配VIP', cls: 'assign', icon: '👑' },
    revoke_vip: { label: '回收VIP', cls: 'revoke', icon: '🗑' },
    adjust_points: { label: '调整积分', cls: 'points', icon: '💰' }
  };

  const action = actionMap[log.action] || { label: log.action, cls: '', icon: '📝' };
  let detail = '';
  try {
    const d = JSON.parse(log.detail || '{}');
    if (log.action === 'assign_vip') detail = `设置 VIP ${d.new_level}，配额 ${d.monthly_quota}/月`;
    else if (log.action === 'revoke_vip') detail = `从 VIP ${d.previous_level} 回收`;
    else if (log.action === 'adjust_points') detail = `${d.change > 0 ? '+' : ''}${d.change} 积分 → ${d.new_points}`;
    else detail = log.detail || '';
  } catch { detail = log.detail || ''; }

  return `
    <div class="log-item">
      <div class="log-icon ${action.cls}">${action.icon}</div>
      <div class="log-content">
        <div class="log-action">${action.label}${log.target_name ? ` — ${escapeHtml(log.target_name)}` : ''}</div>
        <div class="log-detail">${escapeHtml(detail)}</div>
        <div class="log-time">${formatDate(log.created_at)}</div>
      </div>
    </div>
  `;
}

function renderLogPagination(total) {
  const container = document.getElementById('logPagination');
  if (!container) return;

  const totalPages = Math.ceil(total / 15);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="pagination-btn" ${logPage === 1 ? 'disabled' : ''} onclick="window._logPage(${logPage - 1})">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn ${i === logPage ? 'active' : ''}" onclick="window._logPage(${i})">${i}</button>`;
  }
  html += `<button class="pagination-btn" ${logPage === totalPages ? 'disabled' : ''} onclick="window._logPage(${logPage + 1})">›</button>`;
  container.innerHTML = html;
}

window._logPage = (page) => { logPage = page; loadLogs(); };
window._refreshLogs = () => { logPage = 1; loadLogs(); };

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
