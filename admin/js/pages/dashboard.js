/**
 * 数据概览 Dashboard 页面
 * KPI卡片 + 7天趋势图 + 积分来源分布 + 最近核销表格
 */
import { api } from '../api.js';
import { formatNumber, formatDate, showToast } from '../app.js';

let chartInstance = null;

export async function render(container) {
  container.innerHTML = `
    <div id="dashboardContent">
      <div class="loading-state"><div class="loading-spinner"></div>加载数据中...</div>
    </div>
  `;

  try {
    const { data } = await api.get('/admin/dashboard');
    if (!data) throw new Error('数据为空');
    renderDashboard(container, data);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        <p>数据加载失败</p>
        <span>${err.message}</span>
      </div>`;
  }
}

function renderDashboard(container, data) {
  const ov = data.overview;
  const daily = data.daily || [];

  container.innerHTML = `
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">总用户数</span>
        <span class="kpi-value">${formatNumber(ov.total_users)}</span>
        <span class="kpi-change up">+${ov.new_users_today || 0} 今日新增</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">活跃活动</span>
        <span class="kpi-value">${formatNumber(ov.active_activities)}</span>
        <span class="kpi-change">共 ${ov.total_activities || 0} 个</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">今日兑换</span>
        <span class="kpi-value">${formatNumber(ov.redeems_today)}</span>
        <span class="kpi-change">累计 ${formatNumber(ov.total_redeems || 0)}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">累计消耗积分</span>
        <span class="kpi-value">${formatNumber(ov.total_points_spent)}</span>
        <span class="kpi-change">人均 ${formatNumber(ov.avg_user_points || 0)}</span>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>近7天数据趋势</h3>
        <div class="chart-container">
          <canvas id="trendChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h3>积分来源分布</h3>
        <div class="chart-container" id="pointsSourceChart">
          ${renderPointsSource(ov)}
        </div>
      </div>
    </div>

    <!-- Detail Cards Row -->
    <div class="charts-grid">
      <div class="card">
        <div class="card-header">
          <h3>平台数据总览</h3>
        </div>
        <div class="card-body">
          ${renderOverviewTable(ov)}
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <h3>快速操作</h3>
        </div>
        <div class="card-body">
          ${renderQuickActions()}
        </div>
      </div>
    </div>
  `;

  // Draw chart
  setTimeout(() => renderTrendChart(daily), 50);
}

function renderPointsSource(ov) {
  const items = [
    { label: '签到积分', value: ov.checkins_month || 0, color: '#3B82F6' },
    { label: '广告积分', value: ov.total_ad_views || 0, color: '#10B981' },
    { label: '兑换消耗', value: ov.total_redeems || 0, color: '#F59E0B' },
    { label: 'VIP用户', value: ov.total_vip_users || 0, color: '#DC2626' }
  ];
  const max = Math.max(...items.map(i => i.value), 1);

  return items.map(item => `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="width:10px;height:10px;border-radius:3px;background:${item.color};flex-shrink:0;"></div>
      <span style="flex:1;font-size:13px;color:#64748B;">${item.label}</span>
      <span style="font-size:14px;font-weight:600;">${formatNumber(item.value)}</span>
      <div style="width:80px;height:6px;background:#F1F5F9;border-radius:3px;overflow:hidden;">
        <div style="width:${(item.value/max)*100}%;height:100%;background:${item.color};border-radius:3px;"></div>
      </div>
    </div>
  `).join('');
}

function renderOverviewTable(ov) {
  const rows = [
    { label: '注册商家', value: formatNumber(ov.total_merchants || 0) },
    { label: 'VIP用户数', value: formatNumber(ov.total_vip_users || 0) },
    { label: '本月新增用户', value: formatNumber(ov.new_users_month || 0) },
    { label: '待核销兑换', value: formatNumber(ov.pending_redeems || 0) },
    { label: '已核销兑换', value: formatNumber(ov.confirmed_redeems || 0) },
    { label: '系统总积分', value: formatNumber(ov.total_user_points || 0) },
    { label: '今日签到', value: formatNumber(ov.checkins_today || 0) },
    { label: '今日广告观看', value: formatNumber(ov.ad_views_today || 0) }
  ];

  return `
    <table>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td style="color:#64748B;font-size:13px;">${r.label}</td>
            <td style="text-align:right;font-weight:600;">${r.value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderQuickActions() {
  const actions = [
    { label: '分配VIP', icon: '👑', onclick: "location.hash='members'" },
    { label: '查看活动', icon: '🎯', onclick: "location.hash='activities'" },
    { label: '操作日志', icon: '📋', onclick: "location.hash='settings'" }
  ];
  return actions.map(a => `
    <button class="btn btn-outline btn-block" style="margin-bottom:10px;justify-content:flex-start;" onclick="${a.onclick}">
      <span style="font-size:18px;">${a.icon}</span> ${a.label}
    </button>
  `).join('');
}

function renderTrendChart(daily) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;

  if (chartInstance) chartInstance.destroy();

  const labels = daily.map(d => {
    const parts = d.date.split('-');
    return parts[1] + '/' + parts[2];
  });

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '兑换',
          data: daily.map(d => d.redeems),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: '签到',
          data: daily.map(d => d.checkins),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: '广告',
          data: daily.map(d => d.ad_views),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: '新用户',
          data: daily.map(d => d.new_users),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { family: 'Inter', size: 12 }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 }, color: '#94A3B8' }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#F1F5F9' },
          ticks: { font: { family: 'Inter', size: 11 }, color: '#94A3B8' }
        }
      }
    }
  });
}
