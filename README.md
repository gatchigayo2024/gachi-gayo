# 같이가요 (Gachi-Gayo)

음식점의 특가 할인을 제공하고, 같이 갈 사람과 함께 갈 수 있게 하는 서비스입니다.

## 프로젝트 개요

- **이름**: 같이가요
- **목적**: 특가 할인 음식점을 지인과 함께 가거나, 새로운 사람을 찾아서 함께 갈 수 있는 플랫폼
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database + TailwindCSS

## 공개 URL

- **서비스**: https://3000-inksaj2ljlot1y004buxr-0e616f0a.sandbox.novita.ai
- **특가 할인 API**: https://3000-inksaj2ljlot1y004buxr-0e616f0a.sandbox.novita.ai/api/deals
- **같이가요 API**: https://3000-inksaj2ljlot1y004buxr-0e616f0a.sandbox.novita.ai/api/gatherings

## 데이터 아키텍처

### 데이터 모델

1. **users (사용자)**: 카카오톡 연동 로그인 사용자 정보
2. **special_deals (특가 할인)**: 음식점 특가 할인 포스팅
3. **gatherings (같이가요)**: 같이 갈 사람 찾기 포스팅
4. **gathering_applications (동행 신청)**: 같이가요 신청 내역
5. **deal_likes (특가 할인 좋아요)**
6. **gathering_likes (같이가요 좋아요)**

### 저장소 서비스

- **Cloudflare D1 Database**: SQLite 기반 관계형 데이터베이스
  - 로컬 개발: `.wrangler/state/v3/d1` (--local 플래그 사용)
  - 프로덕션: Cloudflare D1 (배포 시 생성 필요)

### 데이터 흐름

1. 사용자가 카카오톡으로 로그인
2. 특가 할인 포스팅 조회 및 좋아요
3. 특가 할인 상세에서 "같이 갈 사람 찾기" 작성
4. 다른 사용자가 동행 신청
5. 관리자가 매칭 후 카카오톡 채팅방 생성

## 주요 기능

### ✅ 완성된 기능

#### 1. 특가 할인 화면
- 인스타그램 스타일 피드
- 이미지 슬라이더 (좌우 스와이프)
- 좋아요 기능
- 연관 같이가요 포스팅 개수 표시
- 공유하기
- 상세 페이지 보기

#### 2. 특가 할인 상세 페이지
- 다중 이미지 슬라이더
- 상세 정보 (제목, 부제목, 본문)
- 장소 정보
- 지인에게 공유하기
- 지인들과 같이가기 (채팅방 생성 신청)
- 같이 갈 사람 찾기 목록
- 같이가요 포스팅 작성

#### 3. 같이가요 화면
- 포스팅 목록 조회
- 작성자, 작성일, 제목, 내용 (2줄)
- 날짜, 시간, 인원
- 장소명과 주소
- 좋아요 및 모집 상태
- 포스팅 상세 보기

#### 4. 같이가요 상세 페이지
- 포스팅 전체 내용
- 날짜, 시간, 인원 정보
- 장소 정보 (네이버 지도 연동 가능)
- 좋아요 기능
- 동행 신청 (질문에 답변)
- 신청 상태 표시 (수락 대기 중/수락됨)

#### 5. 같이가요 작성 페이지
- 제목, 내용 입력
- 날짜, 시간 선택 (또는 자유 텍스트)
- 최대 인원 설정
- 장소 자동 입력 (연관 특가 할인)
- 동행 신청자 대상 질문 작성
- 채팅방 생성 신청

#### 6. MY 화면
- 카카오 로그인/가입
- 내가 쓴 같이가요 (수정/삭제)
- 신청한 같이가요 (상태 확인)
- 내 좋아요 (특가 할인 + 같이가요)
- 로그아웃

#### 7. 인증 시스템
- 카카오톡 연동 로그인 (MVP: 테스트 로그인)
- 로컬 스토리지 세션 관리
- 로그인 필요 기능 자동 리다이렉트

### 🔄 구현 예정 기능

1. **실제 카카오톡 로그인 연동**
   - 카카오 개발자 JavaScript 키 필요
   - OAuth 인증 플로우
   
2. **관리자 이메일 알림**
   - 지인들과 같이가기 신청 시
   - 같이가요 포스팅 작성 시
   - 동행 신청 시
   
3. **카카오톡 채팅방 자동 생성**
   - 카카오톡 API 연동
   - 그룹 채팅방 생성 및 초대

4. **네이버 지도 연동**
   - 장소 검색
   - 지도 썸네일 표시
   - 네이버 지도 앱 연결

5. **포스팅 관리**
   - 같이가요 포스팅 수정
   - 모집 마감 기능
   - 동행 신청 수락/거절

## 사용자 가이드

### 서비스 이용 방법

1. **특가 할인 둘러보기**
   - 로그인 없이 특가 할인 포스팅 조회 가능
   - 이미지 슬라이더로 여러 사진 확인

2. **로그인하기**
   - 기능 사용을 위해서는 로그인 필요
   - "카카오로 가입하기" 버튼 클릭 (MVP: 테스트 이름 입력)

3. **특가 할인 상세 보기**
   - "자세히 보기" 클릭
   - 상세 정보 및 연관 같이가요 확인

4. **같이 갈 사람 찾기**
   - 특가 할인 상세에서 "작성하기" 클릭
   - 제목, 내용, 날짜, 시간, 인원 입력
   - 동행 신청자에게 할 질문 작성
   - "채팅방 생성 신청하기" 클릭

5. **동행 신청하기**
   - 같이가요 포스팅 클릭
   - "동행 신청하기" 버튼 클릭
   - 질문에 답변 작성
   - 작성자 수락 대기

6. **MY 페이지에서 관리**
   - 내가 쓴 같이가요 확인 및 삭제
   - 신청한 같이가요 상태 확인
   - 좋아요한 포스팅 모아보기

## 배포 상태

- **플랫폼**: Cloudflare Pages (배포 예정)
- **현재 상태**: ✅ 로컬 개발 환경 실행 중
- **데이터베이스**: Cloudflare D1 (로컬 모드)
- **마지막 업데이트**: 2025-10-19

## 개발 가이드

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 데이터베이스 초기화
npm run db:migrate:local
npm run db:seed

# 빌드
npm run build

# PM2로 개발 서버 시작
npm run clean-port
pm2 start ecosystem.config.cjs

# 로그 확인
pm2 logs --nostream

# 서버 재시작
npm run clean-port
pm2 restart webapp

# 서버 중지
pm2 delete webapp
```

### API 엔드포인트

#### 인증
- `POST /api/auth/login` - 로그인/회원가입

#### 특가 할인
- `GET /api/deals` - 목록 조회
- `GET /api/deals/:id` - 상세 조회
- `POST /api/deals/:id/like` - 좋아요 토글

#### 같이가요
- `GET /api/gatherings` - 목록 조회
- `GET /api/gatherings/:id` - 상세 조회
- `POST /api/gatherings` - 포스팅 작성
- `PUT /api/gatherings/:id` - 포스팅 수정
- `DELETE /api/gatherings/:id` - 포스팅 삭제
- `POST /api/gatherings/:id/like` - 좋아요 토글
- `POST /api/gatherings/:id/apply` - 동행 신청

#### MY
- `GET /api/my/gatherings` - 내가 쓴 같이가요
- `GET /api/my/applications` - 신청한 같이가요
- `GET /api/my/liked-deals` - 좋아요한 특가 할인
- `GET /api/my/liked-gatherings` - 좋아요한 같이가요

### 프로덕션 배포

```bash
# Cloudflare D1 데이터베이스 생성 (최초 1회)
npx wrangler d1 create webapp-production

# wrangler.jsonc에 database_id 업데이트 필요

# 프로덕션 마이그레이션
npx wrangler d1 migrations apply webapp-production

# 배포
npm run deploy:prod
```

## 다음 단계 권장사항

1. **카카오 개발자 계정 설정**
   - JavaScript 키 발급
   - 리다이렉트 URI 설정
   - app.js의 Kakao.init() 활성화

2. **이메일 알림 서비스 연동**
   - SendGrid, Mailgun 등 이메일 서비스 선택
   - Cloudflare Workers에서 이메일 발송 구현

3. **Cloudflare Pages 배포**
   - Cloudflare 계정 생성
   - D1 데이터베이스 생성
   - Pages 프로젝트 생성 및 배포

4. **네이버 지도 API 연동**
   - 네이버 개발자 계정 생성
   - Maps API 키 발급
   - 장소 검색 및 지도 표시 구현

5. **실제 테스트 데이터 추가**
   - 실제 음식점 정보
   - 실제 이미지 업로드
   - 다양한 특가 할인 포스팅

## 기술 문서

- **프레임워크**: [Hono](https://hono.dev/)
- **데이터베이스**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **배포 플랫폼**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **스타일링**: [TailwindCSS](https://tailwindcss.com/)
- **아이콘**: [Font Awesome](https://fontawesome.com/)

## 라이선스

이 프로젝트는 MVP(Minimum Viable Product) 버전입니다.
