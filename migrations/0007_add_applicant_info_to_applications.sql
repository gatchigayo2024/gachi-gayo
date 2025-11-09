-- 동행 신청 테이블에 신청자 정보 추가
ALTER TABLE gathering_applications ADD COLUMN gender TEXT;
ALTER TABLE gathering_applications ADD COLUMN age_group TEXT;
ALTER TABLE gathering_applications ADD COLUMN job TEXT;
ALTER TABLE gathering_applications ADD COLUMN self_introduction TEXT;
