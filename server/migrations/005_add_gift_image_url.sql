-- 005: 添加礼品图片字段
ALTER TABLE activities ADD COLUMN gift_image_url TEXT NULL AFTER image_url;
