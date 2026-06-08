/**
 * 活动管理页面
 * 活动列表 + 搜索筛选 + 创建/编辑/删除 + 状态管理
 */
import { api } from '../api.js';
import { formatNumber, formatDate, showToast, openModal, closeModal, getUser } from '../app.js';

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
      <div class="toolbar-spacer"></div>
      <button class="btn btn-primary" id="btnCreateActivity">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        创建活动
      </button>
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

  document.getElementById('activitySearch').addEventListener('input', debounce(onSearch, 400));
  document.getElementById('activityStatusFilter').addEventListener('change', onFilterChange);
  document.getElementById('btnCreateActivity').addEventListener('click', () => openActivityForm());

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
            <button class="btn btn-sm btn-outline" onclick="window._editActivity('${a.id}')">编辑</button>
            ${a.status === 'active' ? `<button class="btn btn-sm btn-outline" onclick="window._pauseActivity('${a.id}')">暂停</button>` : ''}
            ${a.status === 'paused' ? `<button class="btn btn-sm btn-outline" onclick="window._activateActivity('${a.id}')">恢复</button>` : ''}
            ${a.status !== 'ended' ? `<button class="btn btn-sm btn-outline" onclick="window._endActivity('${a.id}')">结束</button>` : ''}
            <button class="btn btn-sm btn-outline" style="color:#EF4444;border-color:#FEE2E2;" onclick="window._deleteActivity('${a.id}')">删除</button>
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

// ========== Activity Form Modal ==========
async function openActivityForm(activity) {
  const isEdit = !!activity;
  const title = isEdit ? '编辑活动' : '创建活动';
  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  let merchantSelectorHtml = '';
  if (isAdmin && !isEdit) {
    let merchantOptions = '';
    try {
      const { data } = await api.get('/admin/merchants', { simple: 1 });
      if (data && data.length > 0) {
        merchantOptions = data.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
      }
    } catch (e) { /* ignore */ }
    merchantSelectorHtml = `
      <div class="form-group">
        <label>所属商家 *</label>
        <select name="merchant_id" required>${merchantOptions}</select>
      </div>`;
  }

  const formHtml = `
    <form id="activityForm">
      ${merchantSelectorHtml}
      <div class="form-group">
        <label>活动标题 *</label>
        <input type="text" name="title" value="${escapeHtml(activity?.title || '')}" required maxlength="100" placeholder="例如：新用户专享好礼">
      </div>
      <div class="form-group">
        <label>礼品名称 *</label>
        <input type="text" name="gift_name" value="${escapeHtml(activity?.gift_name || '')}" required maxlength="200" placeholder="例如：精美保温杯">
      </div>
      <div class="form-group">
        <label>所需积分 *</label>
        <input type="number" name="points_required" value="${activity?.points_required || ''}" required min="1" placeholder="兑换需要的积分数量">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="form-group">
          <label>VIP 名额</label>
          <input type="number" name="vip_quota" value="${activity?.vip_quota || 0}" min="0" placeholder="0 表示不限">
        </div>
        <div class="form-group">
          <label>普通名额</label>
          <input type="number" name="regular_quota" value="${activity?.regular_quota || 0}" min="0" placeholder="0 表示不限">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="form-group">
          <label>开始时间</label>
          <input type="date" name="start_time" value="${(activity && activity.start_time) ? formatDate(activity.start_time) : ''}">
        </div>
        <div class="form-group">
          <label>结束时间</label>
          <input type="date" name="end_time" value="${(activity && activity.end_time) ? formatDate(activity.end_time) : ''}">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="form-group">
          <label>图标 Emoji</label>
          <input type="text" name="emoji" value="${escapeHtml(activity?.emoji || '🎁')}" maxlength="10">
        </div>
        <div class="form-group">
          <label>主题色</label>
          <input type="color" name="color" value="${activity?.color || '#EC4899'}" style="height:40px;padding:4px;cursor:pointer;">
        </div>
      </div>
      <div class="form-group">
        <label>活动描述 *</label>
        <textarea name="description" required maxlength="500" placeholder="活动的详细描述...">${escapeHtml(activity?.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>礼品规格</label>
        <input type="text" name="gift_spec" value="${escapeHtml(activity?.gift_spec || '')}" maxlength="200" placeholder="例如：500ml / 304不锈钢">
      </div>
      <div class="form-group">
        <label>礼品描述</label>
        <textarea name="gift_description" maxlength="1000" placeholder="礼品的详细描述...">${escapeHtml(activity?.gift_description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>商家说明</label>
        <textarea name="merchant_description" maxlength="500" placeholder="商家备注信息...">${escapeHtml(activity?.merchant_description || '')}</textarea>
      </div>
      <div class="form-group">
        <label>图片链接</label>
        <input type="url" name="image_url" value="${escapeHtml(activity?.image_url || '')}" placeholder="https://...">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="window._closeActivityForm()">取消</button>
        <button type="submit" class="btn btn-primary">${isEdit ? '保存修改' : '创建活动'}</button>
      </div>
    </form>
  `;

  openModal(title, formHtml);

  document.getElementById('activityForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitActivityForm(isEdit, activity?.id);
  });
}

window._closeActivityForm = () => closeModal();

async function submitActivityForm(isEdit, activityId) {
  const form = document.getElementById('activityForm');
  const formData = new FormData(form);
  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  const body = {
    title: formData.get('title').trim(),
    description: formData.get('description').trim(),
    points_required: parseInt(formData.get('points_required')),
    gift_name: formData.get('gift_name').trim(),
    vip_quota: parseInt(formData.get('vip_quota')) || 0,
    regular_quota: parseInt(formData.get('regular_quota')) || 0,
    emoji: formData.get('emoji').trim() || '🎁',
    color: formData.get('color') || '#EC4899',
    gift_spec: formData.get('gift_spec').trim(),
    gift_description: formData.get('gift_description').trim(),
    merchant_description: formData.get('merchant_description').trim(),
    image_url: formData.get('image_url').trim()
  };

  const startTime = formData.get('start_time');
  const endTime = formData.get('end_time');
  if (startTime) body.start_time = startTime;
  if (endTime) body.end_time = endTime;

  try {
    if (isEdit) {
      await api.put(`/merchant/activities/${activityId}`, body);
      showToast('活动已更新', 'success');
    } else {
      const payload = { ...body };
      if (isAdmin) payload.merchant_id = formData.get('merchant_id');
      await api.post('/merchant/activities', payload);
      showToast('活动已创建', 'success');
    }
    closeModal();
    await loadActivities();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========== Delete ==========
window._deleteActivity = async (id) => {
  openModal('确认删除', `
    <p style="margin-bottom:20px;color:var(--color-text-secondary);">确定要删除此活动吗？此操作不可撤销。</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="window._closeActivityForm()">取消</button>
      <button class="btn btn-danger" id="btnConfirmDelete">确认删除</button>
    </div>
  `);

  document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
    try {
      await api.del(`/merchant/activities/${id}`);
      showToast('活动已删除', 'success');
      closeModal();
      await loadActivities();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
};

// ========== Edit ==========
window._editActivity = async (id) => {
  try {
    const { data } = await api.get(`/merchant/activities/${id}`);
    openActivityForm(data);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ========== Global handlers ==========
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

// ========== Utilities ==========
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
