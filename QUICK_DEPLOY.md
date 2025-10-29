# 빠른 배포 가이드

## 🚀 3단계로 배포하기

### 1단계: 외부 서비스 설정 (약 15분)

#### A. Aligo SMS (실제 SMS 발송용)
1. https://smartsms.aligo.in/ 로그인
2. **설정 > IP 접근 관리 > IP 인증 해제** (권장)
3. **크레딧 충전** 확인

#### B. 카카오 개발자 (공유하기용)
1. https://developers.kakao.com/console/app 로그인
2. 앱 설정 > 플랫폼 > Web 추가
3. **사이트 도메인 추가**: `https://gatchi-gayo.pages.dev`
4. 앱 설정 > 일반 > **앱 상태: 활성화 ON**

#### C. 네이버 클라우드 (지도용)
1. https://console.ncloud.com/ 로그인
2. Services > AI·NAVER API > Maps
3. **웹 서비스 URL 등록**: `https://gatchi-gayo.pages.dev`

### 2단계: Cloudflare 환경 변수 설정 (약 5분)

```bash
# 각 명령어 실행 후 값 입력
npx wrangler pages secret put ALIGO_API_KEY --project-name gatchi-gayo
# 입력: i8bzwls1lyjfsp56pzfenqifhf4uqc6x

npx wrangler pages secret put ALIGO_USER_ID --project-name gatchi-gayo
# 입력: gatchigayo2024

npx wrangler pages secret put ALIGO_SENDER --project-name gatchi-gayo
# 입력: 070-4036-7411

npx wrangler pages secret put KAKAO_JAVASCRIPT_KEY --project-name gatchi-gayo
# 입력: f43c7a0d5a13e6f50277e07f8a037b08
```

### 3단계: 배포 실행 (약 2분)

```bash
# 배포 스크립트 실행
./deploy.sh

# 또는 수동 배포
npm run build
npx wrangler d1 migrations apply webapp-production
npx wrangler pages deploy dist --project-name gatchi-gayo
```

---

## ✅ 배포 완료 후 테스트

### 필수 테스트 (순서대로)

1. **페이지 접속**
   - https://gatchi-gayo.pages.dev 접속
   - 특가 할인 목록 표시 확인 ✅

2. **SMS 인증 (가장 중요!)**
   - MY 페이지 → "전화번호로 회원가입"
   - **실제 전화번호** 입력
   - "발송" 클릭
   - **실제 SMS 수신 확인** ✅
   - 인증번호 입력하여 회원가입 완료

3. **카카오 공유**
   - 특가 할인 카드 → 공유 버튼 클릭
   - 카카오톡 공유 팝업 확인 ✅
   - 실제로 친구에게 공유 테스트

4. **네이버 지도**
   - 특가 할인 상세 페이지 접속
   - 지도 이미지 로딩 확인 ✅
   - 지도 클릭 → 네이버 지도 연결 확인

---

## 🔧 문제 해결

### SMS 발송 안됨
```bash
# 원인 1: Aligo IP 인증 오류
→ Aligo 콘솔에서 IP 인증 해제

# 원인 2: 환경 변수 누락
→ npx wrangler pages secret list --project-name gatchi-gayo
→ 위 "2단계" 다시 실행

# 원인 3: 크레딧 부족
→ Aligo 크레딧 충전
```

### 카카오 공유 실패
```bash
# 원인: 도메인 미등록
→ 카카오 개발자 콘솔에서 도메인 확인
→ https://gatchi-gayo.pages.dev 정확히 등록되었는지 확인
```

### 네이버 지도 안나옴
```bash
# 원인: 도메인 미등록
→ 네이버 클라우드 콘솔에서 웹 서비스 URL 확인
→ https://gatchi-gayo.pages.dev 등록 확인
```

---

## 📊 유용한 명령어

```bash
# 실시간 로그 확인
npx wrangler pages deployment tail --project-name gatchi-gayo

# 환경 변수 확인
npx wrangler pages secret list --project-name gatchi-gayo

# 데이터베이스 쿼리
npx wrangler d1 execute webapp-production --command="SELECT * FROM users"

# 배포 내역
npx wrangler pages deployment list --project-name gatchi-gayo
```

---

## 📝 현재 설정값 요약

### Aligo SMS
```
API Key: i8bzwls1lyjfsp56pzfenqifhf4uqc6x
User ID: gatchigayo2024
Sender: 070-4036-7411
```

### 카카오 JavaScript
```
Key: f43c7a0d5a13e6f50277e07f8a037b08
```

### 네이버 지도
```
Client ID: wj2ya61n2i
Client Secret: pewaagcxRkJv8tjiXRGIIQk19oc7caxyFMnSctog
```

### Cloudflare
```
Project: gatchi-gayo
Database: webapp-production
URL: https://gatchi-gayo.pages.dev
```

---

## 🎯 배포 체크리스트

### 배포 전
- [ ] Aligo IP 인증 해제
- [ ] 카카오 도메인 등록 (gatchi-gayo.pages.dev)
- [ ] 네이버 웹 서비스 URL 등록
- [ ] Cloudflare 환경 변수 설정

### 배포 후
- [ ] 페이지 접속 확인
- [ ] SMS 인증 테스트 (실제 번호)
- [ ] 카카오 공유 테스트
- [ ] 네이버 지도 테스트
- [ ] 전체 사용자 플로우 테스트

---

**상세 가이드**: `DEPLOYMENT_GUIDE.md` 참고

**준비되었으면 `./deploy.sh` 실행!** 🚀
