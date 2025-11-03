# NHN Cloud SMS 인증 구현 가이드

## 📋 필요한 정보 체크리스트

### NHN Cloud 콘솔에서 확인 필요 (내일 제공 예정)

- [ ] **App Key**: `[내일 제공]`
- [ ] **Secret Key**: `[내일 제공]`
- [ ] **발신번호**: `[심사 중 - 승인 대기]`
- [ ] **서비스 ID** (선택): `[확인 필요]`

## 🔍 NHN Cloud 콘솔 확인 방법

### 1. App Key & Secret Key 확인
1. https://console.nhncloud.com/ 접속
2. 프로젝트 선택
3. Notification > SMS 메뉴
4. "URL & Appkey" 탭 클릭
5. `Appkey`와 `Secret Key` 복사

### 2. 발신번호 확인
1. SMS 콘솔 > "발신번호 관리" 메뉴
2. 승인된 발신번호 확인 (심사 완료 후)
3. 발신번호 형식: `01012345678` (하이픈 없이)

### 3. 서비스 ID 확인 (선택)
1. SMS 콘솔 메인 화면
2. 서비스 ID 또는 프로젝트 ID 확인

## 🛠️ 구현 예정 기능

### Backend API
- `POST /api/auth/send-verification` - SMS 인증번호 발송
- `POST /api/auth/verify-code` - 인증번호 확인
- `POST /api/auth/register` - 회원가입 (SMS 인증 완료 후)
- `POST /api/auth/login` - 로그인 (전화번호 + 비밀번호)

### Frontend
- 회원가입 페이지에 SMS 인증 UI
- 로그인 페이지 수정 (카카오 + 전화번호 방식)
- 인증번호 타이머 (3분)
- 재전송 기능

### Database
- `sms_verifications` 테이블 (이미 생성됨)
  - phone: 전화번호
  - code: 6자리 인증번호
  - expires_at: 만료시간 (3분)
  - verified: 인증 완료 여부

## 📝 NHN Cloud SMS API 스펙

### 발송 API
```
POST https://api-sms.cloud.toast.com/sms/v3.0/appKeys/{appKey}/sender/sms

Headers:
- Content-Type: application/json;charset=UTF-8
- X-Secret-Key: {secretKey}

Body:
{
  "body": "[같이가요] 인증번호는 [123456]입니다.",
  "sendNo": "{발신번호}",
  "recipientList": [
    {
      "recipientNo": "{수신번호}",
      "internationalRecipientNo": "{국가번호}{수신번호}"
    }
  ]
}
```

### 응답
```json
{
  "header": {
    "isSuccessful": true,
    "resultCode": 0,
    "resultMessage": "SUCCESS"
  },
  "body": {
    "data": {
      "requestId": "20180810100630ReZQ6KZzAH0",
      "statusCode": "2"
    }
  }
}
```

## 🔐 환경 변수 설정

### .dev.vars (로컬 개발)
```bash
# NHN Cloud SMS
NHN_CLOUD_APP_KEY=your_app_key_here
NHN_CLOUD_SECRET_KEY=your_secret_key_here
NHN_CLOUD_SENDER_PHONE=01012345678
```

### wrangler.jsonc (프로덕션)
```jsonc
{
  "vars": {
    "NHN_CLOUD_APP_KEY": "your_app_key_here",
    "NHN_CLOUD_SENDER_PHONE": "01012345678"
  }
}
```

**주의**: Secret Key는 `wrangler secret put` 명령어로 별도 등록
```bash
echo "your_secret_key" | npx wrangler secret put NHN_CLOUD_SECRET_KEY --env production
```

## ⏱️ 구현 타임라인

### Phase 1: 준비 완료 (오늘)
- [x] 데이터베이스 스키마 확인
- [x] 구현 가이드 문서 작성
- [ ] 코드 구조 준비

### Phase 2: 정보 입력 (내일)
- [ ] App Key 입력
- [ ] Secret Key 입력
- [ ] 발신번호 승인 확인 및 입력

### Phase 3: 구현 (정보 확인 후)
- [ ] Backend API 구현
- [ ] Frontend UI 구현
- [ ] 로컬 테스트
- [ ] 프로덕션 배포

## 📞 인증 흐름

```
사용자 입력: 전화번호
    ↓
Frontend: "인증번호 발송" 버튼 클릭
    ↓
Backend: 6자리 랜덤 코드 생성
    ↓
Backend: NHN Cloud API로 SMS 발송
    ↓
Backend: DB에 코드 저장 (3분 만료)
    ↓
사용자: SMS 수신 및 코드 입력
    ↓
Frontend: 코드 검증 요청
    ↓
Backend: DB에서 코드 확인
    ↓
Backend: 만료시간 확인
    ↓
Success: phone_verified = 1 처리
```

## 🚀 다음 단계

**내일 제공 필요한 정보:**
1. NHN Cloud App Key
2. NHN Cloud Secret Key
3. 발신번호 (심사 승인 후)

정보를 받으면 즉시 구현을 시작합니다! 🎉
