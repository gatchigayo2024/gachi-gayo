# 같이가요 (Gachi-Gayo)

음식점의 특가 할인을 제공하고, 같이 갈 사람과 함께 갈 수 있게 하는 서비스입니다.

## 프로젝트 개요

- **이름**: 같이가요
- **목적**: 특가 할인 음식점을 지인과 함께 가거나, 새로운 사람을 찾아서 함께 갈 수 있는 플랫폼
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 Database + TailwindCSS

## 공개 URL

- **프로덕션**: https://gatchi-gayo.pages.dev
- **특가 할인 API**: https://gatchi-gayo.pages.dev/api/deals
- **같이가요 API**: https://gatchi-gayo.pages.dev/api/gatherings
- **현재 배포 버전**: https://173b56f3.gatchi-gayo.pages.dev

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
- 전화번호 SMS 인증 (Aligo API 연동)
- 통합 회원가입 모달 (이름, 전화번호, 인증번호 한 화면에)
- 로컬 스토리지 세션 관리
- 로그인 필요 기능 자동 팝업 (좋아요, 같이가요 작성, 동행 신청)
- 로그인 후 원래 작업 자동 재개
- 개발 모드: 콘솔에 인증번호 출력 (실제 SMS 발송 없이 테스트 가능)

#### 8. 카카오 공유 및 딥링크
- 카카오톡 공유 기능 (특가 할인, 같이가요)
- 딥링크로 공유된 포스팅 직접 열기
- URL 파라미터 자동 파싱 (?deal=1, ?gathering=1)

#### 9. 네이버 지도 연동
- 네이버 Static Map API 프록시
- 장소 정보에 지도 이미지 표시
- 클릭 시 네이버 지도 앱/웹 연결
- 실제 음식점 좌표 데이터

### 🔄 구현 예정 기능

1. **관리자 이메일 알림**
   - 지인들과 같이가기 신청 시
   - 같이가요 포스팅 작성 시
   - 동행 신청 시
   
2. **카카오톡 채팅방 자동 생성**
   - 카카오톡 API 연동
   - 그룹 채팅방 생성 및 초대

3. **네이버 지도 추가 기능**
   - 장소 검색 기능
   - Dynamic Map 인터랙션

4. **포스팅 관리**
   - 같이가요 포스팅 수정
   - 모집 마감 기능
   - 동행 신청 수락/거절

## 사용자 가이드

### 서비스 이용 방법

1. **특가 할인 둘러보기**
   - 로그인 없이 특가 할인 포스팅 조회 가능
   - 이미지 슬라이더로 여러 사진 확인

2. **로그인하기**
   - 좋아요, 같이가요 작성, 동행 신청 등의 기능을 사용하려면 로그인 필요
   - 로그인이 필요한 기능 클릭 시 자동으로 "카카오로 가입하기" 팝업 표시
   - 카카오 로그인 완료 후 원래 하려던 작업 자동 실행

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

- **플랫폼**: Cloudflare Pages
- **현재 상태**: ✅ 프로덕션 배포 완료
- **프로덕션 URL**: https://gatchi-gayo.pages.dev
- **데이터베이스**: Cloudflare D1 (프로덕션)
- **마지막 업데이트**: 2025-10-29
- **환경 변수**: 
  - ✅ ALIGO_API_KEY (SMS 인증)
  - ✅ ALIGO_USER_ID (SMS 인증)
  - ✅ ALIGO_SENDER (SMS 발신번호)
  - ✅ KAKAO_JAVASCRIPT_KEY (카카오 공유)

## 중요 안내

### ⚠️ 로컬 개발 환경 데이터 영속성

**로컬 개발 환경에서는 다음 경우에 데이터가 초기화될 수 있습니다:**

1. **샌드박스 재시작**: 일정 시간 비활성 후 샌드박스가 재시작되면 `.wrangler` 디렉토리가 초기화됨
2. **PM2 재시작**: `pm2 restart` 실행 시 wrangler가 데이터베이스를 새로 초기화할 수 있음
3. **db:reset 실행**: `npm run db:reset` 명령어는 로컬 데이터베이스를 완전히 삭제하고 재생성

**데이터 손실 방지 방법:**
- 중요한 테스트 데이터는 `seed.sql`에 추가
- 로컬 개발 중에는 `db:reset` 명령어 실행 자제
- 실제 프로덕션 배포 시에는 Cloudflare D1이 데이터 영속성 보장

**프로덕션 환경에서는 데이터가 영구 보존됩니다.**

### 전화번호 SMS 인증 필수

다음 기능을 사용하려면 전화번호 SMS 인증이 필요합니다:
- ❤️ 좋아요 (특가 할인, 같이가요)
- 📝 같이가요 포스팅 작성
- 🤝 동행 신청

로그인하지 않은 상태에서 위 기능을 클릭하면 자동으로 "전화번호로 가입하기" 팝업이 표시됩니다.

**프로덕션 환경**: 실제 SMS 발송 (Aligo API)
**개발 환경**: 콘솔에 인증번호 출력 (또는 Aligo IP 인증 실패 시 자동 개발 모드 전환)

### 외부 서비스 설정

#### 1. Aligo SMS API (전화번호 인증)

이미 설정 완료:
- ✅ API 키: Cloudflare Pages 시크릿으로 설정됨
- ✅ 사용자 ID: gatchigayo2024
- ✅ 발신번호: 070-4036-7411

**추가 필요 작업**:
- Aligo 콘솔에서 IP 인증 해제 (또는 Cloudflare Workers IP 등록)

#### 2. 카카오 개발자 설정 (공유 기능)

카카오톡 공유하기 기능을 사용하려면 [Kakao Developers](https://developers.kakao.com/)에서:
1. ✅ 애플리케이션 생성 (완료)
2. ✅ JavaScript 키 발급 (완료: f43c7a0d5a13e6f50277e07f8a037b08)
3. ⚠️ **플랫폼 설정 > Web > 사이트 도메인 등록 필요**
   - 등록할 도메인: `https://gatchi-gayo.pages.dev`
   - 등록할 도메인: `https://173b56f3.gatchi-gayo.pages.dev`
4. ✅ 환경 변수 설정 완료 (Cloudflare Pages 시크릿)

#### 3. 네이버 지도 API

네이버 지도 표시를 위해 [Naver Cloud Console](https://console.ncloud.com/)에서:
1. ✅ Application 생성 (완료)
2. ✅ Client ID/Secret 발급 (완료)
3. ⚠️ **Web Service URL 등록 필요**
   - 등록할 URL: `https://gatchi-gayo.pages.dev`
   - 등록할 URL: `https://173b56f3.gatchi-gayo.pages.dev`
4. ✅ 환경 변수 설정 완료 (wrangler.jsonc)

**로컬 개발 환경 설정:**
```bash
# .dev.vars 파일
ALIGO_API_KEY=i8bzwls1lyjfsp56pzfenqifhf4uqc6x
ALIGO_USER_ID=gatchigayo2024
ALIGO_SENDER=070-4036-7411
KAKAO_JAVASCRIPT_KEY=f43c7a0d5a13e6f50277e07f8a037b08
```

### 디버깅

모든 주요 기능에 콘솔 로그가 추가되어 있습니다:
- 🔐 카카오 로그인 과정
- ✅ API 요청 성공
- ❌ API 요청 실패 (상세 에러 메시지)
- 📝/🤝/❤️: 각 기능별 이모지로 구분

브라우저 개발자 도구(F12) > Console 탭에서 확인 가능합니다.

## 개발 가이드

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 데이터베이스 초기화 (최초 1회만)
npm run db:migrate:local
npm run db:seed

# 빌드
npm run build

# PM2로 개발 서버 시작
npm run clean-port
pm2 start ecosystem.config.cjs

# 로그 확인
pm2 logs --nostream

# 서버 재시작 (데이터 유지)
pm2 restart webapp

# 서버 중지
pm2 delete webapp

# 데이터베이스 완전 초기화 (주의: 모든 데이터 삭제)
npm run db:reset
```

**⚠️ 데이터 영속성 중요 사항:**

- ✅ **데이터는 영구적으로 유지됩니다**: `.wrangler/state/v3/d1/` 디렉토리에 SQLite 파일로 저장
- ✅ **PM2 재시작 시 데이터 보존**: `pm2 restart webapp` 실행해도 데이터 유지됨
- ✅ **빌드 시 데이터 보존**: `npm run build` 실행해도 데이터 유지됨
- ⚠️ **데이터 삭제 주의**: `npm run db:reset`은 `.wrangler/state/v3/d1/` 디렉토리를 완전히 삭제합니다!
- 💡 **개발 중에는 `db:reset` 사용하지 마세요**: 작성한 같이가요 포스팅이 모두 사라집니다

**데이터가 사라졌다면?**
1. `npm run db:reset` 명령어를 실행했는지 확인
2. 샌드박스 환경이 타임아웃되어 재시작되었을 수 있음 (1시간 이후)
3. 프로덕션 배포 시에는 Cloudflare D1을 사용하므로 이 문제가 없습니다

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
