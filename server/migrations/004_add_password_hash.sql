-- ============================
-- 004: 添加 password_hash 列
-- 用途：商家/管理员使用密码登录管理后台
--
-- 执行方式:
--   mysql -h <host> -P <port> -u <user> -p <db> < 004_add_password_hash.sql
-- ============================

-- 添加 password_hash 列（允许 NULL，兼容现有微信登录用户）
ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER avatar_url;
