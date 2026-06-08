/**
 * 每日签到页
 * 设计参照 Ardot 8:33
 */
const checkinService = require('../../services/checkin');

Page({
  data: {
    statusBarHeight: 20,
    todayReward: 10,
    streakDays: 0,
    checkedIn: false,
    loading: true,

    // 日历
    currentYear: 2026,
    currentMonth: 6,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    weeks: [],
    checkedDates: [],

    // 已签到日期列表
    checkedInDates: []
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const now = new Date();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    this.loadData();
  },

  async loadData() {
    try {
      const [statusRes, historyRes] = await Promise.all([
        checkinService.getTodayStatus(),
        checkinService.getHistory(
          `${this.data.currentYear}-${String(this.data.currentMonth).padStart(2, '0')}`
        )
      ]);

      const { checkedIn, streakDays, reward } = statusRes.data;
      const records = (historyRes.data && historyRes.data.records) || [];
      const checkedDates = records.map(r => r.date);

      this.setData({
        checkedIn,
        streakDays: streakDays || 0,
        todayReward: reward || 10,
        checkedDates,
        loading: false
      });

      this._buildCalendar();
    } catch (err) {
      this.setData({ loading: false });
      // 即使失败也渲染空日历
      this._buildCalendar();
    }
  },

  /** 执行签到 */
  async onCheckin() {
    if (this.data.checkedIn) return;

    try {
      const res = await checkinService.doCheckin();
      wx.showToast({ title: `签到成功！+${res.data.reward}积分`, icon: 'success' });

      this.setData({
        checkedIn: true,
        streakDays: res.data.streakDays || this.data.streakDays + 1
      });

      // 刷新日历
      const today = this._formatDate(new Date());
      const dates = [...this.data.checkedDates, today];
      this.setData({ checkedDates: dates });
      this._buildCalendar();

      // 更新全局积分
      const app = getApp();
      app.globalData.points = (app.globalData.points || 0) + res.data.reward;
    } catch (err) {
      /* 错误已在 request 中处理 */
    }
  },

  /** 月份切换 */
  onPrevMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      currentYear--;
      currentMonth = 12;
    } else {
      currentMonth--;
    }
    this.setData({ currentYear, currentMonth });
    this.loadData();
  },

  onNextMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      currentYear++;
      currentMonth = 1;
    } else {
      currentMonth++;
    }
    this.setData({ currentYear, currentMonth });
    this.loadData();
  },

  /** 构建月历 */
  _buildCalendar() {
    const { currentYear, currentMonth, checkedDates } = this.data;
    const checkedSet = new Set(checkedDates);

    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const today = new Date();
    const todayStr = this._formatDate(today);

    const weeks = [];
    let week = [];

    // 填充第一周前面的空白
    for (let i = 0; i < firstDay; i++) {
      week.push({ day: '', checked: false, isToday: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      week.push({
        day: d,
        checked: checkedSet.has(dateStr),
        isToday: dateStr === todayStr
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // 最后一周补齐
    if (week.length > 0) {
      while (week.length < 7) {
        week.push({ day: '', checked: false, isToday: false });
      }
      weeks.push(week);
    }

    this.setData({ weeks });
  },

  _formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /** 查看签到规则 */
  onViewRules() {
    wx.showToast({ title: '签到规则页开发中', icon: 'none' });
  }
});
