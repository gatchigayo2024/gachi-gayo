-- 테스트 사용자 추가
INSERT OR IGNORE INTO users (kakao_id, name, phone) VALUES 
  ('test_user_1', '차기유니콘', '010-1234-5678'),
  ('test_user_2', '김철수', '010-2345-6789'),
  ('test_user_3', '이영희', '010-3456-7890');

-- 테스트 특가 할인 포스팅 추가
INSERT OR IGNORE INTO special_deals (title, subtitle, content, images, place_name, place_address) VALUES 
  (
    '연희동 감성 와인바 <와인률연희>',
    '특가 할인 이벤트 선착순 10명 30% 할인',
    '안녕하세요. 연희동 감성 와인바 <와인률연희>에서 특별 할인 이벤트를 개최합니다. 30% 할인 가격 기회를 놓치지 마세요. 

메뉴 1. 양갈비
사장님이 직접 불향 입혀 구워주시는 양갈비. 숙성된 고기로 부드러워요.

메뉴 2. 로제 파스타
새우와 소프트크랩이 들어간 진한 맛의 로제 파스타. 저희 시그니처 메뉴에요.

벽면 가득 진열된 와인과 고급스러운 인테리어, 잔잔히 울려퍼지는 김동률 음악… 특별한 날에는 <와인률 연희>',
    '["https://picsum.photos/400/400?random=1", "https://picsum.photos/400/400?random=2", "https://picsum.photos/400/400?random=3"]',
    '와인률연희',
    '서울시 서대문구 연희로 10가길 50 1층'
  ),
  (
    '강남 프리미엄 스테이크하우스',
    '오픈 기념 50% 할인',
    '강남에 새로 오픈한 프리미엄 스테이크하우스입니다. 오픈 기념으로 50% 할인 이벤트를 진행합니다.',
    '["https://picsum.photos/400/400?random=4", "https://picsum.photos/400/400?random=5"]',
    '스테이크하우스 강남',
    '서울시 강남구 테헤란로 123'
  ),
  (
    '을지로 감성 선술집',
    '회원 가입 시 생맥주 무료',
    '을지로 감성 선술집에서 회원 가입하시는 모든 분께 생맥주 1잔을 무료로 제공합니다.',
    '["https://picsum.photos/400/400?random=6", "https://picsum.photos/400/400?random=7", "https://picsum.photos/400/400?random=8"]',
    '을지선술',
    '서울시 중구 을지로3가 123'
  );

-- 테스트 같이가요 포스팅 추가
INSERT OR IGNORE INTO gatherings (user_id, special_deal_id, title, content, date_text, time_text, place_name, place_address, max_people, current_people, question) VALUES 
  (
    1,
    1,
    '와인률연희 같이 가실 분? 제가 와인은 쏠게요!',
    '안녕하세요~ 와인률연희 너무 가고 싶었던 와인바인데 이번에 특가 할인이 떴네요! 저는 20대 후반 갓 사회 생활 시작한 여자입니다. 같이 가실 분 성별은 상관 없는데 나이는 같은 20대 또래였으면 좋겠어요. 아무쪼록 많은 신청 부탁 드릴게요.',
    '추후 조율',
    '오후 7:00',
    '와인률연희',
    '서울시 서대문구 연희로 10가길 50 1층',
    4,
    2,
    '간단하게 자기소개를 해주실 수 있을까요?'
  ),
  (
    2,
    2,
    '강남 스테이크 같이 드실 분 구합니다',
    '강남 새로 생긴 스테이크하우스 같이 가실 분 구해요. 30대 직장인이고 맛집 탐방 좋아합니다!',
    '2025년 10월 25일',
    '저녁 8시',
    '스테이크하우스 강남',
    '서울시 강남구 테헤란로 123',
    3,
    1,
    '선호하는 스테이크 굽기가 있으신가요?'
  );

-- 테스트 좋아요 추가
INSERT OR IGNORE INTO deal_likes (user_id, special_deal_id) VALUES 
  (1, 1),
  (2, 1),
  (3, 1),
  (1, 2);

INSERT OR IGNORE INTO gathering_likes (user_id, gathering_id) VALUES 
  (2, 1),
  (3, 1);
