-- 지인들과 같이가기 요청에 인원 수 추가
ALTER TABLE group_chat_requests ADD COLUMN party_size INTEGER DEFAULT 2;
