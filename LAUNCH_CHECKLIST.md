# 积分活动小程序 — 上线清单与审核指南

## 📋 上线前 Checklist

### 1. 微信小程序后台配置

- [ ] **注册小程序** — 在 [mp.weixin.qq.com](https://mp.weixin.qq.com) 注册，获取 AppID
- [ ] **类目选择** — 建议选择「生活服务 > 百货/超市/便利店」或「商家自营 > 百货」
- [ ] **完善小程序信息** — 名称、图标（建议108x108px）、简介（4-120字）
- [ ] **获取 AppSecret** — 在「开发 > 开发管理 > 开发设置」中获取

### 2. 服务器域名配置

在「开发 > 开发管理 > 开发设置 > 服务器域名」中配置：

| 类型 | 域名 | 说明 |
|------|------|------|
| request 合法域名 | `https://api.yourdomain.com` | API 接口域名 |
| socket 合法域名 | `wss://ws.yourdomain.com` | WebSocket（如需） |
| uploadFile 合法域名 | `https://upload.yourdomain.com` | 文件上传（如需） |
| downloadFile 合法域名 | `https://cdn.yourdomain.com` | 文件下载（如需） |

> ⚠️ **必须 HTTPS**：所有域名必须配置 SSL 证书，支持 TLS 1.2+

### 3. 隐私与权限配置

- [ ] **用户隐私保护指引** — 在「设置 > 基本设置 > 用户隐私保护指引」中配置
  - 需要声明收集的信息：手机号、微信昵称、头像
  - 使用目的：用户身份识别、积分记录、活动兑换
- [ ] **权限声明** — 在 `app.json` 中已配置：
  - `scope.userLocation` — 展示附近商家
  - `getLocation` — 获取用户位置

### 4. 微信支付（如需）

- [ ] 开通微信支付商户号
- [ ] 在「开发 > 开发管理 > 接口设置」中申请微信支付权限
- [ ] 配置支付回调域名

### 5. 订阅消息（✅ 已实现）

已在「功能 > 订阅消息」中申请以下模板（需要替换为实际模板ID）：

| 场景 | 模板ID占位符 | 说明 |
|------|-------------|------|
| 活动提醒 (activity_remind) | `TMPL_ACTIVITY_REMIND` | 活动即将开始时提醒 |
| 兑换成功 (redeem_success) | `TMPL_REDEEM_SUCCESS` | 兑换成功后通知用户 |
| 签到提醒 (checkin_remind) | `TMPL_CHECKIN_REMIND` | 每日签到提醒 |

> 在 `server/migrations/003_subscription_admin.sql` 中替换占位符为实际模板ID

### 6. 激励视频广告（✅ 已实现）

- [ ] 开通流量主 — 在「功能 > 流量主」中申请
- [ ] 创建广告单元 — 选择「激励视频」类型，获取广告单元ID
- [ ] 替换 `miniprogram/pages/ad-reward/ad-reward.js` 中的 `AD_UNIT_ID`
- [ ] 后端环境变量 `ENABLE_AD_REWARD=true`

### 7. 代码审核要点

审核最容易被打回的问题：

| 问题 | 解决方案 |
|------|---------|
| **没有隐私弹窗** | 进入小程序前展示隐私协议弹窗 |
| **强制获取手机号** | 提供「跳过」或微信一键登录（已实现） |
| **类目不匹配** | 根据实际业务选择正确类目 |
| **涉及UGC内容** | 需要接入内容安全API（`security.msgSecCheck`） |
| **诱导分享** | 不能以「分享后才能获取积分」诱导用户分享 |
| **测试数据** | 提交审核前确保没有测试数据 |

### 8. 上线步骤

```
1. 开发环境测试
   └─ 微信开发者工具 → 预览 → 真机调试
   
2. 上传代码
   └─ 开发者工具 → 上传 → 填写版本号和备注

3. 提交审核
   └─ mp.weixin.qq.com → 版本管理 → 选择版本 → 提交审核
   └─ 填写审核信息：
      - 功能页面: pages/index/index
      - 测试账号: 提供商家和管理员测试账号
      - 备注: 说明核心功能流程

4. 审核通过 → 发布
   └─ 版本管理 → 全量发布（或灰度发布）
```

### 9. 环境变量配置

上线前需要修改的文件：

| 文件 | 变量 | 说明 |
|------|------|------|
| `miniprogram/utils/request.js` | `BASE_URL` | 改为正式API域名 |
| `miniprogram/pages/ad-reward/ad-reward.js` | `AD_UNIT_ID` | 替换为实际广告单元ID |
| `miniprogram/project.config.json` | `appid` | 改为正式AppID |
| `server/.env` | 全部 | 改为生产环境值 |

### 10. 数据库初始化

```bash
# 创建数据库
createdb points_activity

# 执行迁移（按顺序）
psql $DATABASE_URL -f server/migrations/001_init.sql
psql $DATABASE_URL -f server/migrations/002_membership_activity_v2.sql
psql $DATABASE_URL -f server/migrations/003_subscription_admin.sql

# 创建管理员账号（手动执行SQL）
# INSERT INTO users (phone, nick_name, role, points) VALUES ('13800138000', '管理员', 'admin', 0);
```

## 🎯 关键业务流程验证

提交审核前，务必在真机上验证以下流程：

1. ✅ **注册登录** — 微信授权 → 手机号绑定 → 进入首页
2. ✅ **微信一键登录** — 无需手机号，wx.login → 快速进入
3. ✅ **每日签到** — 点击签到 → 积分增加 → 连续签到额外奖励
4. ✅ **看广告赚积分** — 观看激励视频 → 后端发积分 → 奖励动画
5. ✅ **VIP免费兑换** — VIP用户免积分参与活动 → 消耗月度额度
6. ✅ **积分兑换** — 选择活动 → 消耗积分 → 生成兑换码
7. ✅ **商家扫码核销** — 商家扫码 → 确认核销 → 兑换码状态更新
8. ✅ **兑换成功通知** — 兑换后弹窗请求订阅 → 核销后推送通知
9. ✅ **积分明细** — 查看积分变动记录（签到/广告/兑换/管理员赠送）
10. ✅ **管理员后台** — VIP分配/回收、积分调整、全局数据看板

## 📦 项目文件清单（完整版）

```
miniprogram/
├── app.js                        # 应用入口 - Token检查、全局状态
├── app.json                      # 应用配置 - 页面路由、TabBar、权限
├── app.wxss                      # 全局样式 - 设计系统变量
├── project.config.json           # 开发者工具配置
├── sitemap.json                  # 搜索索引配置
├── utils/
│   ├── request.js                # 统一请求封装 - Token注入、401刷新
│   ├── auth.js                   # 认证模块 - 微信登录、手机号注册
│   └── subscribe.js              # 🆕 订阅消息工具 - 授权请求与记录
├── services/
│   ├── activity.js               # 活动服务
│   ├── points.js                 # 积分服务
│   ├── checkin.js                # 签到服务
│   ├── scan.js                   # 扫码服务
│   └── merchant.js               # 商家服务
├── components/
│   ├── activity-card/            # 🆕 活动卡片组件
│   ├── empty-state/              # 🆕 空状态组件
│   ├── loading/                  # 🆕 加载中组件
│   ├── points-card/              # 🆕 积分卡片组件
│   └── tab-bar/                  # TabBar组件
├── pages/
│   ├── index/                    # 首页 - 积分卡片 + 活动列表
│   ├── activity/                 # 活动详情 + 兑换流程
│   ├── profile/                  # 个人中心 + VIP权益
│   ├── login/                    # 登录注册（手机号+微信）
│   ├── scan/                     # 商家扫码核销
│   ├── qrcode/                   # 兑换码展示
│   ├── checkin/                  # 签到记录（日历组件）
│   ├── points/                   # 积分明细
│   ├── merchant/                 # 商家后台首页
│   ├── ad-reward/                # 🆕 看广告赚积分
│   └── redeem-history/           # 🆕 兑换记录
└── subpackages/
    └── merchant-admin/           # 商家管理（分包）
        ├── activity-create/      # 创建活动
        ├── activity-list/        # 活动管理
        └── scan-history/         # 核销记录

server/
├── package.json
├── .env.example
├── migrations/
│   ├── 001_init.sql              # 初始表结构
│   ├── 002_membership_activity_v2.sql  # VIP会员+活动属性
│   └── 003_subscription_admin.sql     # 🆕 订阅消息+管理日志+系统配置
└── src/
    ├── app.js                    # Express入口 - 8组路由挂载
    ├── config/index.js           # 集中配置管理
    ├── middleware/
    │   ├── auth.js               # JWT认证 + 角色授权
    │   ├── errorHandler.js       # 全局错误处理
    │   ├── requestId.js          # 请求ID追踪
    │   └── validate.js           # Zod参数校验
    ├── routes/                   # 路由层 (9组)
    │   ├── auth/routes.js        # 6端点：手机登录/微信登录/短信/刷新/资料
    │   ├── home/routes.js        # 首页聚合数据
    │   ├── activities/routes.js  # 活动+兑换（含订阅消息触发）
    │   ├── points/routes.js      # 积分明细+广告奖励+规则
    │   ├── checkin/routes.js     # 签到+状态+历史
    │   ├── scan/routes.js        # 商家扫码核销
    │   ├── merchant/routes.js    # 商家活动管理
    │   ├── subscription/routes.js # 🆕 订阅授权记录+模板查询
    │   └── admin/routes.js       # 🆕 VIP管理+用户管理+数据看板
    ├── services/                 # 业务逻辑层 (8个)
    │   ├── authService.js        # 🆕 增加微信一键登录/短信验证码
    │   ├── homeService.js        # 首页数据聚合
    │   ├── activityService.js    # VIP/普通双轨兑换+状态筛选
    │   ├── pointsService.js      # 积分发放与记录
    │   ├── checkinService.js     # 签到+连续签到奖励
    │   ├── scanService.js        # 扫码核销事务
    │   ├── merchantService.js    # 商家活动CRUD
    │   ├── subscriptionService.js # 🆕 订阅消息管理+微信发送
    │   └── adminService.js       # 🆕 VIP分配/回收+统计看板+用户管理
    ├── models/db.js              # 数据库连接池+事务
    └── utils/errors.js           # 类型化错误类
```

## 🆕 本次更新摘要 (2026-06-06)

### 微信广告 SDK
- 新增 `pages/ad-reward/` 激励视频广告页面
- 集成 `wx.createRewardedVideoAd` API
- 完整观看后调用 `/api/v1/points/ad-reward` 发放积分
- 每日观看次数限制+进度条+奖励动画

### 订阅消息通知
- 新增 `server/migrations/003_subscription_admin.sql` 迁移
- 新增 `subscriptionService` — 管理模板/授权/发送
- 新增 `miniprogram/utils/subscribe.js` — 前端授权工具
- 兑换成功后自动触发兑换成功通知
- 支持 smartSubscribe 智能订阅提示

### 后端API完善
- auth路由新增 `wechat-login` / `send-sms` / `sms-login` 三个端点
- authService 新增 wechatLogin / smsLogin / sendSmsCode 方法
- 兑换记录支持按状态筛选（redeem-history）

### 管理员后台
- 新增 `adminService` — VIP分配/回收、积分调整、用户管理
- 新增 `admin/routes.js` — 8个管理员端点
- 全局数据看板：用户/活动/兑换/签到/广告多维度统计
- 7天趋势数据（generate_series 时间序列）
- 管理员操作日志记录

### 前端组件
- 新增 `activity-card` 活动卡片组件
- 新增 `empty-state` 空状态组件
- 新增 `loading` 加载中组件
- 新增 `points-card` 积分余额组件
- 新增 `redeem-history` 兑换记录页面
- 修复 profile 菜单跳转路径

## 🚀 后续迭代建议

1. ✅ ~~推送通知~~ — 已实现订阅消息（活动提醒/兑换成功/签到提醒）
2. 分销裂变 — 邀请好友注册双方各得积分
3. 排行榜 — 积分排行榜，激励用户活跃
4. 商家SaaS后台 — Web端商家管理后台（Ardot 设计）
5. ✅ ~~数据看板~~ — 已实现管理员全局统计看板
6. 多级VIP — VIP1-5级，消费/签到升级，更高积分倍率
7. 地图导航 — 接入地图组件，导航至商家门店
8. 微信支付 — 积分充值/付费VIP
