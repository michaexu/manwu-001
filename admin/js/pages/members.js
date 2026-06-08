/**
 * 会员管理页面
 * 用户列表 + 搜索筛选 + VIP分配/回收 + 积分调整
 */
import { api } from '../api.js';
import { formatNumber, formatDate, showToast, openModal, closeModal } from '../app.js';

let currentPage = 1;
let currentKeyword = '';
let currentRole = '';
let currentVipLevel = '';
let pageSize = 20;

export async function render(container) {
  container.innerHTML = `
    <!-- Toolbar -->
    <div class="toolbar">
      <input type="text" class="search-input" id="memberSearch" placeholder="搜索手机号/昵称...">
      <select id="memberRoleFilter">
        <option value="">全部角色</option>
        <option value="user">普通用户</option>
        <option value="merchant">商家</option>
        <option value="admin">管理员</option>
      </select>
      <select id="memberVipFilter">
        <option value="">全部VIP等级</option>
        <option value="0">非VIP</option>
        <option value="1">VIP 1</option>
        <option value="2">VIP 2</option>
        <option value="3">VIP 3</option>
        <option value="5">VIP 5</option>
        <option value="10">VIP 10</option>
      </select>
      <div class="toolbar-spacer"></div>
      <span class="results-count" id="memberCount"></span>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>手机号</th>
              <th>角色</th>
              <th>VIP等级</th>
              <th>VIP配额</th>
              <th>积分</th>
              <th>累计积分</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="memberTableBody">
            <tr><td colspan="9"><div class="loading-state"><div class="loading-spinner"></div>加载中...</div></td></tr>
          </tbody>
        </table>
      </div>
      <div id="memberPagination" class="pagination"></div>
    </div>
  `;

  // Bind events
  document.getElementById('memberSearch').addEventListener('input', debounce(onSearch, 400));
  document.getElementById('memberRoleFilter').addEventListener('change', onFilterChange);
  document.getElementById('memberVipFilter').addEventListener('change', onFilterChange);

  await loadMembers();
}

async function loadMembers() {
  const body = document.getElementById('memberTableBody');
  if (!body) return;

  body.innerHTML = '<tr><td colspan="9"><div class="loading-state"><div class="loading-spinner"></div>加载中...</div></td></tr>';

  try {
    const params = { page: currentPage, page_size: pageSize };
    if (currentKeyword) params.keyword = currentKeyword;
    if (currentRole) params.role = currentRole;
    if (currentVipLevel !== '') params.vip_level = currentVipLevel;

    const { data } = await api.get('/admin/users', params);
    const users = data.users || [];
    const total = data.total || 0;

    document.getElementById('memberCount').textContent = `共 ${total} 人`;

    if (users.length === 0) {
      body.innerHTML = `<tr><td colspan="9"><div class="empty-state"><p>暂无用户数据</p></div></td></tr>`;
      document.getElementById('memberPagination').innerHTML = '';
      return;
    }

    body.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:8px;background:${getAvatarColor(u.nick_name)};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;flex-shrink:0;">${(u.nick_name || '?')[0]}</div>
            <span style="font-weight:600;">${escapeHtml(u.nick_name || '未设置')}</span>
          </div>
        </td>
        <td style="font-family:monospace;">${u.phone || '-'}</td>
        <td>${renderRoleBadge(u.role)}</td>
        <td>${u.vip_level > 0 ? `<span class="badge badge-warning">VIP ${u.vip_level}</span>` : '<span class="badge badge-neutral">普通</span>'}</td>
        <td>${u.vip_level > 0 ? `${u.vip_monthly_used || 0}/${u.vip_monthly_quota || 0}` : '-'}</td>
        <td style="font-weight:600;">${formatNumber(u.points)}</td>
        <td style="color:#64748B;">${formatNumber(u.total_points_earned)}</td>
        <td style="color:#64748B;font-size:13px;">${formatDate(u.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="window._viewDetail('${u.id}')">详情</button>
            <button class="btn btn-sm btn-primary" onclick="window._assignVip('${u.id}')">VIP</button>
            <button class="btn btn-sm btn-outline" onclick="window._adjustPoints('${u.id}')">积分</button>
            <button class="btn btn-sm btn-outline" onclick="window._resetPwd('${u.id}')">改密</button>
            ${u.vip_level > 0 ? `<button class="btn btn-sm btn-outline" style="color:#EF4444;" onclick="window._revokeVip('${u.id}')">回收</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    renderPagination(total);
  } catch (err) {
    body.innerHTML = `<tr><td colspan="9"><div class="empty-state"><p>加载失败</p><span>${err.message}</span></div></td></tr>`;
  }
}

function renderRoleBadge(role) {
  const map = {
    user: '<span class="badge badge-neutral">用户</span>',
    merchant: '<span class="badge badge-info">商家</span>',
    admin: '<span class="badge badge-danger">管理员</span>'
  };
  return map[role] || `<span class="badge badge-neutral">${role}</span>`;
}

function renderPagination(total) {
  const container = document.getElementById('memberPagination');
  if (!container) return;
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window._memberPage(${currentPage - 1})">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="window._memberPage(${i})">${i}</button>`;
  }
  html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window._memberPage(${currentPage + 1})">›</button>`;
  container.innerHTML = html;
}

// ====== Global Handlers ======
window._memberPage = (page) => { currentPage = page; loadMembers(); };

window._assignVip = (userId) => {
  openModal('分配VIP', `
    <form id="vipForm" onsubmit="return window._submitVip(event, '${userId}')">
      <div class="form-group">
        <label>VIP等级 (1-10)</label>
        <select id="vipLevel" required>
          <option value="1">VIP 1</option>
          <option value="2">VIP 2</option>
          <option value="3">VIP 3</option>
          <option value="5" selected>VIP 5</option>
          <option value="10">VIP 10</option>
        </select>
      </div>
      <div class="form-group">
        <label>月度免费兑换配额</label>
        <input type="number" id="vipQuota" value="30" min="0" required>
      </div>
      <div class="form-group">
        <label>备注（选填）</label>
        <input type="text" id="vipReason" placeholder="分配原因" maxlength="200">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
        <button type="submit" class="btn btn-primary">确认分配</button>
      </div>
    </form>
  `);
};

window._submitVip = async (event, userId) => {
  event.preventDefault();
  try {
    await api.post('/admin/vip/assign', {
      userId,
      vipLevel: parseInt(document.getElementById('vipLevel').value),
      monthlyQuota: parseInt(document.getElementById('vipQuota').value),
      reason: document.getElementById('vipReason').value
    });
    closeModal();
    showToast('VIP分配成功', 'success');
    loadMembers();
  } catch (err) { showToast(err.message, 'error'); }
  return false;
};

window._revokeVip = (userId) => {
  openModal('回收VIP', `
    <p style="color:#64748B;margin-bottom:20px;">确认回收该用户的VIP权益？此操作将清除VIP等级和配额。</p>
    <div class="form-group">
      <label>回收原因（选填）</label>
      <input type="text" id="revokeReason" placeholder="回收原因" maxlength="200">
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">取消</button>
      <button class="btn btn-danger" id="confirmRevoke">确认回收</button>
    </div>
  `);
  document.getElementById('confirmRevoke').onclick = async () => {
    try {
      await api.post('/admin/vip/revoke', {
        userId,
        reason: document.getElementById('revokeReason').value
      });
      closeModal();
      showToast('VIP已回收', 'success');
      loadMembers();
    } catch (err) { showToast(err.message, 'error'); }
  };
};

window._adjustPoints = (userId) => {
  openModal('调整积分', `
    <form id="pointsForm" onsubmit="return window._submitPoints(event, '${userId}')">
      <div class="form-group">
        <label>积分变化（正数赠送，负数扣除）</label>
        <input type="number" id="pointsChange" required placeholder="如: 100 或 -50">
      </div>
      <div class="form-group">
        <label>调整原因</label>
        <textarea id="pointsReason" placeholder="请填写调整原因" maxlength="200"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
        <button type="submit" class="btn btn-primary">确认调整</button>
      </div>
    </form>
  `);
};

window._submitPoints = async (event, userId) => {
  event.preventDefault();
  try {
    await api.post('/admin/points/adjust', {
      userId,
      points: parseInt(document.getElementById('pointsChange').value),
      reason: document.getElementById('pointsReason').value
    });
    closeModal();
    showToast('积分调整成功', 'success');
    loadMembers();
  } catch (err) { showToast(err.message, 'error'); }
  return false;
};

window._viewDetail = async (userId) => {
  openModal('用户详情', `<div class="loading-state" style="text-align:center;padding:30px;"><div class="loading-spinner"></div>加载中...</div>`);
  try {
    const { data } = await api.get(`/admin/users/${userId}`);
    const u = data;
    const stat = u.stats || {};
    openModal('用户详情', `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:44px;height:44px;border-radius:10px;background:${getAvatarColor(u.nick_name)};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;">${(u.nick_name || '?')[0]}</div>
        <div>
          <div style="font-weight:700;font-size:16px;">${escapeHtml(u.nick_name || '未设置')}</div>
          <div style="font-size:13px;color:#64748B;">ID: ${u.id}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="form-group">
          <label>手机号</label>
          <div style="font-family:monospace;font-weight:600;">${u.phone || '-'}</div>
        </div>
        <div class="form-group">
          <label>角色</label>
          <div>${renderRoleBadge(u.role)}</div>
        </div>
        <div class="form-group">
          <label>VIP等级</label>
          <div>${u.vip_level > 0 ? `VIP ${u.vip_level}` : '非VIP'}</div>
        </div>
        <div class="form-group">
          <label>VIP月度配额</label>
          <div>${u.vip_level > 0 ? `${u.vip_monthly_used || 0} / ${u.vip_monthly_quota || 0}` : '-'}</div>
        </div>
        <div class="form-group">
          <label>当前积分</label>
          <div style="font-weight:600;color:#DC2626;">${formatNumber(u.points)}</div>
        </div>
        <div class="form-group">
          <label>累计获得积分</label>
          <div style="color:#64748B;">${formatNumber(u.total_points_earned)}</div>
        </div>
        <div class="form-group">
          <label>累计签到</label>
          <div>${stat.total_checkins || 0} 次</div>
        </div>
        <div class="form-group">
          <label>累计看广告</label>
          <div>${stat.total_ads || 0} 次</div>
        </div>
        <div class="form-group">
          <label>累计兑换</label>
          <div>${stat.total_redeems || 0} 次</div>
        </div>
        <div class="form-group">
          <label>累计消耗积分</label>
          <div>${formatNumber(stat.total_points_spent || 0)}</div>
        </div>
        <div class="form-group">
          <label>注册时间</label>
          <div style="font-size:13px;color:#64748B;">${formatDate(u.created_at)}</div>
        </div>
        <div class="form-group">
          <label>最近更新</label>
          <div style="font-size:13px;color:#64748B;">${formatDate(u.updated_at)}</div>
        </div>
        ${u.merchant_name ? `
        <div class="form-group">
          <label>关联商家</label>
          <div><span class="badge badge-info">${escapeHtml(u.merchant_name)}</span></div>
        </div>` : ''}
      </div>
      <div class="modal-actions" style="margin-top:20px;">
        <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
      </div>
    `);
  } catch (err) {
    openModal('用户详情', `<p>加载失败：${err.message}</p><div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">关闭</button></div>`);
  }
};

window._resetPwd = (userId) => {
  openModal('修改密码', `
    <form id="resetPwdForm" onsubmit="return window._submitResetPwd(event, '${userId}')">
      <div class="form-group">
        <label>新密码（至少6位）</label>
        <input type="text" id="newPassword" required minlength="6" maxlength="50" placeholder="输入新密码">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
        <button type="submit" class="btn btn-primary">确认修改</button>
      </div>
    </form>
  `);
};

window._submitResetPwd = async (event, userId) => {
  event.preventDefault();
  try {
    const newPassword = document.getElementById('newPassword').value.trim();
    if (newPassword.length < 6) { showToast('密码至少6位', 'error'); return false; }
    await api.put(`/admin/users/${userId}/reset-password`, { newPassword });
    closeModal();
    showToast('密码已重置', 'success');
  } catch (err) { showToast(err.message, 'error'); }
  return false;
};

// ====== Helpers ======
function getAvatarColor(name) {
  const colors = ['#DC2626','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4'];
  let hash = 0;
  for (let i = 0; i < (name || '?').length; i++) {
    hash = ((hash << 5) - hash) + (name || '?').charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

function onSearch() {
  currentKeyword = document.getElementById('memberSearch').value.trim();
  currentPage = 1;
  loadMembers();
}

function onFilterChange() {
  currentRole = document.getElementById('memberRoleFilter').value;
  currentVipLevel = document.getElementById('memberVipFilter').value;
  currentPage = 1;
  loadMembers();
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
