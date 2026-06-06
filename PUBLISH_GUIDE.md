# 🚀 微信小程序发布指南 — 分步实施

> 当前日期：2026-06-06 | 项目：积分活动小程序

---

## 第一步：前置准备（一次性）

### 1.1 注册微信小程序

1. 访问 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 点击「立即注册」→ 选择「小程序」
2. 填写邮箱、密码，激活账号
3. 选择主体类型（企业/个体工商户/个人）
   - **个人**：无需营业执照，但不能使用微信支付
   - **企业**：需要营业执照，功能完整
4. 完成微信认证（企业需缴纳 300 元/年认证费）

### 1.2 获取关键信息

注册完成 → 登录后台 → 「开发」→「开发管理」→「开发设置」：

| 信息 | 位置 | 用途 |
|------|------|------|
| **AppID** | 开发→开发设置 | 小程序唯一标识 |
| **AppSecret** | 开发→开发设置 | 服务端调用 API 密钥 |

### 1.3 选择类目

「设置」→「基本设置」→「服务类目」：
- 建议选择：**生活服务 > 百货/超市/便利店**
- 或：**商家自营 > 百货**

---

## 第二步：后端部署（前置条件）

> ⚠️ 小程序 **必须使用 HTTPS 域名**，不支持 IP 和 HTTP。

### 2.1 准备域名 + SSL 证书

```
域名示例：api.yourdomain.com
SSL 要求：TLS 1.2+，有效证书（推荐 Let's Encrypt 或阿里云免费证书）
```

### 2.2 部署后端服务

```bash
# 1. 上传代码到服务器
scp -r server/ user@your-server:/app/

# 2. 安装依赖
cd /app/server && npm install --production

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入：
#   PORT=4001
#   NODE_ENV=production
#   DB_HOST=rm-xxx.mysql.rds.aliyuncs.com
#   DB_PORT=4001
#   DB_NAME=five_db
#   DB_USER=five
#   DB_PASSWORD=***
#   WECHAT_APPID=wxXXXXXXXXXXXXXXXX
#   WECHAT_SECRET=xxxxxxxxxxxxxxxx

# 4. 启动（推荐用 PM2）
npm install -g pm2
pm2 start src/app.js --name points-api
pm2 save
pm2 startup
```

### 2.3 配置微信后台域名

登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) →「开发」→「开发管理」→「开发设置」→「服务器域名」：

| 类型 | 域名 |
|------|------|
| **request 合法域名** | `https://api.yourdomain.com` |
| socket 合法域名 | `wss://api.yourdomain.com`（如需） |
| uploadFile 合法域名 | `https://api.yourdomain.com`（如需） |
| downloadFile 合法域名 | `https://api.yourdomain.com`（如需） |

> ⚠️ 每月只能修改 5 次，请确认正确后保存。

---

## 第三步：代码配置（一次性）

### 3.1 修改小程序配置

打开 `miniprogram/utils/config.js`：

```javascript
const config = {
  // 🔴 改为你的 HTTPS API 域名
  apiBaseUrl: 'https://api.yourdomain.com/api/v1',

  // 🔴 如果开通了流量主，填入广告单元 ID
  adUnitId: '',

  // 发布前改为 'production'
  env: 'production',
};
```

### 3.2 修改 project.config.json

```json
{
  "appid": "wxXXXXXXXXXXXXXXXX"  // 🔴 改为你的真实 AppID
}
```

### 3.3 验证后端连接

在微信开发者工具中：
1. 打开项目 → 点击「编译」
2. 查看 Console，确认无网络请求错误
3. 检查登录页能否正常发送验证码

---

## 第四步：微信开发者工具操作

### 4.1 下载开发者工具

- 下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- macOS 选择「macOS x64」或「macOS ARM64」（M 系列芯片）

### 4.2 打开项目

1. 打开微信开发者工具 → 扫码登录
2. 点击「+」→「导入项目」
3. 目录选择：`miniprogram/` 文件夹
4. AppID 填入你的真实 AppID
5. 项目名称：积分活动
6. 点击「确定」

### 4.3 真机预览测试

1. 点击工具栏「预览」→ 生成二维码
2. 用手机微信扫码
3. 在真机上测试所有功能：
   - ✅ 登录（手机号+验证码）
   - ✅ 微信一键登录
   - ✅ 首页活动列表
   - ✅ 签到领积分
   - ✅ 活动兑换
   - ✅ 积分明细
   - ✅ 个人中心

### 4.4 上传代码

1. 确认所有功能正常
2. 点击工具栏「上传」
3. 版本号：`1.0.0`
4. 备注：`初始版本 — 积分活动小程序（签到+兑换+VIP）`
5. 点击「上传」

---

## 第五步：提交审核

### 5.1 进入版本管理

登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) →「管理」→「版本管理」

### 5.2 提交审核

在「开发版本」中找到刚上传的 `1.0.0` → 点击「提交审核」

**审核信息填写模板：**

| 字段 | 填写内容 |
|------|---------|
| 配置功能页面 | `pages/index/index`（首页） |
| 测试账号 | 手机号：`13900000001`，验证码：接入短信后可提供 |
| 备注 | 本小程序为用户提供积分活动服务。用户通过每日签到获取积分，参与商家发布的积分兑换活动，线下扫码核销领取。核心流程：登录→签到→兑换→扫码核销。 |

### 5.3 审核要点

> 以下是审核最容易被打回的问题，请确保全部处理：

| 问题 | 状态 | 处理方式 |
|------|------|---------|
| **隐私弹窗** | ⚠️ | 首次进入需展示隐私协议弹窗，用户同意后才能调用 wx.login 等 API |
| **强制获取手机号** | ✅ | 已提供「微信一键登录」作为替代方案（无需手机号） |
| **类目不匹配** | ⚠️ | 确保选择的类目与实际功能一致 |
| **测试数据** | ⚠️ | 数据库中不要有明显测试内容 |
| **内容安全** | ⚠️ | 如果有用户生成内容（昵称等），需接入 `security.msgSecCheck` |
| **诱导分享** | ✅ | 无「分享后才能获取积分」等诱导逻辑 |
| **页面空白** | ⚠️ | 确保所有页面有兜底（空状态组件已实现） |

---

## 第六步：审核通过 → 发布

1. 审核通过后，在「版本管理」中会收到通知
2. 在「审核版本」中点击「提交发布」
3. 选择发布方式：
   - **全量发布**：所有用户可见
   - **灰度发布**：按 5%/15%/30%/50%/100% 逐步放量

---

## 📊 当前项目状态

### ✅ 已完成
- [x] TabBar 图标已生成（8 个 PNG）
- [x] 统一配置 `utils/config.js`（API 地址、广告单元 ID）
- [x] `request.js` 自动 Token 注入、401 刷新
- [x] 后端 12 张表 MySQL 就绪
- [x] 9 组 API 路由全部就绪
- [x] Leader Web 管理后台（admin/）
- [x] 微信登录 + 短信登录
- [x] 签到 + 连续签到
- [x] VIP 免费兑换 + 积分兑换
- [x] 商家扫码核销
- [x] 订阅消息（兑换成功通知）
- [x] 激励视频广告 SDK 框架

### 🔴 还需要你做
- [ ] 获取真实微信 AppID 和 AppSecret
- [ ] 部署后端到 HTTPS 域名
- [ ] 配置微信后台服务器域名
- [ ] 如需使用广告：开通流量主 + 填入广告单元 ID
- [ ] 如需使用订阅消息：申请模板 + 填入模板 ID
- [ ] 如需使用微信支付：开通商户号 + 配置密钥
- [ ] 首次进入隐私弹窗（审核必需）

---

## 📁 关键文件速查

```
miniprogram/
├── utils/config.js          ← 🔴 API地址 + adUnitId
├── project.config.json      ← 🔴 AppID
├── static/icons/            ← ✅ 8个TabBar图标
├── utils/request.js         ← ✅ 自动请求封装
├── utils/auth.js            ← ✅ 登录认证
├── utils/subscribe.js       ← ✅ 订阅消息工具
└── app.json                 ← ✅ 页面路由配置

server/
├── .env                     ← 🔴 数据库 + 微信密钥
├── src/app.js               ← ✅ Express入口
└── migrations/              ← ✅ 数据库迁移脚本
```
