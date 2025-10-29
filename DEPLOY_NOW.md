# 🚀 지금 바로 배포하기 - 완벽 가이드

> 현재 로컬 버전을 https://gatchi-gayo.pages.dev 에 배포하여  
> SMS 인증, 카카오 공유, 네이버 지도가 모두 작동하도록 만듭니다.

---

## ⏱️ 예상 소요 시간: 약 30분

- 1단계 (외부 서비스 설정): 15분
- 2단계 (환경 변수 설정): 5분  
- 3단계 (배포 실행): 5분
- 4단계 (테스트): 5분

---

## 📋 사전 확인

### 현재 로컬 버전 상태
```bash
cd /home/user/webapp
git log --oneline -5
```

이 버전이 배포될 예정입니다. ✅

### 기존 배포 덮어쓰기
- ✅ 기존 `https://gatchi-gayo.pages.dev`를 최신 코드로 **완전히 교체**합니다
- ✅ 이전 버전은 자동으로 백업됩니다 (롤백 가능)
- ✅ URL은 그대로 유지됩니다

---

## 1단계: 외부 서비스 설정 (15분)

### A. Aligo SMS 설정 ⚡ (가장 중요!)

**목적**: 실제 전화번호로 SMS 인증번호 발송

**작업 순서:**

1. **Aligo 콘솔 로그인**
   ```
   URL: https://smartsms.aligo.in/
   계정: gatchigayo2024 (또는 귀하의 계정)
   ```

2. **IP 인증 해제** (필수!)
   ```
   경로: 설정 > IP 접근 관리
   
   현재 상태 확인:
   - IP 인증 활성화 → OFF로 변경
   
   이유: Cloudflare Workers는 고정 IP가 없어서 IP 인증 사용 불가
   ```

3. **발신번호 확인**
   ```
   경로: 발신번호 관리
   
   확인사항:
   - 070-4036-7411 등록되어 있는지 확인
   - 상태: "사용중" 또는 "승인완료"
   
   ❌ 미등록 시: 발신번호 등록 신청 (1-2일 소요)
   ```

4. **크레딧 잔액 확인**
   ```
   경로: 메인 대시보드
   
   확인사항:
   - 잔액 충분한지 확인 (SMS 1건당 약 15원)
   - 최소 1,000원 이상 권장
   
   ❌ 부족 시: 크레딧 충전
   ```

**✅ 완료 체크:**
- [ ] IP 인증 해제됨
- [ ] 070-4036-7411 등록 확인
- [ ] 크레딧 잔액 충분

---

### B. 카카오 개발자 설정 🟡

**목적**: 카카오톡 공유하기 기능 작동

**작업 순서:**

1. **카카오 개발자 콘솔 로그인**
   ```
   URL: https://developers.kakao.com/console/app
   
   ❗ 없으면 카카오 계정으로 가입
   ```

2. **애플리케이션 선택/생성**
   ```
   - 기존 앱이 있으면 선택
   - 없으면 "애플리케이션 추가하기" 클릭
     - 앱 이름: "같이가요" 또는 원하는 이름
     - 사업자명: 개인 (또는 회사명)
   ```

3. **JavaScript 키 확인**
   ```
   경로: 앱 설정 > 일반 > 앱 키
   
   확인사항:
   - JavaScript 키 복사
   - 현재 키: f43c7a0d5a13e6f50277e07f8a037b08
   
   ❗ 이 키가 맞는지 확인
   ```

4. **Web 플랫폼 등록** (가장 중요!)
   ```
   경로: 앱 설정 > 플랫폼 > Web
   
   작업:
   1. "Web 플랫폼 등록" 클릭
   2. 사이트 도메인 입력:
      
      https://gatchi-gayo.pages.dev
      
      ❗ 반드시 https:// 포함
      ❗ 끝에 / 없이
      
   3. "저장" 클릭
   ```

5. **앱 활성화 확인**
   ```
   경로: 앱 설정 > 일반
   
   확인사항:
   - 앱 상태: "활성화 ON" 
   
   ❌ OFF인 경우: 토글 클릭하여 ON
   ```

**✅ 완료 체크:**
- [ ] JavaScript 키 확인됨
- [ ] Web 플랫폼에 https://gatchi-gayo.pages.dev 등록
- [ ] 앱 상태 활성화 ON

---

### C. 네이버 클라우드 설정 🟢

**목적**: 네이버 지도 표시

**작업 순서:**

1. **네이버 클라우드 콘솔 로그인**
   ```
   URL: https://console.ncloud.com/
   
   ❗ 없으면 네이버 계정으로 가입 (무료)
   ```

2. **Maps API 활성화**
   ```
   경로: Services > AI·NAVER API > AI·NAVER API
   
   작업:
   1. "Maps" 찾기
   2. "Web Dynamic Map" 신청
   3. "Static Map" 신청
   
   ❗ 무료 플랜 선택 (일일 5만건까지 무료)
   ```

3. **Application 확인/생성**
   ```
   경로: AI·NAVER API > Application
   
   현재 설정:
   - Application 이름: 기존 또는 "같이가요"
   - Client ID: wj2ya61n2i
   - Client Secret: pewaagcxRkJv8tjiXRGIIQk19oc7caxyFMnSctog
   
   확인: 이 값들이 맞는지 체크
   ```

4. **웹 서비스 URL 등록** (가장 중요!)
   ```
   경로: Application 상세 > Web 서비스 URL
   
   작업:
   1. "Web 서비스 URL" 항목 찾기
   2. "+" 버튼 클릭
   3. URL 입력:
      
      https://gatchi-gayo.pages.dev
      
      ❗ 반드시 https:// 포함
      
   4. "추가" 또는 "확인" 클릭
   ```

**✅ 완료 체크:**
- [ ] Maps API 활성화됨
- [ ] Application 확인됨
- [ ] https://gatchi-gayo.pages.dev URL 등록

---

## 2단계: Cloudflare 환경 변수 설정 (5분)

### 중요! Cloudflare API 토큰 먼저 설정

**방법 1: Deploy 탭에서 설정 (권장)**
```
1. 좌측 사이드바 > Deploy 탭 클릭
2. Cloudflare API 토큰 입력 
3. 저장
```

**방법 2: 터미널에서 확인**
```bash
# 토큰이 설정되어 있는지 확인
echo $CLOUDFLARE_API_TOKEN

# 없으면 에러 발생
```

### 환경 변수 (Secrets) 설정

**터미널에서 다음 명령어들을 순서대로 실행:**

```bash
# 1. Aligo API Key
npx wrangler pages secret put ALIGO_API_KEY --project-name gatchi-gayo
```
입력 프롬프트가 나오면:
```
i8bzwls1lyjfsp56pzfenqifhf4uqc6x
```
Enter 키 입력

```bash
# 2. Aligo User ID  
npx wrangler pages secret put ALIGO_USER_ID --project-name gatchi-gayo
```
입력:
```
gatchigayo2024
```

```bash
# 3. Aligo Sender
npx wrangler pages secret put ALIGO_SENDER --project-name gatchi-gayo
```
입력:
```
070-4036-7411
```

```bash
# 4. Kakao JavaScript Key
npx wrangler pages secret put KAKAO_JAVASCRIPT_KEY --project-name gatchi-gayo
```
입력:
```
f43c7a0d5a13e6f50277e07f8a037b08
```

### 환경 변수 확인

```bash
# 설정된 환경 변수 목록 확인
npx wrangler pages secret list --project-name gatchi-gayo
```

**예상 출력:**
```
ALIGO_API_KEY
ALIGO_USER_ID  
ALIGO_SENDER
KAKAO_JAVASCRIPT_KEY
```

**✅ 완료 체크:**
- [ ] 4개 환경 변수 모두 설정됨
- [ ] secret list 명령어로 확인됨

---

## 3단계: 배포 실행 (5분)

### 옵션 1: 자동 배포 스크립트 (권장)

```bash
cd /home/user/webapp
./deploy.sh
```

스크립트가 자동으로:
1. ✅ Git 상태 확인
2. ✅ 빌드 실행
3. ✅ D1 마이그레이션 (선택)
4. ✅ 환경 변수 확인
5. ✅ 배포 실행

### 옵션 2: 수동 배포

```bash
cd /home/user/webapp

# 1. 빌드
npm run build

# 2. D1 마이그레이션 (최초 배포 시 또는 DB 변경 시)
npx wrangler d1 migrations apply webapp-production

# 3. 배포
npx wrangler pages deploy dist --project-name gatchi-gayo
```

### 배포 성공 확인

**예상 출력:**
```
✨ Success! Uploaded X files (Y seconds)

✨ Deployment complete! Take a peek over at
   https://abc123.gatchi-gayo.pages.dev
```

**메인 URL:**
```
https://gatchi-gayo.pages.dev
```

**✅ 완료 체크:**
- [ ] 빌드 성공
- [ ] 마이그레이션 성공 (선택)
- [ ] 배포 성공
- [ ] URL 확인

---

## 4단계: 배포 후 테스트 (5분)

### A. 기본 접속 테스트

**브라우저에서:**
```
https://gatchi-gayo.pages.dev
```

**확인사항:**
- [ ] 페이지가 로딩됨
- [ ] 특가 할인 목록이 보임
- [ ] 같이가요 탭 전환 작동
- [ ] MY 페이지 접속 가능

---

### B. SMS 인증 테스트 ⚡ (가장 중요!)

**테스트 순서:**

1. **MY 페이지 접속**
   ```
   https://gatchi-gayo.pages.dev
   → 하단 MY 탭 클릭
   ```

2. **회원가입 시작**
   ```
   → "전화번호로 회원가입" 버튼 클릭
   ```

3. **정보 입력**
   ```
   - 이름: 테스터
   - 전화번호: [실제 전화번호] 
     예: 01012345678
   ```

4. **인증번호 발송**
   ```
   → "발송" 버튼 클릭
   → 팝업: "인증번호가 발송되었습니다" 확인
   ```

5. **SMS 수신 확인** ✅
   ```
   휴대폰으로 문자 수신 확인:
   "[같이가요] 인증번호는 [123456] 입니다. 3분 이내에 입력해주세요."
   ```

6. **인증번호 입력**
   ```
   받은 인증번호 6자리 입력
   → "확인" 버튼 클릭
   → "회원가입이 완료되었습니다!" 확인
   ```

**❌ 실패 시:**
```bash
# 실시간 로그 확인
npx wrangler pages deployment tail --project-name gatchi-gayo

# 에러 확인:
# - "IP 인증 오류" → 1단계 A로 돌아가서 IP 인증 해제
# - "발신번호 오류" → 070-4036-7411 등록 확인
# - "크레딧 부족" → Aligo 크레딧 충전
```

---

### C. 카카오 공유 테스트 🟡

**테스트 순서:**

1. **특가 할인 카드 공유**
   ```
   특가 할인 목록에서
   → 카드 상단의 "공유" 아이콘 클릭
   → 카카오톡 공유 팝업 확인 ✅
   ```

2. **실제 공유 테스트**
   ```
   → 친구 선택
   → 전송
   → 카카오톡에서 메시지 확인
   → 링크 클릭 시 해당 특가로 이동 확인
   ```

**❌ 실패 시:**
```
F12 > Console 확인:
- "도메인 미등록" 에러 
  → 1단계 B로 돌아가서 도메인 재확인
  → https://gatchi-gayo.pages.dev 정확히 입력했는지 확인
  → 앱 활성화 ON 확인
```

---

### D. 네이버 지도 테스트 🟢

**테스트 순서:**

1. **특가 할인 상세 접속**
   ```
   특가 할인 카드 클릭
   → 상세 페이지 열림
   ```

2. **지도 표시 확인**
   ```
   → 장소 정보 섹션
   → 네이버 지도 이미지 로딩 확인 ✅
   → 지도에 위치 마커 표시 확인
   ```

3. **지도 클릭 테스트**
   ```
   → 지도 이미지 클릭
   → 네이버 지도 앱/웹 열림 확인
   → 해당 위치로 이동 확인
   ```

**❌ 실패 시:**
```
F12 > Network 탭 확인:
- /api/map/static 요청 실패
  → 1단계 C로 돌아가서 URL 등록 재확인
  → https://gatchi-gayo.pages.dev 정확히 등록되었는지 확인
```

---

### E. 전체 사용자 플로우 테스트

**시나리오 1: 신규 사용자**
```
1. 사이트 접속
2. 특가 할인 둘러보기
3. 좋아요 클릭 → 회원가입 팝업
4. SMS 인증으로 회원가입 ✅
5. 좋아요 재클릭 → 성공
6. 카카오톡 공유 → 성공 ✅
```

**시나리오 2: 같이가요 작성**
```
1. 특가 할인 상세 페이지
2. "작성하기" 클릭 (로그인 필요)
3. 같이가요 정보 입력
4. 채팅방 생성 신청
5. MY 페이지에서 내가 쓴 글 확인
```

**✅ 완료 체크:**
- [ ] SMS 인증 성공 (실제 문자 수신)
- [ ] 카카오 공유 성공
- [ ] 네이버 지도 표시
- [ ] 전체 플로우 정상 작동

---

## 5단계: 배포 후 수정 및 재배포

### ✅ 언제든지 수정 가능!

**수정 후 재배포 과정:**

```bash
# 1. 로컬에서 코드 수정
cd /home/user/webapp
# ... 파일 수정 ...

# 2. Git 커밋
git add .
git commit -m "Fix: 수정 내용"

# 3. 재배포 (3분 소요)
npm run build
npx wrangler pages deploy dist --project-name gatchi-gayo
```

**재배포 시 장점:**
- ✅ 환경 변수는 다시 설정 안해도 됨
- ✅ 기존 데이터 유지됨
- ✅ 이전 버전 자동 백업 (롤백 가능)
- ✅ 다운타임 없음 (제로 다운타임 배포)

### 롤백 (이전 버전으로 되돌리기)

```bash
# 배포 내역 확인
npx wrangler pages deployment list --project-name gatchi-gayo

# 특정 버전으로 롤백
npx wrangler pages deployment rollback --project-name gatchi-gayo
```

---

## 🔍 실시간 모니터링

### 배포 후 로그 확인

```bash
# 실시간 로그 (Ctrl+C로 종료)
npx wrangler pages deployment tail --project-name gatchi-gayo
```

**확인할 로그:**
- ✅ SMS 발송 성공: `✅ SMS 발송 성공: 010...`
- ✅ 카카오 SDK 초기화: `✅ Kakao SDK 초기화 완료`
- ❌ 에러 발생 시 빨간색으로 표시

### Cloudflare Dashboard

```
1. https://dash.cloudflare.com/ 로그인
2. Pages > gatchi-gayo 선택
3. 최근 배포 내역 확인
4. Functions > Logs 탭에서 에러 확인
```

---

## ⚠️ 주의사항

### 배포 전 체크리스트

- [ ] **Aligo IP 인증 반드시 해제** (안하면 SMS 발송 100% 실패)
- [ ] **카카오 도메인 정확히 입력** (https:// 포함, 끝에 / 없이)
- [ ] **네이버 URL 정확히 입력** (https:// 포함)
- [ ] **환경 변수 4개 모두 설정**

### 배포 후 확인사항

- [ ] 실제 전화번호로 SMS 테스트 (테스트 번호 아님!)
- [ ] 카카오 공유 실제로 전송해보기
- [ ] 네이버 지도 여러 위치 확인

---

## 📞 문제 해결 빠른 가이드

### SMS 발송 실패
```
1. npx wrangler pages deployment tail --project-name gatchi-gayo
2. 에러 메시지 확인:
   - "IP 인증 오류" → Aligo IP 인증 해제
   - "발신번호 오류" → 070-4036-7411 등록
   - "크레딧 부족" → 충전
```

### 카카오 공유 실패  
```
1. F12 > Console 확인
2. 에러 메시지 확인:
   - "도메인 오류" → 카카오 콘솔에서 도메인 재확인
   - "SDK 초기화 실패" → JavaScript 키 확인
```

### 네이버 지도 안나옴
```
1. F12 > Network 탭 확인
2. /api/map/static 요청 상태:
   - 403 Forbidden → 네이버 URL 등록 재확인
   - 401 Unauthorized → Client ID/Secret 확인
```

---

## 🎯 체크리스트 요약

### 배포 전
- [ ] 1단계 A: Aligo IP 인증 해제
- [ ] 1단계 B: 카카오 도메인 등록
- [ ] 1단계 C: 네이버 URL 등록
- [ ] 2단계: 환경 변수 4개 설정

### 배포
- [ ] 3단계: 빌드 및 배포 성공

### 배포 후
- [ ] 4단계 B: SMS 인증 (실제 문자)
- [ ] 4단계 C: 카카오 공유
- [ ] 4단계 D: 네이버 지도
- [ ] 4단계 E: 전체 플로우

---

## 🚀 시작하기

**준비되었으면 1단계부터 순서대로 진행하세요!**

예상 시간: **30분**

모든 단계를 완료하면 **SMS 인증, 카카오 공유, 네이버 지도가 모두 작동하는 실제 서비스**가 완성됩니다! 🎉

**배포 URL**: https://gatchi-gayo.pages.dev
