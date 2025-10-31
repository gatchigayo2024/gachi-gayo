// ============================================
// 전역 상태 관리
// ============================================
const APP_STATE = {
  currentUser: null,
  currentPage: 'deals',
  deals: [],
  gatherings: [],
  selectedDeal: null,
  selectedGathering: null,
  loginCallback: null,
  smsVerification: {
    phone: null,
    expiresAt: null,
    timer: null,
    callback: null
  }
}

// 로컬 스토리지에서 사용자 정보 로드
function loadUser() {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    APP_STATE.currentUser = JSON.parse(userStr)
  }
}

// 사용자 정보 저장
function saveUser(user) {
  APP_STATE.currentUser = user
  localStorage.setItem('user', JSON.stringify(user))
}

// 사용자 로그아웃
function logout() {
  APP_STATE.currentUser = null
  localStorage.removeItem('user')
  navigateTo('my')
}

// ============================================
// SMS 전화번호 인증
// ============================================

// SMS 인증 팝업 표시 (회원가입)
function showPhoneAuth() {
  // 이미 모달이 있으면 중복 생성 방지
  if (document.getElementById('phoneAuthOverlay')) {
    return
  }
  
  const html = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-3" id="phoneAuthOverlay" onclick="if(event.target === this) closePhoneAuth()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto" style="max-height: 85vh; overflow-y: auto;">
        <!-- 헤더 -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 flex items-center justify-between rounded-t-2xl sticky top-0">
          <h2 class="text-base font-bold text-white">전화번호로 회원가입</h2>
          <button type="button" onclick="closePhoneAuth()" class="text-white hover:text-gray-200">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <div class="p-3.5 space-y-3">
          <!-- 안내 메시지 -->
          <div class="bg-blue-50 rounded-lg p-2.5 flex items-start gap-2">
            <i class="fas fa-info-circle text-blue-500 text-sm mt-0.5 flex-shrink-0"></i>
            <p class="text-xs text-blue-800 leading-tight">전화번호 인증으로 간편하게 가입하세요.</p>
          </div>
          
          <!-- 이름 입력 -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-user mr-1"></i>이름 (닉네임)
            </label>
            <input 
              type="text" 
              id="nameInput" 
              class="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" 
              placeholder="홍길동"
            >
          </div>
          
          <!-- 전화번호 입력 -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-mobile-alt mr-1"></i>전화번호
            </label>
            <div class="flex gap-1.5">
              <input 
                type="tel" 
                id="phoneInput" 
                class="flex-1 min-w-0 border-2 border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:border-blue-500 focus:outline-none" 
                placeholder="01012345678"
                maxlength="11"
                onkeypress="if(event.key === 'Enter') sendAuthCode()"
              >
              <button 
                type="button"
                onclick="sendAuthCode()"
                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors shadow-sm flex-shrink-0 text-xs"
              >
                발송
              </button>
            </div>
          </div>
          
          <!-- 인증번호 입력 (항상 표시) -->
          <div id="codeInputSection">
            <label class="block text-xs font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-key mr-1"></i>인증번호
            </label>
            <div class="flex gap-1.5">
              <input 
                type="text" 
                id="codeInput" 
                class="flex-1 min-w-0 border-2 border-gray-300 rounded-lg px-2.5 py-2 text-center text-base tracking-wider focus:border-green-500 focus:outline-none font-mono" 
                placeholder="000000"
                maxlength="6"
                disabled
                onkeypress="if(event.key === 'Enter') verifyAuthCode()"
              >
              <button 
                type="button"
                onclick="verifyAuthCode()"
                id="verifyButton"
                disabled
                class="bg-gray-400 text-white font-semibold px-3.5 py-2 rounded-lg whitespace-nowrap shadow-sm flex-shrink-0 text-xs cursor-not-allowed"
              >
                확인
              </button>
            </div>
            <div class="flex justify-between items-center mt-1.5">
              <span id="timerDisplay" class="text-xs font-semibold text-gray-600"></span>
              <button 
                type="button"
                onclick="resendAuthCode()"
                id="resendButton"
                disabled
                class="text-xs text-gray-400 font-medium cursor-not-allowed"
              >
                <i class="fas fa-redo mr-0.5"></i>재발송
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', html)
  
  // 모바일에서 자동 포커스 시 키보드가 올라오는 문제 방지
  // 사용자가 직접 입력 필드를 클릭하도록 유도
}

// SMS 인증 팝업 닫기
function closePhoneAuth() {
  if (APP_STATE.smsVerification.timer) {
    clearInterval(APP_STATE.smsVerification.timer)
  }
  
  APP_STATE.smsVerification = {
    phone: null,
    expiresAt: null,
    timer: null,
    callback: null
  }
  
  document.getElementById('phoneAuthOverlay')?.remove()
}

// 인증번호 발송
async function sendAuthCode() {
  const nameInput = document.getElementById('nameInput')
  const phoneInput = document.getElementById('phoneInput')
  const phone = phoneInput.value.replace(/-/g, '')
  
  // 이름 확인
  const name = nameInput?.value.trim()
  if (!name) {
    alert('이름(닉네임)을 입력해주세요.')
    return
  }
  APP_STATE.smsVerification.name = name
  
  // 전화번호 유효성 검사
  if (!/^01[0-9]{8,9}$/.test(phone)) {
    alert('올바른 전화번호를 입력해주세요.\n(예: 01012345678)')
    // phoneInput.focus() - 모바일 키보드 팝업 방지
    return
  }
  
  try {
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
    
    const data = await res.json()
    
    if (data.success) {
      APP_STATE.smsVerification.phone = phone
      APP_STATE.smsVerification.expiresAt = data.expiresAt
      
      // 인증번호 입력란 활성화
      const codeInput = document.getElementById('codeInput')
      const verifyButton = document.getElementById('verifyButton')
      const resendButton = document.getElementById('resendButton')
      
      if (codeInput) {
        codeInput.disabled = false
        codeInput.classList.remove('bg-gray-100')
      }
      
      if (verifyButton) {
        verifyButton.disabled = false
        verifyButton.classList.remove('bg-gray-400', 'cursor-not-allowed')
        verifyButton.classList.add('bg-green-600', 'hover:bg-green-700')
      }
      
      if (resendButton) {
        resendButton.disabled = false
        resendButton.classList.remove('text-gray-400', 'cursor-not-allowed')
        resendButton.classList.add('text-blue-600', 'hover:text-blue-700', 'hover:underline')
      }
      
      // 타이머 시작
      startAuthTimer()
      
      // 개발 모드 메시지
      if (data.devMode && data.devCode) {
        alert(`🔧 개발 모드\n\n인증번호: ${data.devCode}\n\n실제 SMS는 발송되지 않았습니다.\n위 인증번호를 입력하세요.`)
      } else {
        alert('인증번호가 발송되었습니다.')
      }
    } else {
      alert(data.error || 'SMS 발송에 실패했습니다.')
    }
  } catch (error) {
    console.error('SMS 발송 오류:', error)
    alert('SMS 발송 중 오류가 발생했습니다.')
  }
}

// 인증번호 재발송
async function resendAuthCode() {
  document.getElementById('codeInput').value = ''
  
  if (APP_STATE.smsVerification.timer) {
    clearInterval(APP_STATE.smsVerification.timer)
  }
}

// 인증번호 확인 및 로그인/회원가입
async function verifyAuthCode() {
  const codeInput = document.getElementById('codeInput')
  const code = codeInput.value
  
  if (!code || code.length !== 6) {
    alert('6자리 인증번호를 입력해주세요.')
    // codeInput.focus() - 모바일 키보드 팝업 방지
    return
  }
  
  try {
    // 1단계: 인증번호 확인
    const verifyRes = await fetch('/api/sms/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: APP_STATE.smsVerification.phone,
        code: code
      })
    })
    
    const verifyData = await verifyRes.json()
    
    if (!verifyData.success) {
      alert(verifyData.error || '인증번호가 올바르지 않습니다.')
      codeInput.value = ''
      // codeInput.focus() - 모바일 키보드 팝업 방지
      return
    }
    
    // 2단계: 회원가입/로그인
    const loginRes = await fetch('/api/auth/phone-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: APP_STATE.smsVerification.phone,
        name: APP_STATE.smsVerification.name
      })
    })
    
    const loginData = await loginRes.json()
    
    console.log('📱 로그인 응답:', loginData)
    
    if (loginData.success) {
      console.log('✅ 로그인 성공, 사용자 정보:', loginData.user)
      
      // 1. 로컬 사용자 정보 저장
      saveUser(loginData.user)
      console.log('✅ 사용자 정보 저장 완료, APP_STATE.currentUser:', APP_STATE.currentUser)
      
      // 2. 모달 닫기
      closePhoneAuth()
      
      // 3. 현재 페이지 즉시 업데이트 (모달 닫기 전)
      if (APP_STATE.currentPage === 'my') {
        console.log('🔄 MY 페이지 즉시 업데이트')
        renderMyPage()
      }
      
      // 4. 성공 메시지 표시
      let successMessage = ''
      if (loginData.isNewUser) {
        // 신규 회원가입
        successMessage = '회원가입이 완료되었습니다!<br>같이가요를 시작해보세요.'
      } else if (loginData.nameUpdated) {
        // 기존 회원, 닉네임 업데이트
        successMessage = `로그인되었습니다!<br>닉네임이 "${loginData.user.name}"(으)로 변경되었습니다.`
      } else {
        // 기존 회원, 로그인만
        successMessage = `${loginData.user.name}님, 환영합니다!`
      }
      
      showSuccessModal(successMessage, () => {
        // 로그인 콜백 실행
        if (APP_STATE.loginCallback) {
          console.log('🔄 로그인 콜백 실행')
          APP_STATE.loginCallback()
          APP_STATE.loginCallback = null
        } else {
          // 현재 페이지 다시 렌더링 (확실하게)
          console.log('🔄 현재 페이지 최종 렌더링:', APP_STATE.currentPage)
          navigateTo(APP_STATE.currentPage)
        }
      })
    } else {
      console.error('❌ 로그인 실패:', loginData.error)
      alert(loginData.error || '로그인에 실패했습니다.')
    }
  } catch (error) {
    console.error('❌ 인증 확인 오류:', error)
    console.error('오류 상세:', error.message, error.stack)
    alert('인증 확인 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.')
  }
}

// 타이머 시작
function startAuthTimer() {
  if (APP_STATE.smsVerification.timer) {
    clearInterval(APP_STATE.smsVerification.timer)
  }
  
  APP_STATE.smsVerification.timer = setInterval(() => {
    const now = Math.floor(Date.now() / 1000)
    const remaining = APP_STATE.smsVerification.expiresAt - now
    
    const timerDisplay = document.getElementById('timerDisplay')
    if (!timerDisplay) return
    
    if (remaining <= 0) {
      clearInterval(APP_STATE.smsVerification.timer)
      timerDisplay.textContent = '인증 시간 만료'
      timerDisplay.className = 'text-sm font-semibold text-red-600'
    } else {
      const minutes = Math.floor(remaining / 60)
      const seconds = remaining % 60
      timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
      timerDisplay.className = remaining <= 30 ? 'text-sm font-semibold text-red-600' : 'text-sm font-semibold text-gray-600'
    }
  }, 1000)
}

// ============================================
// 공통 모달 함수
// ============================================

// 성공/안내 모달 표시
function showSuccessModal(message, onConfirm) {
  const html = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" id="successModal">
      <div class="bg-white rounded-lg shadow-lg max-w-[320px] w-full mx-4">
        <div class="p-5 text-center">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i class="fas fa-check text-xl text-green-600"></i>
          </div>
          <p class="text-gray-700 text-sm leading-relaxed mb-4">${message}</p>
          <button 
            type="button"
            onclick="closeSuccessModal()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', html)
  
  window.closeSuccessModal = () => {
    document.getElementById('successModal')?.remove()
    if (onConfirm) onConfirm()
  }
}

// 질문 답변 모달 표시
function showQuestionModal(question, onSubmit) {
  const html = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" id="questionModal">
      <div class="bg-white rounded-lg shadow-lg max-w-[340px] w-full mx-4">
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5">
          <h2 class="text-sm font-bold text-white">작성자의 질문</h2>
        </div>
        <div class="p-4">
          <div class="bg-purple-50 rounded-lg p-3 mb-3">
            <p class="text-gray-800 text-sm">${question}</p>
          </div>
          <textarea 
            id="answerInput"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none resize-none text-sm" 
            rows="3"
            placeholder="답변을 입력하세요..."
          ></textarea>
          <div class="flex space-x-2 mt-3">
            <button 
              type="button"
              onclick="closeQuestionModal()"
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm transition-colors"
            >
              취소
            </button>
            <button 
              type="button"
              onclick="submitQuestion()"
              class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm transition-colors"
            >
              제출
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', html)
  
  window.submitQuestion = () => {
    const answer = document.getElementById('answerInput').value.trim()
    if (!answer) {
      alert('답변을 입력해주세요.')
      return
    }
    document.getElementById('questionModal')?.remove()
    if (onSubmit) onSubmit(answer)
  }
  
  window.closeQuestionModal = () => {
    document.getElementById('questionModal')?.remove()
  }
  
  // setTimeout(() => document.getElementById('answerInput')?.focus(), 100) - 모바일 키보드 팝업 방지
}

// ============================================
// 네이버 지도
// ============================================
// 네이버 지도 표시 함수
function initNaverMap(containerId, lat, lng, placeName) {
  // 네이버 Maps API가 로드되었는지 확인
  if (typeof naver === 'undefined' || !naver.maps) {
    console.warn('⚠️ 네이버 Maps API가 로드되지 않았습니다.')
    return null
  }
  
  // 지도 옵션
  const mapOptions = {
    center: new naver.maps.LatLng(lat, lng),
    zoom: 16,
    zoomControl: true,
    zoomControlOptions: {
      position: naver.maps.Position.TOP_RIGHT
    }
  }
  
  // 지도 생성
  const map = new naver.maps.Map(containerId, mapOptions)
  
  // 마커 생성
  const marker = new naver.maps.Marker({
    position: new naver.maps.LatLng(lat, lng),
    map: map,
    title: placeName
  })
  
  return map
}

// 네이버 지도 앱으로 열기
function openNaverMap(lat, lng, placeName) {
  console.log('🗺️ 네이버 지도 URL 생성:', { lat, lng, placeName })
  
  // 네이버 지도 v5 최신 URL 형식
  // c 파라미터: 경도,위도,줌레벨,틸트,회전,지도타입,트래픽
  const url = `https://map.naver.com/p?c=${lng},${lat},16,0,0,0,dh&title=${encodeURIComponent(placeName)}`
  
  console.log('🔗 생성된 URL:', url)
  window.open(url, '_blank')
}

// 네이버 지도 장소 페이지로 열기
function openNaverMapPlace(dealId) {
  // 특정 deal ID에 대한 네이버 지도 장소 ID 매핑
  const placeIdMap = {
    1: '1035431851' // 와인률연희
  }
  
  const placeId = placeIdMap[dealId]
  
  if (placeId) {
    // 네이버 지도 장소 페이지로 이동
    const url = `https://map.naver.com/p/entry/place/${placeId}?c=15.00,0,0,0,dh`
    window.open(url, '_blank')
  } else {
    // 기본 좌표로 열기
    const deal = APP_STATE.selectedDeal
    openNaverMap(deal.place_lat || 37.5665, deal.place_lng || 126.9780, deal.place_name)
  }
}

// 같이가요 포스팅의 네이버 지도 열기
function openNaverMapForGathering(gatheringId) {
  const g = APP_STATE.selectedGathering
  
  console.log('🗺️ 네이버 지도 열기:', {
    gathering_id: gatheringId,
    place_name: g.place_name,
    place_lat: g.place_lat,
    place_lng: g.place_lng,
    special_deal_id: g.special_deal_id
  })
  
  // 좌표 정보가 있으면 좌표로 지도 열기
  if (g.place_lat && g.place_lng) {
    openNaverMap(g.place_lat, g.place_lng, g.place_name)
  } else {
    // 좌표 정보가 없으면 장소명으로 검색
    const searchUrl = `https://map.naver.com/v5/search/${encodeURIComponent(g.place_name || g.place_address)}`
    window.open(searchUrl, '_blank')
  }
}

function kakaoLogin() {
  if (!Kakao.isInitialized()) {
    alert('카카오 SDK가 초기화되지 않았습니다. 관리자에게 문의하세요.')
    console.error('❌ Kakao SDK 초기화 실패')
    return
  }
  
  console.log('🔐 카카오 로그인 시작...')
  
  Kakao.Auth.login({
    success: function(authObj) {
      console.log('✅ 카카오 인증 성공:', authObj)
      
      // 사용자 정보 요청
      Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
          console.log('✅ 사용자 정보 조회 성공:', res)
          
          const user = {
            kakao_id: res.id.toString(),
            name: res.properties.nickname,
            phone: res.kakao_account.phone_number || null
          }
          
          console.log('📤 서버 로그인 요청:', user)
          
          // 서버에 로그인 요청
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              console.log('✅ 서버 로그인 성공:', data.user)
              saveUser(data.user)
              closePhoneAuth()
              
              // 로그인 후 콜백 실행
              if (APP_STATE.loginCallback) {
                APP_STATE.loginCallback()
                APP_STATE.loginCallback = null
              } else {
                navigateTo(APP_STATE.currentPage)
              }
            } else {
              alert('서버 로그인 실패: ' + (data.error || '알 수 없는 오류'))
              console.error('❌ 서버 로그인 실패:', data)
            }
          })
          .catch(err => {
            alert('서버 연결 실패')
            console.error('❌ 서버 연결 오류:', err)
          })
        },
        fail: function(err) {
          alert('사용자 정보 가져오기 실패')
          console.error('❌ 사용자 정보 조회 실패:', err)
        }
      })
    },
    fail: function(err) {
      alert('카카오 로그인 실패')
      console.error('❌ 카카오 로그인 실패:', err)
    }
  })
}

// 실제 카카오 로그인 (참고용)
/*
function kakaoLoginReal() {
  Kakao.Auth.login({
    success: function(authObj) {
      Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
          const user = {
            kakao_id: res.id.toString(),
            name: res.properties.nickname,
            phone: res.kakao_account.phone_number
          }
          
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              saveUser(data.user)
              closePhoneAuth()
              if (APP_STATE.loginCallback) {
                APP_STATE.loginCallback()
                APP_STATE.loginCallback = null
              }
            }
          })
        },
        fail: function(err) {
          alert('카카오 사용자 정보 가져오기 실패')
        }
      })
    },
    fail: function(err) {
      alert('카카오 로그인 실패')
    }
  })
}
*/

function requireLogin(callback) {
  if (!APP_STATE.currentUser) {
    APP_STATE.loginCallback = callback
    showPhoneAuth()
    return false
  }
  return true
}

// ============================================
// 카카오톡 채널 친구 추가
// ============================================
const KAKAO_CHANNEL_ID = '_qxcCln'  // 같이가요 카카오톡 채널

// 카카오톡 채널 친구 추가 팝업
function addKakaoChannel() {
  return new Promise((resolve) => {
    if (!Kakao.isInitialized()) {
      alert('카카오 SDK가 초기화되지 않았습니다.')
      resolve(false)
      return
    }
    
    try {
      Kakao.Channel.addChannel({
        channelPublicId: KAKAO_CHANNEL_ID,
        success: function() {
          console.log('✅ 카카오톡 채널 친구 추가 성공')
          resolve(true)
        },
        fail: function(error) {
          console.error('❌ 카카오톡 채널 친구 추가 실패:', error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('❌ 카카오톡 채널 추가 오류:', error)
      alert('카카오톡 채널 추가 중 오류가 발생했습니다.')
      resolve(false)
    }
  })
}

// 채널 친구 추가 상태 저장
async function saveChannelAddedStatus() {
  if (!APP_STATE.currentUser) return
  
  try {
    const res = await fetch('/api/user/channel-added', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: APP_STATE.currentUser.id })
    })
    
    const data = await res.json()
    if (data.success) {
      console.log('✅ 채널 친구 추가 상태 저장 완료')
      // 로컬 사용자 정보 업데이트
      APP_STATE.currentUser.kakao_channel_added = 1
      saveUser(APP_STATE.currentUser)
    }
  } catch (error) {
    console.error('❌ 채널 상태 저장 실패:', error)
  }
}

// 채널 친구 추가 유도 및 처리
async function promptChannelAdd(actionName) {
  if (!APP_STATE.currentUser) return false
  
  // 이미 채널 추가했으면 스킵
  if (APP_STATE.currentUser.kakao_channel_added) {
    return true
  }
  
  const message = `${actionName}을(를) 위해 카카오톡 채널 친구 추가가 필요합니다.\n\n알림을 받고 단톡방 초대 링크를 받으실 수 있습니다.`
  
  if (confirm(message)) {
    const added = await addKakaoChannel()
    if (added) {
      await saveChannelAddedStatus()
      alert('카카오톡 채널 친구 추가가 완료되었습니다!\n관리자가 알림과 단톡방 링크를 보내드립니다.')
      return true
    } else {
      alert('카카오톡 채널 친구 추가가 필요합니다.\n나중에 다시 시도해주세요.')
      return false
    }
  }
  
  return false
}

// ============================================
// 네비게이션
// ============================================
function navigateTo(page) {
  APP_STATE.currentPage = page
  
  // 네비게이션 버튼 활성화 상태 변경
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('text-blue-600')
  })
  document.querySelector(`button[onclick="navigateTo('${page}')"]`)?.classList.add('text-blue-600')
  
  // 페이지 렌더링
  const app = document.getElementById('app')
  
  switch(page) {
    case 'deals':
      renderDealsPage()
      break
    case 'gatherings':
      renderGatheringsPage()
      break
    case 'my':
      renderMyPage()
      break
  }
}

// ============================================
// 특가 할인 페이지
// ============================================
async function renderDealsPage() {
  const userId = APP_STATE.currentUser?.id
  const url = userId ? `/api/deals?user_id=${userId}` : '/api/deals'
  
  const res = await fetch(url)
  const data = await res.json()
  
  if (data.success) {
    APP_STATE.deals = data.deals
    
    const html = `
      <div class="max-w-2xl mx-auto">
        <div class="bg-white border-b p-4">
          <h1 class="text-2xl font-bold">특가 할인</h1>
          <p class="text-gray-600 text-sm">엄선된 장소를 특가로 즐기세요</p>
        </div>
        
        <div class="space-y-4 p-4">
          ${APP_STATE.deals.map(deal => renderDealCard(deal)).join('')}
        </div>
      </div>
    `
    
    document.getElementById('app').innerHTML = html
  }
}

function renderDealCard(deal) {
  const images = JSON.parse(deal.images)
  const isLiked = deal.is_liked > 0
  
  return `
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <!-- 이미지 슬라이더 -->
      <div class="slider-container" id="slider-${deal.id}">
        <div class="slider-wrapper">
          ${images.map(img => `
            <img src="${img}" alt="${deal.title}" class="slider-item object-cover">
          `).join('')}
        </div>
        ${images.length > 1 ? `
          <button type="button" class="slider-button prev" onclick="moveSlider(${deal.id}, -1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button type="button" class="slider-button next" onclick="moveSlider(${deal.id}, 1)">
            <i class="fas fa-chevron-right"></i>
          </button>
          <div class="slider-dots">
            ${images.map((_, i) => `<div class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}
          </div>
        ` : ''}
      </div>
      
      <!-- 정보 -->
      <div class="p-4">
        <p class="text-sm text-gray-600 mb-1">${deal.title}</p>
        ${deal.subtitle ? `<h2 class="text-lg font-bold mb-3">${deal.subtitle}</h2>` : ''}
        
        <!-- 액션 버튼 -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-4">
            <button type="button" onclick="event.stopPropagation(); toggleDealLike(event, ${deal.id})" class="flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-600'}">
              <i class="fas fa-heart"></i>
              <span>${deal.like_count || 0}</span>
            </button>
            <div class="flex items-center gap-1 text-gray-600">
              <i class="fas fa-users"></i>
              <span>${deal.gathering_count || 0}</span>
            </div>
            <button type="button" onclick="event.stopPropagation(); shareDeal(${deal.id})" class="text-gray-600">
              <i class="fas fa-share"></i>
            </button>
          </div>
          <button type="button" onclick="event.stopPropagation(); showDealDetail(${deal.id})" class="text-blue-600 font-medium">
            자세히 보기 <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `
}

// 슬라이더 이동
function moveSlider(dealId, direction) {
  const container = document.getElementById(`slider-${dealId}`)
  const wrapper = container.querySelector('.slider-wrapper')
  const items = wrapper.querySelectorAll('.slider-item')
  const dots = container.querySelectorAll('.slider-dot')
  
  const currentIndex = Array.from(dots).findIndex(dot => dot.classList.contains('active'))
  let newIndex = currentIndex + direction
  
  if (newIndex < 0) newIndex = items.length - 1
  if (newIndex >= items.length) newIndex = 0
  
  wrapper.style.transform = `translateX(-${newIndex * 100}%)`
  
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === newIndex)
  })
}

// 특가 할인 좋아요 토글
async function toggleDealLike(event, dealId) {
  if (!requireLogin(() => toggleDealLike(null, dealId))) return
  
  try {
    console.log('❤️ 특가 할인 좋아요 토글 요청:', { deal_id: dealId, user_id: APP_STATE.currentUser.id })
    
    const res = await fetch(`/api/deals/${dealId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: APP_STATE.currentUser.id })
    })
    
    const data = await res.json()
    console.log('❤️ 특가 할인 좋아요 토글 응답:', data)
    
    if (data.success) {
      // 좋아요 개수만 업데이트 (스크롤 위치 유지)
      const likeCountElement = document.getElementById(`deal-like-count-${dealId}`)
      if (likeCountElement) {
        // 최신 데이터 가져오기
        const userId = APP_STATE.currentUser?.id
        const url = userId ? `/api/deals/${dealId}?user_id=${userId}` : `/api/deals/${dealId}`
        const detailRes = await fetch(url)
        const detailData = await detailRes.json()
        
        if (detailData.success) {
          // 좋아요 개수 업데이트
          likeCountElement.textContent = detailData.deal.like_count || 0
          
          // 버튼 색상 업데이트
          const button = likeCountElement.closest('button')
          const isLiked = detailData.deal.is_liked > 0
          button.className = `flex items-center gap-2 px-4 py-2 rounded-lg ${isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`
          
          // 상세 페이지 데이터도 업데이트
          APP_STATE.selectedDeal = detailData.deal
        }
      }
      
      // 목록 페이지의 데이터도 백그라운드에서 업데이트 (스크롤 위치 유지)
      const currentPath = APP_STATE.currentPage
      if (currentPath === 'deals') {
        // 현재 스크롤 위치 저장
        const scrollPos = window.scrollY
        await renderDealsPage()
        // 스크롤 위치 복원
        window.scrollTo(0, scrollPos)
      }
    } else {
      console.error('❌ 좋아요 토글 실패:', data.error)
      alert('좋아요 처리에 실패했습니다: ' + (data.error || '알 수 없는 오류'))
    }
  } catch (error) {
    console.error('❌ 좋아요 토글 중 오류:', error)
    alert('좋아요 처리 중 오류가 발생했습니다: ' + error.message)
  }
}

// 특가 할인 공유 (카카오톡)
function shareDeal(dealId) {
  const deal = APP_STATE.deals.find(d => d.id === dealId) || APP_STATE.selectedDeal
  
  if (!deal) {
    alert('공유할 정보를 불러올 수 없습니다.')
    return
  }
  
  console.log('🔍 카카오 공유 시작:', {
    initialized: Kakao.isInitialized(),
    dealId: dealId,
    origin: window.location.origin
  })
  
  if (!Kakao.isInitialized()) {
    alert('카카오톡 공유 기능을 사용할 수 없습니다.\n\n카카오 SDK가 초기화되지 않았습니다.')
    console.error('❌ Kakao SDK 초기화 안됨')
    return
  }
  
  // 이미지 URL 파싱
  const images = JSON.parse(deal.images)
  const thumbnailUrl = images[0] || 'https://via.placeholder.com/400x300'
  
  // 카카오톡 공유하기
  try {
    console.log('📤 카카오 공유 요청 데이터:', {
      title: `🍽️ ${deal.title}`,
      imageUrl: thumbnailUrl,
      link: `${window.location.origin}/?deal=${dealId}`
    })
    
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `🍽️ ${deal.title}`,
        description: deal.subtitle || deal.content.substring(0, 100) + '...',
        imageUrl: thumbnailUrl,
        link: {
          mobileWebUrl: `${window.location.origin}/?deal=${dealId}`,
          webUrl: `${window.location.origin}/?deal=${dealId}`
        }
      },
      buttons: [
        {
          title: '자세히 보기',
          link: {
            mobileWebUrl: `${window.location.origin}/?deal=${dealId}`,
            webUrl: `${window.location.origin}/?deal=${dealId}`
          }
        }
      ]
    })
    console.log('✅ 카카오 공유 요청 성공')
  } catch (error) {
    console.error('❌ 카카오 공유 오류 상세:', error)
    console.error('에러 타입:', error.name)
    console.error('에러 메시지:', error.message)
    
    let errorMessage = `카카오톡 공유에 실패했습니다.\n\n`
    errorMessage += `현재 도메인: ${window.location.origin}\n`
    errorMessage += `JavaScript 키: ${window.KAKAO_KEY}\n\n`
    
    if (error.message) {
      errorMessage += `오류: ${error.message}\n\n`
    }
    
    errorMessage += `해결 방법:\n`
    errorMessage += `1. 카카오 개발자 콘솔에서 도메인 확인\n`
    errorMessage += `2. JavaScript 키가 올바른지 확인\n`
    errorMessage += `3. 앱 설정 > 일반 > 앱 키 확인\n\n`
    errorMessage += `콘솔(F12)에서 자세한 오류를 확인하세요.`
    
    alert(errorMessage)
  }
}

// 같이가요 공유 (카카오톡)
function shareGathering(gatheringId) {
  const gathering = APP_STATE.gatherings.find(g => g.id === gatheringId) || APP_STATE.selectedGathering
  
  if (!gathering) {
    alert('공유할 정보를 불러올 수 없습니다.')
    return
  }
  
  console.log('🔍 카카오 공유 시작 (같이가요):', {
    initialized: Kakao.isInitialized(),
    gatheringId: gatheringId,
    origin: window.location.origin
  })
  
  if (!Kakao.isInitialized()) {
    alert('카카오톡 공유 기능을 사용할 수 없습니다.\n\n카카오 SDK가 초기화되지 않았습니다.')
    console.error('❌ Kakao SDK 초기화 안됨')
    return
  }
  
  // 카카오톡 공유하기
  try {
    console.log('📤 카카오 공유 요청 데이터 (같이가요):', {
      title: `👥 ${gathering.title}`,
      link: `${window.location.origin}/?gathering=${gatheringId}`
    })
    
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `👥 ${gathering.title}`,
        description: `📅 ${gathering.date_text} ${gathering.time_text}\n👥 ${gathering.current_people}/${gathering.max_people > 10 ? 'N' : gathering.max_people}명\n📍 ${gathering.place_name}`,
        imageUrl: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=같이가요',
        link: {
          mobileWebUrl: `${window.location.origin}/?gathering=${gatheringId}`,
          webUrl: `${window.location.origin}/?gathering=${gatheringId}`
        }
      },
      buttons: [
        {
          title: '같이가요 보기',
          link: {
            mobileWebUrl: `${window.location.origin}/?gathering=${gatheringId}`,
            webUrl: `${window.location.origin}/?gathering=${gatheringId}`
          }
        }
      ]
    })
    console.log('✅ 카카오 공유 요청 성공 (같이가요)')
  } catch (error) {
    console.error('❌ 카카오 공유 오류 상세 (같이가요):', error)
    console.error('에러 타입:', error.name)
    console.error('에러 메시지:', error.message)
    
    let errorMessage = `카카오톡 공유에 실패했습니다.\n\n`
    errorMessage += `현재 도메인: ${window.location.origin}\n`
    errorMessage += `JavaScript 키: ${window.KAKAO_KEY}\n\n`
    
    if (error.message) {
      errorMessage += `오류: ${error.message}\n\n`
    }
    
    errorMessage += `해결 방법:\n`
    errorMessage += `1. 카카오 개발자 콘솔에서 도메인 확인\n`
    errorMessage += `2. JavaScript 키가 올바른지 확인\n`
    errorMessage += `3. 앱 설정 > 일반 > 앱 키 확인\n\n`
    errorMessage += `콘솔(F12)에서 자세한 오류를 확인하세요.`
    
    alert(errorMessage)
  }
}

// 특가 할인 상세 보기
async function showDealDetail(dealId) {
  const userId = APP_STATE.currentUser?.id
  const url = userId ? `/api/deals/${dealId}?user_id=${userId}` : `/api/deals/${dealId}`
  
  const res = await fetch(url)
  const data = await res.json()
  
  if (data.success) {
    APP_STATE.selectedDeal = data.deal
    renderDealDetailPanel()
  }
}

function renderDealDetailPanel() {
  const deal = APP_STATE.selectedDeal
  const images = JSON.parse(deal.images)
  
  // 해당 특가할인의 같이가요 목록 가져오기
  fetch(`/api/gatherings?deal_id=${deal.id}${APP_STATE.currentUser ? '&user_id=' + APP_STATE.currentUser.id : ''}`)
    .then(res => res.json())
    .then(data => {
      const gatherings = data.success ? data.gatherings : []
      
      const html = `
        <div class="detail-panel active" id="dealDetail">
          <!-- 헤더 -->
          <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center" style="z-index: 20;">
            <button type="button" onclick="closeDealDetail()" class="mr-3">
              <i class="fas fa-times text-xl"></i>
            </button>
            <h2 class="text-lg font-bold">특가 할인 상세</h2>
          </div>
          
          <!-- 내용 -->
          <div class="p-4">
            <!-- 이미지 슬라이더 -->
            <div class="slider-container mb-4" id="detail-slider">
              <div class="slider-wrapper">
                ${images.map(img => `
                  <img src="${img}" alt="${deal.title}" class="slider-item object-cover">
                `).join('')}
              </div>
              ${images.length > 1 ? `
                <button type="button" class="slider-button prev" onclick="moveDetailSlider(-1)">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button type="button" class="slider-button next" onclick="moveDetailSlider(1)">
                  <i class="fas fa-chevron-right"></i>
                </button>
                <div class="slider-dots">
                  ${images.map((_, i) => `<div class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}
                </div>
              ` : ''}
            </div>
            
            <h1 class="text-2xl font-bold mb-2">${deal.title}</h1>
            ${deal.subtitle ? `<p class="text-lg text-gray-700 mb-4">${deal.subtitle}</p>` : ''}
            
            <div class="prose max-w-none mb-6">
              ${deal.content.split('\n').map(line => `<p class="mb-2">${line}</p>`).join('')}
            </div>
            
            <!-- 장소 정보 -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 class="font-bold mb-2"><i class="fas fa-map-marker-alt text-red-500"></i> 장소</h3>
              <p class="font-medium">${deal.place_name}</p>
              <p class="text-sm text-gray-600 mb-3">${deal.place_address}</p>
              
              <!-- 네이버 정적 지도 이미지 -->
              <div class="relative bg-white rounded-lg border-2 border-gray-200 mb-3 overflow-hidden cursor-pointer" style="height: 200px;" onclick="openNaverMapPlace(${deal.id})">
                <img 
                  src="/api/map/static?lat=${deal.place_lat || 37.5665}&lng=${deal.place_lng || 126.9780}&w=400&h=200&zoom=16"
                  onerror="document.getElementById('deal-map-fallback-${deal.id}').style.display='flex'; this.style.display='none';"
                  alt="${deal.place_name} 지도"
                  class="w-full h-full object-cover"
                />
                
                <!-- 지도 오버레이 안내 -->
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 text-center">
                  <i class="fas fa-hand-pointer"></i> 지도를 클릭하면 네이버 지도로 이동합니다
                </div>
                
                <!-- 지도 로딩 실패 시 대체 UI -->
                <div id="deal-map-fallback-${deal.id}" class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50" style="display: none;">
                  <i class="fas fa-map-marked-alt text-6xl text-green-600 mb-3"></i>
                  <p class="text-gray-700 font-medium mb-1">${deal.place_name}</p>
                  <p class="text-gray-500 text-sm px-4 text-center">${deal.place_address}</p>
                  <p class="text-green-600 text-sm mt-3">👇 아래 버튼을 눌러 지도를 확인하세요</p>
                </div>
              </div>
            </div>
            
            <!-- 좋아요 버튼 -->
            <div class="mb-4">
              <button type="button" onclick="toggleDealLike(null, ${deal.id})" class="flex items-center gap-2 px-4 py-2 rounded-lg ${deal.is_liked > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}">
                <i class="fas fa-heart"></i>
                <span id="deal-like-count-${deal.id}">${deal.like_count || 0}</span>
              </button>
            </div>
            
            <!-- 액션 버튼 -->
            <div class="space-y-3 mb-6">
              <button type="button" onclick="event.stopPropagation(); shareDeal(${deal.id})" class="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 rounded-lg">
                <i class="fas fa-share"></i> 지인에게 공유하기
              </button>
              <button type="button" onclick="requestGroupChatForDeal()" class="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 rounded-lg">
                <i class="fas fa-users"></i> 지인들과 같이가기
              </button>
            </div>
            
            <!-- 같이 갈 사람 찾기 -->
            <div class="border-t pt-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold">같이 갈 사람 찾기</h3>
                <button type="button" onclick="showCreateGathering()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  <i class="fas fa-plus"></i> 작성하기
                </button>
              </div>
              
              ${gatherings.length > 0 ? `
                <div class="space-y-4">
                  ${gatherings.map(g => renderGatheringCardSmall(g)).join('')}
                </div>
              ` : `
                <p class="text-center text-gray-500 py-8">아직 같이가요 포스팅이 없습니다</p>
              `}
            </div>
          </div>
        </div>
      `
      
      document.body.insertAdjacentHTML('beforeend', html)
    })
}

function moveDetailSlider(direction) {
  const container = document.getElementById('detail-slider')
  const wrapper = container.querySelector('.slider-wrapper')
  const items = wrapper.querySelectorAll('.slider-item')
  const dots = container.querySelectorAll('.slider-dot')
  
  const currentIndex = Array.from(dots).findIndex(dot => dot.classList.contains('active'))
  let newIndex = currentIndex + direction
  
  if (newIndex < 0) newIndex = items.length - 1
  if (newIndex >= items.length) newIndex = 0
  
  wrapper.style.transform = `translateX(-${newIndex * 100}%)`
  
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === newIndex)
  })
}

function closeDealDetail() {
  document.getElementById('dealDetail')?.remove()
}

// 지인들과 같이가기
function requestGroupChatForDeal() {
  if (!requireLogin(() => requestGroupChatForDeal())) return
  
  showSuccessModal(
    '지인들과의 같이가요 채팅방 생성을 신청하시겠습니까?<br>관리자가 확인 후 문자로 안내해드립니다.',
    () => {
      // TODO: 관리자에게 알림 발송
      console.log('지인들과 같이가기 신청 완료')
    }
  )
}

// ============================================
// 같이가요 페이지
// ============================================
async function renderGatheringsPage() {
  const userId = APP_STATE.currentUser?.id
  const url = userId ? `/api/gatherings?user_id=${userId}` : '/api/gatherings'
  
  const res = await fetch(url)
  const data = await res.json()
  
  if (data.success) {
    APP_STATE.gatherings = data.gatherings
    
    const html = `
      <div class="max-w-2xl mx-auto">
        <div class="bg-white border-b p-4">
          <h1 class="text-2xl font-bold">같이가요</h1>
          <p class="text-gray-600 text-sm">같이 갈 사람을 찾을 수 있어요</p>
        </div>
        
        <div class="space-y-4 p-4 pb-24">
          ${APP_STATE.gatherings.length > 0 ? 
            APP_STATE.gatherings.map(g => renderGatheringCard(g)).join('') :
            '<p class="text-center text-gray-500 py-8">아직 같이가요 포스팅이 없습니다</p>'
          }
        </div>
        
        <!-- 플로팅 글쓰기 버튼 -->
        <button 
          onclick="showCreateGatheringModal()" 
          class="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-xl z-50 transition-transform hover:scale-110"
        >
          <i class="fas fa-pen"></i>
        </button>
      </div>
    `
    
    document.getElementById('app').innerHTML = html
  }
}

function renderGatheringCard(gathering) {
  const isLiked = gathering.is_liked > 0
  const statusText = gathering.status === 'open' ? '모집 중' : '모집 마감'
  const statusClass = gathering.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
  
  return `
    <div class="bg-white rounded-lg shadow p-4" onclick="showGatheringDetail(${gathering.id})">
      <div class="flex items-center justify-between mb-2 text-sm text-gray-600">
        <span class="font-medium">${gathering.user_name}</span>
        <span>${formatDate(gathering.created_at)}</span>
      </div>
      
      <h3 class="font-bold text-lg mb-2">${gathering.title}</h3>
      <p class="text-gray-600 text-sm mb-3 line-clamp-2">${gathering.content}</p>
      
      <div class="text-sm text-gray-700 mb-3">
        <div class="mb-1">
          <i class="fas fa-calendar text-blue-500 w-4"></i>
          <span>날짜: ${gathering.date_text}</span>
        </div>
        <div class="mb-1">
          <i class="fas fa-clock text-blue-500 w-4"></i>
          <span>시간: ${gathering.time_text}</span>
        </div>
        <div class="mb-1">
          <i class="fas fa-users text-blue-500 w-4"></i>
          <span>${gathering.current_people}/${gathering.max_people > 10 ? 'N' : gathering.max_people}명</span>
        </div>
      </div>
      
      <div class="text-sm mb-3">
        <p class="font-medium text-gray-800">${gathering.place_name}</p>
        <p class="text-gray-600">${gathering.place_address}</p>
      </div>
      
      <div class="flex items-center justify-between">
        <button onclick="toggleGatheringLike(event, ${gathering.id})" class="flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-600'}">
          <i class="fas fa-heart"></i>
          <span>${gathering.like_count || 0}</span>
        </button>
        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusClass}">${statusText}</span>
      </div>
    </div>
  `
}

function renderGatheringCardSmall(gathering) {
  const isLiked = gathering.is_liked > 0
  
  return `
    <div class="border rounded-lg p-3" onclick="showGatheringDetail(${gathering.id})">
      <div class="flex items-center justify-between mb-1 text-xs text-gray-600">
        <span class="font-medium">${gathering.user_name}</span>
        <span>${formatDate(gathering.created_at)}</span>
      </div>
      
      <h4 class="font-bold mb-1">${gathering.title}</h4>
      <p class="text-sm text-gray-600 mb-2 line-clamp-2">${gathering.content}</p>
      
      <div class="text-xs text-gray-700 mb-2">
        <span>날짜: ${gathering.date_text}</span> · 
        <span>시간: ${gathering.time_text}</span> · 
        <span>${gathering.current_people}/${gathering.max_people > 10 ? 'N' : gathering.max_people}명</span>
      </div>
      
      <div class="flex items-center justify-between">
        <button type="button" onclick="event.stopPropagation(); toggleGatheringLikeSmall(${gathering.id})" class="flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-600'}" id="small-like-btn-${gathering.id}">
          <i class="fas fa-heart"></i>
          <span id="small-like-count-${gathering.id}">${gathering.like_count || 0}</span>
        </button>
        <span class="text-xs text-green-600 font-medium">모집 중</span>
      </div>
    </div>
  `
}

// 작은 카드에서 같이가요 좋아요 토글 (특가 할인 상세에서 사용)
async function toggleGatheringLikeSmall(gatheringId) {
  if (!requireLogin(() => toggleGatheringLikeSmall(gatheringId))) return
  
  try {
    console.log('❤️ 작은 카드 좋아요 토글:', { gathering_id: gatheringId, user_id: APP_STATE.currentUser.id })
    
    const res = await fetch(`/api/gatherings/${gatheringId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: APP_STATE.currentUser.id })
    })
    
    const data = await res.json()
    console.log('❤️ 좋아요 토글 응답:', data)
    
    if (data.success) {
      // 최신 데이터 가져오기
      const userId = APP_STATE.currentUser?.id
      const url = userId ? `/api/gatherings/${gatheringId}?user_id=${userId}` : `/api/gatherings/${gatheringId}`
      const detailRes = await fetch(url)
      const detailData = await detailRes.json()
      
      if (detailData.success) {
        const gathering = detailData.gathering
        const isLiked = gathering.is_liked > 0
        
        // 좋아요 개수 업데이트
        const countElement = document.getElementById(`small-like-count-${gatheringId}`)
        if (countElement) {
          countElement.textContent = gathering.like_count || 0
        }
        
        // 버튼 색상 업데이트
        const button = document.getElementById(`small-like-btn-${gatheringId}`)
        if (button) {
          button.className = `flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-600'}`
        }
      }
    } else {
      console.error('❌ 좋아요 토글 실패:', data.error)
      alert('좋아요 처리에 실패했습니다.')
    }
  } catch (error) {
    console.error('❌ 좋아요 토글 오류:', error)
    alert('좋아요 처리 중 오류가 발생했습니다.')
  }
}

// 같이가요 좋아요 토글
async function toggleGatheringLike(event, gatheringId) {
  if (!requireLogin(() => toggleGatheringLike(null, gatheringId))) return
  
  try {
    console.log('❤️ 좋아요 토글 요청:', { gathering_id: gatheringId, user_id: APP_STATE.currentUser.id })
    
    const res = await fetch(`/api/gatherings/${gatheringId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: APP_STATE.currentUser.id })
    })
    
    const data = await res.json()
    console.log('❤️ 좋아요 토글 응답:', data)
    
    if (data.success) {
      // 좋아요 개수만 업데이트 (스크롤 위치 유지)
      const likeCountElement = document.getElementById(`like-count-${gatheringId}`)
      if (likeCountElement) {
        // 최신 데이터 가져오기
        const userId = APP_STATE.currentUser?.id
        const url = userId ? `/api/gatherings/${gatheringId}?user_id=${userId}` : `/api/gatherings/${gatheringId}`
        const detailRes = await fetch(url)
        const detailData = await detailRes.json()
        
        if (detailData.success) {
          // 좋아요 개수 업데이트
          likeCountElement.textContent = detailData.gathering.like_count || 0
          
          // 버튼 색상 업데이트
          const button = likeCountElement.closest('button')
          const isLiked = detailData.gathering.is_liked > 0
          button.className = `flex items-center gap-2 px-4 py-2 rounded-lg ${isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`
        }
      }
      
      // 목록 페이지의 데이터도 백그라운드에서 업데이트 (스크롤 위치 유지)
      const currentPath = APP_STATE.currentPage
      if (currentPath === 'gatherings') {
        // 현재 스크롤 위치 저장
        const scrollPos = window.scrollY
        await renderGatheringsPage()
        // 스크롤 위치 복원
        window.scrollTo(0, scrollPos)
      }
    } else {
      console.error('❌ 좋아요 토글 실패:', data.error)
      alert('좋아요 처리에 실패했습니다: ' + (data.error || '알 수 없는 오류'))
    }
  } catch (error) {
    console.error('❌ 좋아요 토글 중 오류:', error)
    alert('좋아요 처리 중 오류가 발생했습니다: ' + error.message)
  }
}

// 같이가요 상세 보기
async function showGatheringDetail(gatheringId) {
  const userId = APP_STATE.currentUser?.id
  const url = userId ? `/api/gatherings/${gatheringId}?user_id=${userId}` : `/api/gatherings/${gatheringId}`
  
  const res = await fetch(url)
  const data = await res.json()
  
  if (data.success) {
    APP_STATE.selectedGathering = data.gathering
    renderGatheringDetailPanel()
  }
}

function renderGatheringDetailPanel() {
  const g = APP_STATE.selectedGathering
  const isLiked = g.is_liked > 0
  const applicationStatus = g.application_status
  
  let applyButtonHtml = ''
  if (!APP_STATE.currentUser) {
    applyButtonHtml = '<button type="button" onclick="requireLogin(() => showGatheringDetail(' + g.id + '))" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg">동행 신청하기</button>'
  } else if (g.user_id === APP_STATE.currentUser.id) {
    applyButtonHtml = '<div class="text-center text-gray-600 py-4">내가 작성한 포스팅입니다</div>'
  } else if (applicationStatus === 'pending') {
    applyButtonHtml = '<button disabled class="w-full bg-gray-400 text-white font-bold py-4 rounded-lg cursor-not-allowed">수락 대기 중</button>'
  } else if (applicationStatus === 'accepted') {
    applyButtonHtml = '<div class="text-center text-green-600 font-bold py-4">동행이 수락되었습니다</div>'
  } else {
    applyButtonHtml = '<button type="button" onclick="applyGathering()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg">동행 신청하기</button>'
  }
  
  const html = `
    <div class="detail-panel active" id="gatheringDetail">
      <!-- 헤더 -->
      <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center" style="z-index: 20;">
        <button type="button" onclick="closeGatheringDetail()" class="mr-3">
          <i class="fas fa-times text-xl"></i>
        </button>
        <h2 class="text-lg font-bold">같이가요 상세</h2>
      </div>
      
      <!-- 내용 -->
      <div class="p-4">
        <div class="flex items-center justify-between mb-2 text-sm text-gray-600">
          <span class="font-medium">${g.user_name}</span>
          <span>${formatDate(g.created_at)}</span>
        </div>
        
        <h1 class="text-2xl font-bold mb-4">${g.title}</h1>
        
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="mb-2">
            <i class="fas fa-calendar text-blue-500 w-5"></i>
            <span class="font-medium">날짜:</span> ${g.date_text}
          </div>
          <div class="mb-2">
            <i class="fas fa-clock text-blue-500 w-5"></i>
            <span class="font-medium">시간:</span> ${g.time_text}
          </div>
          <div>
            <i class="fas fa-users text-blue-500 w-5"></i>
            <span class="font-medium">인원:</span> ${g.current_people}/${g.max_people > 10 ? 'N' : g.max_people}명
          </div>
        </div>
        
        <div class="mb-6">
          <h3 class="font-bold mb-2">내용</h3>
          <div class="text-gray-700 whitespace-pre-wrap">${g.content}</div>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 class="font-bold mb-2"><i class="fas fa-map-marker-alt text-red-500"></i> 장소</h3>
          <p class="font-medium">${g.place_name}</p>
          <p class="text-sm text-gray-600 mb-3">${g.place_address}</p>
          
          <!-- 네이버 정적 지도 이미지 -->
          <div class="relative bg-white rounded-lg border-2 border-gray-200 mb-3 overflow-hidden cursor-pointer" style="height: 200px;" onclick="openNaverMapForGathering(${g.id})">
            <img 
              src="/api/map/static?lat=${g.place_lat || 37.5665}&lng=${g.place_lng || 126.9780}&w=400&h=200&zoom=16"
              onerror="document.getElementById('gathering-map-fallback-${g.id}').style.display='flex'; this.style.display='none';"
              alt="${g.place_name} 지도"
              class="w-full h-full object-cover"
            />
            
            <!-- 지도 오버레이 안내 -->
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 text-center">
              <i class="fas fa-hand-pointer"></i> 지도를 클릭하면 네이버 지도로 이동합니다
            </div>
            
            <!-- 지도 로딩 실패 시 대체 UI -->
            <div id="gathering-map-fallback-${g.id}" class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50" style="display: none;">
              <i class="fas fa-map-marked-alt text-6xl text-green-600 mb-3"></i>
              <p class="text-gray-700 font-medium mb-1">${g.place_name}</p>
              <p class="text-gray-500 text-sm px-4 text-center">${g.place_address}</p>
              <p class="text-green-600 text-sm mt-3">👇 아래 버튼을 눌러 지도를 확인하세요</p>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-2 mb-4">
          <button type="button" onclick="toggleGatheringLike(null, ${g.id})" class="flex items-center gap-2 px-4 py-2 rounded-lg ${isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}">
            <i class="fas fa-heart"></i>
            <span id="like-count-${g.id}">${g.like_count || 0}</span>
          </button>
          <button type="button" onclick="shareGathering(${g.id})" class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-600">
            <i class="fas fa-share"></i>
            <span>공유하기</span>
          </button>
          <span class="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-medium">모집 중</span>
        </div>
        
        <div class="mb-6"></div>
        
        ${applyButtonHtml}
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', html)
}

function closeGatheringDetail() {
  document.getElementById('gatheringDetail')?.remove()
}

// 동행 신청
async function applyGathering() {
  if (!requireLogin(() => applyGathering())) return
  
  const g = APP_STATE.selectedGathering
  
  // 질문 답변 모달 표시
  showQuestionModal(g.question || '간단한 자기소개를 해주세요', async (answer) => {
    try {
      console.log('🤝 동행 신청 요청:', { gathering_id: g.id, user_id: APP_STATE.currentUser.id })
      
      const res = await fetch(`/api/gatherings/${g.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: APP_STATE.currentUser.id,
          answer: answer
        })
      })
      
      const data = await res.json()
      console.log('🤝 동행 신청 응답:', data)
      
      if (data.success) {
        closeGatheringDetail()
        showSuccessModal(
          '동행 신청이 완료되었습니다.<br>작성자가 수락 시 문자로 안내해드립니다.',
          () => {
            showGatheringDetail(g.id)
          }
        )
      } else {
        console.error('❌ 동행 신청 실패:', data.error)
        alert('동행 신청에 실패했습니다: ' + (data.error || '알 수 없는 오류'))
      }
    } catch (error) {
      console.error('❌ 동행 신청 중 오류:', error)
      alert('동행 신청 중 오류가 발생했습니다: ' + error.message)
    }
  })
}

// 같이가요 독립 작성 모달 (플로팅 버튼용)
function showCreateGatheringModal() {
  if (!requireLogin(() => showCreateGatheringModal())) return
  
  const html = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" id="createGatheringModal" onclick="if(event.target.id==='createGatheringModal') closeCreateGatheringModal()">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 class="text-lg font-bold">같이가요 작성</h2>
          <button type="button" onclick="closeCreateGatheringModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="p-4">
          <form onsubmit="submitIndependentGathering(event)" class="space-y-4">
            <div>
              <label class="block font-medium mb-2">제목</label>
              <input type="text" id="modal-title" required class="w-full border rounded-lg px-3 py-2" placeholder="제목을 입력하세요">
            </div>
            
            <div>
              <label class="block font-medium mb-2">내용</label>
              <textarea id="modal-content" required rows="5" class="w-full border rounded-lg px-3 py-2" placeholder="내용을 입력하세요"></textarea>
            </div>
            
            <!-- 장소 검색 -->
            <div>
              <label class="block font-medium mb-2">장소 검색</label>
              <div class="relative">
                <input 
                  type="text" 
                  id="place-search-input"
                  class="w-full border rounded-lg px-3 py-2 pr-10" 
                  placeholder="장소명을 입력하세요 (예: 연희동 와인률)"
                  onkeyup="searchPlacesDebounced(this.value)"
                  autocomplete="off"
                >
                <i class="fas fa-search absolute right-3 top-3 text-gray-400"></i>
              </div>
              
              <!-- 검색 결과 -->
              <div id="place-search-results" class="mt-2 border rounded-lg max-h-60 overflow-y-auto hidden"></div>
              
              <!-- 선택된 장소 표시 -->
              <div id="selected-place-display" class="mt-2"></div>
            </div>
            
            <!-- 숨김 필드 -->
            <input type="hidden" id="modal-place-name">
            <input type="hidden" id="modal-place-address">
            <input type="hidden" id="modal-place-lat">
            <input type="hidden" id="modal-place-lng">
            
            <div>
              <label class="block font-medium mb-2">날짜</label>
              <input type="text" id="modal-date" required class="w-full border rounded-lg px-3 py-2" placeholder="예: 2025년 10월 25일 또는 추후 조율">
            </div>
            
            <div>
              <label class="block font-medium mb-2">시간</label>
              <input type="text" id="modal-time" required class="w-full border rounded-lg px-3 py-2" placeholder="예: 오후 7:00 또는 저녁">
            </div>
            
            <div>
              <label class="block font-medium mb-2">최대 인원 (본인 포함)</label>
              <input type="number" id="modal-max-people" value="4" min="2" max="20" class="w-full border rounded-lg px-3 py-2">
            </div>
            
            <div>
              <label class="block font-medium mb-2">동행 신청자에게 할 질문 (선택)</label>
              <input type="text" id="modal-question" class="w-full border rounded-lg px-3 py-2" placeholder="예: 간단하게 자기소개를 해주실 수 있을까요?">
            </div>
            
            <div class="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <p class="mb-2"><strong>안내 사항</strong></p>
              <p class="mb-1">1. 동행 신청자가 발생하면 같이가요 1:1 채팅방에서 정보를 알려드리고, 수락/거절 여부를 선택하실 수 있어요</p>
              <p>2. 동행 수락된 유저들과의 단톡방에서 관리자가 일정 예약과 결제 관련 사항들을 안내해드려요</p>
            </div>
            
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">
              작성 완료
            </button>
          </form>
        </div>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', html)
}

function closeCreateGatheringModal() {
  document.getElementById('createGatheringModal')?.remove()
}

// 장소 검색 디바운스
let searchTimeout
function searchPlacesDebounced(keyword) {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchPlaces(keyword)
  }, 300)
}

// 장소 검색
async function searchPlaces(keyword) {
  const resultsDiv = document.getElementById('place-search-results')
  
  if (!keyword || keyword.trim().length < 2) {
    resultsDiv.innerHTML = ''
    resultsDiv.classList.add('hidden')
    return
  }
  
  try {
    console.log('🔍 장소 검색:', keyword)
    
    const res = await fetch(`/api/search/places?query=${encodeURIComponent(keyword)}`)
    const data = await res.json()
    
    console.log('🔍 검색 결과:', data)
    
    if (data.success && data.places && data.places.length > 0) {
      const html = data.places.map(place => `
        <div 
          onclick="selectPlace('${place.title.replace(/'/g, "\\'")}', '${(place.roadAddress || place.address).replace(/'/g, "\\'")}', ${place.lng}, ${place.lat})"
          class="p-3 border-b hover:bg-gray-50 cursor-pointer"
        >
          <div class="font-medium">${place.title}</div>
          <div class="text-sm text-gray-600">${place.roadAddress || place.address}</div>
          <div class="text-xs text-gray-500">${place.category}</div>
        </div>
      `).join('')
      
      resultsDiv.innerHTML = html
      resultsDiv.classList.remove('hidden')
    } else {
      resultsDiv.innerHTML = '<div class="p-4 text-gray-500 text-sm text-center">검색 결과가 없습니다</div>'
      resultsDiv.classList.remove('hidden')
    }
  } catch (error) {
    console.error('❌ 장소 검색 오류:', error)
    resultsDiv.innerHTML = '<div class="p-4 text-red-500 text-sm text-center">검색 중 오류가 발생했습니다</div>'
    resultsDiv.classList.remove('hidden')
  }
}

// 장소 선택
function selectPlace(name, address, lng, lat) {
  console.log('📍 장소 선택:', { name, address, lng, lat })
  
  // 숨김 필드에 값 설정
  document.getElementById('modal-place-name').value = name
  document.getElementById('modal-place-address').value = address
  document.getElementById('modal-place-lat').value = lat
  document.getElementById('modal-place-lng').value = lng
  
  // 검색 결과 숨기기
  document.getElementById('place-search-results').innerHTML = ''
  document.getElementById('place-search-results').classList.add('hidden')
  
  // 검색창 비우기
  document.getElementById('place-search-input').value = ''
  
  // 선택된 장소 표시
  document.getElementById('selected-place-display').innerHTML = `
    <div class="bg-green-50 border border-green-200 rounded-lg p-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium text-green-900">✓ ${name}</div>
          <div class="text-sm text-green-700">${address}</div>
        </div>
        <button type="button" onclick="clearSelectedPlace()" class="text-red-500 hover:text-red-700">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `
}

// 선택된 장소 지우기
function clearSelectedPlace() {
  document.getElementById('modal-place-name').value = ''
  document.getElementById('modal-place-address').value = ''
  document.getElementById('modal-place-lat').value = ''
  document.getElementById('modal-place-lng').value = ''
  document.getElementById('selected-place-display').innerHTML = ''
}

// 독립 같이가요 작성 제출
async function submitIndependentGathering(e) {
  e.preventDefault()
  
  // 장소 선택 확인
  const placeName = document.getElementById('modal-place-name').value
  if (!placeName) {
    alert('장소를 검색하여 선택해주세요.')
    return
  }
  
  try {
    const data = {
      user_id: APP_STATE.currentUser.id,
      special_deal_id: null,  // 특가 할인 연결 없음
      title: document.getElementById('modal-title').value,
      content: document.getElementById('modal-content').value,
      date_text: document.getElementById('modal-date').value,
      time_text: document.getElementById('modal-time').value,
      place_name: document.getElementById('modal-place-name').value,
      place_address: document.getElementById('modal-place-address').value,
      place_lat: parseFloat(document.getElementById('modal-place-lat').value),
      place_lng: parseFloat(document.getElementById('modal-place-lng').value),
      max_people: parseInt(document.getElementById('modal-max-people').value),
      question: document.getElementById('modal-question').value || null
    }
    
    console.log('📝 독립 같이가요 작성 요청:', data)
    
    const res = await fetch('/api/gatherings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await res.json()
    console.log('📝 작성 응답:', result)
    
    if (result.success) {
      closeCreateGatheringModal()
      showSuccessModal(
        '포스팅 작성에 성공했습니다.<br>동행 신청자 발생 시 문자로 안내해드립니다.',
        () => {
          navigateTo('gatherings')
        }
      )
    } else {
      console.error('❌ 작성 실패:', result.error)
      alert('포스팅 작성에 실패했습니다: ' + (result.error || '알 수 없는 오류'))
    }
  } catch (error) {
    console.error('❌ 같이가요 작성 중 오류:', error)
    alert('포스팅 작성 중 오류가 발생했습니다: ' + error.message)
  }
}

// 같이가요 작성하기 (특가 할인 상세에서)
function showCreateGathering() {
  if (!requireLogin(() => showCreateGathering())) return
  
  const deal = APP_STATE.selectedDeal
  
  const html = `
    <div class="detail-panel active" id="createGathering">
      <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center" style="z-index: 20;">
        <button type="button" onclick="closeCreateGathering()" class="mr-3">
          <i class="fas fa-times text-xl"></i>
        </button>
        <h2 class="text-lg font-bold">같이가요 작성</h2>
      </div>
      
      <div class="p-4">
        <form onsubmit="submitGathering(event)" class="space-y-4">
          <div>
            <label class="block font-medium mb-2">제목</label>
            <input type="text" name="title" required class="w-full border rounded-lg px-3 py-2" placeholder="제목을 입력하세요">
          </div>
          
          <div>
            <label class="block font-medium mb-2">내용</label>
            <textarea name="content" required rows="5" class="w-full border rounded-lg px-3 py-2" placeholder="내용을 입력하세요"></textarea>
          </div>
          
          <div>
            <label class="block font-medium mb-2">날짜</label>
            <input type="text" name="date_text" required class="w-full border rounded-lg px-3 py-2" placeholder="예: 2025년 10월 25일 또는 추후 조율">
          </div>
          
          <div>
            <label class="block font-medium mb-2">시간</label>
            <input type="text" name="time_text" required class="w-full border rounded-lg px-3 py-2" placeholder="예: 오후 7:00 또는 저녁">
          </div>
          
          <div>
            <label class="block font-medium mb-2">최대 인원 (본인 포함)</label>
            <input type="number" name="max_people" value="4" min="2" class="w-full border rounded-lg px-3 py-2">
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-bold mb-2">장소</h3>
            <p class="font-medium">${deal.place_name}</p>
            <p class="text-sm text-gray-600">${deal.place_address}</p>
          </div>
          
          <div>
            <label class="block font-medium mb-2">동행 신청자에게 할 질문</label>
            <input type="text" name="question" class="w-full border rounded-lg px-3 py-2" placeholder="예: 간단하게 자기소개를 해주실 수 있을까요?">
          </div>
          
          <div class="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            <p class="mb-2"><strong>안내 사항</strong></p>
            <p class="mb-1">1. 동행 신청자가 발생하면 같이가요 1:1 채팅방에서 정보를 알려드리고, 수락/거절 여부를 선택하실 수 있어요</p>
            <p>2. 동행 수락된 유저들과의 단톡방에서 관리자가 일정 예약과 결제 관련 사항들을 안내해드려요</p>
          </div>
          
          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">
            채팅방 생성 신청하기
          </button>
        </form>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', html)
}

function closeCreateGathering() {
  document.getElementById('createGathering')?.remove()
}

async function submitGathering(e) {
  e.preventDefault()
  
  try {
    const formData = new FormData(e.target)
    const deal = APP_STATE.selectedDeal
    
    const data = {
      user_id: APP_STATE.currentUser.id,
      special_deal_id: deal.id,
      title: formData.get('title'),
      content: formData.get('content'),
      date_text: formData.get('date_text'),
      time_text: formData.get('time_text'),
      place_name: deal.place_name,
      place_address: deal.place_address,
      place_lat: deal.place_lat || null,
      place_lng: deal.place_lng || null,
      max_people: parseInt(formData.get('max_people')),
      question: formData.get('question')
    }
    
    console.log('📝 같이가요 작성 요청:', data)
    
    const res = await fetch('/api/gatherings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await res.json()
    console.log('📝 같이가요 작성 응답:', result)
    
    if (result.success) {
      closeCreateGathering()
      closeDealDetail()
      showSuccessModal(
        '포스팅 작성에 성공했습니다.<br>동행 신청자 발생 시 문자로 안내해드립니다.',
        () => {
          navigateTo('gatherings')
        }
      )
    } else {
      console.error('❌ 작성 실패:', result.error)
      alert('포스팅 작성에 실패했습니다: ' + (result.error || '알 수 없는 오류'))
    }
  } catch (error) {
    console.error('❌ 같이가요 작성 중 오류:', error)
    alert('포스팅 작성 중 오류가 발생했습니다: ' + error.message)
  }
}

// ============================================
// MY 페이지
// ============================================
async function renderMyPage() {
  if (!APP_STATE.currentUser) {
    const html = `
      <div class="max-w-2xl mx-auto">
        <div class="bg-white border-b p-4">
          <h1 class="text-2xl font-bold">MY</h1>
        </div>
        
        <div class="p-8 text-center">
          <i class="fas fa-user-circle text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-600 mb-6">로그인이 필요합니다</p>
          <button type="button" onclick="showPhoneAuth()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            <i class="fas fa-mobile-alt"></i> 전화번호로 회원가입
          </button>
        </div>
      </div>
    `
    document.getElementById('app').innerHTML = html
    return
  }
  
  const html = `
    <div class="max-w-2xl mx-auto">
      <div class="bg-white border-b p-4">
        <h1 class="text-2xl font-bold">MY</h1>
        <p class="text-gray-600">안녕하세요! ${APP_STATE.currentUser.name}님</p>
      </div>
      
      <div class="p-4 space-y-3">
        <button type="button" onclick="showMyGatherings()" class="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="fas fa-pen text-blue-600 text-xl"></i>
              <span class="font-medium">내가 쓴 같이가요</span>
            </div>
            <i class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </button>
        
        <button type="button" onclick="showMyApplications()" class="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="fas fa-paper-plane text-green-600 text-xl"></i>
              <span class="font-medium">신청한 같이가요</span>
            </div>
            <i class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </button>
        
        <button type="button" onclick="showMyLikes()" class="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="fas fa-heart text-red-600 text-xl"></i>
              <span class="font-medium">내 좋아요</span>
            </div>
            <i class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </button>
        
        <button type="button" onclick="logout()" class="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50">
          <div class="flex items-center gap-3">
            <i class="fas fa-sign-out-alt text-gray-600 text-xl"></i>
            <span class="font-medium text-gray-600">로그아웃</span>
          </div>
        </button>
      </div>
    </div>
  `
  
  document.getElementById('app').innerHTML = html
}

// 내가 쓴 같이가요
async function showMyGatherings() {
  const res = await fetch(`/api/my/gatherings?user_id=${APP_STATE.currentUser.id}`)
  const data = await res.json()
  
  if (data.success) {
    const gatherings = data.gatherings
    
    const html = `
      <div class="max-w-2xl mx-auto">
        <div class="bg-white border-b p-4 flex items-center">
          <button type="button" onclick="renderMyPage()" class="mr-3">
            <i class="fas fa-arrow-left text-xl"></i>
          </button>
          <h1 class="text-xl font-bold">내가 쓴 같이가요</h1>
        </div>
        
        <div class="p-4 space-y-4">
          ${gatherings.length > 0 ?
            gatherings.map(g => renderMyGatheringCard(g)).join('') :
            '<p class="text-center text-gray-500 py-8">작성한 같이가요가 없습니다</p>'
          }
        </div>
      </div>
    `
    
    document.getElementById('app').innerHTML = html
  }
}

function renderMyGatheringCard(gathering) {
  return `
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="font-bold text-lg mb-2">${gathering.title}</h3>
      <p class="text-gray-600 text-sm mb-3 line-clamp-2">${gathering.content}</p>
      
      <div class="text-sm text-gray-700 mb-3">
        <div>날짜: ${gathering.date_text} · 시간: ${gathering.time_text}</div>
        <div>인원: ${gathering.current_people}/${gathering.max_people > 10 ? 'N' : gathering.max_people}명</div>
      </div>
      
      <div class="flex gap-2">
        <button type="button" onclick="showGatheringDetail(${gathering.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">
          상세보기
        </button>
        <button type="button" onclick="deleteGathering(${gathering.id})" class="px-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `
}

async function deleteGathering(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return
  
  try {
    console.log('🗑️ 같이가요 삭제 요청:', { gathering_id: id })
    
    const res = await fetch(`/api/gatherings/${id}`, { 
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const data = await res.json()
    console.log('🗑️ 같이가요 삭제 응답:', data)
    
    if (data.success) {
      alert('삭제되었습니다')
      showMyGatherings()
    } else {
      console.error('❌ 삭제 실패:', data.error)
      alert('삭제에 실패했습니다: ' + (data.error || '알 수 없는 오류'))
    }
  } catch (error) {
    console.error('❌ 삭제 중 오류:', error)
    alert('삭제 중 오류가 발생했습니다: ' + error.message)
  }
}

// 신청한 같이가요
async function showMyApplications() {
  const res = await fetch(`/api/my/applications?user_id=${APP_STATE.currentUser.id}`)
  const data = await res.json()
  
  if (data.success) {
    const gatherings = data.gatherings
    
    const html = `
      <div class="max-w-2xl mx-auto">
        <div class="bg-white border-b p-4 flex items-center">
          <button type="button" onclick="renderMyPage()" class="mr-3">
            <i class="fas fa-arrow-left text-xl"></i>
          </button>
          <h1 class="text-xl font-bold">신청한 같이가요</h1>
        </div>
        
        <div class="p-4 space-y-4">
          ${gatherings.length > 0 ?
            gatherings.map(g => renderApplicationCard(g)).join('') :
            '<p class="text-center text-gray-500 py-8">신청한 같이가요가 없습니다</p>'
          }
        </div>
      </div>
    `
    
    document.getElementById('app').innerHTML = html
  }
}

function renderApplicationCard(gathering) {
  const statusText = {
    'pending': '수락 대기 중',
    'accepted': '수락됨',
    'rejected': '거절됨'
  }[gathering.application_status]
  
  const statusClass = {
    'pending': 'bg-yellow-100 text-yellow-700',
    'accepted': 'bg-green-100 text-green-700',
    'rejected': 'bg-red-100 text-red-700'
  }[gathering.application_status]
  
  return `
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-gray-600">${gathering.user_name}</span>
        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">${statusText}</span>
      </div>
      
      <h3 class="font-bold text-lg mb-2">${gathering.title}</h3>
      <p class="text-gray-600 text-sm mb-3 line-clamp-2">${gathering.content}</p>
      
      <button type="button" onclick="showGatheringDetail(${gathering.id})" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">
        상세보기
      </button>
    </div>
  `
}

// 내 좋아요
async function showMyLikes() {
  const [dealsRes, gatheringsRes] = await Promise.all([
    fetch(`/api/my/liked-deals?user_id=${APP_STATE.currentUser.id}`),
    fetch(`/api/my/liked-gatherings?user_id=${APP_STATE.currentUser.id}`)
  ])
  
  const [dealsData, gatheringsData] = await Promise.all([
    dealsRes.json(),
    gatheringsRes.json()
  ])
  
  const deals = dealsData.success ? dealsData.deals : []
  const gatherings = gatheringsData.success ? gatheringsData.gatherings : []
  
  const html = `
    <div class="max-w-2xl mx-auto">
      <div class="bg-white border-b p-4 flex items-center">
        <button type="button" onclick="renderMyPage()" class="mr-3">
          <i class="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 class="text-xl font-bold">내 좋아요</h1>
      </div>
      
      <div class="p-4">
        <h2 class="text-lg font-bold mb-3">특가 할인</h2>
        <div class="space-y-4 mb-6">
          ${deals.length > 0 ?
            deals.map(d => `
              <div class="bg-white rounded-lg shadow p-4" onclick="showDealDetail(${d.id})">
                <h3 class="font-bold mb-1">${d.title}</h3>
                <p class="text-sm text-gray-600">${d.subtitle || ''}</p>
              </div>
            `).join('') :
            '<p class="text-center text-gray-500 py-4">좋아요한 특가 할인이 없습니다</p>'
          }
        </div>
        
        <h2 class="text-lg font-bold mb-3">같이가요</h2>
        <div class="space-y-4">
          ${gatherings.length > 0 ?
            gatherings.map(g => `
              <div class="bg-white rounded-lg shadow p-4" onclick="showGatheringDetail(${g.id})">
                <h3 class="font-bold mb-1">${g.title}</h3>
                <p class="text-sm text-gray-600 line-clamp-1">${g.content}</p>
              </div>
            `).join('') :
            '<p class="text-center text-gray-500 py-4">좋아요한 같이가요가 없습니다</p>'
          }
        </div>
      </div>
    </div>
  `
  
  document.getElementById('app').innerHTML = html
}

// ============================================
// 유틸리티
// ============================================
function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 7) {
    return date.toLocaleDateString('ko-KR')
  } else if (days > 0) {
    return `${days}일 전`
  } else if (hours > 0) {
    return `${hours}시간 전`
  } else if (minutes > 0) {
    return `${minutes}분 전`
  } else {
    return '방금 전'
  }
}

// ============================================
// 딥링크 처리 (카카오톡 공유 링크)
// ============================================
function handleDeepLink() {
  const urlParams = new URLSearchParams(window.location.search)
  const dealId = urlParams.get('deal')
  const gatheringId = urlParams.get('gathering')
  
  if (dealId) {
    console.log('🔗 딥링크 감지: 특가 할인 #' + dealId)
    // 특가 할인 페이지로 이동 후 상세보기
    navigateTo('deals')
    setTimeout(() => {
      showDealDetail(parseInt(dealId))
    }, 100)
  } else if (gatheringId) {
    console.log('🔗 딥링크 감지: 같이가요 #' + gatheringId)
    // 같이가요 페이지로 이동 후 상세보기
    navigateTo('gatherings')
    setTimeout(() => {
      showGatheringDetail(parseInt(gatheringId))
    }, 100)
  } else {
    // 파라미터 없으면 기본 페이지로
    navigateTo('deals')
  }
  
  // URL 파라미터 제거 (깨끗한 URL 유지)
  if (dealId || gatheringId) {
    window.history.replaceState({}, '', window.location.pathname)
  }
}

// ============================================
// 관리자 이메일 알림
// ============================================
async function sendAdminEmail(type, data) {
  try {
    const res = await fetch('/api/admin/email-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    })
    
    const result = await res.json()
    if (result.success) {
      console.log('✅ 관리자 이메일 발송 성공')
    } else {
      console.error('❌ 관리자 이메일 발송 실패:', result.error)
    }
  } catch (error) {
    console.error('❌ 관리자 이메일 발송 오류:', error)
  }
}

// ============================================
// 초기화
// ============================================

// Kakao SDK 초기화
if (typeof Kakao !== 'undefined' && window.KAKAO_KEY) {
  if (!Kakao.isInitialized()) {
    try {
      Kakao.init(window.KAKAO_KEY)
      console.log('✅ Kakao SDK 초기화 완료')
      console.log('📱 JavaScript 키:', window.KAKAO_KEY)
      console.log('🌐 현재 도메인:', window.location.origin)
    } catch (error) {
      console.error('❌ Kakao SDK 초기화 실패:', error)
    }
  } else {
    console.log('✅ Kakao SDK 이미 초기화됨')
  }
} else {
  console.warn('⚠️ Kakao SDK를 불러올 수 없습니다')
  console.warn('Kakao 객체:', typeof Kakao)
  console.warn('KAKAO_KEY:', window.KAKAO_KEY)
}

loadUser()
handleDeepLink()
