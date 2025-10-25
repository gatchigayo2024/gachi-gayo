-- users 테이블에 kakao_channel_added 컬럼 추가
ALTER TABLE users ADD COLUMN kakao_channel_added INTEGER DEFAULT 0;

-- 기존 users 업데이트 (선택)
UPDATE users SET kakao_channel_added = 0 WHERE kakao_channel_added IS NULL;
