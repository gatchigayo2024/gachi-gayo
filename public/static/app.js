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
  loginCallback: null
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
// 카카오 로그인
// ============================================
// 카카오 SDK 초기화 (실제 사용시 JavaScript 키 필요)
// Kakao.init('YOUR_JAVASCRIPT_KEY')

function kakaoLogin() {
  // MVP 버전: 간단한 테스트 로그인
  const name = prompt('테스트용 이름을 입력하세요:')
  if (!name) return
  
  const testUser = {
    kakao_id: 'test_' + Date.now(),
    name: name,
    phone: '010-0000-0000'
  }
  
  // 서버에 로그인 요청
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      saveUser(data.user)
      closeLoginModal()
      
      // 로그인 후 콜백 실행
      if (APP_STATE.loginCallback) {
        APP_STATE.loginCallback()
        APP_STATE.loginCallback = null
      } else {
        navigateTo(APP_STATE.currentPage)
      }
    }
  })
  .catch(err => {
    alert('로그인 실패')
    console.error(err)
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
              closeLoginModal()
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

function showLoginModal(callback) {
  APP_STATE.loginCallback = callback
  document.getElementById('loginModal').classList.add('active')
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('active')
  APP_STATE.loginCallback = null
}

function requireLogin(callback) {
  if (!APP_STATE.currentUser) {
    showLoginModal(callback)
    return false
  }
  return true
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
          <h1 class="text-2xl font-bold">같이가요</h1>
          <p class="text-gray-600 text-sm">특가 할인으로 함께 즐거운 시간을</p>
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
          <button class="slider-button prev" onclick="moveSlider(${deal.id}, -1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="slider-button next" onclick="moveSlider(${deal.id}, 1)">
            <i class="fas fa-chevron-right"></i>
          </button>
          <div class="slider-dots">
            ${images.map((_, i) => `<div class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}
          </div>
        ` : ''}
      </div>
      
      <!-- 정보 -->
      <div class="p-4">
        <h2 class="text-lg font-bold mb-1">${deal.title}</h2>
        ${deal.subtitle ? `<p class="text-sm text-gray-600 mb-3">${deal.subtitle}</p>` : ''}
        
        <!-- 액션 버튼 -->
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-4">
            <button onclick="toggleDealLike(${deal.id})" class="flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-600'}">
              <i class="fas fa-heart"></i>
              <span>${deal.like_count || 0}</span>
            </button>
            <div class="flex items-center gap-1 text-gray-600">
              <i class="fas fa-users"></i>
              <span>${deal.gathering_count || 0}</span>
            </div>
            <button onclick="shareDeal(${deal.id})" class="text-gray-600">
              <i class="fas fa-share"></i>
            </button>
          </div>
          <button onclick="showDealDetail(${deal.id})" class="text-blue-600 font-medium">
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
async function toggleDealLike(dealId) {
  if (!requireLogin(() => toggleDealLike(dealId))) return
  
  const res = await fetch(`/api/deals/${dealId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: APP_STATE.currentUser.id })
  })
  
  const data = await res.json()
  if (data.success) {
    renderDealsPage()
  }
}

// 특가 할인 공유
function shareDeal(dealId) {
  // MVP: 간단한 URL 복사
  const url = `${window.location.origin}/?deal=${dealId}`
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
    alert('링크가 복사되었습니다!')
  } else {
    prompt('이 링크를 복사하세요:', url)
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
          <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center z-10">
            <button onclick="closeDealDetail()" class="mr-3">
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
                <button class="slider-button prev" onclick="moveDetailSlider(-1)">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="slider-button next" onclick="moveDetailSlider(1)">
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
              <p class="text-sm text-gray-600">${deal.place_address}</p>
            </div>
            
            <!-- 액션 버튼 -->
            <div class="space-y-3 mb-6">
              <button onclick="shareDeal(${deal.id})" class="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 rounded-lg">
                <i class="fas fa-share"></i> 지인에게 공유하기
              </button>
              <button onclick="requestGroupChatForDeal()" class="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 rounded-lg">
                <i class="fas fa-users"></i> 지인들과 같이가기
              </button>
            </div>
            
            <!-- 같이 갈 사람 찾기 -->
            <div class="border-t pt-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold">같이 갈 사람 찾기</h3>
                <button onclick="showCreateGathering()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
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
  
  if (confirm('같이가요 채팅방 생성을 신청하시겠습니까? 관리자가 확인 후 연락드립니다.')) {
    // TODO: 관리자에게 이메일 발송
    alert('채팅방 생성이 신청되었습니다. 관리자가 확인 후 연락드리겠습니다.')
  }
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
          <p class="text-gray-600 text-sm">함께할 사람을 찾아보세요</p>
        </div>
        
        <div class="space-y-4 p-4">
          ${APP_STATE.gatherings.length > 0 ? 
            APP_STATE.gatherings.map(g => renderGatheringCard(g)).join('') :
            '<p class="text-center text-gray-500 py-8">아직 같이가요 포스팅이 없습니다</p>'
          }
        </div>
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
        <button onclick="event.stopPropagation(); toggleGatheringLike(${gathering.id})" class="flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-600'}">
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
        <button onclick="event.stopPropagation(); toggleGatheringLike(${gathering.id})" class="flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-600'}">
          <i class="fas fa-heart"></i>
          <span>${gathering.like_count || 0}</span>
        </button>
        <span class="text-xs text-green-600 font-medium">모집 중</span>
      </div>
    </div>
  `
}

// 같이가요 좋아요 토글
async function toggleGatheringLike(gatheringId) {
  if (!requireLogin(() => toggleGatheringLike(gatheringId))) return
  
  const res = await fetch(`/api/gatherings/${gatheringId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: APP_STATE.currentUser.id })
  })
  
  const data = await res.json()
  if (data.success) {
    renderGatheringsPage()
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
    applyButtonHtml = '<button onclick="requireLogin(() => showGatheringDetail(' + g.id + '))" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg">동행 신청하기</button>'
  } else if (g.user_id === APP_STATE.currentUser.id) {
    applyButtonHtml = '<div class="text-center text-gray-600 py-4">내가 작성한 포스팅입니다</div>'
  } else if (applicationStatus === 'pending') {
    applyButtonHtml = '<button disabled class="w-full bg-gray-400 text-white font-bold py-4 rounded-lg cursor-not-allowed">수락 대기 중</button>'
  } else if (applicationStatus === 'accepted') {
    applyButtonHtml = '<div class="text-center text-green-600 font-bold py-4">동행이 수락되었습니다</div>'
  } else {
    applyButtonHtml = '<button onclick="applyGathering()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg">동행 신청하기</button>'
  }
  
  const html = `
    <div class="detail-panel active" id="gatheringDetail">
      <!-- 헤더 -->
      <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center z-10">
        <button onclick="closeGatheringDetail()" class="mr-3">
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
          <div class="bg-gray-200 h-32 rounded flex items-center justify-center text-gray-500">
            <i class="fas fa-map text-4xl"></i>
          </div>
        </div>
        
        <div class="flex items-center gap-2 mb-6">
          <button onclick="toggleGatheringLike(${g.id})" class="flex items-center gap-2 px-4 py-2 rounded-lg ${isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}">
            <i class="fas fa-heart"></i>
            <span>${g.like_count || 0}</span>
          </button>
          <span class="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-medium">모집 중</span>
        </div>
        
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
function applyGathering() {
  if (!requireLogin(() => applyGathering())) return
  
  const g = APP_STATE.selectedGathering
  
  const answer = prompt(g.question || '간단한 자기소개를 해주세요:')
  if (answer === null) return
  
  fetch(`/api/gatherings/${g.id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: APP_STATE.currentUser.id,
      answer: answer
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('동행 신청이 완료되었습니다. 작성자가 수락하면 카카오 채팅방으로 연결됩니다.')
      closeGatheringDetail()
      showGatheringDetail(g.id)
    } else {
      alert(data.error || '동행 신청에 실패했습니다.')
    }
  })
}

// 같이가요 작성하기
function showCreateGathering() {
  if (!requireLogin(() => showCreateGathering())) return
  
  const deal = APP_STATE.selectedDeal
  
  const html = `
    <div class="detail-panel active" id="createGathering">
      <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center z-10">
        <button onclick="closeCreateGathering()" class="mr-3">
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
    max_people: parseInt(formData.get('max_people')),
    question: formData.get('question')
  }
  
  const res = await fetch('/api/gatherings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  const result = await res.json()
  if (result.success) {
    alert('같이가요 포스팅이 작성되었습니다!')
    closeCreateGathering()
    closeDealDetail()
    navigateTo('gatherings')
  } else {
    alert('포스팅 작성에 실패했습니다.')
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
          <button onclick="showLoginModal()" class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg">
            <i class="fas fa-comment"></i> 카카오로 가입하기
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
        <button onclick="showMyGatherings()" class="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="fas fa-pen text-blue-600 text-xl"></i>
              <span class="font-medium">내가 쓴 같이가요</span>
            </div>
            <i class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </button>
        
        <button onclick="showMyApplications()" class="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="fas fa-paper-plane text-green-600 text-xl"></i>
              <span class="font-medium">신청한 같이가요</span>
            </div>
            <i class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </button>
        
        <button onclick="showMyLikes()" class="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="fas fa-heart text-red-600 text-xl"></i>
              <span class="font-medium">내 좋아요</span>
            </div>
            <i class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </button>
        
        <button onclick="logout()" class="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50">
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
          <button onclick="renderMyPage()" class="mr-3">
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
        <button onclick="showGatheringDetail(${gathering.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">
          상세보기
        </button>
        <button onclick="deleteGathering(${gathering.id})" class="px-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `
}

async function deleteGathering(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return
  
  const res = await fetch(`/api/gatherings/${id}`, { method: 'DELETE' })
  const data = await res.json()
  
  if (data.success) {
    alert('삭제되었습니다')
    showMyGatherings()
  } else {
    alert('삭제에 실패했습니다')
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
          <button onclick="renderMyPage()" class="mr-3">
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
      
      <button onclick="showGatheringDetail(${gathering.id})" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">
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
        <button onclick="renderMyPage()" class="mr-3">
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
// 초기화
// ============================================
loadUser()
navigateTo('deals')
