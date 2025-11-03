/**
 * NHN Cloud SMS 서비스 유틸리티
 * 
 * 환경 변수 필요:
 * - NHN_CLOUD_APP_KEY
 * - NHN_CLOUD_SECRET_KEY
 * - NHN_CLOUD_SENDER_PHONE
 */

export interface SMSConfig {
  appKey: string
  secretKey: string
  senderPhone: string
}

export interface SendSMSRequest {
  recipientPhone: string
  message: string
}

export interface SendSMSResponse {
  success: boolean
  requestId?: string
  error?: string
}

/**
 * NHN Cloud SMS API를 통해 SMS 발송
 */
export async function sendSMS(
  config: SMSConfig,
  request: SendSMSRequest
): Promise<SendSMSResponse> {
  try {
    const url = `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${config.appKey}/sender/sms`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Secret-Key': config.secretKey
      },
      body: JSON.stringify({
        body: request.message,
        sendNo: config.senderPhone,
        recipientList: [
          {
            recipientNo: request.recipientPhone,
            internationalRecipientNo: `82${request.recipientPhone.substring(1)}` // 한국 국가번호
          }
        ]
      })
    })

    const data = await response.json()

    if (data.header?.isSuccessful) {
      return {
        success: true,
        requestId: data.body?.data?.requestId
      }
    } else {
      return {
        success: false,
        error: data.header?.resultMessage || 'SMS 발송 실패'
      }
    }
  } catch (error) {
    console.error('SMS 발송 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS 발송 중 오류 발생'
    }
  }
}

/**
 * 6자리 랜덤 인증번호 생성
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * 만료 시간 계산 (현재 시간 + 3분)
 */
export function getExpirationTime(): number {
  return Math.floor(Date.now() / 1000) + 180 // 3분 = 180초
}

/**
 * 인증 메시지 생성
 */
export function createVerificationMessage(code: string): string {
  return `[같이가요] 인증번호는 [${code}]입니다. 3분 이내에 입력해주세요.`
}

/**
 * 전화번호 유효성 검사 (한국 휴대폰 번호)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // 010, 011, 016, 017, 018, 019로 시작하는 10-11자리 숫자
  const phoneRegex = /^01[0-9]{8,9}$/
  return phoneRegex.test(phone)
}

/**
 * 전화번호 포맷팅 (하이픈 제거)
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}
