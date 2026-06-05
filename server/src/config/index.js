require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'five'
  },
  wechat: {
    customer: {
      appId: process.env.WX_APPID_CUSTOMER || '',
      secret: process.env.WX_SECRET_CUSTOMER || ''
    },
    merchant: {
      appId: process.env.WX_APPID_MERCHANT || '',
      secret: process.env.WX_SECRET_MERCHANT || ''
    }
  },
  qr: {
    secret: process.env.QR_SECRET || 'dev-qr-secret'
  },
  admin: {
    phone: process.env.ADMIN_PHONE || '13800000000'
  },
  ad: {
    rewardVerify: process.env.WX_AD_REWARD_VERIFY === 'true'
  }
};

module.exports = config;
