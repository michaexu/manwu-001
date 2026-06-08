/**
 * 商家管理页面
 * 商家列表 + 搜索 + 创建/编辑/删除
 */
import { api } from '../api.js';
import { formatDate, showToast, openModal, closeModal } from '../app.js';

let currentPage = 1;
let currentKeyword = '';
let currentStatus = '';

export async function render(container) {
  container.innerHTML = `
    <div class="toolbar">
      <input type="text" class="search-input" id="merchantSearch" placeholder="搜索商家名称或手机号...">
      <select id="merchantStatusFilter">
        <option value="">全部状态</option>
        <option value="active">启用</option>
        <option value="disabled">已禁用</option>
      </select>
      <div class="toolbar-spacer"></div>
      <button class="btn btn-primary" id="btnCreateMerchant">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        创建商家
      </button>
      <span class="results-count" id="merchantCount"></span>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>商家名称</th>
              <th>手机号</th>
              <th>地址</th>
              <th>负责人</th>
              <th>活动数</th>
              <th>核销数</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="merchantTableBody">
            <tr><td colspan="9"><div class="loading-state"><div class="loading-spinner"></div>加载中...</div></td></tr>
          </tbody>
        </table>
      </div>
      <div id="merchantPagination" class="pagination"></div>
    </div>
  `;

  document.getElementById('merchantSearch').addEventListener('input', debounce(onSearch, 400));
  document.getElementById('merchantStatusFilter').addEventListener('change', onFilterChange);
  document.getElementById('btnCreateMerchant').addEventListener('click', () => openMerchantForm());

  await loadMerchants();
}

async function loadMerchants() {
  const body = document.getElementById('merchantTableBody');
  if (!body) return;

  body.innerHTML = '<tr><td colspan="9"><div class="loading-state"><div class="loading-spinner"></div>加载中...</div></td></tr>';

  try {
    const params = { page: currentPage, page_size: 15 };
    if (currentStatus) params.status = currentStatus;
    if (currentKeyword) params.keyword = currentKeyword;

    const { data } = await api.get('/admin/merchants', params);
    const merchants = data.merchants || [];
    const total = data.total || merchants.length;

    document.getElementById('merchantCount').textContent = `共 ${total} 个商家`;

    if (merchants.length === 0) {
      body.innerHTML = `<tr><td colspan="9"><div class="empty-state"><p>暂无商家数据</p></div></td></tr>`;
      document.getElementById('merchantPagination').innerHTML = '';
      return;
    }

    body.innerHTML = merchants.map(m => `
      <tr>
        <td style="font-weight:600;">${escapeHtml(m.name)}</td>
        <td>${escapeHtml(m.phone || '-')}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(m.address || '')}">${escapeHtml(m.address || '-')}</td>
        <td>${escapeHtml(m.owner_name || '-')}</td>
        <td>${m.activity_count || 0}</td>
        <td>${m.redeem_count || 0}</td>
        <td>${renderStatusBadge(m.status)}</td>
        <td style="color:#64748B;font-size:13px;">${formatDate(m.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="window._editMerchant('${m.id}')">编辑</button>
            <button class="btn btn-sm btn-outline" style="color:#EF4444;border-color:#FEE2E2;" onclick="window._deleteMerchant('${m.id}')">删除</button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPagination(total);
  } catch (err) {
    body.innerHTML = `<tr><td colspan="9"><div class="empty-state"><p>加载失败</p><span>${err.message}</span></div></td></tr>`;
  }
}

function renderStatusBadge(status) {
  return status === 'active'
    ? '<span class="badge badge-success">启用</span>'
    : '<span class="badge badge-neutral">已禁用</span>';
}

function renderPagination(total) {
  const container = document.getElementById('merchantPagination');
  if (!container) return;
  const totalPages = Math.ceil(total / 15);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window._merchantPage(${currentPage - 1})">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="window._merchantPage(${i})">${i}</button>`;
  }
  html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window._merchantPage(${currentPage + 1})">›</button>`;
  container.innerHTML = html;
}

// ========== Form Modal ==========
function openMerchantForm(merchant) {
  const isEdit = !!merchant;
  const title = isEdit ? '编辑商家' : '创建商家';

  const formHtml = `
    <form id="merchantForm">
      <div class="form-group">
        <label>商家名称 *</label>
        <input type="text" name="name" value="${escapeHtml(merchant?.name || '')}" required maxlength="200" placeholder="例如：星巴克咖啡">
      </div>
      <div class="form-group">
        <label>手机号 *${isEdit ? '' : '（作为商家登录账号）'}</label>
        <input type="tel" name="phone" value="${escapeHtml(merchant?.phone || '')}" required maxlength="20" placeholder="11位手机号" ${isEdit ? '' : ''}>
      </div>
      ${!isEdit ? `
      <div class="form-group">
        <label>登录密码</label>
        <input type="password" name="password" placeholder="留空则默认 123456" minlength="6">
      </div>` : ''}
      <div class="form-group">
        <label>地址</label>
        <input type="text" name="address" value="${escapeHtml(merchant?.address || '')}" maxlength="500" placeholder="商家地址">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea name="description" maxlength="500" placeholder="商家简介...">${escapeHtml(merchant?.description || '')}</textarea>
      </div>
      ${isEdit ? `
      <div class="form-group">
        <label>状态</label>
        <select name="status">
          <option value="active" ${merchant?.status === 'active' ? 'selected' : ''}>启用</option>
          <option value="disabled" ${merchant?.status === 'disabled' ? 'selected' : ''}>禁用</option>
        </select>
      </div>` : ''}
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="window._closeMerchantForm()">取消</button>
        <button type="submit" class="btn btn-primary">${isEdit ? '保存修改' : '创建商家'}</button>
      </div>
    </form>
  `;

  openModal(title, formHtml);

  document.getElementById('merchantForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitMerchantForm(isEdit, merchant?.id);
  });
}

window._closeMerchantForm = () => closeModal();

async function submitMerchantForm(isEdit, merchantId) {
  const form = document.getElementById('merchantForm');
  const formData = new FormData(form);

  const body = {
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    address: formData.get('address').trim(),
    description: formData.get('description').trim()
  };
  if (!isEdit) {
    const pwd = formData.get('password').trim();
    if (pwd) body.password = pwd;
  } else {
    body.status = formData.get('status');
  }

  try {
    if (isEdit) {
      await api.put(`/admin/merchants/${merchantId}`, body);
      showToast('商家已更新', 'success');
    } else {
      await api.post('/admin/merchants', body);
      showToast('商家已创建', 'success');
    }
    closeModal();
    await loadMerchants();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========== Edit ==========
window._editMerchant = async (id) => {
  try {
    const { data } = await api.get(`/admin/merchants/${id}`);
    openMerchantForm(data);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ========== Delete ==========
window._deleteMerchant = async (id) => {
  openModal('确认删除', `
    <p style="margin-bottom:20px;color:var(--color-text-secondary);">确定要删除此商家吗？此操作不可撤销。<br>注意：有活动的商家无法删除。</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="window._closeMerchantForm()">取消</button>
      <button class="btn btn-danger" id="btnConfirmDelete">确认删除</button>
    </div>
  `);

  document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
    try {
      await api.del(`/admin/merchants/${id}`);
      showToast('商家已删除', 'success');
      closeModal();
      await loadMerchants();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
};

// ========== Pagination ==========
window._merchantPage = (page) => { currentPage = page; loadMerchants(); };

function onSearch() {
  currentKeyword = document.getElementById('merchantSearch').value.trim();
  currentPage = 1;
  loadMerchants();
}

function onFilterChange() {
  currentStatus = document.getElementById('merchantStatusFilter').value;
  currentPage = 1;
  loadMerchants();
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
