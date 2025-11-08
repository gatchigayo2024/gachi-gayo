-- 같이가요 포스팅에 작성자 정보 추가
-- Migration: 0006_add_author_info_to_gatherings.sql

ALTER TABLE gatherings ADD COLUMN gender TEXT;
ALTER TABLE gatherings ADD COLUMN age_group TEXT;
ALTER TABLE gatherings ADD COLUMN job TEXT;
ALTER TABLE gatherings ADD COLUMN self_introduction TEXT;
