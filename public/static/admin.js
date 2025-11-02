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
      <!-- 헤더 -->
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i class="fas fa-shield-alt text-2xl text-blue-600"></i>
            <h1 class="text-2xl font-bold text-gray-800">같이가요 관리자</h1>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-gray-600">
              <i class="fas fa-user mr-2"></i>${ADMIN_STATE.admin.name}
            </span>
            <button onclick="logout()" class="text-red-600 hover:text-red-700">
              <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
            </button>
          </div>
        </div>
      </header>
      
      <!-- 메인 컨텐츠 -->
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- 네비게이션 -->
        <div class="bg-white rounded-lg shadow-md p-4 mb-6">
          <div class="flex gap-4 flex-wrap">
            <button onclick="renderDashboard()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <i class="fas fa-chart-line mr-2"></i>대시보드
            </button>
            <button onclick="renderUsersPage()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              <i class="fas fa-users mr-2"></i>사용자 관리
            </button>
            <button onclick="renderDealsPage()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              <i class="fas fa-tag mr-2"></i>특가할인
            </button>
            <button onclick="renderGatheringsPage()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              <i class="fas fa-calendar mr-2"></i>같이가요
            </button>
            <button onclick="renderApplicationsPage()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              <i class="fas fa-user-friends mr-2"></i>동행 신청
            </button>
            <button onclick="renderGroupRequestsPage()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              <i class="fas fa-comments mr-2"></i>지인 신청
            </button>
          </div>
        </div>
        
        <!-- 통계 카드 -->
        <div id="stats-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <i class="fas fa-users text-4xl text-blue-600 mb-3"></i>
            <div class="text-3xl font-bold text-gray-800" id="stat-users">-</div>
            <div class="text-gray-600 mt-1">사용자</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <i class="fas fa-tag text-4xl text-green-600 mb-3"></i>
            <div class="text-3xl font-bold text-gray-800" id="stat-deals">-</div>
            <div class="text-gray-600 mt-1">특가할인</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <i class="fas fa-calendar text-4xl text-purple-600 mb-3"></i>
            <div class="text-3xl font-bold text-gray-800" id="stat-gatherings">-</div>
            <div class="text-gray-600 mt-1">같이가요</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <i class="fas fa-user-friends text-4xl text-orange-600 mb-3"></i>
            <div class="text-3xl font-bold text-gray-800" id="stat-applications">-</div>
            <div class="text-gray-600 mt-1">동행 신청</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <i class="fas fa-comments text-4xl text-pink-600 mb-3"></i>
            <div class="text-3xl font-bold text-gray-800" id="stat-group-requests">-</div>
            <div class="text-gray-600 mt-1">지인 신청</div>
          </div>
        </div>
        
        <!-- 최근 활동 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-clock mr-2"></i>최근 활동
          </h2>
          <div id="recent-activities" class="space-y-3">
            <div class="text-center text-gray-500 py-8">로딩 중...</div>
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
      
      // 최근 활동 표시
      const activitiesHtml = data.recentActivities.map(activity => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-3">
            <i class="fas fa-calendar text-purple-600"></i>
            <div>
              <div class="font-medium text-gray-800">${activity.title}</div>
              <div class="text-sm text-gray-600">by ${activity.user_name}</div>
            </div>
          </div>
          <div class="text-sm text-gray-500">
            ${new Date(activity.created_at).toLocaleString('ko-KR')}
          </div>
        </div>
      `).join('')
      
      document.getElementById('recent-activities').innerHTML = activitiesHtml || '<div class="text-center text-gray-500 py-8">최근 활동이 없습니다</div>'
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
        <div class="max-w-7xl mx-auto px-4 py-4">
          <h1 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-users mr-2"></i>사용자 관리
          </h1>
        </div>
      </header>
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <button onclick="renderDashboard()" class="mb-4 text-blue-600 hover:text-blue-700">
          <i class="fas fa-arrow-left mr-2"></i>대시보드로 돌아가기
        </button>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <div id="users-list">
            <div class="text-center text-gray-500 py-8">로딩 중...</div>
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
      const html = `
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
// 특가할인 관리 페이지 (TODO)
// ============================================

function renderDealsPage() {
  alert('특가할인 관리 페이지는 아직 구현 중입니다.')
  renderDashboard()
}

// ============================================
// 같이가요 관리 페이지 (TODO)
// ============================================

function renderGatheringsPage() {
  alert('같이가요 관리 페이지는 아직 구현 중입니다.')
  renderDashboard()
}

// ============================================
// 동행 신청 관리 페이지
// ============================================

async function renderApplicationsPage() {
  ADMIN_STATE.currentPage = 'applications'
  
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <h1 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-user-friends mr-2"></i>동행 신청 관리
          </h1>
        </div>
      </header>
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <button onclick="renderDashboard()" class="mb-4 text-blue-600 hover:text-blue-700">
          <i class="fas fa-arrow-left mr-2"></i>대시보드로 돌아가기
        </button>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <div id="applications-list">
            <div class="text-center text-gray-500 py-8">로딩 중...</div>
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
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left p-3">ID</th>
              <th class="text-left p-3">신청자</th>
              <th class="text-left p-3">전화번호</th>
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
      `
      
      document.getElementById('applications-list').innerHTML = html || '<div class="text-center text-gray-500 py-8">동행 신청이 없습니다</div>'
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
        <div class="max-w-7xl mx-auto px-4 py-4">
          <h1 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-comments mr-2"></i>지인 신청 관리
          </h1>
        </div>
      </header>
      
      <div class="max-w-7xl mx-auto px-4 py-8">
        <button onclick="renderDashboard()" class="mb-4 text-blue-600 hover:text-blue-700">
          <i class="fas fa-arrow-left mr-2"></i>대시보드로 돌아가기
        </button>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <div id="group-requests-list">
            <div class="text-center text-gray-500 py-8">로딩 중...</div>
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
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left p-3">ID</th>
              <th class="text-left p-3">신청자</th>
              <th class="text-left p-3">전화번호</th>
              <th class="text-left p-3">특가할인</th>
              <th class="text-left p-3">장소</th>
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
      `
      
      document.getElementById('group-requests-list').innerHTML = html || '<div class="text-center text-gray-500 py-8">지인 신청이 없습니다</div>'
    }
  } catch (error) {
    console.error('지인 신청 목록 로딩 오류:', error)
  }
}
