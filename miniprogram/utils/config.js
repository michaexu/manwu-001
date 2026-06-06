/**
 * 全局配置 — 发布前修改以下值
 * =============================================
 * 上线前必须替换的配置项已用 🔴 标记
 */
const config = {
  // 🔴 API 基础地址 — 替换为你的后端 HTTPS 域名
  apiBaseUrl: 'https://api.yourdomain.com/api/v1',

  // 🔴 广告单元 ID — 在微信「流量主」后台获取
  // 如果未开通流量主功能，保持为空字符串即可
  adUnitId: '',

  // 版本号
  version: '1.0.0',

  // 环境标识
  env: 'development', // 'development' | 'production'
};

module.exports = config;
