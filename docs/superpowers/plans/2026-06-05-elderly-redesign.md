# 适老化 UI 重设计 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign 2 WeChat miniapps (client + merchant) with red/gold elderly-friendly theme: larger fonts, high contrast, big touch targets, warm colors.

**Architecture:** Pure WXSS/WXML/JSON changes — no JS logic touched. Global styles in app.wxss set foundation (colors, buttons, cards, tags). Each page .wxss overrides page-specific layout. Minor .wxml changes for layout restructure (quota grid, card layout). app.json tabBar colors.

**Tech Stack:** WeChat Mini Program (WXSS + WXML + JSON), rpx units

**Design spec:** [docs/superpowers/specs/2026-06-04-elderly-redesign.md](/docs/superpowers/specs/2026-06-04-elderly-redesign.md)

---

### Task 1: Global style foundation (both apps)

**Files:**
- Modify: `client-miniapp/app.wxss`
- Modify: `client-miniapp/app.json`
- Modify: `merchant-miniapp/app.wxss`
- Modify: `merchant-miniapp/app.json`

- [ ] **Step 1: Update client-miniapp/app.wxss — replace entire file with red/gold global styles**

```wxss
/* 适老化重设计 — 红金主题 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background-color: #FFF8F0;
  color: #2D1B00;
  font-size: 32rpx;
  box-sizing: border-box;
}

view, scroll-view, swiper { box-sizing: border-box; }

/* 按钮 — 主 */
.btn-primary {
  background: #C41E1E;
  color: #FFFFFF;
  border: none;
  border-radius: 20rpx;
  height: 90rpx;
  padding: 0 48rpx;
  font-size: 34rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 90rpx;
}
.btn-primary:active { opacity: 0.85; background: #A01818; }
.btn-primary[disabled] { background: #CCCCCC; color: #666666; }

/* 按钮 — 次 */
.btn-secondary {
  background: #FFFFFF;
  color: #C41E1E;
  border: 2rpx solid #D4A030;
  border-radius: 20rpx;
  height: 90rpx;
  padding: 0 48rpx;
  font-size: 34rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 90rpx;
}
.btn-secondary:active { background: #FFF8F0; }

/* 按钮 — mini */
.btn-primary[size="mini"], .btn-secondary[size="mini"] {
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  border-radius: 16rpx;
  display: inline-block;
}

/* 卡片 */
.card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 32rpx;
  margin: 24rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-no-margin {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

/* VIP 标签 */
.tag-vip {
  display: inline-block;
  background: #D4A030;
  color: #C41E1E;
  font-size: 26rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-weight: 600;
}

/* 普通标签 */
.tag-regular {
  display: inline-block;
  background: #FFF8F0;
  color: #2D1B00;
  font-size: 26rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
}

/* 已核销标签 */
.tag-claimed {
  background: #E8F5E9;
  color: #2E7D32;
  font-size: 26rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
}

/* 加载中 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: #8B7A66;
  font-size: 30rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  color: #8B7A66;
  font-size: 30rpx;
}

/* 页面标题 */
.page-title {
  font-size: 36rpx;
  font-weight: 700;
  padding: 30rpx 24rpx 10rpx;
  color: #2D1B00;
}
```

- [ ] **Step 2: Update client-miniapp/app.json — tabBar selectedColor to red**

Edit `app.json` line 21: change `"selectedColor": "#07c160"` to `"selectedColor": "#C41E1E"`.

- [ ] **Step 3: Update merchant-miniapp/app.wxss — replace entire file**

```wxss
/* 适老化重设计 — 红金主题（商家版） */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background-color: #FFF8F0;
  color: #2D1B00;
  font-size: 32rpx;
  box-sizing: border-box;
}

view, scroll-view, swiper { box-sizing: border-box; }

.btn-primary {
  background: #C41E1E;
  color: #FFFFFF;
  border: none;
  border-radius: 20rpx;
  height: 90rpx;
  padding: 0 48rpx;
  font-size: 34rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 90rpx;
}
.btn-primary:active { opacity: 0.85; background: #A01818; }
.btn-primary[disabled] { background: #CCCCCC; color: #666666; }

.btn-secondary {
  background: #FFFFFF;
  color: #C41E1E;
  border: 2rpx solid #D4A030;
  border-radius: 20rpx;
  height: 90rpx;
  padding: 0 48rpx;
  font-size: 34rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 90rpx;
}
.btn-secondary:active { background: #FFF8F0; }

/* mini buttons */
.btn-primary[size="mini"], .btn-secondary[size="mini"] {
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  border-radius: 16rpx;
  display: inline-block;
}

.card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 32rpx;
  margin: 24rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.card-no-margin {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.page-title {
  font-size: 36rpx;
  font-weight: 700;
  padding: 30rpx 24rpx 10rpx;
  color: #2D1B00;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  color: #8B7A66;
  font-size: 30rpx;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: #8B7A66;
  font-size: 30rpx;
}

.tag-vip {
  display: inline-block;
  background: #D4A030;
  color: #C41E1E;
  font-size: 26rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-weight: 600;
}

.tag-regular {
  display: inline-block;
  background: #FFF8F0;
  color: #2D1B00;
  font-size: 26rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
}
```

- [ ] **Step 4: Update merchant-miniapp/app.json — tabBar selectedColor to red**

Edit `app.json` line 24: change `"selectedColor": "#07c160"` to `"selectedColor": "#C41E1E"`.

- [ ] **Step 5: Commit global foundation**

```bash
git add client-miniapp/app.wxss client-miniapp/app.json merchant-miniapp/app.wxss merchant-miniapp/app.json
git commit -m "feat: global red/gold theme foundation for elderly redesign"
```

---

### Task 2: Client — Home page (index)

**Files:**
- Modify: `client-miniapp/pages/index/index.wxml`
- Modify: `client-miniapp/pages/index/index.wxss`

- [ ] **Step 1: Update index.wxml — change header to red, enlarge activity cards**

Replace entire file content with:

```xml
<view class="page">
  <!-- 顶栏 红底 -->
  <view class="header-card">
    <text class="header-title">会员领物</text>
    <text class="header-sub">浏览精彩活动，到店领取奖品</text>
  </view>

  <!-- 活动列表 -->
  <view class="section-title">热门活动</view>

  <view class="activity-list">
    <view
      class="activity-card card"
      wx:for="{{activities}}"
      wx:key="id"
      data-id="{{item.id}}"
      catchtap="goToDetail"
    >
      <image class="activity-cover" src="{{item.coverImage || 'https://via.placeholder.com/690x360/e8f5e9/4caf50?text=活动'}}" mode="aspectFill" />
      <view class="activity-info">
        <view class="activity-title">{{item.title}}</view>
        <view class="activity-meta">
          <text class="meta-item">{{item.location}}</text>
          <text class="meta-item">{{item.startTime.slice(5, 16)}}</text>
        </view>
        <view class="activity-quota">
          <text class="quota-tag vip-quota" wx:if="{{item.vipRemaining !== '不限' && item.vipRemaining > 0}}">VIP 余{{item.vipRemaining}}</text>
          <text class="quota-tag vip-full" wx:if="{{item.vipRemaining === 0}}">VIP 满</text>
          <text class="quota-tag regular-quota" wx:if="{{item.regularRemaining !== '不限' && item.regularRemaining > 0}}">普通 余{{item.regularRemaining}}</text>
          <text class="quota-tag regular-full" wx:if="{{item.regularRemaining === 0}}">普通 满</text>
        </view>
      </view>
    </view>
  </view>

  <view class="loading-container" wx:if="{{isLoading}}">
    <text>加载中...</text>
  </view>

  <view class="empty-state" wx:if="{{!isLoading && activities.length === 0}}">
    <text>暂无活动</text>
    <text style="font-size:28rpx;color:#8B7A66;margin-top:16rpx;">敬请期待更多精彩活动</text>
  </view>
</view>
```

- [ ] **Step 2: Update index.wxss — replace entire file**

```wxss
.page {
  min-height: 100vh;
  padding-bottom: 130rpx;
}

.header-card {
  background: #C41E1E;
  padding: 50rpx 24rpx;
  color: #FFFFFF;
  border-bottom: 4rpx solid #D4A030;
}

.header-title {
  font-size: 42rpx;
  font-weight: 700;
  display: block;
}

.header-sub {
  font-size: 28rpx;
  opacity: 0.85;
  margin-top: 12rpx;
  display: block;
}

.section-title {
  font-size: 36rpx;
  font-weight: 700;
  padding: 30rpx 24rpx 20rpx;
  color: #2D1B00;
  display: flex;
  align-items: center;
}
.section-title::before {
  content: '';
  width: 6rpx;
  height: 32rpx;
  background: #D4A030;
  margin-right: 16rpx;
  border-radius: 3rpx;
  flex-shrink: 0;
}

.activity-card {
  margin-bottom: 24rpx;
  padding: 0;
  overflow: hidden;
}

.activity-cover {
  width: 100%;
  height: 360rpx;
  display: block;
}

.activity-info {
  padding: 28rpx 32rpx 32rpx;
}

.activity-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #2D1B00;
  margin-bottom: 16rpx;
}

.activity-meta {
  display: flex;
  gap: 24rpx;
  color: #8B7A66;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.activity-quota {
  display: flex;
  gap: 16rpx;
}

.quota-tag {
  font-size: 26rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
}

.vip-quota {
  background: #FFF8F0;
  color: #C41E1E;
  border: 2rpx solid #D4A030;
}

.vip-full {
  background: #C41E1E;
  color: #FFFFFF;
}

.regular-quota {
  background: #FFF8F0;
  color: #2D1B00;
  border: 2rpx solid #F0E8DE;
}

.regular-full {
  background: #C62828;
  color: #FFFFFF;
}
```

- [ ] **Step 3: Commit**

```bash
git add client-miniapp/pages/index/index.wxml client-miniapp/pages/index/index.wxss
git commit -m "feat(client): home page elderly redesign — red header, larger cards, bigger fonts"
```

---

### Task 3: Client — Activity Detail page

**Files:**
- Modify: `client-miniapp/pages/activity-detail/activity-detail.wxml`
- Modify: `client-miniapp/pages/activity-detail/activity-detail.wxss`

- [ ] **Step 1: Update activity-detail.wxml — restructure quota grid to 2 columns, enlarge everything**

```xml
<view class="page">
  <view class="loading-container" wx:if="{{isLoading}}">
    <text>加载中...</text>
  </view>

  <block wx:else>
    <!-- 封面图 -->
    <image class="detail-cover" src="{{activity.coverImage || 'https://via.placeholder.com/750x400/e8f5e9/4caf50?text=活动封面'}}" mode="aspectFill" />

    <!-- 活动信息 -->
    <view class="detail-section card">
      <view class="detail-title">{{activity.title}}</view>
      <view class="detail-points" wx:if="{{!isVip && activity.pointsRequired > 0}}">
        需消耗 <text class="highlight">{{activity.pointsRequired}}</text> 积分
      </view>
      <view class="detail-points" wx:if="{{!isVip && activity.pointsRequired === 0}}">免费参与</view>
      <view class="detail-points vip-free" wx:if="{{isVip}}">VIP 会员免费参与</view>

      <view class="detail-info-list">
        <view class="info-item">
          <text class="info-label">领取地点</text>
          <text class="info-value">{{activity.location}}</text>
        </view>
        <view class="info-item">
          <text class="info-label">领取时间</text>
          <text class="info-value">{{activity.startTime}} ~ {{activity.endTime}}</text>
        </view>
      </view>
    </view>

    <!-- 名额信息 — 2列大卡片 -->
    <view class="detail-section card">
      <view class="section-label">名额信息</view>
      <view class="quota-grid">
        <view class="quota-item">
          <text class="quota-num">{{activity.vipRemaining === '不限' ? '不限' : activity.vipRemaining}}</text>
          <text class="quota-label">VIP 剩余</text>
        </view>
        <view class="quota-item">
          <text class="quota-num">{{activity.regularRemaining === '不限' ? '不限' : activity.regularRemaining}}</text>
          <text class="quota-label">普通剩余</text>
        </view>
      </view>
    </view>

    <!-- 奖品描述 -->
    <view class="detail-section card" wx:if="{{activity.prizeDesc}}">
      <view class="section-label">奖品描述</view>
      <text class="desc-text">{{activity.prizeDesc}}</text>
    </view>

    <!-- 活动说明 -->
    <view class="detail-section card" wx:if="{{activity.description}}">
      <view class="section-label">活动说明</view>
      <text class="desc-text">{{activity.description}}</text>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <view class="bottom-inner">
        <button class="btn-primary" wx:if="{{isRegistered && registrationStatus === 'registered'}}" catchtap="goToQrCode">
          查看领奖码
        </button>
        <button class="btn-secondary" wx:if="{{isRegistered && registrationStatus === 'claimed'}}" disabled>
          已核销
        </button>
        <button class="btn-primary" wx:if="{{isRegistered && registrationStatus === 'cancelled'}}" catchtap="handleRegister">
          重新报名
        </button>

        <block wx:if="{{!isRegistered}}">
          <button class="btn-primary" wx:if="{{isVip}}" catchtap="handleRegister">VIP 免积分参加</button>
          <button class="btn-primary" wx:elif="{{activity.pointsRequired > 0}}" catchtap="handleRegister">消耗 {{activity.pointsRequired}} 积分参加</button>
          <button class="btn-primary" wx:else catchtap="handleRegister">免费参加</button>
        </block>
      </view>
    </view>
  </block>
</view>
```

- [ ] **Step 2: Update activity-detail.wxss — replace entire file**

```wxss
.page {
  min-height: 100vh;
  padding-bottom: 130rpx;
}

.detail-cover {
  width: 100%;
  height: 400rpx;
  display: block;
}

.detail-section {
  margin-bottom: 16rpx;
}

.detail-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #2D1B00;
  margin-bottom: 16rpx;
}

.detail-points {
  font-size: 32rpx;
  color: #8B7A66;
  margin-bottom: 24rpx;
}

.highlight {
  color: #D4A030;
  font-weight: 700;
  font-size: 36rpx;
}

.vip-free {
  color: #C41E1E;
  font-weight: 600;
  background: #FFF8F0;
  display: inline-block;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  border: 2rpx solid #D4A030;
}

.detail-info-list {
  border-top: 2rpx solid #F0E8DE;
  padding-top: 24rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
}

.info-label {
  color: #8B7A66;
  font-size: 28rpx;
}

.info-value {
  color: #2D1B00;
  font-size: 30rpx;
  max-width: 60%;
  text-align: right;
}

.section-label {
  font-size: 32rpx;
  font-weight: 600;
  color: #2D1B00;
  margin-bottom: 24rpx;
}

.quota-grid {
  display: flex;
  gap: 24rpx;
}

.quota-item {
  text-align: center;
  flex: 1;
  background: #FFF8F0;
  border-radius: 16rpx;
  padding: 28rpx 20rpx;
  border: 2rpx solid #F0E8DE;
}

.quota-num {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #D4A030;
}

.quota-label {
  display: block;
  font-size: 26rpx;
  color: #8B7A66;
  margin-top: 12rpx;
}

.desc-text {
  font-size: 30rpx;
  color: #2D1B00;
  line-height: 1.8;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  padding: 24rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.bottom-inner {
  max-width: 690rpx;
  margin: 0 auto;
}
```

- [ ] **Step 3: Commit**

```bash
git add client-miniapp/pages/activity-detail/activity-detail.wxml client-miniapp/pages/activity-detail/activity-detail.wxss
git commit -m "feat(client): activity detail page elderly redesign — bigger cover, 2-col quota, larger fonts"
```

---

### Task 4: Client — Profile + Points Tasks + Points Detail pages

**Files:**
- Modify: `client-miniapp/pages/profile/profile.wxml`
- Modify: `client-miniapp/pages/profile/profile.wxss`
- Modify: `client-miniapp/pages/points-tasks/points-tasks.wxml`
- Modify: `client-miniapp/pages/points-tasks/points-tasks.wxss`
- Modify: `client-miniapp/pages/points-detail/points-detail.wxml`
- Modify: `client-miniapp/pages/points-detail/points-detail.wxss`

- [ ] **Step 1: Update profile.wxml — tag-vip/regular now golden from global styles, enlarge layout**

```xml
<view class="page">
  <!-- 顶部用户信息 红底 -->
  <view class="profile-header">
    <view class="avatar-container">
      <image class="avatar" src="{{memberInfo.avatarUrl || 'https://via.placeholder.com/140x140/ccc/fff?text=U'}}" mode="aspectFill" wx:if="{{isLoggedIn}}" />
      <image class="avatar" src="https://via.placeholder.com/140x140/ccc/fff?text=U" mode="aspectFill" wx:else />
    </view>
    <view class="profile-info" wx:if="{{isLoggedIn}}">
      <view class="profile-name">{{memberInfo.nickname || '微信用户'}}</view>
      <view class="profile-tags">
        <text class="{{memberInfo.memberType === 'vip' ? 'tag-vip' : 'tag-regular'}}">
          {{memberInfo.memberType === 'vip' ? 'VIP 会员' : '普通会员'}}
        </text>
      </view>
      <text class="profile-phone" wx:if="{{memberInfo.phone}}">{{memberInfo.phone}}</text>
    </view>
    <view class="not-logged-in" wx:else>
      <button class="login-btn" catchtap="tryLogin">微信一键登录</button>
      <text class="or-text">或</text>
      <button class="register-btn" catchtap="goToRegister">手机号注册 / 登录</button>
    </view>
  </view>

  <!-- 菜单列表 -->
  <view class="profile-body">
    <view class="menu-group card" wx:if="{{isLoggedIn}}">
      <view class="menu-item" catchtap="goToParticipations">
        <text class="menu-label">我的参与</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" catchtap="goToPointsDetail" wx:if="{{memberInfo.memberType === 'regular'}}">
        <text class="menu-label">积分明细</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-group card" wx:if="{{!isLoggedIn}}">
      <view class="menu-item" catchtap="goToRegister">
        <text class="menu-label">手机号注册</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" catchtap="goToParticipations">
        <text class="menu-label">查看参与记录</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <button class="logout-btn" wx:if="{{isLoggedIn}}" catchtap="handleLogout">退出登录</button>
  </view>
</view>
```

- [ ] **Step 2: Update profile.wxss — replace entire file**

```wxss
.page {
  min-height: 100vh;
}

.profile-header {
  background: #C41E1E;
  padding: 60rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 32rpx;
  color: #FFFFFF;
  border-bottom: 4rpx solid #D4A030;
}

.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.profile-name {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  display: block;
}

.profile-phone {
  font-size: 28rpx;
  opacity: 0.8;
  display: block;
  margin-top: 12rpx;
}

.not-logged-in {
  flex: 1;
  text-align: center;
}

.login-btn {
  background: #FFFFFF;
  color: #C41E1E;
  font-size: 30rpx;
  padding: 20rpx 48rpx;
  border-radius: 20rpx;
  font-weight: 600;
  display: inline-block;
  line-height: 1.2;
  height: auto;
}

.or-text {
  display: block;
  font-size: 26rpx;
  opacity: 0.7;
  margin: 20rpx 0;
}

.register-btn {
  background: transparent;
  color: #FFFFFF;
  font-size: 28rpx;
  border: 2rpx solid rgba(255,255,255,0.5);
  padding: 16rpx 36rpx;
  border-radius: 20rpx;
  display: inline-block;
  height: auto;
  line-height: 1.2;
}

.profile-body {
  padding: 0 24rpx;
}

.menu-group {
  margin-top: 32rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  border-bottom: 2rpx solid #F0E8DE;
  min-height: 100rpx;
}
.menu-item:last-child {
  border-bottom: none;
}

.menu-label {
  font-size: 32rpx;
  color: #2D1B00;
  flex: 1;
}

.menu-arrow {
  font-size: 36rpx;
  color: #D4A030;
}

.logout-btn {
  background: #FFFFFF;
  color: #C62828;
  border: 2rpx solid #C62828;
  border-radius: 20rpx;
  font-size: 32rpx;
  height: 90rpx;
  line-height: 90rpx;
  margin: 60rpx 24rpx;
  width: auto;
}
```

- [ ] **Step 3: Update points-tasks.wxss — replace entire file**

```wxss
.page {
  min-height: 100vh;
  padding-bottom: 30rpx;
}

.points-header {
  background: #C41E1E;
  color: #FFFFFF;
  padding: 40rpx 24rpx;
  text-align: center;
  border-bottom: 4rpx solid #D4A030;
}

.points-card {
  padding: 30rpx 0;
}

.card-label {
  font-size: 30rpx;
  opacity: 0.9;
}

.card-value {
  font-size: 80rpx;
  font-weight: 700;
  color: #D4A030;
  display: block;
  margin: 16rpx 0;
}

.card-desc {
  font-size: 26rpx;
  opacity: 0.7;
}

.points-history {
  text-align: right;
  font-size: 28rpx;
  opacity: 0.85;
  padding: 12rpx 0;
}

.section-title {
  font-size: 36rpx;
  font-weight: 700;
  padding: 30rpx 24rpx 20rpx;
  color: #2D1B00;
  display: flex;
  align-items: center;
}
.section-title::before {
  content: '';
  width: 6rpx;
  height: 32rpx;
  background: #D4A030;
  margin-right: 16rpx;
  border-radius: 3rpx;
  flex-shrink: 0;
}

.ad-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.ad-name {
  font-size: 32rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 12rpx;
  color: #2D1B00;
}

.ad-reward {
  font-size: 28rpx;
  color: #8B7A66;
}

.highlight {
  color: #D4A030;
  font-weight: 700;
}

.ad-btn {
  padding: 16rpx 40rpx;
  font-size: 28rpx;
  min-width: 140rpx;
  height: 66rpx;
  line-height: 66rpx;
}
```

- [ ] **Step 4: Update points-tasks.wxml — minor adjustments (remove emoji icons from section-title, use CSS pseudo)**

No WXML changes needed — the `.wxss` `::before` pseudo handles the gold bar decoration. The WXML stays as-is.

- [ ] **Step 5: Update points-detail.wxss — replace entire file**

```wxss
.page {
  min-height: 100vh;
  padding-bottom: 30rpx;
}

.balance-header {
  background: #C41E1E;
  padding: 50rpx 24rpx;
  text-align: center;
  color: #FFFFFF;
  border-bottom: 4rpx solid #D4A030;
}

.balance-label {
  font-size: 30rpx;
  opacity: 0.9;
  display: block;
}

.balance-value {
  font-size: 80rpx;
  font-weight: 700;
  color: #D4A030;
  display: block;
  margin-top: 16rpx;
}

.filter-bar {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 24rpx;
  background: #FFFFFF;
  overflow-x: auto;
}

.filter-item {
  padding: 14rpx 32rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #2D1B00;
  background: #FFF8F0;
  flex-shrink: 0;
}

.filter-item.active {
  background: #C41E1E;
  color: #FFFFFF;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.record-type {
  font-size: 30rpx;
  font-weight: 500;
  color: #2D1B00;
  display: block;
}

.record-time {
  font-size: 26rpx;
  color: #8B7A66;
  display: block;
  margin-top: 8rpx;
}

.record-remark {
  font-size: 26rpx;
  color: #8B7A66;
  display: block;
  margin-top: 6rpx;
}

.record-right {
  text-align: right;
}

.record-amount {
  font-size: 34rpx;
  font-weight: 700;
  display: block;
}

.record-amount.positive {
  color: #C41E1E;
}

.record-amount.negative {
  color: #8B7A66;
}

.record-balance {
  font-size: 24rpx;
  color: #8B7A66;
  display: block;
  margin-top: 6rpx;
}
```

- [ ] **Step 6: Commit**

```bash
git add client-miniapp/pages/profile/profile.wxml client-miniapp/pages/profile/profile.wxss \
      client-miniapp/pages/points-tasks/points-tasks.wxss \
      client-miniapp/pages/points-detail/points-detail.wxss
git commit -m "feat(client): profile + points pages elderly redesign — red headers, gold accents, bigger text"
```

---

### Task 5: Client — Remaining pages (my-participations, registration-success, qr-code, phone-register)

**Files:**
- Modify: `client-miniapp/pages/my-participations/my-participations.wxss`
- Modify: `client-miniapp/pages/registration-success/registration-success.wxss`
- Modify: `client-miniapp/pages/qr-code/qr-code.wxss`
- Modify: `client-miniapp/pages/phone-register/phone-register.wxss`

- [ ] **Step 1: Update my-participations.wxss — replace file**

```wxss
.page {
  min-height: 100vh;
  padding-bottom: 30rpx;
}

.reg-item {
  margin-bottom: 16rpx;
}

.reg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.reg-title {
  font-size: 32rpx;
  font-weight: 600;
  flex: 1;
  color: #2D1B00;
}

.reg-status {
  font-size: 26rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  white-space: nowrap;
}

.status-registered {
  background: #E8F5E9;
  color: #2E7D32;
  font-weight: 600;
}

.status-claimed {
  background: #FFF8F0;
  color: #2D1B00;
  border: 2rpx solid #D4A030;
}

.status-cancelled {
  background: #F0E8DE;
  color: #8B7A66;
}

.reg-meta {
  display: flex;
  gap: 24rpx;
  color: #8B7A66;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.reg-actions {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.claimed-info,
.cancelled-info {
  font-size: 28rpx;
  color: #8B7A66;
}
```

- [ ] **Step 2: Update registration-success.wxss — replace file**

```wxss
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

.success-container {
  text-align: center;
  margin-bottom: 80rpx;
}

.success-icon {
  width: 140rpx;
  height: 140rpx;
  line-height: 140rpx;
  border-radius: 50%;
  background: #2E7D32;
  color: #FFFFFF;
  font-size: 72rpx;
  margin: 0 auto 36rpx;
}

.success-title {
  font-size: 42rpx;
  font-weight: 700;
  color: #2D1B00;
  margin-bottom: 24rpx;
}

.success-desc {
  font-size: 30rpx;
  color: #8B7A66;
  line-height: 1.8;
}

.action-buttons {
  width: 80%;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}
```

- [ ] **Step 3: Update qr-code.wxss — replace file**

```wxss
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 24rpx;
}

.qr-header {
  width: 100%;
  margin-bottom: 48rpx;
  text-align: center;
}

.qr-activity-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #2D1B00;
  display: block;
  margin-bottom: 16rpx;
}

.qr-location {
  font-size: 28rpx;
  color: #8B7A66;
}

.qr-container {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 48rpx;
}

.qr-image {
  width: 420rpx;
  height: 420rpx;
  display: block;
}

.qr-tip {
  text-align: center;
  color: #8B7A66;
  font-size: 28rpx;
  margin-top: 32rpx;
}

.qr-actions {
  width: 80%;
}
```

- [ ] **Step 4: Update phone-register.wxss — replace file**

```wxss
.page {
  min-height: 100vh;
  padding: 80rpx 40rpx;
  background: #FFFFFF;
}

.register-header {
  text-align: center;
  margin-bottom: 60rpx;
}

.register-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #2D1B00;
  display: block;
  margin-bottom: 16rpx;
}

.register-desc {
  font-size: 30rpx;
  color: #8B7A66;
}

.form-group {
  margin-bottom: 36rpx;
}

.form-label {
  font-size: 30rpx;
  color: #2D1B00;
  font-weight: 500;
  display: block;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 30rpx;
  background: #FFF8F0;
  border: 2rpx solid #F0E8DE;
  border-radius: 16rpx;
  font-size: 32rpx;
  box-sizing: border-box;
}

.register-btn {
  width: 100%;
  margin-top: 24rpx;
}

.footer {
  text-align: center;
  margin-top: 100rpx;
}

.footer-link {
  font-size: 28rpx;
  color: #C41E1E;
}
```

- [ ] **Step 5: Commit**

```bash
git add client-miniapp/pages/my-participations/my-participations.wxss \
      client-miniapp/pages/registration-success/registration-success.wxss \
      client-miniapp/pages/qr-code/qr-code.wxss \
      client-miniapp/pages/phone-register/phone-register.wxss
git commit -m "feat(client): remaining pages elderly redesign — unified red/gold theme, large text"
```

---

### Task 6: Merchant — Login + Scan Verify + Dashboard

**Files:**
- Modify: `merchant-miniapp/pages/login/login.wxss`
- Modify: `merchant-miniapp/pages/scan-verify/scan-verify.wxss`
- Modify: `merchant-miniapp/pages/dashboard/dashboard.wxss`

- [ ] **Step 1: Update login.wxss — replace file**

```wxss
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  width: 80%;
  text-align: center;
}

.login-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.login-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #2D1B00;
  margin-bottom: 16rpx;
}

.login-desc {
  font-size: 28rpx;
  color: #8B7A66;
  margin-bottom: 80rpx;
}

.login-btn {
  width: 100%;
  margin-bottom: 30rpx;
}

.login-hint {
  font-size: 26rpx;
  color: #8B7A66;
}
```

- [ ] **Step 2: Update scan-verify.wxss — replace file**

```wxss
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-container {
  text-align: center;
  width: 80%;
}

.scan-icon {
  font-size: 140rpx;
  margin-bottom: 36rpx;
}

.scan-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #2D1B00;
  display: block;
  margin-bottom: 24rpx;
}

.scan-desc {
  font-size: 28rpx;
  color: #8B7A66;
  display: block;
  line-height: 1.8;
}

.scan-btn {
  margin-top: 80rpx;
  width: 100%;
}
```

- [ ] **Step 3: Update dashboard.wxss — replace file**

```wxss
.page { min-height: 100vh; padding-bottom: 30rpx; }

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  padding: 0 24rpx;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 28rpx 20rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.stat-num {
  font-size: 52rpx;
  font-weight: 700;
  color: #D4A030;
  display: block;
}

.stat-label {
  font-size: 26rpx;
  color: #8B7A66;
  display: block;
  margin-top: 8rpx;
}

.menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16rpx;
  padding: 0 24rpx;
}

.menu-item {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx 16rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.menu-icon {
  font-size: 56rpx;
  display: block;
  margin-bottom: 12rpx;
}

.menu-name {
  font-size: 28rpx;
  color: #2D1B00;
  display: block;
}
```

- [ ] **Step 4: Commit**

```bash
git add merchant-miniapp/pages/login/login.wxss \
      merchant-miniapp/pages/scan-verify/scan-verify.wxss \
      merchant-miniapp/pages/dashboard/dashboard.wxss
git commit -m "feat(merchant): login + scan + dashboard elderly redesign — red/gold, larger stats cards"
```

---

### Task 7: Merchant — Activity pages (management, detail, create)

**Files:**
- Modify: `merchant-miniapp/pages/activity-management/activity-management.wxss`
- Modify: `merchant-miniapp/pages/activity-detail/activity-detail.wxss`
- Modify: `merchant-miniapp/pages/activity-create/activity-create.wxss`

- [ ] **Step 1: Update activity-management.wxss — replace file**

```wxss
.page { min-height: 100vh; padding-bottom: 30rpx; }

.top-bar {
  padding: 24rpx 24rpx;
  background: #FFFFFF;
}

.create-btn {
  width: 100%;
}

.filter-bar {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background: #FFFFFF;
  border-bottom: 2rpx solid #F0E8DE;
  overflow-x: auto;
  white-space: nowrap;
}

.filter-item {
  flex-shrink: 0;
  padding: 14rpx 32rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #2D1B00;
  background: #FFF8F0;
}

.filter-item.active {
  background: #C41E1E;
  color: #FFFFFF;
}

.act-item {
  margin-bottom: 16rpx;
}

.act-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.act-title {
  font-size: 32rpx;
  font-weight: 600;
  flex: 1;
  color: #2D1B00;
}

.act-status {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  white-space: nowrap;
}

.status-draft { background: #F0E8DE; color: #8B7A66; }
.status-published { background: #E8F5E9; color: #2E7D32; font-weight: 600; }
.status-ended { background: #FFF8F0; color: #2D1B00; border: 2rpx solid #D4A030; }
.status-unpublished { background: #C41E1E; color: #FFFFFF; }

.act-meta {
  display: flex;
  gap: 24rpx;
  font-size: 28rpx;
  color: #8B7A66;
  margin-bottom: 12rpx;
}

.act-time {
  font-size: 26rpx;
  color: #8B7A66;
  margin-bottom: 20rpx;
}

.act-actions {
  display: flex;
  gap: 16rpx;
}
```

- [ ] **Step 2: Update activity-detail.wxss (merchant) — replace file**

```wxss
.page { min-height: 100vh; padding-bottom: 30rpx; }

.card {
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 18rpx 0;
  border-bottom: 2rpx solid #F0E8DE;
  font-size: 30rpx;
}
.info-row:last-child { border-bottom: none; }

.info-label { color: #8B7A66; }
.info-row text:last-child { color: #2D1B00; }

.filter-bar {
  display: flex;
  gap: 16rpx;
  padding: 0 24rpx 20rpx;
  overflow-x: auto;
}

.filter-item {
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #2D1B00;
  background: #FFF8F0;
  flex-shrink: 0;
}

.filter-item.active { background: #C41E1E; color: #FFFFFF; }

.reg-item { margin-bottom: 16rpx; }

.reg-user {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 12rpx;
}

.reg-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}

.reg-info {
  flex: 1;
}

.reg-name {
  font-size: 30rpx;
  color: #2D1B00;
  display: block;
  margin-bottom: 6rpx;
}

.reg-type {
  font-size: 24rpx;
  color: #8B7A66;
}

.reg-time {
  font-size: 26rpx;
  color: #8B7A66;
  margin-left: 96rpx;
}
```

- [ ] **Step 3: Update activity-create.wxss — replace file**

```wxss
.page {
  min-height: 100vh;
  padding-bottom: 130rpx;
}

.form-container {
  padding: 24rpx;
}

.form-group {
  margin-bottom: 36rpx;
}

.form-label {
  font-size: 30rpx;
  color: #2D1B00;
  font-weight: 500;
  display: block;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 28rpx;
  background: #FFF8F0;
  border: 2rpx solid #F0E8DE;
  border-radius: 16rpx;
  font-size: 30rpx;
  box-sizing: border-box;
  line-height: 88rpx;
}

.form-textarea {
  width: 100%;
  padding: 24rpx 28rpx;
  background: #FFF8F0;
  border: 2rpx solid #F0E8DE;
  border-radius: 16rpx;
  font-size: 30rpx;
  min-height: 200rpx;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 24rpx;
}

.half {
  flex: 1;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  padding: 24rpx;
  display: flex;
  gap: 20rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.bottom-bar button {
  flex: 1;
}
```

- [ ] **Step 4: Commit**

```bash
git add merchant-miniapp/pages/activity-management/activity-management.wxss \
      merchant-miniapp/pages/activity-detail/activity-detail.wxss \
      merchant-miniapp/pages/activity-create/activity-create.wxss
git commit -m "feat(merchant): activity pages elderly redesign — unified red/gold, larger form inputs"
```

---

### Task 8: Merchant — Remaining pages (member-management, member-detail, verification-confirm, admin/*)

**Files:**
- Modify: `merchant-miniapp/pages/member-management/member-management.wxss`
- Modify: `merchant-miniapp/pages/member-detail/member-detail.wxss`
- Modify: `merchant-miniapp/pages/verification-confirm/verification-confirm.wxss`
- Modify: `merchant-miniapp/pages/admin/vip-management/vip-management.wxss`
- Modify: `merchant-miniapp/pages/admin/ad-config/ad-config.wxss`
- Modify: `merchant-miniapp/pages/admin/whitelist/whitelist.wxss`

- [ ] **Step 1: Update member-management.wxss — replace file**

```wxss
.page { min-height: 100vh; padding-bottom: 30rpx; }

.search-bar {
  padding: 20rpx 24rpx;
}

.search-input {
  width: 100%;
  height: 80rpx;
  padding: 0 30rpx;
  background: #FFF8F0;
  border: 2rpx solid #F0E8DE;
  border-radius: 40rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.member-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #2D1B00;
  display: block;
  margin-bottom: 8rpx;
}

.member-stats {
  text-align: right;
}

.member-points {
  font-size: 28rpx;
  color: #8B7A66;
}

.member-arrow {
  font-size: 36rpx;
  color: #D4A030;
  margin-left: 12rpx;
}
```

- [ ] **Step 2: Update member-detail.wxss — replace file**

```wxss
.page { min-height: 100vh; padding-bottom: 30rpx; }

.profile-header {
  background: #C41E1E;
  padding: 60rpx 24rpx;
  text-align: center;
  color: #FFFFFF;
  border-bottom: 4rpx solid #D4A030;
}

.profile-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255,255,255,0.3);
  margin-bottom: 24rpx;
}

.profile-name {
  font-size: 36rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}

.card {
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 18rpx 0;
  border-bottom: 2rpx solid #F0E8DE;
  font-size: 30rpx;
}
.info-row:last-child { border-bottom: none; }

.info-label { color: #8B7A66; }
.info-row text:last-child { color: #2D1B00; }
```

- [ ] **Step 3: Update verification-confirm.wxss — replace file**

```wxss
.page { min-height: 100vh; padding-bottom: 200rpx; }

.card { margin-bottom: 16rpx; }

.user-section {
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
}

.user-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #2D1B00;
  display: block;
  margin-bottom: 12rpx;
}

.section-label {
  font-size: 32rpx;
  font-weight: 600;
  color: #2D1B00;
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  font-size: 30rpx;
  border-bottom: 2rpx solid #F0E8DE;
}
.info-row:last-child { border-bottom: none; }

.info-label { color: #8B7A66; }

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  padding: 24rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}
```

- [ ] **Step 4: Update vip-management.wxss — replace file**

```wxss
.page { min-height: 100vh; padding-bottom: 30rpx; }

.search-bar {
  padding: 20rpx 24rpx;
}

.search-input {
  width: 100%;
  height: 80rpx;
  padding: 0 30rpx;
  background: #FFF8F0;
  border: 2rpx solid #F0E8DE;
  border-radius: 40rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.member-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #2D1B00;
  display: block;
  margin-bottom: 8rpx;
}

.vip-btn.grant {
  background: #D4A030;
  color: #FFFFFF;
  border: none;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
}
.vip-btn.revoke {
  background: #FFFFFF;
  color: #C62828;
  border: 2rpx solid #C62828;
  border-radius: 16rpx;
  font-size: 26rpx;
}
```

- [ ] **Step 5: Update ad-config.wxss — replace file**

```wxss
.page { min-height: 100vh; padding-bottom: 30rpx; }

.top-bar { padding: 24rpx 24rpx; background: #FFFFFF; }
.create-btn { width: 100%; }

.ad-item { margin-bottom: 16rpx; }
.ad-header { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.ad-name { font-size: 32rpx; font-weight: 600; color: #2D1B00; }
.ad-status { font-size: 24rpx; padding: 8rpx 20rpx; border-radius: 24rpx; }
.ad-status.active { background: #E8F5E9; color: #2E7D32; font-weight: 600; }
.ad-status.inactive { background: #F0E8DE; color: #8B7A66; }

.ad-meta { display: flex; gap: 24rpx; font-size: 26rpx; color: #8B7A66; }

/* Modal */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal-content {
  background: #FFFFFF; border-radius: 20rpx; padding: 40rpx;
  width: 85%; max-height: 80vh; overflow-y: auto;
}
.modal-title {
  font-size: 36rpx; font-weight: 700; margin-bottom: 36rpx; text-align: center; color: #2D1B00;
}
.form-group { margin-bottom: 28rpx; }
.form-label { font-size: 28rpx; color: #2D1B00; display: block; margin-bottom: 12rpx; }
.form-input { width: 100%; height: 80rpx; padding: 0 24rpx; background: #FFF8F0; border: 2rpx solid #F0E8DE; border-radius: 16rpx; font-size: 28rpx; box-sizing: border-box; line-height: 80rpx; }
.modal-actions { display: flex; margin-top: 36rpx; gap: 20rpx; }
.modal-actions button { flex: 1; }
```

- [ ] **Step 6: Update whitelist.wxss — replace file**

```wxss
.page { min-height: 100vh; padding-bottom: 30rpx; }
.top-bar { padding: 24rpx 24rpx; background: #FFFFFF; }
.create-btn { width: 100%; }

.item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.item-phone { font-size: 32rpx; font-weight: 500; color: #2D1B00; display: block; }
.item-name { font-size: 26rpx; color: #8B7A66; display: block; margin-top: 6rpx; }

.danger { color: #C62828; border-color: #C62828; }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal-content {
  background: #FFFFFF; border-radius: 20rpx; padding: 40rpx;
  width: 85%;
}
.modal-title { font-size: 36rpx; font-weight: 700; margin-bottom: 36rpx; text-align: center; color: #2D1B00; }
.form-group { margin-bottom: 28rpx; }
.form-label { font-size: 28rpx; color: #2D1B00; display: block; margin-bottom: 12rpx; }
.form-input { width: 100%; height: 80rpx; padding: 0 24rpx; background: #FFF8F0; border: 2rpx solid #F0E8DE; border-radius: 16rpx; font-size: 28rpx; box-sizing: border-box; line-height: 80rpx; }
.modal-actions { display: flex; margin-top: 36rpx; gap: 20rpx; }
.modal-actions button { flex: 1; }
```

- [ ] **Step 7: Commit**

```bash
git add merchant-miniapp/pages/member-management/member-management.wxss \
      merchant-miniapp/pages/member-detail/member-detail.wxss \
      merchant-miniapp/pages/verification-confirm/verification-confirm.wxss \
      merchant-miniapp/pages/admin/vip-management/vip-management.wxss \
      merchant-miniapp/pages/admin/ad-config/ad-config.wxss \
      merchant-miniapp/pages/admin/whitelist/whitelist.wxss
git commit -m "feat(merchant): remaining pages elderly redesign — member management, admin panels"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Every section of the design spec maps to a task:
  - Color system → Task 1 (global styles)
  - Typography/spacing → Task 1 (global base font 32rpx, all page .wxss use larger values)
  - Components (buttons, cards, tags, tabBar) → Task 1 + app.json changes
  - Client pages (index, detail, profile, points, others) → Tasks 2, 3, 4, 5
  - Merchant pages (login, scan, dashboard, activity, member, admin) → Tasks 6, 7, 8
- [x] **No placeholders:** All files have complete replacement code. Exact colors, sizes, and values specified.
- [x] **Type consistency:** CSS class names match between WXML and WXSS (same `.card`, `.btn-primary`, `.tag-vip` as before, just restyled).
- [x] **No JS logic changes:** All tasks are WXSS/WXML/JSON only — no .js files touched.
