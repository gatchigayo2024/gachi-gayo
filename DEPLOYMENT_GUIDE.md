# 프로덕션 배포 가이드

## 목차
1. [배포 전 준비사항](#1-배포-전-준비사항)
2. [Cloudflare 설정](#2-cloudflare-설정)
3. [외부 서비스 설정](#3-외부-서비스-설정)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [데이터베이스 마이그레이션](#5-데이터베이스-마이그레이션)
6. [배포 실행](#6-배포-실행)
7. [배포 후 확인사항](#7-배포-후-확인사항)

---

## 1. 배포 전 준비사항

### 필요한 계정
- ✅ Cloudflare 계정 (Pages 배포용)
- ✅ 카카오 개발자 계정 (공유하기 기능)
- ✅ 네이버 클라우드 계정 (지도 API)
- ✅ 알리고 계정 (SMS 인증)

### 로컬 환경 확인
```bash
# Git 상태 확인
cd /home/user/webapp
git status

# 모든 변경사항 커밋
git add .
git commit -m "Ready for production deployment"

# GitHub에 푸시 (선택사항)
git push origin main
```

---

## 2. Cloudflare 설정

### 2-1. Cloudflare API 토큰 설정

**Deploy 탭에서 API 키 설정:**
1. Deploy 탭 열기
2. Cloudflare API 토큰 입력
3. 저장

**또는 터미널에서 설정:**
```bash
# Cloudflare API 토큰을 환경 변수로 설정
export CLOUDFLARE_API_TOKEN=your_token_here
```

### 2-2. D1 데이터베이스 생성 (이미 생성됨)

현재 설정:
```
database_name: webapp-production
database_id: 8ad918db-f6c0-4c9f-8fd5-18c129c7f82a
```

확인 명령어:
```bash
npx wrangler d1 list
```

---

## 3. 외부 서비스 설정

### 3-1. Aligo SMS API (실제 SMS 발송)

**현재 설정:**
- API Key: `i8bzwls1lyjfsp56pzfenqifhf4uqc6x`
- User ID: `gatchigayo2024`
- Sender: `070-4036-7411`

**Aligo 콘솔에서 확인/설정할 것:**

1. **IP 등록 (중요!)**
   - Aligo 콘솔 로그인: https://smartsms.aligo.in/
   - 설정 > IP 접근 관리
   - Cloudflare Workers IP 대역 등록 필요
   - **또는**: IP 인증 해제 (보안 주의)

2. **발신번호 등록 확인**
   - `070-4036-7411`이 등록되어 있는지 확인
   - 미등록 시 SMS 발송 불가

3. **크레딧 잔액 확인**
   - SMS 발송을 위한 충분한 크레딧 필요
   - 1건당 약 15원

**Cloudflare Workers IP 대역 (참고):**
Cloudflare는 고정 IP를 사용하지 않으므로:
- **권장**: Aligo에서 IP 인증 해제
- **또는**: API Key만으로 인증하도록 설정

### 3-2. 카카오 JavaScript SDK (공유하기)

**현재 설정:**
- JavaScript 키: `f43c7a0d5a13e6f50277e07f8a037b08`

**카카오 개발자 콘솔 설정:**

1. **콘솔 접속**
   - https://developers.kakao.com/console/app

2. **앱 설정 > 플랫폼**
   - Web 플랫폼 추가
   - 프로덕션 도메인 등록:
     ```
     https://gatchi-gayo.pages.dev
     https://your-custom-domain.com  (커스텀 도메인 사용 시)
     ```

3. **앱 설정 > 일반**
   - 앱 상태: "활성화 ON" 확인
   - JavaScript 키 확인

### 3-3. 네이버 지도 API

**현재 설정:**
- Client ID: `wj2ya61n2i`
- Client Secret: `pewaagcxRkJv8tjiXRGIIQk19oc7caxyFMnSctog`

**네이버 클라우드 콘솔 설정:**

1. **콘솔 접속**
   - https://console.ncloud.com/

2. **API 이용 신청**
   - Services > AI·NAVER API > Maps
   - Web Dynamic Map / Static Map 신청

3. **웹 서비스 URL 등록**
   - 프로덕션 도메인 등록:
     ```
     https://gatchi-gayo.pages.dev
     https://your-custom-domain.com
     ```

4. **API 호출 허용**
   - Referrer 체크 설정
   - 등록된 도메인에서만 호출 허용

---

## 4. 환경 변수 설정

### 4-1. Cloudflare Pages Secrets 설정

**방법 1: wrangler 명령어 사용**

```bash
# Aligo SMS API
npx wrangler pages secret put ALIGO_API_KEY --project-name gatchi-gayo
# 입력: i8bzwls1lyjfsp56pzfenqifhf4uqc6x

npx wrangler pages secret put ALIGO_USER_ID --project-name gatchi-gayo
# 입력: gatchigayo2024

npx wrangler pages secret put ALIGO_SENDER --project-name gatchi-gayo
# 입력: 070-4036-7411

# 카카오 JavaScript 키
npx wrangler pages secret put KAKAO_JAVASCRIPT_KEY --project-name gatchi-gayo
# 입력: f43c7a0d5a13e6f50277e07f8a037b08
```

**방법 2: Cloudflare Dashboard 사용**

1. Cloudflare Dashboard 접속
2. Pages > gatchi-gayo 프로젝트 선택
3. Settings > Environment Variables
4. Production 탭에서 다음 변수 추가:
   ```
   ALIGO_API_KEY = i8bzwls1lyjfsp56pzfenqifhf4uqc6x
   ALIGO_USER_ID = gatchigayo2024
   ALIGO_SENDER = 070-4036-7411
   KAKAO_JAVASCRIPT_KEY = f43c7a0d5a13e6f50277e07f8a037b08
   ```

### 4-2. 공개 환경 변수 (wrangler.jsonc)

네이버 지도는 이미 wrangler.jsonc에 설정되어 있습니다:
```json
"vars": {
  "NAVER_MAP_CLIENT_ID": "wj2ya61n2i",
  "NAVER_MAP_CLIENT_SECRET": "pewaagcxRkJv8tjiXRGIIQk19oc7caxyFMnSctog"
}
```

---

## 5. 데이터베이스 마이그레이션

### 5-1. 프로덕션 D1 마이그레이션 실행

```bash
# 프로덕션 데이터베이스에 마이그레이션 적용
npx wrangler d1 migrations apply webapp-production

# 확인
npx wrangler d1 execute webapp-production \
  --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### 5-2. 초기 데이터 입력 (선택사항)

**seed.sql의 테스트 데이터를 프로덕션에 넣으려면:**
```bash
npx wrangler d1 execute webapp-production --file=./seed.sql
```

**또는 실제 데이터만 입력:**
- 관리자 페이지를 통해 수동으로 입력
- 또는 별도의 프로덕션용 seed 파일 생성

---

## 6. 배포 실행

### 6-1. 빌드 및 배포

```bash
# 빌드
npm run build

# 배포 (프로젝트 이름 지정)
npx wrangler pages deploy dist --project-name gatchi-gayo
```

### 6-2. 배포 완료 시 나오는 정보

```
✨ Success! Uploaded 1 files (x seconds)

✨ Deployment complete! Take a peek over at
   https://random-id.gatchi-gayo.pages.dev
```

### 6-3. 프로덕션 URL 확인

- **Primary URL**: `https://gatchi-gayo.pages.dev`
- **Branch URL**: `https://main.gatchi-gayo.pages.dev`

---

## 7. 배포 후 확인사항

### 7-1. 기본 기능 테스트

**1. 페이지 접속**
```bash
curl https://gatchi-gayo.pages.dev
```

**2. API 테스트**
```bash
# 특가 할인 목록
curl https://gatchi-gayo.pages.dev/api/deals

# 같이가요 목록
curl https://gatchi-gayo.pages.dev/api/gatherings
```

### 7-2. SMS 인증 테스트

**브라우저에서:**
1. MY 페이지 접속
2. "전화번호로 회원가입" 클릭
3. 실제 전화번호 입력
4. "발송" 클릭
5. **실제 SMS 수신 확인** ✅
6. 인증번호 입력하여 회원가입 완료

**로그 확인:**
```bash
# Cloudflare Dashboard > Pages > gatchi-gayo > Logs
# 또는
npx wrangler pages deployment tail --project-name gatchi-gayo
```

### 7-3. 카카오 공유 테스트

**브라우저에서:**
1. 특가 할인 카드의 공유 버튼 클릭
2. 카카오톡 공유 팝업 확인 ✅
3. 실제 카카오톡으로 공유 테스트

**실패 시:**
- F12 > Console 확인
- 카카오 개발자 콘솔에서 도메인 등록 확인

### 7-4. 네이버 지도 테스트

**브라우저에서:**
1. 특가 할인 상세 페이지 접속
2. 지도 이미지 로딩 확인 ✅
3. 지도 클릭 시 네이버 지도 앱/웹 연결 확인

**실패 시:**
- F12 > Network 탭에서 지도 API 요청 확인
- 네이버 클라우드 콘솔에서 도메인 등록 확인

---

## 8. 문제 해결

### SMS 발송 실패 시

**원인 1: Aligo IP 인증 오류**
```
해결: Aligo 콘솔에서 IP 인증 해제
```

**원인 2: 발신번호 미등록**
```
해결: Aligo 콘솔에서 070-4036-7411 등록
```

**원인 3: 크레딧 부족**
```
해결: Aligo 크레딧 충전
```

### 카카오 공유 실패 시

**원인 1: 도메인 미등록**
```
해결: 카카오 개발자 콘솔 > 플랫폼 > Web > 도메인 추가
```

**원인 2: JavaScript 키 오류**
```
해결: 
1. 카카오 개발자 콘솔에서 올바른 JavaScript 키 확인
2. wrangler pages secret put KAKAO_JAVASCRIPT_KEY --project-name gatchi-gayo
```

### 네이버 지도 실패 시

**원인 1: 도메인 미등록**
```
해결: 네이버 클라우드 콘솔 > Maps > 웹 서비스 URL 추가
```

**원인 2: API 키 오류**
```
해결: wrangler.jsonc에서 Client ID/Secret 확인
```

---

## 9. 배포 스크립트 (자동화)

### deploy.sh 생성

```bash
#!/bin/bash
set -e

echo "🚀 프로덕션 배포 시작..."

# 1. 빌드
echo "📦 빌드 중..."
npm run build

# 2. 마이그레이션 (필요 시)
echo "🗄️ 데이터베이스 마이그레이션 확인..."
npx wrangler d1 migrations apply webapp-production

# 3. 배포
echo "☁️ Cloudflare Pages에 배포 중..."
npx wrangler pages deploy dist --project-name gatchi-gayo

echo "✅ 배포 완료!"
echo "🌐 URL: https://gatchi-gayo.pages.dev"
```

### 실행
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 10. 체크리스트

### 배포 전
- [ ] Cloudflare API 토큰 설정 완료
- [ ] Aligo 계정 설정 및 크레딧 충전
- [ ] 카카오 개발자 앱 생성 및 JavaScript 키 발급
- [ ] 네이버 클라우드 Maps API 신청
- [ ] D1 데이터베이스 생성 확인
- [ ] Git 커밋 완료

### 배포 중
- [ ] 환경 변수 설정 (secrets)
- [ ] D1 마이그레이션 실행
- [ ] 빌드 성공
- [ ] 배포 성공

### 배포 후
- [ ] 페이지 접속 확인
- [ ] API 응답 확인
- [ ] SMS 인증 테스트 (실제 전화번호)
- [ ] 카카오 공유 테스트
- [ ] 네이버 지도 테스트
- [ ] 전체 사용자 플로우 테스트

---

## 11. 유용한 명령어

```bash
# 배포 로그 실시간 확인
npx wrangler pages deployment tail --project-name gatchi-gayo

# D1 데이터베이스 쿼리
npx wrangler d1 execute webapp-production \
  --command="SELECT * FROM users LIMIT 10"

# 환경 변수 확인
npx wrangler pages secret list --project-name gatchi-gayo

# 배포 내역 확인
npx wrangler pages deployment list --project-name gatchi-gayo

# 특정 배포 롤백
npx wrangler pages deployment rollback --project-name gatchi-gayo
```

---

## 12. 추가 설정 (선택사항)

### 커스텀 도메인 연결

```bash
# 도메인 추가
npx wrangler pages domain add your-domain.com --project-name gatchi-gayo

# DNS 설정
# your-domain.com의 DNS에 CNAME 레코드 추가:
# CNAME @ gatchi-gayo.pages.dev
```

### GitHub Actions 자동 배포

`.github/workflows/deploy.yml` 생성:
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy dist --project-name gatchi-gayo
```

---

## 연락처

문제 발생 시:
1. Cloudflare Dashboard > Pages > gatchi-gayo > Logs 확인
2. 브라우저 F12 > Console/Network 확인
3. 각 서비스 콘솔에서 설정 재확인

**배포 준비가 되면 이 가이드를 따라 진행하세요!** 🚀
