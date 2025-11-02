-- 외래 키 제약 조건 비활성화
PRAGMA foreign_keys = OFF;

-- 기존 데이터 삭제
DELETE FROM gathering_likes;
DELETE FROM deal_likes;
DELETE FROM gathering_applications;
DELETE FROM gatherings;
DELETE FROM special_deals;

-- 특가할인 데이터 복원
INSERT INTO special_deals (id, title, subtitle, content, images, place_name, place_address, place_lat, place_lng, created_at) VALUES
(1, '연희동 감성 와인바 <와인률연희>', '특가 할인 이벤트 선착순 10명 30% 할인', '안녕하세요. 연희동 감성 와인바 <와인률연희>에서 특별 할인 이벤트를 개최합니다. 30% 할인 가격 기회를 놓치지 마세요. 

메뉴 1. 양갈비
사장님이 직접 불향 입혀 구워주시는 양갈비. 숙성된 고기로 부드러워요.

메뉴 2. 로제 파스타
새우와 소프트크랩이 들어간 진한 맛의 로제 파스타. 저희 시그니처 메뉴에요.

벽면 가득 진열된 와인과 고급스러운 인테리어, 잔잔히 울려퍼지는 김동률 음악… 특별한 날에는 <와인률 연희>', '["https://popmenucloud.com/cdn-cgi/image/width=1200,height=1200,format=auto,fit=scale-down/zovhgdjk/4d1449e5-e2dd-43ee-9078-4db21c93692c.jpg", "https://nomadette.com/wp-content/uploads/2021/11/Shrimp-Rose-Pasta-Nomadette.jpg", "https://cdn.prod.website-files.com/63d06722a6f6c82db2e3292f/674070ac57c44d1e7b6d6c83_67406e6324dba8fb98534022_Bar%2520interior%2520with%2520bar%2520chairs%2520and%2520lights%2520at%2520night.jpeg"]', '와인률연희', '서울 서대문구 연희로10가길 50 1층', 37.5707894, 126.9283785, '2025-10-21 14:03:16'),

(2, '강남 프리미엄 스테이크하우스', '오픈 기념 50% 할인', '강남에 새로 오픈한 프리미엄 스테이크하우스입니다. 오픈 기념으로 50% 할인 이벤트를 진행합니다.', '["https://rosebudsteak.com/wp-content/uploads/2024/08/RB-Steak-Kitchen-83-1.jpg", "https://www.thepostoakhotel.com/img/mastros/Mastros2.jpg"]', '스테이크하우스 강남', '서울시 강남구 테헤란로 123', 37.504, 127.04, '2025-10-21 14:03:16'),

(3, '을지로 감성 선술집', '회원 가입 시 생맥주 무료', '을지로 감성 선술집에서 회원 가입하시는 모든 분께 생맥주 1잔을 무료로 제공합니다.', '["https://middleclass.sg/wp-content/uploads/2021/03/Mixed-Korean-Fried-Chicken-with-Soju-and-Beer.jpg", "https://kimchimari.com/wp-content/uploads/2023/05/korean-bar-food-collage.jpg", "https://www.yourlittleblackbook.me/wp-content/uploads/2021/11/sojubar-amsterdam-Snapinsta.app_350091516_1966111153765521_5794677704145391881_n_1080-700x525.jpg"]', '을지선술', '서울시 중구 을지로3가 123', 37.566, 126.991, '2025-10-21 14:03:16');

-- 외래 키 제약 조건 활성화
PRAGMA foreign_keys = ON;
