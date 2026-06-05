-- ============================================
-- 会员领物系统 - 测试数据
-- 使用方式: mysql -h rm-uf606r39mc69yc73seo.mysql.rds.aliyuncs.com -P 4001 -u five -p five_db < seed.sql
-- ============================================

-- 清理旧数据（按外键约束顺序）
DELETE FROM ad_claim_records;
DELETE FROM points_records;
DELETE FROM registrations;
DELETE FROM activities;
DELETE FROM ads;
DELETE FROM vip_logs;
DELETE FROM operator_whitelist;
DELETE FROM message_templates;
DELETE FROM members;

-- ========================================
-- 1. 会员（测试登录用）
-- ========================================
INSERT INTO members (id, openid, nickname, avatar_url, phone, member_type, points_balance, created_at, updated_at) VALUES
('m001', 'mock_openid_1111111111111111', '张三', '', '', 'vip', 9999, NOW(), NOW()),
('m002', 'mock_openid_2222222222222222', '李四', '', '', 'regular', 200, NOW(), NOW()),
('m003', 'mock_openid_3333333333333333', '王五', '', '', 'regular', 50, NOW(), NOW()),
('m004', 'mock_openid_4444444444444444', '赵六', '', '', 'regular', 0, NOW(), NOW());

-- ========================================
-- 2. 活动
-- ========================================
INSERT INTO activities (id, title, cover_image, prize_desc, location, start_time, end_time, max_participants, vip_quota, regular_quota, points_required, description, status, current_count, vip_count, regular_count, created_by, created_at, updated_at) VALUES
('a001', '端午好礼大派送', '', '精美端午礼盒一份，内含粽子6个+咸鸭蛋4个', '朝阳区建国路88号门店', '2026-06-08 09:00:00', '2026-06-15 21:00:00', 100, 20, 80, 30, '端午节特别活动，到店即可领取端午礼盒，数量有限先到先得！', 'published', 0, 0, 0, NULL, NOW(), NOW()),

('a002', '夏日清凉饮品免费领', '', '指定饮品任选一杯（冰美式/柠檬茶/气泡水）', '海淀区中关村大街66号门店', '2026-06-10 10:00:00', '2026-06-30 20:00:00', 200, 50, 150, 10, '炎炎夏日，来店里免费领取一杯清凉饮品吧！', 'published', 0, 0, 0, NULL, NOW(), NOW()),

('a003', 'VIP 专属品鉴会', '', '高端红酒品鉴会入场券（含红酒伴手礼）', '朝阳区三里屯路19号 VIP 室', '2026-06-20 14:00:00', '2026-06-20 18:00:00', 30, 30, 0, 0, '仅限 VIP 会员参加的高端红酒品鉴会，名额有限。', 'published', 0, 0, 0, NULL, NOW(), NOW()),

('a004', '新品体验官招募', '', '新品全套体验装（价值198元）', '朝阳区建国路88号门店', '2026-06-12 09:00:00', '2026-06-25 21:00:00', 50, 0, 50, 50, '成为我们的新品体验官，试用即将上市的新品，给出你的真实反馈！', 'published', 0, 0, 0, NULL, NOW(), NOW()),

('a005', '积分翻倍周（草稿）', '', '活动期间消费双倍积分', '所有门店', '2026-07-01 00:00:00', '2026-07-07 23:59:59', 0, 0, 0, 0, '活动说明待完善', 'draft', 0, 0, 0, NULL, NOW(), NOW());

-- ========================================
-- 3. 广告位（积分任务）
-- ========================================
INSERT INTO ads (id, name, ad_unit_id, points_reward, daily_limit, is_active, created_at, updated_at) VALUES
('ad01', '首页Banner广告', 'adunit-xxxxxxxxxxxxx1', 5, 1, TRUE, NOW(), NOW()),
('ad02', '激励视频广告-A', 'adunit-xxxxxxxxxxxxx2', 10, 1, TRUE, NOW(), NOW()),
('ad03', '激励视频广告-B', 'adunit-xxxxxxxxxxxxx3', 15, 1, TRUE, NOW(), NOW()),
('ad04', '插屏广告(测试)', 'adunit-xxxxxxxxxxxxx4', 3, 2, FALSE, NOW(), NOW());

-- ========================================
-- 4. 商家操作员白名单
-- ========================================
INSERT INTO operator_whitelist (id, phone, nickname, is_active, created_at, updated_at) VALUES
('op001', '13800000000', '王经理', TRUE, NOW(), NOW()),
('op002', '13900000001', '李店长', TRUE, NOW(), NOW());

-- ========================================
-- 5. 订阅消息模板（占位）
-- ========================================
INSERT INTO message_templates (id, type, template_id, is_active, created_at, updated_at) VALUES
('mt001', 'signup_success',    'your_signup_success_tmpl_id',    TRUE, NOW(), NOW()),
('mt002', 'activity_reminder', 'your_activity_reminder_tmpl_id', TRUE, NOW(), NOW()),
('mt003', 'claim_success',     'your_claim_success_tmpl_id',    TRUE, NOW(), NOW());

-- ========================================
-- 6. 报名记录（测试用）
-- ========================================
INSERT INTO registrations (id, member_id, activity_id, qr_token, points_cost, status, claimed_at, claimed_by, created_at, cancelled_at) VALUES
('r001', 'm001', 'a001', 'test_token_vip_activity_a001', 0, 'registered', NULL, NULL, NOW(), NULL),
('r002', 'm002', 'a002', 'test_token_regular_activity_a002', 10, 'registered', NULL, NULL, NOW(), NULL);

-- ========================================
-- 7. 积分明细
-- ========================================
INSERT INTO points_records (id, member_id, change_type, change_amount, balance_after, ref_id, remark, created_at) VALUES
('p001', 'm002', 'earn_ad', 10, 210, 'ad02', '观看广告: 激励视频广告-A', NOW()),
('p002', 'm002', 'cost_activity', -10, 200, 'a002', '报名活动: 夏日清凉饮品免费领', NOW()),
('p003', 'm003', 'earn_ad', 10, 60, 'ad02', '观看广告: 激励视频广告-A', NOW()),
('p004', 'm003', 'earn_ad', 5, 65, 'ad01', '观看广告: 首页Banner广告', NOW()),
('p005', 'm003', 'cost_activity', -15, 50, 'a004', '报名活动: 新品体验官招募', NOW());

-- ========================================
-- 查询验证
-- ========================================
SELECT '✅ members' AS tbl, COUNT(*) AS cnt FROM members
UNION ALL SELECT '✅ activities', COUNT(*) FROM activities
UNION ALL SELECT '✅ ads', COUNT(*) FROM ads
UNION ALL SELECT '✅ operator_whitelist', COUNT(*) FROM operator_whitelist
UNION ALL SELECT '✅ registrations', COUNT(*) FROM registrations
UNION ALL SELECT '✅ points_records', COUNT(*) FROM points_records
UNION ALL SELECT '✅ message_templates', COUNT(*) FROM message_templates;
