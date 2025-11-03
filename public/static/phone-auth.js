/**
 * SMS 전화번호 인증 UI 컴포넌트
 * 
 * 사용법:
 * <div id="phone-auth-container"></div>
 * <script>
 *   renderPhoneAuthUI('phone-auth-container', (phone, verified) => {
 *     console.log('인증 완료:', phone, verified)
 *   })
 * </script>
 */

const PHONE_AUTH_STATE = {
  phone: '',
  code: '',
  verificationId: null,
  isVerified: false,
  isSending: false,
  isVerifying: false,
  timerSeconds: 0,
  timerInterval: null
}

/**
 * SMS 인증 UI 렌더링
 * @param {string} containerId - 컨테이너 DOM ID
 * @param {Function} onVerified - 인증 완료 콜백 (phone, verified) => void
 */
function renderPhoneAuthUI(containerId, onVerified) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error('Container not found:', containerId)
    return
  }

  container.innerHTML = `
    <div class="space-y-4">
      <!-- 전화번호 입력 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-mobile-alt mr-1"></i>전화번호
        </label>
        <div class="flex gap-2">
          <input
            type="tel"
            id="phone-input"
            placeholder="01012345678"
            maxlength="11"
            class="flex-1 px-4 py-3 border rounded-lg text-base"
            ${PHONE_AUTH_STATE.isVerified ? 'disabled' : ''}
          >
          <button
            id="send-code-btn"
            onclick="handleSendCode()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap text-base"
            ${PHONE_AUTH_STATE.isVerified ? 'disabled' : ''}
          >
            ${PHONE_AUTH_STATE.isSending ? 
              '<i class="fas fa-spinner fa-spin"></i>' : 
              PHONE_AUTH_STATE.timerSeconds > 0 ? '재전송' : '인증번호 발송'
            }
          </button>
        </div>
        ${PHONE_AUTH_STATE.timerSeconds > 0 ? 
          `<p class="text-sm text-blue-600 mt-1">
            <i class="fas fa-clock mr-1"></i>
            남은 시간: ${formatTime(PHONE_AUTH_STATE.timerSeconds)}
          </p>` : ''
        }
      </div>

      <!-- 인증번호 입력 (발송 후 표시) -->
      ${PHONE_AUTH_STATE.verificationId ? `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-key mr-1"></i>인증번호
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              id="code-input"
              placeholder="6자리 숫자"
              maxlength="6"
              class="flex-1 px-4 py-3 border rounded-lg text-base tracking-wider"
              ${PHONE_AUTH_STATE.isVerified ? 'disabled' : ''}
            >
            <button
              id="verify-code-btn"
              onclick="handleVerifyCode()"
              class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap text-base"
              ${PHONE_AUTH_STATE.isVerified ? 'disabled' : ''}
            >
              ${PHONE_AUTH_STATE.isVerifying ? 
                '<i class="fas fa-spinner fa-spin"></i>' : 
                PHONE_AUTH_STATE.isVerified ? 
                  '<i class="fas fa-check"></i> 인증완료' : 
                  '확인'
              }
            </button>
          </div>
        </div>
      ` : ''}

      <!-- 인증 상태 메시지 -->
      <div id="auth-message"></div>
    </div>
  `

  // 전화번호 입력 값 복원
  if (PHONE_AUTH_STATE.phone) {
    document.getElementById('phone-input').value = PHONE_AUTH_STATE.phone
  }

  // 인증번호 입력 값 복원
  if (PHONE_AUTH_STATE.code) {
    const codeInput = document.getElementById('code-input')
    if (codeInput) codeInput.value = PHONE_AUTH_STATE.code
  }

  // 인증 완료 콜백 저장
  PHONE_AUTH_STATE.onVerified = onVerified
}

/**
 * 인증번호 발송 처리
 */
async function handleSendCode() {
  const phoneInput = document.getElementById('phone-input')
  const phone = phoneInput.value.replace(/[^0-9]/g, '')

  // 유효성 검사
  if (!phone) {
    showMessage('전화번호를 입력해주세요.', 'error')
    return
  }

  if (!/^01[0-9]{8,9}$/.test(phone)) {
    showMessage('올바른 휴대폰 번호를 입력해주세요.', 'error')
    return
  }

  PHONE_AUTH_STATE.phone = phone
  PHONE_AUTH_STATE.isSending = true
  renderPhoneAuthUI('phone-auth-container', PHONE_AUTH_STATE.onVerified)

  try {
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })

    const data = await response.json()

    if (data.success) {
      PHONE_AUTH_STATE.verificationId = data.verificationId
      PHONE_AUTH_STATE.timerSeconds = 180 // 3분
      startTimer()
      showMessage('인증번호가 발송되었습니다. (3분 이내 입력)', 'success')
    } else {
      showMessage(data.error || '인증번호 발송에 실패했습니다.', 'error')
    }
  } catch (error) {
    console.error('인증번호 발송 오류:', error)
    showMessage('인증번호 발송 중 오류가 발생했습니다.', 'error')
  } finally {
    PHONE_AUTH_STATE.isSending = false
    renderPhoneAuthUI('phone-auth-container', PHONE_AUTH_STATE.onVerified)
  }
}

/**
 * 인증번호 확인 처리
 */
async function handleVerifyCode() {
  const codeInput = document.getElementById('code-input')
  const code = codeInput.value.trim()

  if (!code) {
    showMessage('인증번호를 입력해주세요.', 'error')
    return
  }

  if (code.length !== 6) {
    showMessage('인증번호는 6자리입니다.', 'error')
    return
  }

  PHONE_AUTH_STATE.code = code
  PHONE_AUTH_STATE.isVerifying = true
  renderPhoneAuthUI('phone-auth-container', PHONE_AUTH_STATE.onVerified)

  try {
    const response = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: PHONE_AUTH_STATE.phone,
        code: code
      })
    })

    const data = await response.json()

    if (data.success) {
      PHONE_AUTH_STATE.isVerified = true
      stopTimer()
      showMessage('전화번호 인증이 완료되었습니다!', 'success')

      // 콜백 호출
      if (PHONE_AUTH_STATE.onVerified) {
        PHONE_AUTH_STATE.onVerified(PHONE_AUTH_STATE.phone, true)
      }
    } else {
      showMessage(data.error || '인증번호가 일치하지 않습니다.', 'error')
    }
  } catch (error) {
    console.error('인증 확인 오류:', error)
    showMessage('인증 확인 중 오류가 발생했습니다.', 'error')
  } finally {
    PHONE_AUTH_STATE.isVerifying = false
    renderPhoneAuthUI('phone-auth-container', PHONE_AUTH_STATE.onVerified)
  }
}

/**
 * 타이머 시작
 */
function startTimer() {
  stopTimer() // 기존 타이머 정리

  PHONE_AUTH_STATE.timerInterval = setInterval(() => {
    PHONE_AUTH_STATE.timerSeconds--

    if (PHONE_AUTH_STATE.timerSeconds <= 0) {
      stopTimer()
      showMessage('인증 시간이 만료되었습니다. 다시 발송해주세요.', 'error')
    }

    renderPhoneAuthUI('phone-auth-container', PHONE_AUTH_STATE.onVerified)
  }, 1000)
}

/**
 * 타이머 정지
 */
function stopTimer() {
  if (PHONE_AUTH_STATE.timerInterval) {
    clearInterval(PHONE_AUTH_STATE.timerInterval)
    PHONE_AUTH_STATE.timerInterval = null
  }
  PHONE_AUTH_STATE.timerSeconds = 0
}

/**
 * 시간 포맷팅 (MM:SS)
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * 메시지 표시
 */
function showMessage(message, type = 'info') {
  const messageDiv = document.getElementById('auth-message')
  if (!messageDiv) return

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  }

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  }

  messageDiv.innerHTML = `
    <div class="border rounded-lg p-3 ${colors[type]}">
      <i class="fas ${icons[type]} mr-2"></i>${message}
    </div>
  `
}

/**
 * 인증 상태 초기화
 */
function resetPhoneAuth() {
  stopTimer()
  PHONE_AUTH_STATE.phone = ''
  PHONE_AUTH_STATE.code = ''
  PHONE_AUTH_STATE.verificationId = null
  PHONE_AUTH_STATE.isVerified = false
  PHONE_AUTH_STATE.isSending = false
  PHONE_AUTH_STATE.isVerifying = false
}
