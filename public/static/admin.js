// ============================================
// 관리자 페이지 상태 관리
// ============================================

const ADMIN_STATE = {
  admin: null,
  sessionToken: null,
  currentPage: 'login'
}

// ============================================
// 초기화
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // 세션 확인
  const savedSession = localStorage.getItem('admin_session')
  if (savedSession) {
    ADMIN_STATE.sessionToken = savedSession
    checkSession()
  } else {
    renderLoginPage()
  }
})

// ============================================
// 세션 관리
// ============================================

async function checkSession() {
  try {
    const res = await fetch('/api/admin/check-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: ADMIN_STATE.sessionToken })
    })
    
    const data = await res.json()
    
    if (data.success) {
      ADMIN_STATE.admin = data.admin
      renderDashboard()
    } else {
      localStorage.removeItem('admin_session')
      renderLoginPage()
    }
  } catch (error) {
    console.error('세션 확인 오류:', error)
    renderLoginPage()
  }
}

function logout() {
  ADMIN_STATE.admin = null
  ADMIN_STATE.sessionToken = null
  localStorage.removeItem('admin_session')
  renderLoginPage()
}

// ============================================
// 로그인 페이지
// ============================================

function renderLoginPage() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div class="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <i class="fas fa-shield-alt text-5xl text-blue-600 mb-4"></i>
          <h1 class="text-3xl font-bold text-gray-800">같이가요 관리자</h1>
          <p class="text-gray-600 mt-2">관리자 로그인</p>
        </div>
        
        <form onsubmit="handleLogin(event)" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-phone mr-2"></i>전화번호
            </label>
            <input 
              type="tel" 
              id="admin-phone" 
              placeholder="01012345678"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-lock mr-2"></i>비밀번호
            </label>
            <input 
              type="password" 
              id="admin-password" 
              placeholder="비밀번호를 입력하세요"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <button 
            type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>로그인
          </button>
        </form>
        
        <div class="mt-6 text-center text-sm text-gray-600">
          <p>테스트 계정</p>
          <p class="font-mono mt-1">01012345678 / admin1234</p>
        </div>
      </div>
    </div>
  `
}

async function handleLogin(event) {
  event.preventDefault()
  
  const phone = document.getElementById('admin-phone').value
  const password = document.getElementById('admin-password').value
  
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    })
    
    const data = await res.json()
    
    if (data.success) {
      ADMIN_STATE.admin = data.admin
      ADMIN_STATE.sessionToken = data.sessionToken
      localStorage.setItem('admin_session', data.sessionToken)
      renderDashboard()
    } else {
      alert('❌ ' + data.error)
    }
  } catch (error) {
    console.error('로그인 오류:', error)
    alert('로그인 중 오류가 발생했습니다.')
  }
}

// ============================================
// 대시보드
// ============================================

async function renderDashboard() {
  ADMIN_STATE.currentPage = 'dashboard'
  
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <!-- 헤더 - 모바일 최적화 -->
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div class="flex items-center gap-2 sm:gap-3">
            <i class="fas fa-shield-alt text-xl sm:text-2xl text-blue-600"></i>
            <h1 class="text-lg sm:text-2xl font-bold text-gray-800">같이가요 관리자</h1>
          </div>
          <div class="flex items-center gap-2 sm:gap-4">
            <span class="text-sm sm:text-base text-gray-600 hidden sm:inline">
              <i class="fas fa-user mr-2"></i>${ADMIN_STATE.admin.name}
            </span>
            <button onclick="logout()" class="text-red-600 hover:text-red-700 px-2 py-1 sm:px-3 sm:py-2 text-sm sm:text-base">
              <i class="fas fa-sign-out-alt sm:mr-2"></i><span class="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>
      
      <!-- 메인 컨텐츠 -->
      <div class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <!-- 네비게이션 - 모바일에서 가로 스크롤 -->
        <div class="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6 overflow-x-auto">
          <div class="flex gap-2 sm:gap-4 min-w-max sm:min-w-0 sm:flex-wrap">
            <button onclick="renderDashboard()" class="px-3 sm:px-4 py-2 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap text-sm sm:text-base">
              <i class="fas fa-chart-line mr-1 sm:mr-2"></i>대시보드
            </button>
            <button onclick="renderUsersPage()" class="px-3 sm:px-4 py-2 sm:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 whitespace-nowrap text-sm sm:text-base">
              <i class="fas fa-users mr-1 sm:mr-2"></i>사용자
            </button>
            <button onclick="renderDealsPage()" class="px-3 sm:px-4 py-2 sm:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 whitespace-nowrap text-sm sm:text-base">
              <i class="fas fa-tag mr-1 sm:mr-2"></i>특가할인
            </button>
            <button onclick="renderGatheringsPage()" class="px-3 sm:px-4 py-2 sm:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 whitespace-nowrap text-sm sm:text-base">
              <i class="fas fa-calendar mr-1 sm:mr-2"></i>같이가요
            </button>
            <button onclick="renderApplicationsPage()" class="px-3 sm:px-4 py-2 sm:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 whitespace-nowrap text-sm sm:text-base">
              <i class="fas fa-user-friends mr-1 sm:mr-2"></i>동행 신청
            </button>
            <button onclick="renderGroupRequestsPage()" class="px-3 sm:px-4 py-2 sm:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 whitespace-nowrap text-sm sm:text-base">
              <i class="fas fa-comments mr-1 sm:mr-2"></i>지인 신청
            </button>
          </div>
        </div>
        
        <!-- 통계 카드 - 모바일 최적화 (1열, 작은 화면에서 2열) -->
        <div id="stats-container" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
            <i class="fas fa-users text-2xl sm:text-4xl text-blue-600 mb-2 sm:mb-3"></i>
            <div class="text-xl sm:text-3xl font-bold text-gray-800" id="stat-users">-</div>
            <div class="text-xs sm:text-base text-gray-600 mt-1">사용자</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
            <i class="fas fa-tag text-2xl sm:text-4xl text-green-600 mb-2 sm:mb-3"></i>
            <div class="text-xl sm:text-3xl font-bold text-gray-800" id="stat-deals">-</div>
            <div class="text-xs sm:text-base text-gray-600 mt-1">특가할인</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
            <i class="fas fa-calendar text-2xl sm:text-4xl text-purple-600 mb-2 sm:mb-3"></i>
            <div class="text-xl sm:text-3xl font-bold text-gray-800" id="stat-gatherings">-</div>
            <div class="text-xs sm:text-base text-gray-600 mt-1">같이가요</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
            <i class="fas fa-user-friends text-2xl sm:text-4xl text-orange-600 mb-2 sm:mb-3"></i>
            <div class="text-xl sm:text-3xl font-bold text-gray-800" id="stat-applications">-</div>
            <div class="text-xs sm:text-base text-gray-600 mt-1">동행</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
            <i class="fas fa-comments text-2xl sm:text-4xl text-pink-600 mb-2 sm:mb-3"></i>
            <div class="text-xl sm:text-3xl font-bold text-gray-800" id="stat-group-requests">-</div>
            <div class="text-xs sm:text-base text-gray-600 mt-1">지인</div>
          </div>
        </div>
        
        <!-- 최근 활동 -->
        <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 class="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
            <i class="fas fa-clock mr-2"></i>최근 활동
          </h2>
          <div id="recent-activities" class="space-y-2 sm:space-y-3">
            <div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">로딩 중...</div>
          </div>
        </div>
      </div>
    </div>
  `
  
  // 통계 데이터 로딩
  loadStats()
}

async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats')
    const data = await res.json()
    
    if (data.success) {
      document.getElementById('stat-users').textContent = data.stats.users
      document.getElementById('stat-deals').textContent = data.stats.deals
      document.getElementById('stat-gatherings').textContent = data.stats.gatherings
      document.getElementById('stat-applications').textContent = data.stats.applications
      document.getElementById('stat-group-requests').textContent = data.stats.groupRequests
      
      // 최근 활동 표시 - 모바일 최적화
      const activitiesHtml = data.recentActivities.map(activity => `
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
          <div class="flex items-center gap-2 sm:gap-3">
            <i class="fas fa-calendar text-purple-600 text-sm sm:text-base"></i>
            <div>
              <div class="font-medium text-gray-800 text-sm sm:text-base">${activity.title}</div>
              <div class="text-xs sm:text-sm text-gray-600">by ${activity.user_name}</div>
            </div>
          </div>
          <div class="text-xs sm:text-sm text-gray-500 pl-6 sm:pl-0">
            ${new Date(activity.created_at).toLocaleString('ko-KR')}
          </div>
        </div>
      `).join('')
      
      document.getElementById('recent-activities').innerHTML = activitiesHtml || '<div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">최근 활동이 없습니다</div>'
    }
  } catch (error) {
    console.error('통계 로딩 오류:', error)
  }
}

// ============================================
// 사용자 관리 페이지
// ============================================

async function renderUsersPage() {
  ADMIN_STATE.currentPage = 'users'
  
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 class="text-lg sm:text-2xl font-bold text-gray-800">
            <i class="fas fa-users mr-2"></i>사용자 관리
          </h1>
        </div>
      </header>
      
      <div class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <button onclick="renderDashboard()" class="mb-3 sm:mb-4 text-blue-600 hover:text-blue-700 px-3 py-2 text-sm sm:text-base">
          <i class="fas fa-arrow-left mr-2"></i>대시보드로 돌아가기
        </button>
        
        <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div id="users-list">
            <div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">로딩 중...</div>
          </div>
        </div>
      </div>
    </div>
  `
  
  loadUsers()
}

async function loadUsers() {
  try {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    
    if (data.success) {
      // 모바일: 카드 레이아웃, 데스크톱: 테이블 레이아웃
      const html = `
        <!-- 데스크톱 테이블 (768px 이상) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left p-3">ID</th>
                <th class="text-left p-3">이름</th>
                <th class="text-left p-3">전화번호</th>
                <th class="text-left p-3">포스팅</th>
                <th class="text-left p-3">신청</th>
                <th class="text-left p-3">가입일</th>
                <th class="text-left p-3">상태</th>
                <th class="text-left p-3">관리</th>
              </tr>
            </thead>
            <tbody>
              ${data.users.map(user => `
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-3">${user.id}</td>
                  <td class="p-3">${user.name}</td>
                  <td class="p-3 font-mono">${user.phone}</td>
                  <td class="p-3">${user.gathering_count}</td>
                  <td class="p-3">${user.application_count}</td>
                  <td class="p-3">${new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
                  <td class="p-3">
                    ${user.blocked_id ? 
                      '<span class="text-red-600 font-medium">차단됨</span>' : 
                      '<span class="text-green-600">정상</span>'
                    }
                  </td>
                  <td class="p-3">
                    ${user.blocked_id ? 
                      `<button onclick="unblockUser(${user.id})" class="text-green-600 hover:text-green-700">
                        <i class="fas fa-unlock mr-1"></i>차단 해제
                      </button>` :
                      `<button onclick="blockUser(${user.id}, '${user.name}')" class="text-red-600 hover:text-red-700">
                        <i class="fas fa-ban mr-1"></i>차단
                      </button>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- 모바일 카드 레이아웃 (768px 미만) -->
        <div class="md:hidden space-y-3">
          ${data.users.map(user => `
            <div class="border rounded-lg p-4 bg-gray-50">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <div class="font-bold text-lg text-gray-800">${user.name}</div>
                  <div class="text-sm font-mono text-gray-600">${user.phone}</div>
                </div>
                <div>
                  ${user.blocked_id ? 
                    '<span class="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">차단됨</span>' : 
                    '<span class="text-xs px-2 py-1 bg-green-100 text-green-600 rounded">정상</span>'
                  }
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-2 text-center mb-3">
                <div class="bg-white rounded p-2">
                  <div class="text-xs text-gray-500">ID</div>
                  <div class="font-medium">${user.id}</div>
                </div>
                <div class="bg-white rounded p-2">
                  <div class="text-xs text-gray-500">포스팅</div>
                  <div class="font-medium">${user.gathering_count}</div>
                </div>
                <div class="bg-white rounded p-2">
                  <div class="text-xs text-gray-500">신청</div>
                  <div class="font-medium">${user.application_count}</div>
                </div>
              </div>
              
              <div class="flex justify-between items-center text-sm">
                <div class="text-gray-500">
                  <i class="fas fa-calendar mr-1"></i>
                  ${new Date(user.created_at).toLocaleDateString('ko-KR')}
                </div>
                <div>
                  ${user.blocked_id ? 
                    `<button onclick="unblockUser(${user.id})" class="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                      <i class="fas fa-unlock mr-1"></i>해제
                    </button>` :
                    `<button onclick="blockUser(${user.id}, '${user.name}')" class="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                      <i class="fas fa-ban mr-1"></i>차단
                    </button>`
                  }
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `
      
      document.getElementById('users-list').innerHTML = html
    }
  } catch (error) {
    console.error('사용자 목록 로딩 오류:', error)
  }
}

async function blockUser(userId, userName) {
  const reason = prompt(`"${userName}" 사용자를 차단하시겠습니까?\n차단 사유를 입력하세요:`)
  
  if (reason !== null) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: ADMIN_STATE.admin.id,
          reason
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        alert('✅ 사용자가 차단되었습니다.')
        loadUsers()
      } else {
        alert('❌ ' + data.error)
      }
    } catch (error) {
      console.error('차단 오류:', error)
      alert('차단 중 오류가 발생했습니다.')
    }
  }
}

async function unblockUser(userId) {
  if (confirm('이 사용자의 차단을 해제하시겠습니까?')) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/unblock`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (data.success) {
        alert('✅ 차단이 해제되었습니다.')
        loadUsers()
      } else {
        alert('❌ ' + data.error)
      }
    } catch (error) {
      console.error('차단 해제 오류:', error)
      alert('차단 해제 중 오류가 발생했습니다.')
    }
  }
}

// ============================================
// 특가할인 관리 페이지
// ============================================

async function renderDealsPage() {
  ADMIN_STATE.currentPage = 'deals'
  
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 class="text-lg sm:text-2xl font-bold text-gray-800">
            <i class="fas fa-tag mr-2"></i>특가할인 관리
          </h1>
        </div>
      </header>
      
      <div class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
          <button onclick="renderDashboard()" class="text-blue-600 hover:text-blue-700 px-3 py-2 text-sm sm:text-base">
            <i class="fas fa-arrow-left mr-2"></i>대시보드로 돌아가기
          </button>
          <button onclick="showCreateDealModal()" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg text-sm sm:text-base">
            <i class="fas fa-plus mr-2"></i>새 특가할인 추가
          </button>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div id="deals-list">
            <div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">로딩 중...</div>
          </div>
        </div>
      </div>
    </div>
  `
  
  loadDeals()
}

async function loadDeals() {
  try {
    const res = await fetch('/api/deals')
    const data = await res.json()
    
    if (data.success) {
      const html = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          ${data.deals.map(deal => `
            <div class="border rounded-lg p-3 sm:p-4 hover:shadow-lg transition-shadow">
              <img src="${JSON.parse(deal.images)[0]}" alt="${deal.title}" class="w-full h-40 sm:h-48 object-cover rounded-lg mb-2 sm:mb-3">
              <h3 class="font-bold text-base sm:text-lg mb-1 sm:mb-2">${deal.title}</h3>
              ${deal.subtitle ? `<p class="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">${deal.subtitle}</p>` : ''}
              <p class="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">${deal.content}</p>
              <div class="flex gap-2">
                <button onclick="showEditDealModal(${deal.id})" class="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm">
                  <i class="fas fa-edit mr-1"></i>수정
                </button>
                <button onclick="deleteDeal(${deal.id})" class="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm">
                  <i class="fas fa-trash mr-1"></i>삭제
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `
      
      document.getElementById('deals-list').innerHTML = html || '<div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">특가할인이 없습니다</div>'
    }
  } catch (error) {
    console.error('특가할인 목록 로딩 오류:', error)
  }
}

function showCreateDealModal() {
  const modal = document.createElement('div')
  modal.id = 'create-deal-modal'
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-0 sm:p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-none sm:rounded-lg shadow-xl w-full sm:max-w-2xl h-full sm:h-auto sm:m-4 sm:max-h-screen overflow-y-auto">
      <div class="p-4 sm:p-6">
        <div class="flex justify-between items-center mb-3 sm:mb-4">
          <h2 class="text-xl sm:text-2xl font-bold">새 특가할인 추가</h2>
          <button onclick="closeCreateDealModal()" class="text-gray-500 hover:text-gray-700 p-2">
            <i class="fas fa-times text-xl sm:text-2xl"></i>
          </button>
        </div>
        
        <form onsubmit="submitCreateDeal(event)" class="space-y-3 sm:space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">제목 *</label>
            <input type="text" id="create-deal-title" 
                   class="w-full px-3 py-3 border rounded-lg text-base" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">부제목</label>
            <input type="text" id="create-deal-subtitle" 
                   class="w-full px-3 py-3 border rounded-lg text-base">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">내용 *</label>
            <textarea id="create-deal-content" rows="6" 
                      placeholder="여러 줄 띄우기: 엔터 2-3번&#10;굵은 글씨: **굵게 할 텍스트**&#10;기울임: *기울일 텍스트*"
                      class="w-full px-3 py-3 border rounded-lg text-base" required></textarea>
            <p class="text-xs text-gray-500 mt-1">
              💡 팁: 엔터를 여러 번 쳐서 줄 간격을 넓힐 수 있습니다. **텍스트**로 굵게 표시 가능
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">
              <i class="fas fa-upload mr-1"></i>이미지 파일 업로드 *
            </label>
            <input type="file" id="create-deal-image-files" accept="image/*" multiple
                   class="w-full px-3 py-3 border rounded-lg text-base" required>
            <p class="text-xs text-gray-500 mt-1">최소 1개 이상의 이미지를 선택하세요</p>
            <div id="create-deal-upload-progress" class="mt-2"></div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">장소명 *</label>
            <input type="text" id="create-deal-place-name" 
                   class="w-full px-3 py-3 border rounded-lg text-base" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">주소 *</label>
            <input type="text" id="create-deal-place-address" 
                   class="w-full px-3 py-3 border rounded-lg text-base" required>
          </div>
          
          <div class="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">위도</label>
              <input type="number" step="any" id="create-deal-place-lat" 
                     class="w-full px-3 py-3 border rounded-lg text-base">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">경도</label>
              <input type="number" step="any" id="create-deal-place-lng" 
                     class="w-full px-3 py-3 border rounded-lg text-base">
            </div>
          </div>
          
          <div class="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button type="submit" id="create-deal-submit-btn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-base">
              <i class="fas fa-save mr-2"></i>저장
            </button>
            <button type="button" onclick="closeCreateDealModal()" 
                    class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg text-base">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

function closeCreateDealModal() {
  const modal = document.getElementById('create-deal-modal')
  if (modal) modal.remove()
}

async function submitCreateDeal(event) {
  event.preventDefault()
  
  const submitBtn = document.getElementById('create-deal-submit-btn')
  const originalBtnText = submitBtn.innerHTML
  
  const title = document.getElementById('create-deal-title').value
  const subtitle = document.getElementById('create-deal-subtitle').value
  const content = document.getElementById('create-deal-content').value
  const place_name = document.getElementById('create-deal-place-name').value
  const place_address = document.getElementById('create-deal-place-address').value
  const place_lat = document.getElementById('create-deal-place-lat').value
  const place_lng = document.getElementById('create-deal-place-lng').value
  
  const fileInput = document.getElementById('create-deal-image-files')
  const files = fileInput.files
  
  console.log('🎯 submitCreateDeal 함수 시작')
  console.log('선택된 파일 개수:', files.length)
  
  if (files.length === 0) {
    alert('최소 1개 이상의 이미지를 선택하세요.')
    return
  }
  
  // 버튼 비활성화
  submitBtn.disabled = true
  submitBtn.classList.add('opacity-50', 'cursor-not-allowed')
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>업로드 중...'
  
  try {
    // 이미지 업로드
    const uploadedImages = []
    const progressDiv = document.getElementById('create-deal-upload-progress')
    
    console.log('📁 파일 업로드 시작!')
    
    progressDiv.innerHTML = `
      <div class="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <i class="fas fa-spinner fa-spin mr-2"></i>
        이미지 업로드 중... (0/${files.length})
      </div>
    `
    
    for (let i = 0; i < files.length; i++) {
      console.log(`🔄 이미지 ${i + 1}/${files.length} 처리 시작`)
      
      progressDiv.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <i class="fas fa-spinner fa-spin mr-2"></i>
          이미지 업로드 중... (${i + 1}/${files.length})
        </div>
      `
      
      try {
        const url = await uploadImageToImgBB(files[i])
        uploadedImages.push(url)
        console.log(`✅ 이미지 ${i + 1} 업로드 완료:`, url)
      } catch (error) {
        console.error(`❌ 이미지 ${i + 1} 업로드 실패:`, error)
        alert(`❌ 이미지 ${i + 1} 업로드 실패: ${error.message}`)
        // 버튼 복구
        submitBtn.disabled = false
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed')
        submitBtn.innerHTML = originalBtnText
        throw new Error(`이미지 ${i + 1} 업로드 실패: ${error.message}`)
      }
    }
    
    progressDiv.innerHTML = `
      <div class="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
        <i class="fas fa-check mr-2"></i>
        ${files.length}개 이미지 업로드 완료!
      </div>
    `
    
    // 특가할인 생성
    const res = await fetch('/api/admin/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        subtitle,
        content,
        images: JSON.stringify(uploadedImages),
        place_name,
        place_address,
        place_lat: place_lat ? parseFloat(place_lat) : null,
        place_lng: place_lng ? parseFloat(place_lng) : null
      })
    })
    
    const data = await res.json()
    
    if (data.success) {
      alert('✅ 특가할인이 추가되었습니다.')
      closeCreateDealModal()
      loadDeals()
    } else {
      alert('❌ ' + data.error)
      // 버튼 복구 (오류 시)
      submitBtn.disabled = false
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed')
      submitBtn.innerHTML = originalBtnText
    }
  } catch (error) {
    console.error('생성 오류:', error)
    alert('❌ 오류: ' + error.message)
    // 버튼 복구 (예외 발생 시)
    submitBtn.disabled = false
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed')
    submitBtn.innerHTML = originalBtnText
  }
}

async function showEditDealModal(dealId) {
  try {
    // 특가할인 정보 조회
    const res = await fetch(`/api/deals/${dealId}`)
    const data = await res.json()
    
    if (!data.success) {
      alert('특가할인 정보를 불러올 수 없습니다.')
      return
    }
    
    const deal = data.deal
    const images = JSON.parse(deal.images)
    
    // 모달 생성
    const modal = document.createElement('div')
    modal.id = 'edit-deal-modal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-0 sm:p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-none sm:rounded-lg shadow-xl w-full sm:max-w-2xl h-full sm:h-auto sm:m-4 sm:max-h-screen overflow-y-auto">
        <div class="p-4 sm:p-6">
          <div class="flex justify-between items-center mb-3 sm:mb-4">
            <h2 class="text-xl sm:text-2xl font-bold">특가할인 수정</h2>
            <button onclick="closeEditDealModal()" class="text-gray-500 hover:text-gray-700 p-2">
              <i class="fas fa-times text-xl sm:text-2xl"></i>
            </button>
          </div>
          
          <form onsubmit="submitEditDeal(event, ${dealId})" class="space-y-3 sm:space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">제목</label>
              <input type="text" id="edit-deal-title" value="${deal.title.replace(/"/g, '&quot;')}" 
                     class="w-full px-3 py-3 border rounded-lg text-base" required>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">부제목</label>
              <input type="text" id="edit-deal-subtitle" value="${(deal.subtitle || '').replace(/"/g, '&quot;')}" 
                     class="w-full px-3 py-3 border rounded-lg text-base">
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">내용</label>
              <textarea id="edit-deal-content" rows="6" 
                        placeholder="여러 줄 띄우기: 엔터 2-3번&#10;굵은 글씨: **굵게 할 텍스트**&#10;기울임: *기울일 텍스트*"
                        class="w-full px-3 py-3 border rounded-lg text-base" required>${deal.content}</textarea>
              <p class="text-xs text-gray-500 mt-1">
                💡 팁: 엔터를 여러 번 쳐서 줄 간격을 넓힐 수 있습니다. **텍스트**로 굵게 표시 가능
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">이미지</label>
              <div class="space-y-2 sm:space-y-3">
                <div id="edit-deal-current-images" class="grid grid-cols-3 gap-2">
                  ${images.map((img, idx) => `
                    <div class="relative">
                      <img src="${img}" class="w-full h-20 sm:h-24 object-cover rounded border">
                      <button type="button" onclick="removeCurrentImage(${idx})" 
                              class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-7 h-7 sm:w-6 sm:h-6 text-xs hover:bg-red-600">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  `).join('')}
                </div>
                <div class="border-t pt-2 sm:pt-3">
                  <label class="block text-sm font-medium mb-2">
                    <i class="fas fa-upload mr-1"></i>이미지 파일 업로드
                  </label>
                  <input type="file" id="edit-deal-image-files" accept="image/*" multiple
                         onchange="previewUploadedImages()"
                         class="w-full px-3 py-3 border rounded-lg text-base">
                  <p class="text-xs text-gray-500 mt-1">이미지 파일을 선택하세요 (여러 개 선택 가능)</p>
                  <div id="edit-deal-upload-progress" class="mt-2"></div>
                </div>
              </div>
              <input type="hidden" id="edit-deal-images" value='${JSON.stringify(images)}'>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">장소명</label>
              <input type="text" id="edit-deal-place-name" value="${deal.place_name.replace(/"/g, '&quot;')}" 
                     class="w-full px-3 py-3 border rounded-lg text-base" required>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">주소</label>
              <input type="text" id="edit-deal-place-address" value="${deal.place_address.replace(/"/g, '&quot;')}" 
                     class="w-full px-3 py-3 border rounded-lg text-base" required>
            </div>
            
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">위도</label>
                <input type="number" step="any" id="edit-deal-place-lat" value="${deal.place_lat || ''}" 
                       class="w-full px-3 py-3 border rounded-lg text-base">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">경도</label>
                <input type="number" step="any" id="edit-deal-place-lng" value="${deal.place_lng || ''}" 
                       class="w-full px-3 py-3 border rounded-lg text-base">
              </div>
            </div>
            
            <div class="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button type="submit" id="edit-deal-submit-btn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-base">
                <i class="fas fa-save mr-2"></i>저장
              </button>
              <button type="button" onclick="closeEditDealModal()" 
                      class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg text-base">
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('수정 모달 오류:', error)
    alert('오류가 발생했습니다.')
  }
}

function closeEditDealModal() {
  const modal = document.getElementById('edit-deal-modal')
  if (modal) modal.remove()
}

function removeCurrentImage(index) {
  const imagesInput = document.getElementById('edit-deal-images')
  const images = JSON.parse(imagesInput.value)
  images.splice(index, 1)
  imagesInput.value = JSON.stringify(images)
  
  // UI 업데이트 - 전체 다시 렌더링
  const imageContainer = document.getElementById('edit-deal-current-images')
  imageContainer.innerHTML = images.map((img, idx) => `
    <div class="relative">
      <img src="${img}" class="w-full h-24 object-cover rounded border">
      <button type="button" onclick="removeCurrentImage(${idx})" 
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('')
}

function previewUploadedImages() {
  const fileInput = document.getElementById('edit-deal-image-files')
  const files = fileInput.files
  
  if (files.length === 0) return
  
  const progressDiv = document.getElementById('edit-deal-upload-progress')
  progressDiv.innerHTML = `
    <div class="text-sm text-gray-600">
      <i class="fas fa-spinner fa-spin mr-2"></i>${files.length}개의 이미지를 준비 중...
    </div>
  `
}

async function uploadImageToImgBB(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        console.log('====================================')
        console.log('📤 이미지 업로드 시작')
        console.log('파일명:', file.name)
        console.log('크기:', (file.size / 1024).toFixed(2) + 'KB')
        console.log('타입:', file.type)
        console.log('====================================')
        
        // 백엔드 API를 통한 업로드로 변경 (CORS 문제 방지)
        console.log('🌐 API 호출 중: /api/admin/upload-image')
        
        const response = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: e.target.result,
            filename: file.name
          })
        })
        
        console.log('📥 응답 받음')
        console.log('상태 코드:', response.status)
        console.log('상태 텍스트:', response.statusText)
        console.log('====================================')
        
        if (!response.ok) {
          let errorData
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
          } else {
            const text = await response.text()
            errorData = { error: text || '알 수 없는 오류' }
          }
          
          console.error('❌ 서버 오류 응답:', errorData)
          reject(new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`))
          return
        }
        
        const data = await response.json()
        console.log('📦 응답 데이터:', JSON.stringify(data, null, 2))
        
        if (data.success && data.url) {
          console.log('✅ 업로드 성공!')
          console.log('이미지 URL:', data.url)
          console.log('====================================')
          resolve(data.url)
        } else {
          console.error('❌ 업로드 실패 - success가 false')
          console.error('전체 응답:', data)
          reject(new Error(data.error || '업로드 실패 (success: false)'))
        }
      } catch (error) {
        console.error('====================================')
        console.error('❌ 치명적 오류 발생')
        console.error('오류 타입:', error.name)
        console.error('오류 메시지:', error.message)
        console.error('스택:', error.stack)
        console.error('====================================')
        reject(error)
      }
    }
    
    reader.onerror = (error) => {
      console.error('====================================')
      console.error('❌ 파일 읽기 실패')
      console.error('오류:', error)
      console.error('====================================')
      reject(new Error('파일 읽기 실패'))
    }
    
    console.log('📖 파일 읽기 시작...')
    reader.readAsDataURL(file)
  })
}

async function submitEditDeal(event, dealId) {
  event.preventDefault()
  
  const submitBtn = document.getElementById('edit-deal-submit-btn')
  const originalBtnText = submitBtn.innerHTML
  
  const title = document.getElementById('edit-deal-title').value
  const subtitle = document.getElementById('edit-deal-subtitle').value
  const content = document.getElementById('edit-deal-content').value
  const place_name = document.getElementById('edit-deal-place-name').value
  const place_address = document.getElementById('edit-deal-place-address').value
  const place_lat = document.getElementById('edit-deal-place-lat').value
  const place_lng = document.getElementById('edit-deal-place-lng').value
  
  // 기존 이미지 배열 가져오기
  let finalImages = JSON.parse(document.getElementById('edit-deal-images').value)
  
  // 새로 업로드할 파일 확인
  const fileInput = document.getElementById('edit-deal-image-files')
  const files = fileInput.files
  
  console.log('🎯 submitEditDeal 함수 시작')
  console.log('선택된 파일 개수:', files.length)
  
  try {
    // 파일 업로드 처리
    if (files.length > 0) {
      console.log('📁 파일 업로드 시작!')
      
      // 버튼 비활성화
      submitBtn.disabled = true
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed')
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>업로드 중...'
      
      const progressDiv = document.getElementById('edit-deal-upload-progress')
      progressDiv.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <i class="fas fa-spinner fa-spin mr-2"></i>
          이미지 업로드 중... (0/${files.length})
        </div>
      `
      
      for (let i = 0; i < files.length; i++) {
        console.log(`🔄 이미지 ${i + 1}/${files.length} 처리 시작`)
        
        progressDiv.innerHTML = `
          <div class="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <i class="fas fa-spinner fa-spin mr-2"></i>
            이미지 업로드 중... (${i + 1}/${files.length})
          </div>
        `
        
        try {
          const url = await uploadImageToImgBB(files[i])
          finalImages.push(url)
          console.log(`✅ 이미지 ${i + 1} 업로드 완료:`, url)
        } catch (error) {
          console.error(`❌ 이미지 ${i + 1} 업로드 실패:`, error)
          alert(`❌ 이미지 ${i + 1} 업로드 실패: ${error.message}`)
          throw new Error(`이미지 ${i + 1} 업로드 실패: ${error.message}`)
        }
      }
      
      progressDiv.innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
          <i class="fas fa-check mr-2"></i>
          ${files.length}개 이미지 업로드 완료!
        </div>
      `
    }
    
    if (finalImages.length === 0) {
      alert('최소 1개 이상의 이미지가 필요합니다.')
      return
    }
    
    // 특가할인 업데이트
    const res = await fetch(`/api/admin/deals/${dealId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        subtitle,
        content,
        images: JSON.stringify(finalImages),
        place_name,
        place_address,
        place_lat: place_lat ? parseFloat(place_lat) : null,
        place_lng: place_lng ? parseFloat(place_lng) : null
      })
    })
    
    const data = await res.json()
    
    if (data.success) {
      alert('✅ 특가할인이 수정되었습니다.')
      closeEditDealModal()
      loadDeals()
    } else {
      alert('❌ ' + data.error)
      // 버튼 복구 (오류 시)
      submitBtn.disabled = false
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed')
      submitBtn.innerHTML = originalBtnText
    }
  } catch (error) {
    console.error('수정 오류:', error)
    alert('❌ 오류: ' + error.message)
    // 버튼 복구 (예외 발생 시)
    submitBtn.disabled = false
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed')
    submitBtn.innerHTML = originalBtnText
  }
}

async function deleteDeal(dealId) {
  if (confirm('이 특가할인을 삭제하시겠습니까?')) {
    try {
      const res = await fetch(`/api/admin/deals/${dealId}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (data.success) {
        alert('✅ 특가할인이 삭제되었습니다.')
        loadDeals()
      } else {
        alert('❌ ' + data.error)
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }
}

// ============================================
// 같이가요 관리 페이지
// ============================================

async function renderGatheringsPage() {
  ADMIN_STATE.currentPage = 'gatherings'
  
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 class="text-lg sm:text-2xl font-bold text-gray-800">
            <i class="fas fa-calendar mr-2"></i>같이가요 관리
          </h1>
        </div>
      </header>
      
      <div class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <button onclick="renderDashboard()" class="mb-3 sm:mb-4 text-blue-600 hover:text-blue-700 px-3 py-2 text-sm sm:text-base">
          <i class="fas fa-arrow-left mr-2"></i>대시보드로 돌아가기
        </button>
        
        <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div id="gatherings-list">
            <div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">로딩 중...</div>
          </div>
        </div>
      </div>
    </div>
  `
  
  loadGatherings()
}

async function loadGatherings() {
  try {
    const res = await fetch('/api/gatherings')
    const data = await res.json()
    
    if (data.success) {
      const html = `
        <!-- 데스크톱 테이블 (768px 이상) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left p-3">ID</th>
                <th class="text-left p-3">제목</th>
                <th class="text-left p-3">작성자</th>
                <th class="text-left p-3">장소</th>
                <th class="text-left p-3">날짜/시간</th>
                <th class="text-left p-3">인원</th>
                <th class="text-left p-3">모집 상태</th>
                <th class="text-left p-3">작성일</th>
                <th class="text-left p-3">관리</th>
              </tr>
            </thead>
            <tbody>
              ${data.gatherings.map(g => `
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-3">${g.id}</td>
                  <td class="p-3">${g.title}</td>
                  <td class="p-3">${g.user_name}</td>
                  <td class="p-3">${g.place_name}</td>
                  <td class="p-3">${g.date_text} ${g.time_text}</td>
                  <td class="p-3">${g.current_people}/${g.max_people}</td>
                  <td class="p-3">
                    <select onchange="updateGatheringStatus(${g.id}, this.value)" class="border rounded px-2 py-1 text-sm ${g.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}">
                      <option value="open" ${g.status === 'open' ? 'selected' : ''}>모집 중</option>
                      <option value="closed" ${g.status === 'closed' ? 'selected' : ''}>모집 완료</option>
                    </select>
                  </td>
                  <td class="p-3">${new Date(g.created_at).toLocaleDateString('ko-KR')}</td>
                  <td class="p-3">
                    <button onclick="showEditGatheringModal(${g.id})" class="text-blue-600 hover:text-blue-700 mr-3">
                      <i class="fas fa-edit mr-1"></i>수정
                    </button>
                    <button onclick="deleteGathering(${g.id})" class="text-red-600 hover:text-red-700">
                      <i class="fas fa-trash mr-1"></i>삭제
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- 모바일 카드 레이아웃 (768px 미만) -->
        <div class="md:hidden space-y-3">
          ${data.gatherings.map(g => `
            <div class="border rounded-lg p-4 bg-gray-50">
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <div class="font-bold text-base text-gray-800 mb-1">${g.title}</div>
                  <div class="text-sm text-gray-600">
                    <i class="fas fa-user mr-1"></i>${g.user_name}
                  </div>
                </div>
                <div class="text-xs text-gray-500 ml-2">#${g.id}</div>
              </div>
              
              <div class="space-y-1.5 mb-3">
                <div class="text-sm text-gray-600">
                  <i class="fas fa-map-marker-alt mr-1 text-red-500"></i>${g.place_name}
                </div>
                <div class="text-sm text-gray-600">
                  <i class="fas fa-clock mr-1 text-blue-500"></i>${g.date_text} ${g.time_text}
                </div>
                <div class="flex justify-between items-center text-sm">
                  <div class="text-gray-600">
                    <i class="fas fa-users mr-1 text-green-500"></i>${g.current_people}/${g.max_people}명
                  </div>
                  <div class="text-xs text-gray-500">
                    ${new Date(g.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <div class="pt-2">
                  <label class="text-xs text-gray-500 block mb-1">모집 상태</label>
                  <select onchange="updateGatheringStatus(${g.id}, this.value)" class="w-full border rounded px-2 py-1.5 text-sm ${g.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}">
                    <option value="open" ${g.status === 'open' ? 'selected' : ''}>모집 중</option>
                    <option value="closed" ${g.status === 'closed' ? 'selected' : ''}>모집 완료</option>
                  </select>
                </div>
              </div>
              
              <div class="flex gap-2">
                <button onclick="showEditGatheringModal(${g.id})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm">
                  <i class="fas fa-edit mr-1"></i>수정
                </button>
                <button onclick="deleteGathering(${g.id})" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm">
                  <i class="fas fa-trash mr-1"></i>삭제
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `
      
      document.getElementById('gatherings-list').innerHTML = html || '<div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">같이가요 포스팅이 없습니다</div>'
    }
  } catch (error) {
    console.error('같이가요 목록 로딩 오류:', error)
  }
}

async function showEditGatheringModal(gatheringId) {
  try {
    // 같이가요 정보 조회
    const res = await fetch(`/api/gatherings/${gatheringId}`)
    const data = await res.json()
    
    if (!data.success) {
      alert('같이가요 정보를 불러올 수 없습니다.')
      return
    }
    
    const g = data.gathering
    
    // 모달 생성
    const modal = document.createElement('div')
    modal.id = 'edit-gathering-modal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-0 sm:p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-none sm:rounded-lg shadow-xl w-full sm:max-w-2xl h-full sm:h-auto sm:m-4 sm:max-h-screen overflow-y-auto">
        <div class="p-4 sm:p-6">
          <div class="flex justify-between items-center mb-3 sm:mb-4">
            <h2 class="text-xl sm:text-2xl font-bold">같이가요 수정</h2>
            <button onclick="closeEditGatheringModal()" class="text-gray-500 hover:text-gray-700 p-2">
              <i class="fas fa-times text-xl sm:text-2xl"></i>
            </button>
          </div>
          
          <form onsubmit="submitEditGathering(event, ${gatheringId})" class="space-y-3 sm:space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">제목</label>
              <input type="text" id="edit-gathering-title" value="${g.title.replace(/"/g, '&quot;')}" 
                     class="w-full px-3 py-3 border rounded-lg text-base" required>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">내용</label>
              <textarea id="edit-gathering-content" rows="4" 
                        class="w-full px-3 py-3 border rounded-lg text-base" required>${g.content}</textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">날짜</label>
                <input type="text" id="edit-gathering-date" value="${g.date_text.replace(/"/g, '&quot;')}" 
                       class="w-full px-3 py-3 border rounded-lg text-base" required>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">시간</label>
                <input type="text" id="edit-gathering-time" value="${g.time_text.replace(/"/g, '&quot;')}" 
                       class="w-full px-3 py-3 border rounded-lg text-base" required>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">장소명</label>
              <input type="text" id="edit-gathering-place-name" value="${g.place_name.replace(/"/g, '&quot;')}" 
                     class="w-full px-3 py-3 border rounded-lg text-base" required>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">주소</label>
              <input type="text" id="edit-gathering-place-address" value="${g.place_address.replace(/"/g, '&quot;')}" 
                     class="w-full px-3 py-3 border rounded-lg text-base" required>
            </div>
            
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">현재 참여 인원</label>
                <input type="number" id="edit-gathering-current-people" value="${g.current_people}" 
                       class="w-full px-3 py-3 border rounded-lg text-base" min="1" required>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">최대 인원</label>
                <input type="number" id="edit-gathering-max-people" value="${g.max_people}" 
                       class="w-full px-3 py-3 border rounded-lg text-base" min="2" required>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">질문</label>
              <input type="text" id="edit-gathering-question" value="${(g.question || '').replace(/"/g, '&quot;')}" 
                     class="w-full px-3 py-3 border rounded-lg text-base">
            </div>
            
            <div class="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-base">
                <i class="fas fa-save mr-2"></i>저장
              </button>
              <button type="button" onclick="closeEditGatheringModal()" 
                      class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg text-base">
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('수정 모달 오류:', error)
    alert('오류가 발생했습니다.')
  }
}

function closeEditGatheringModal() {
  const modal = document.getElementById('edit-gathering-modal')
  if (modal) modal.remove()
}

async function submitEditGathering(event, gatheringId) {
  event.preventDefault()
  
  const title = document.getElementById('edit-gathering-title').value
  const content = document.getElementById('edit-gathering-content').value
  const date_text = document.getElementById('edit-gathering-date').value
  const time_text = document.getElementById('edit-gathering-time').value
  const place_name = document.getElementById('edit-gathering-place-name').value
  const place_address = document.getElementById('edit-gathering-place-address').value
  const current_people = parseInt(document.getElementById('edit-gathering-current-people').value)
  const max_people = parseInt(document.getElementById('edit-gathering-max-people').value)
  const question = document.getElementById('edit-gathering-question').value
  
  try {
    const res = await fetch(`/api/admin/gatherings/${gatheringId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        date_text,
        time_text,
        place_name,
        place_address,
        current_people,
        max_people,
        question
      })
    })
    
    const data = await res.json()
    
    if (data.success) {
      alert('✅ 같이가요 포스팅이 수정되었습니다.')
      closeEditGatheringModal()
      loadGatherings()
    } else {
      alert('❌ ' + data.error)
    }
  } catch (error) {
    console.error('수정 오류:', error)
    alert('수정 중 오류가 발생했습니다.')
  }
}

async function deleteGathering(gatheringId) {
  if (confirm('이 같이가요 포스팅을 삭제하시겠습니까?')) {
    try {
      const res = await fetch(`/api/admin/gatherings/${gatheringId}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (data.success) {
        alert('✅ 같이가요 포스팅이 삭제되었습니다.')
        loadGatherings()
      } else {
        alert('❌ ' + data.error)
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }
}

// ============================================
// 동행 신청 관리 페이지
// ============================================

async function renderApplicationsPage() {
  ADMIN_STATE.currentPage = 'applications'
  
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 class="text-lg sm:text-2xl font-bold text-gray-800">
            <i class="fas fa-user-friends mr-2"></i>동행 신청 관리
          </h1>
        </div>
      </header>
      
      <div class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <button onclick="renderDashboard()" class="mb-3 sm:mb-4 text-blue-600 hover:text-blue-700 px-3 py-2 text-sm sm:text-base">
          <i class="fas fa-arrow-left mr-2"></i>대시보드로 돌아가기
        </button>
        
        <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div id="applications-list">
            <div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">로딩 중...</div>
          </div>
        </div>
      </div>
    </div>
  `
  
  loadApplications()
}

async function loadApplications() {
  try {
    const res = await fetch('/api/admin/applications')
    const data = await res.json()
    
    if (data.success) {
      const html = `
        <!-- 데스크톱 테이블 (768px 이상) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left p-3">ID</th>
                <th class="text-left p-3">신청자</th>
                <th class="text-left p-3">전화번호</th>
                <th class="text-left p-3">질문 / 답변</th>
                <th class="text-left p-3">포스팅</th>
                <th class="text-left p-3">작성자</th>
                <th class="text-left p-3">작성자 전화</th>
                <th class="text-left p-3">장소</th>
                <th class="text-left p-3">날짜/시간</th>
                <th class="text-left p-3">신청일</th>
              </tr>
            </thead>
            <tbody>
              ${data.applications.map(app => `
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-3">${app.id}</td>
                  <td class="p-3">${app.applicant_name}</td>
                  <td class="p-3 font-mono text-blue-600">${app.applicant_phone}</td>
                  <td class="p-3 max-w-md">
                    <div class="space-y-1">
                      ${app.question ? 
                        `<div class="text-xs text-gray-500">
                          <span class="font-medium">Q:</span> ${app.question}
                         </div>` : 
                        ''
                      }
                      ${app.answer ? 
                        `<div class="text-sm text-gray-700">
                          <span class="font-medium text-blue-600">A:</span> <span class="italic">"${app.answer}"</span>
                         </div>` : 
                        '<div class="text-gray-400 text-xs">답변 없음</div>'
                      }
                    </div>
                  </td>
                  <td class="p-3">${app.gathering_title}</td>
                  <td class="p-3">${app.author_name}</td>
                  <td class="p-3 font-mono text-green-600">${app.author_phone}</td>
                  <td class="p-3">${app.place_name}</td>
                  <td class="p-3">${app.date_text} ${app.time_text}</td>
                  <td class="p-3">${new Date(app.created_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- 모바일 카드 레이아웃 (768px 미만) -->
        <div class="md:hidden space-y-3">
          ${data.applications.map(app => `
            <div class="border rounded-lg p-4 bg-gray-50">
              <div class="flex justify-between items-start mb-3">
                <div class="font-bold text-base text-gray-800">${app.gathering_title}</div>
                <div class="text-xs text-gray-500 ml-2">#${app.id}</div>
              </div>
              
              <div class="space-y-2 mb-3">
                <div class="bg-blue-50 rounded p-2">
                  <div class="text-xs text-blue-600 font-medium mb-1">
                    <i class="fas fa-user mr-1"></i>신청자
                  </div>
                  <div class="text-sm font-medium">${app.applicant_name}</div>
                  <div class="text-xs font-mono text-blue-600">${app.applicant_phone}</div>
                </div>
                
                ${(app.question || app.answer) ? `
                  <div class="bg-yellow-50 rounded p-3 border border-yellow-200">
                    <div class="text-xs text-yellow-700 font-medium mb-2">
                      <i class="fas fa-comments mr-1"></i>질문 / 답변
                    </div>
                    <div class="space-y-2">
                      ${app.question ? `
                        <div class="bg-white rounded p-2 border-l-2 border-orange-400">
                          <div class="text-xs text-orange-600 font-medium mb-1">Q. 작성자 질문</div>
                          <div class="text-sm text-gray-700">${app.question}</div>
                        </div>
                      ` : ''}
                      ${app.answer ? `
                        <div class="bg-white rounded p-2 border-l-2 border-blue-400">
                          <div class="text-xs text-blue-600 font-medium mb-1">A. 신청자 답변</div>
                          <div class="text-sm text-gray-700 italic">"${app.answer}"</div>
                        </div>
                      ` : '<div class="text-xs text-gray-500 italic">답변 없음</div>'}
                    </div>
                  </div>
                ` : ''}
                
                <div class="bg-green-50 rounded p-2">
                  <div class="text-xs text-green-600 font-medium mb-1">
                    <i class="fas fa-user-edit mr-1"></i>작성자
                  </div>
                  <div class="text-sm font-medium">${app.author_name}</div>
                  <div class="text-xs font-mono text-green-600">${app.author_phone}</div>
                </div>
              </div>
              
              <div class="space-y-1 text-sm">
                <div class="text-gray-600">
                  <i class="fas fa-map-marker-alt mr-1 text-red-500"></i>${app.place_name}
                </div>
                <div class="text-gray-600">
                  <i class="fas fa-clock mr-1 text-blue-500"></i>${app.date_text} ${app.time_text}
                </div>
                <div class="text-xs text-gray-500">
                  <i class="fas fa-calendar mr-1"></i>신청일: ${new Date(app.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `
      
      document.getElementById('applications-list').innerHTML = html || '<div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">동행 신청이 없습니다</div>'
    }
  } catch (error) {
    console.error('동행 신청 목록 로딩 오류:', error)
  }
}

// ============================================
// 지인 신청 관리 페이지
// ============================================

async function renderGroupRequestsPage() {
  ADMIN_STATE.currentPage = 'group-requests'
  
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <h1 class="text-lg sm:text-2xl font-bold text-gray-800">
            <i class="fas fa-comments mr-2"></i>지인 신청 관리
          </h1>
        </div>
      </header>
      
      <div class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <button onclick="renderDashboard()" class="mb-3 sm:mb-4 text-blue-600 hover:text-blue-700 px-3 py-2 text-sm sm:text-base">
          <i class="fas fa-arrow-left mr-2"></i>대시보드로 돌아가기
        </button>
        
        <div class="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div id="group-requests-list">
            <div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">로딩 중...</div>
          </div>
        </div>
      </div>
    </div>
  `
  
  loadGroupRequests()
}

async function loadGroupRequests() {
  try {
    const res = await fetch('/api/admin/group-requests')
    const data = await res.json()
    
    if (data.success) {
      const html = `
        <!-- 데스크톱 테이블 (768px 이상) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left p-3">ID</th>
                <th class="text-left p-3">신청자</th>
                <th class="text-left p-3">전화번호</th>
                <th class="text-left p-3">특가할인</th>
                <th class="text-left p-3">장소</th>
                <th class="text-left p-3">인원</th>
                <th class="text-left p-3">신청일</th>
                <th class="text-left p-3">상태</th>
              </tr>
            </thead>
            <tbody>
              ${data.requests.map(req => `
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-3">${req.id}</td>
                  <td class="p-3">${req.user_name}</td>
                  <td class="p-3 font-mono text-blue-600">${req.user_phone}</td>
                  <td class="p-3">${req.deal_title}</td>
                  <td class="p-3">${req.place_name}</td>
                  <td class="p-3"><span class="font-semibold text-blue-600">${req.party_size || 2}명</span></td>
                  <td class="p-3">${new Date(req.created_at).toLocaleDateString('ko-KR')}</td>
                  <td class="p-3">
                    <span class="px-2 py-1 rounded text-sm ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }">
                      ${req.status === 'pending' ? '대기중' : req.status === 'approved' ? '승인됨' : req.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- 모바일 카드 레이아웃 (768px 미만) -->
        <div class="md:hidden space-y-3">
          ${data.requests.map(req => `
            <div class="border rounded-lg p-4 bg-gray-50">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <div class="font-bold text-base text-gray-800 mb-1">${req.deal_title}</div>
                  <div class="text-xs text-gray-500">ID: ${req.id}</div>
                </div>
                <span class="px-2 py-1 rounded text-xs ${
                  req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  req.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }">
                  ${req.status === 'pending' ? '대기중' : req.status === 'approved' ? '승인됨' : req.status}
                </span>
              </div>
              
              <div class="bg-blue-50 rounded p-2 mb-2">
                <div class="text-xs text-blue-600 font-medium mb-1">
                  <i class="fas fa-user mr-1"></i>신청자
                </div>
                <div class="text-sm font-medium">${req.user_name}</div>
                <div class="text-xs font-mono text-blue-600">${req.user_phone}</div>
              </div>
              
              <div class="space-y-1 text-sm">
                <div class="text-gray-600">
                  <i class="fas fa-map-marker-alt mr-1 text-red-500"></i>${req.place_name}
                </div>
                <div class="text-gray-700">
                  <i class="fas fa-users mr-1 text-blue-600"></i>동행 인원: <span class="font-semibold text-blue-600">${req.party_size || 2}명</span>
                </div>
                <div class="text-xs text-gray-500">
                  <i class="fas fa-calendar mr-1"></i>신청일: ${new Date(req.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `
      
      document.getElementById('group-requests-list').innerHTML = html || '<div class="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">지인 신청이 없습니다</div>'
    }
  } catch (error) {
    console.error('지인 신청 목록 로딩 오류:', error)
  }
}

// 같이가요 모집 상태 업데이트
async function updateGatheringStatus(gatheringId, newStatus) {
  try {
    console.log('📝 같이가요 모집 상태 변경:', { gatheringId, newStatus })
    
    const res = await fetch(`/api/gatherings/${gatheringId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    
    const data = await res.json()
    
    if (data.success) {
      alert(newStatus === 'open' ? '모집 중으로 변경되었습니다.' : '모집 완료로 변경되었습니다.')
      // 목록 새로고침
      loadGatherings()
    } else {
      console.error('❌ 상태 변경 실패:', data.error)
      alert('상태 변경에 실패했습니다: ' + (data.error || '알 수 없는 오류'))
      // 목록 새로고침하여 이전 상태로 복원
      loadGatherings()
    }
  } catch (error) {
    console.error('❌ 같이가요 상태 변경 중 오류:', error)
    alert('상태 변경 중 오류가 발생했습니다: ' + error.message)
    // 목록 새로고침하여 이전 상태로 복원
    loadGatherings()
  }
}
