import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// 관리자 페이지 라우트
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>같이가요 관리자</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            * {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
        </style>
    </head>
    <body class="bg-gray-100">
        <div id="app"></div>
        
        <script>
            // ImgBB API 키 설정 (환경 변수가 있으면 사용, 없으면 기본 키 사용)
            window.IMGBB_API_KEY = '${c.env.IMGBB_API_KEY || '46c880e8ef76835f02b13e40650a2c14'}';
        </script>
        <script src="/static/admin.js"></script>
    </body>
    </html>
  `)
})

// ============================================
// API 라우트
// ============================================

// ============================================
// SMS 인증 API (알리고)
// ============================================

// 인증번호 발송
app.post('/api/sms/send', async (c) => {
  try {
    const { phone } = await c.req.json()
    
    // 전화번호 유효성 검사
    if (!phone || !/^01[0-9]{8,9}$/.test(phone.replace(/-/g, ''))) {
      return c.json({ success: false, error: '올바른 전화번호를 입력해주세요.' }, 400)
    }
    
    // 6자리 랜덤 인증번호 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 만료 시간 (3분 후)
    const expiresAt = Math.floor(Date.now() / 1000) + 180
    
    // DB에 인증번호 저장
    await c.env.DB.prepare(
      'INSERT INTO sms_verifications (phone, code, expires_at) VALUES (?, ?, ?)'
    ).bind(phone, code, expiresAt).run()
    
    // 개발 모드 체크 (환경 변수로 제어)
    const hasAligoKey = !!c.env.ALIGO_API_KEY
    const hasAligoUserId = !!c.env.ALIGO_USER_ID
    const hasAligoSender = !!c.env.ALIGO_SENDER
    const isDevelopment = c.env.ENVIRONMENT === 'development' || !c.env.ALIGO_API_KEY
    
    // 디버깅 로그
    console.log('🔍 환경변수 체크:', {
      ENVIRONMENT: c.env.ENVIRONMENT,
      hasAligoKey,
      hasAligoUserId,
      hasAligoSender,
      isDevelopment
    })
    
    if (isDevelopment) {
      // 개발 모드: 콘솔에 인증번호 출력, SMS는 발송하지 않음
      console.log('🔧 [개발 모드] 인증번호:', code, '전화번호:', phone)
      console.log('📱 실제 SMS는 발송되지 않았습니다. 위 인증번호를 사용하세요.')
      return c.json({ 
        success: true, 
        expiresAt,
        devMode: true,
        devCode: code // 개발 모드에서만 인증번호 반환
      })
    }
    
    // 프로덕션 모드: 실제 SMS 발송
    // NHN Cloud SMS 우선 사용, 없으면 Aligo 사용
    if (c.env.NHN_SMS_APP_KEY && c.env.NHN_SMS_SENDER) {
      // NHN Cloud SMS 발송
      console.log('📱 NHN Cloud SMS 사용')
      
      const NHN_APP_KEY = c.env.NHN_SMS_APP_KEY
      const NHN_SECRET_KEY = c.env.NHN_SMS_SECRET_KEY || ''
      const NHN_SENDER = c.env.NHN_SMS_SENDER
      
      const smsData = {
        body: `[같이가요] 인증번호는 [${code}] 입니다. 3분 이내에 입력해주세요.`,
        sendNo: NHN_SENDER,
        recipientList: [
          {
            recipientNo: phone,
            templateParameter: {}
          }
        ]
      }
      
      const response = await fetch(
        `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${NHN_APP_KEY}/sender/sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-Secret-Key': NHN_SECRET_KEY
          },
          body: JSON.stringify(smsData)
        }
      )
      
      const result = await response.json()
      
      if (result.header?.isSuccessful || response.ok) {
        console.log('✅ NHN Cloud SMS 발송 성공:', phone)
        return c.json({ success: true, expiresAt })
      } else {
        console.error('❌ NHN Cloud SMS 발송 실패:', result)
        return c.json({ 
          success: false, 
          error: 'SMS 발송에 실패했습니다.',
          details: result.header?.resultMessage 
        }, 500)
      }
    } else {
      // Aligo SMS 발송 (폴백)
      console.log('📱 Aligo SMS 사용')
      
      const ALIGO_API_KEY = c.env.ALIGO_API_KEY || ''
      const ALIGO_USER_ID = c.env.ALIGO_USER_ID || ''
      const ALIGO_SENDER = c.env.ALIGO_SENDER || ''
      
      const formData = new URLSearchParams()
      formData.append('key', ALIGO_API_KEY)
      formData.append('user_id', ALIGO_USER_ID)
      formData.append('sender', ALIGO_SENDER)
      formData.append('receiver', phone)
      formData.append('msg', `[같이가요] 인증번호는 [${code}] 입니다. 3분 이내에 입력해주세요.`)
      formData.append('msg_type', 'SMS')
      formData.append('title', '같이가요 인증번호')
      
      const response = await fetch('https://apis.aligo.in/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      })
      
      const result = await response.json()
      
      if (result.result_code === '1') {
        console.log('✅ Aligo SMS 발송 성공:', phone)
        return c.json({ success: true, expiresAt })
      } else {
        console.error('❌ Aligo SMS 발송 실패:', result)
        // IP 인증 오류인 경우 개발 모드로 폴백
        if (result.result_code === -101 || result.result_code === '-101') {
          console.log('🔧 IP 인증 오류 감지 - 개발 모드로 전환')
          console.log('🔧 [개발 모드] 인증번호:', code, '전화번호:', phone)
          return c.json({ 
            success: true, 
            expiresAt,
            devMode: true,
            devCode: code
          })
        }
        return c.json({ success: false, error: 'SMS 발송에 실패했습니다.' }, 500)
      }
    }
  } catch (error) {
    console.error('SMS send error:', error)
    return c.json({ success: false, error: 'SMS 발송 중 오류가 발생했습니다.' }, 500)
  }
})

// 인증번호 확인
app.post('/api/sms/verify', async (c) => {
  try {
    const { phone, code } = await c.req.json()
    
    if (!phone || !code) {
      return c.json({ success: false, error: '전화번호와 인증번호를 입력해주세요.' }, 400)
    }
    
    // 현재 시간
    const now = Math.floor(Date.now() / 1000)
    
    // DB에서 유효한 인증번호 조회
    const verification = await c.env.DB.prepare(`
      SELECT * FROM sms_verifications 
      WHERE phone = ? 
        AND code = ? 
        AND verified = 0 
        AND expires_at > ?
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(phone, code, now).first()
    
    if (!verification) {
      return c.json({ success: false, error: '인증번호가 올바르지 않거나 만료되었습니다.' }, 400)
    }
    
    // 인증 완료 처리
    await c.env.DB.prepare(
      'UPDATE sms_verifications SET verified = 1 WHERE id = ?'
    ).bind(verification.id).run()
    
    console.log('✅ 인증 성공:', phone)
    return c.json({ success: true })
  } catch (error) {
    console.error('SMS verify error:', error)
    return c.json({ success: false, error: '인증 확인 중 오류가 발생했습니다.' }, 500)
  }
})

// ============================================
// 전화번호 기반 인증 API
// ============================================

// 전화번호로 회원가입 또는 로그인
app.post('/api/auth/phone-login', async (c) => {
  try {
    const { phone, name } = await c.req.json()
    
    if (!phone) {
      return c.json({ success: false, error: '전화번호를 입력해주세요.' }, 400)
    }
    
    // 전화번호로 사용자 조회
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE phone = ?'
    ).bind(phone).first()

    if (existingUser) {
      // 기존 사용자: 닉네임이 다르면 업데이트
      if (name && name !== existingUser.name) {
        console.log(`🔄 닉네임 업데이트: "${existingUser.name}" → "${name}"`)
        
        await c.env.DB.prepare(
          'UPDATE users SET name = ? WHERE id = ?'
        ).bind(name, existingUser.id).run()
        
        // 업데이트된 사용자 정보 다시 조회
        const updatedUser = await c.env.DB.prepare(
          'SELECT * FROM users WHERE id = ?'
        ).bind(existingUser.id).first()
        
        return c.json({ 
          success: true, 
          user: updatedUser, 
          isNewUser: false,
          nameUpdated: true
        })
      }
      
      // 닉네임 변경 없이 로그인
      console.log(`✅ 기존 사용자 로그인: ${existingUser.name}`)
      return c.json({ success: true, user: existingUser, isNewUser: false })
    }

    // 신규 사용자 회원가입
    if (!name) {
      return c.json({ success: false, error: '이름을 입력해주세요.' }, 400)
    }
    
    console.log(`🆕 신규 회원가입: ${name} (${phone})`)
    
    // phone 전용 kakao_id 생성 (UNIQUE 제약 우회)
    const phoneBasedKakaoId = `phone_${phone}`
    
    const result = await c.env.DB.prepare(
      'INSERT INTO users (phone, name, kakao_id, phone_verified) VALUES (?, ?, ?, 1)'
    ).bind(phone, name, phoneBasedKakaoId).run()

    const newUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(result.meta.last_row_id).first()

    // 📧 관리자에게 회원가입 알림 발송
    await sendEmailNotification('signup', {
      name: newUser.name,
      phone: newUser.phone,
      created_at: newUser.created_at
    }, c.env)

    return c.json({ success: true, user: newUser, isNewUser: true })
  } catch (error) {
    console.error('Phone login error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return c.json({ 
      success: false, 
      error: '로그인 중 오류가 발생했습니다.',
      details: error.message // 개발용
    }, 500)
  }
})

// ============================================
// 관리자 인증 API
// ============================================

// 관리자 로그인
app.post('/api/admin/login', async (c) => {
  try {
    const { phone, password } = await c.req.json()
    
    if (!phone || !password) {
      return c.json({ success: false, error: '전화번호와 비밀번호를 입력해주세요.' }, 400)
    }
    
    // 관리자 계정 조회
    const admin = await c.env.DB.prepare(
      'SELECT * FROM admins WHERE phone = ? AND is_active = 1'
    ).bind(phone).first()
    
    if (!admin) {
      return c.json({ success: false, error: '관리자 계정을 찾을 수 없습니다.' }, 401)
    }
    
    // 비밀번호 검증 (실제로는 해시 비교해야 하지만, 간단히 평문 비교)
    // TODO: bcrypt 등으로 비밀번호 해싱 구현
    if (admin.password !== password) {
      return c.json({ success: false, error: '비밀번호가 올바르지 않습니다.' }, 401)
    }
    
    // 세션 토큰 생성 (간단히 admin ID + timestamp 조합)
    const sessionToken = `${admin.id}_${Date.now()}_${Math.random().toString(36)}`
    
    // 비밀번호 제외하고 반환
    const { password: _, ...adminData } = admin
    
    return c.json({ 
      success: true, 
      admin: adminData,
      sessionToken
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return c.json({ success: false, error: '로그인 중 오류가 발생했습니다.' }, 500)
  }
})

// 관리자 세션 확인
app.post('/api/admin/check-session', async (c) => {
  try {
    const { sessionToken } = await c.req.json()
    
    if (!sessionToken) {
      return c.json({ success: false, error: '세션 토큰이 필요합니다.' }, 401)
    }
    
    // 세션 토큰에서 admin ID 추출
    const adminId = sessionToken.split('_')[0]
    
    // 관리자 정보 조회
    const admin = await c.env.DB.prepare(
      'SELECT id, phone, name, email, is_active FROM admins WHERE id = ? AND is_active = 1'
    ).bind(adminId).first()
    
    if (!admin) {
      return c.json({ success: false, error: '유효하지 않은 세션입니다.' }, 401)
    }
    
    return c.json({ success: true, admin })
  } catch (error) {
    console.error('Admin session check error:', error)
    return c.json({ success: false, error: '세션 확인 중 오류가 발생했습니다.' }, 500)
  }
})

// 특가 할인 목록 조회
app.get('/api/deals', async (c) => {
  try {
    const userId = c.req.query('user_id')
    
    let query = `
      SELECT 
        d.*,
        (SELECT COUNT(*) FROM deal_likes WHERE special_deal_id = d.id) as like_count,
        (SELECT COUNT(*) FROM gatherings WHERE special_deal_id = d.id) as gathering_count
    `
    
    if (userId) {
      query += `,
        (SELECT COUNT(*) FROM deal_likes WHERE special_deal_id = d.id AND user_id = ?) as is_liked
      `
    }
    
    query += `
      FROM special_deals d
      ORDER BY d.created_at DESC
    `

    const stmt = userId 
      ? c.env.DB.prepare(query).bind(userId)
      : c.env.DB.prepare(query)
    
    const { results } = await stmt.all()
    
    return c.json({ success: true, deals: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch deals' }, 500)
  }
})

// 특가 할인 상세 조회
app.get('/api/deals/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const userId = c.req.query('user_id')
    
    let query = `
      SELECT 
        d.*,
        (SELECT COUNT(*) FROM deal_likes WHERE special_deal_id = d.id) as like_count,
        (SELECT COUNT(*) FROM gatherings WHERE special_deal_id = d.id) as gathering_count
    `
    
    if (userId) {
      query += `,
        (SELECT COUNT(*) FROM deal_likes WHERE special_deal_id = d.id AND user_id = ?) as is_liked
      `
    }
    
    query += `
      FROM special_deals d
      WHERE d.id = ?
    `

    const stmt = userId
      ? c.env.DB.prepare(query).bind(userId, id)
      : c.env.DB.prepare(query).bind(id)
    
    const deal = await stmt.first()
    
    if (!deal) {
      return c.json({ success: false, error: 'Deal not found' }, 404)
    }
    
    return c.json({ success: true, deal })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch deal' }, 500)
  }
})

// 특가 할인 좋아요 토글
app.post('/api/deals/:id/like', async (c) => {
  try {
    const dealId = c.req.param('id')
    const { user_id } = await c.req.json()
    
    // 좋아요 존재 확인
    const existing = await c.env.DB.prepare(
      'SELECT * FROM deal_likes WHERE user_id = ? AND special_deal_id = ?'
    ).bind(user_id, dealId).first()

    if (existing) {
      // 좋아요 취소
      await c.env.DB.prepare(
        'DELETE FROM deal_likes WHERE user_id = ? AND special_deal_id = ?'
      ).bind(user_id, dealId).run()
      
      return c.json({ success: true, liked: false })
    } else {
      // 좋아요 추가
      await c.env.DB.prepare(
        'INSERT INTO deal_likes (user_id, special_deal_id) VALUES (?, ?)'
      ).bind(user_id, dealId).run()
      
      return c.json({ success: true, liked: true })
    }
  } catch (error) {
    return c.json({ success: false, error: 'Failed to toggle like' }, 500)
  }
})

// 지인들과 같이가기 신청
app.post('/api/deals/:id/group-chat-request', async (c) => {
  try {
    const dealId = c.req.param('id')
    const { user_id } = await c.req.json()
    
    if (!user_id || !dealId) {
      return c.json({ success: false, error: 'User ID and Deal ID required' }, 400)
    }
    
    // 중복 신청 확인
    const existing = await c.env.DB.prepare(
      'SELECT * FROM group_chat_requests WHERE user_id = ? AND deal_id = ?'
    ).bind(user_id, dealId).first()
    
    if (existing) {
      return c.json({ success: false, error: 'Already requested' }, 400)
    }
    
    // 신청 생성
    await c.env.DB.prepare(
      'INSERT INTO group_chat_requests (user_id, deal_id, status) VALUES (?, ?, ?)'
    ).bind(user_id, dealId, 'pending').run()
    
    // 신청자 및 특가할인 정보 조회
    const requestInfo = await c.env.DB.prepare(`
      SELECT 
        u.name as user_name,
        u.phone as user_phone,
        d.title as deal_title
      FROM users u
      JOIN special_deals d ON d.id = ?
      WHERE u.id = ?
    `).bind(dealId, user_id).first()
    
    // 📧 관리자에게 지인들과 같이가기 신청 알림 발송
    if (requestInfo) {
      await sendEmailNotification('group_chat_request', {
        user_name: requestInfo.user_name,
        user_phone: requestInfo.user_phone,
        deal_title: requestInfo.deal_title,
        created_at: new Date().toISOString()
      }, c.env)
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('❌ 지인들과 같이가기 신청 오류:', error)
    return c.json({ success: false, error: 'Failed to create group chat request' }, 500)
  }
})

// 장소 검색 API (네이버 지역 검색)
app.get('/api/search/places', async (c) => {
  const query = c.req.query('query')
  
  if (!query) {
    return c.json({ success: false, error: '검색어를 입력해주세요.' }, 400)
  }
  
  try {
    console.log('🔍 장소 검색:', query)
    
    // URLSearchParams를 사용하여 올바른 URL 인코딩 보장
    const searchParams = new URLSearchParams({
      query: query,
      display: '10'
    })
    
    const apiUrl = `https://openapi.naver.com/v1/search/local.json?${searchParams.toString()}`
    console.log('🔗 API URL:', apiUrl)
    
    const response = await fetch(apiUrl, {
      headers: {
        'X-Naver-Client-Id': c.env.NAVER_SEARCH_CLIENT_ID,
        'X-Naver-Client-Secret': c.env.NAVER_SEARCH_CLIENT_SECRET,
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API 응답 오류:', response.status, errorText)
      return c.json({ 
        success: false, 
        error: `API 오류: ${response.status}`,
        details: errorText 
      }, 500)
    }
    
    const data = await response.json()
    console.log('🔍 검색 결과:', data.items?.length || 0, '개')
    
    // 좌표 변환 및 HTML 태그 제거
    const places = data.items?.map(item => ({
      title: item.title.replace(/<\/?b>/g, ''), // HTML 태그 제거
      address: item.address,
      roadAddress: item.roadAddress,
      category: item.category,
      telephone: item.telephone,
      lng: parseInt(item.mapx) / 10000000,  // 경도 변환
      lat: parseInt(item.mapy) / 10000000   // 위도 변환
    })) || []
    
    return c.json({ success: true, places })
  } catch (error) {
    console.error('❌ 장소 검색 오류:', error)
    return c.json({ 
      success: false, 
      error: '장소 검색에 실패했습니다.',
      details: error.message 
    }, 500)
  }
})

// 같이가요 목록 조회
app.get('/api/gatherings', async (c) => {
  try {
    const userId = c.req.query('user_id')
    const dealId = c.req.query('deal_id')
    
    let query = `
      SELECT 
        g.*,
        u.name as user_name,
        (SELECT COUNT(*) FROM gathering_likes WHERE gathering_id = g.id) as like_count
    `
    
    if (userId) {
      query += `,
        (SELECT COUNT(*) FROM gathering_likes WHERE gathering_id = g.id AND user_id = ?) as is_liked,
        (SELECT status FROM gathering_applications WHERE gathering_id = g.id AND user_id = ?) as application_status
      `
    }
    
    query += `
      FROM gatherings g
      JOIN users u ON g.user_id = u.id
    `
    
    const conditions = []
    const bindings = []
    
    if (userId) {
      bindings.push(userId, userId)
    }
    
    if (dealId) {
      conditions.push('g.special_deal_id = ?')
      bindings.push(dealId)
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY g.created_at DESC`

    const stmt = c.env.DB.prepare(query).bind(...bindings)
    const { results } = await stmt.all()
    
    return c.json({ success: true, gatherings: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch gatherings' }, 500)
  }
})

// 같이가요 상세 조회
app.get('/api/gatherings/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const userId = c.req.query('user_id')
    
    let query = `
      SELECT 
        g.*,
        u.name as user_name,
        (SELECT COUNT(*) FROM gathering_likes WHERE gathering_id = g.id) as like_count
    `
    
    if (userId) {
      query += `,
        (SELECT COUNT(*) FROM gathering_likes WHERE gathering_id = g.id AND user_id = ?) as is_liked,
        (SELECT status FROM gathering_applications WHERE gathering_id = g.id AND user_id = ?) as application_status
      `
    }
    
    query += `
      FROM gatherings g
      JOIN users u ON g.user_id = u.id
      WHERE g.id = ?
    `

    const bindings = userId ? [userId, userId, id] : [id]
    const stmt = c.env.DB.prepare(query).bind(...bindings)
    const gathering = await stmt.first()
    
    if (!gathering) {
      return c.json({ success: false, error: 'Gathering not found' }, 404)
    }
    
    return c.json({ success: true, gathering })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch gathering' }, 500)
  }
})

// 같이가요 포스팅 생성
app.post('/api/gatherings', async (c) => {
  try {
    const data = await c.req.json()
    
    console.log('📝 같이가요 작성 요청:', {
      user_id: data.user_id,
      special_deal_id: data.special_deal_id,
      title: data.title,
      place_name: data.place_name
    })
    
    const result = await c.env.DB.prepare(`
      INSERT INTO gatherings 
      (user_id, special_deal_id, title, content, date_text, time_text, place_name, place_address, place_lat, place_lng, max_people, question)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.user_id,
      data.special_deal_id || null,
      data.title,
      data.content,
      data.date_text,
      data.time_text,
      data.place_name,
      data.place_address,
      data.place_lat || null,
      data.place_lng || null,
      data.max_people || 4,
      data.question || ''
    ).run()

    console.log('✅ 같이가요 생성 성공, ID:', result.meta.last_row_id)

    const newGathering = await c.env.DB.prepare(
      'SELECT * FROM gatherings WHERE id = ?'
    ).bind(result.meta.last_row_id).first()

    // 작성자 정보 조회
    const author = await c.env.DB.prepare(
      'SELECT name, phone FROM users WHERE id = ?'
    ).bind(newGathering.user_id).first()

    // 📧 관리자에게 같이가요 작성 알림 발송
    if (author) {
      await sendEmailNotification('gathering_created', {
        user_name: author.name,
        user_phone: author.phone,
        title: newGathering.title,
        place_name: newGathering.place_name,
        date_text: newGathering.date_text,
        time_text: newGathering.time_text,
        created_at: newGathering.created_at
      }, c.env)
    }
    
    return c.json({ success: true, gathering: newGathering })
  } catch (error) {
    console.error('❌ 같이가요 작성 오류:', error)
    console.error('❌ 오류 메시지:', error.message)
    console.error('❌ 오류 스택:', error.stack)
    return c.json({ 
      success: false, 
      error: 'Failed to create gathering',
      details: error.message 
    }, 500)
  }
})

// 같이가요 포스팅 수정
app.put('/api/gatherings/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE gatherings 
      SET title = ?, content = ?, date_text = ?, time_text = ?, max_people = ?, question = ?
      WHERE id = ?
    `).bind(
      data.title,
      data.content,
      data.date_text,
      data.time_text,
      data.max_people,
      data.question,
      id
    ).run()

    const updated = await c.env.DB.prepare(
      'SELECT * FROM gatherings WHERE id = ?'
    ).bind(id).first()
    
    return c.json({ success: true, gathering: updated })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update gathering' }, 500)
  }
})

// 같이가요 포스팅 삭제
app.delete('/api/gatherings/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    console.log('🗑️ Deleting gathering:', id)
    
    // 관련 데이터 삭제 (외래 키 제약 조건 때문에)
    // 1. 좋아요 삭제
    await c.env.DB.prepare('DELETE FROM gathering_likes WHERE gathering_id = ?').bind(id).run()
    
    // 2. 동행 신청 삭제
    await c.env.DB.prepare('DELETE FROM gathering_applications WHERE gathering_id = ?').bind(id).run()
    
    // 3. 같이가요 포스팅 삭제
    const result = await c.env.DB.prepare('DELETE FROM gatherings WHERE id = ?').bind(id).run()
    
    console.log('✅ Gathering deleted:', result)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('❌ Delete gathering error:', error)
    return c.json({ success: false, error: 'Failed to delete gathering: ' + error.message }, 500)
  }
})

// 같이가요 좋아요 토글
app.post('/api/gatherings/:id/like', async (c) => {
  try {
    const gatheringId = c.req.param('id')
    const { user_id } = await c.req.json()
    
    const existing = await c.env.DB.prepare(
      'SELECT * FROM gathering_likes WHERE user_id = ? AND gathering_id = ?'
    ).bind(user_id, gatheringId).first()

    if (existing) {
      await c.env.DB.prepare(
        'DELETE FROM gathering_likes WHERE user_id = ? AND gathering_id = ?'
      ).bind(user_id, gatheringId).run()
      
      return c.json({ success: true, liked: false })
    } else {
      await c.env.DB.prepare(
        'INSERT INTO gathering_likes (user_id, gathering_id) VALUES (?, ?)'
      ).bind(user_id, gatheringId).run()
      
      return c.json({ success: true, liked: true })
    }
  } catch (error) {
    return c.json({ success: false, error: 'Failed to toggle like' }, 500)
  }
})

// 같이가요 동행 신청
app.post('/api/gatherings/:id/apply', async (c) => {
  try {
    const gatheringId = c.req.param('id')
    const { user_id, answer } = await c.req.json()
    
    // 중복 신청 확인
    const existing = await c.env.DB.prepare(
      'SELECT * FROM gathering_applications WHERE gathering_id = ? AND user_id = ?'
    ).bind(gatheringId, user_id).first()

    if (existing) {
      return c.json({ success: false, error: 'Already applied' }, 400)
    }

    await c.env.DB.prepare(
      'INSERT INTO gathering_applications (gathering_id, user_id, answer) VALUES (?, ?, ?)'
    ).bind(gatheringId, user_id, answer || '').run()

    // 신청자 및 포스팅 정보 조회
    const applicantInfo = await c.env.DB.prepare(`
      SELECT 
        u.name as applicant_name,
        u.phone as applicant_phone,
        g.title as gathering_title,
        g.user_id as author_id,
        author.name as author_name,
        author.phone as author_phone
      FROM users u
      JOIN gatherings g ON g.id = ?
      JOIN users author ON author.id = g.user_id
      WHERE u.id = ?
    `).bind(gatheringId, user_id).first()

    // 📧 관리자에게 동행 신청 알림 발송
    if (applicantInfo) {
      await sendEmailNotification('gathering_application', {
        applicant_name: applicantInfo.applicant_name,
        applicant_phone: applicantInfo.applicant_phone,
        gathering_title: applicantInfo.gathering_title,
        author_name: applicantInfo.author_name,
        author_phone: applicantInfo.author_phone,
        answer: answer || '',
        created_at: new Date().toISOString()
      }, c.env)
    }
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to apply' }, 500)
  }
})

// 내가 작성한 같이가요 조회
app.get('/api/my/gatherings', async (c) => {
  try {
    const userId = c.req.query('user_id')
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID required' }, 400)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT 
        g.*,
        u.name as user_name,
        (SELECT COUNT(*) FROM gathering_likes WHERE gathering_id = g.id) as like_count
      FROM gatherings g
      JOIN users u ON g.user_id = u.id
      WHERE g.user_id = ?
      ORDER BY g.created_at DESC
    `).bind(userId).all()
    
    return c.json({ success: true, gatherings: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch my gatherings' }, 500)
  }
})

// 내가 신청한 같이가요 조회
app.get('/api/my/applications', async (c) => {
  try {
    const userId = c.req.query('user_id')
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID required' }, 400)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT 
        g.*,
        u.name as user_name,
        ga.status as application_status,
        (SELECT COUNT(*) FROM gathering_likes WHERE gathering_id = g.id) as like_count
      FROM gathering_applications ga
      JOIN gatherings g ON ga.gathering_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE ga.user_id = ?
      ORDER BY ga.created_at DESC
    `).bind(userId).all()
    
    return c.json({ success: true, gatherings: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch applications' }, 500)
  }
})

// 내가 좋아요한 특가 할인 조회
app.get('/api/my/liked-deals', async (c) => {
  try {
    const userId = c.req.query('user_id')
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID required' }, 400)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT 
        d.*,
        (SELECT COUNT(*) FROM deal_likes WHERE special_deal_id = d.id) as like_count,
        (SELECT COUNT(*) FROM gatherings WHERE special_deal_id = d.id) as gathering_count,
        1 as is_liked
      FROM special_deals d
      JOIN deal_likes dl ON d.id = dl.special_deal_id
      WHERE dl.user_id = ?
      ORDER BY dl.created_at DESC
    `).bind(userId).all()
    
    return c.json({ success: true, deals: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch liked deals' }, 500)
  }
})

// 내가 좋아요한 같이가요 조회
app.get('/api/my/liked-gatherings', async (c) => {
  try {
    const userId = c.req.query('user_id')
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID required' }, 400)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT 
        g.*,
        u.name as user_name,
        (SELECT COUNT(*) FROM gathering_likes WHERE gathering_id = g.id) as like_count,
        1 as is_liked
      FROM gatherings g
      JOIN gathering_likes gl ON g.id = gl.gathering_id
      JOIN users u ON g.user_id = u.id
      WHERE gl.user_id = ?
      ORDER BY gl.created_at DESC
    `).bind(userId).all()
    
    return c.json({ success: true, gatherings: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch liked gatherings' }, 500)
  }
})

// ============================================
// 프론트엔드 HTML
// ============================================
app.get('/', (c) => {
  const kakaoKey = c.env.KAKAO_JAVASCRIPT_KEY || ''
  const naverMapClientId = c.env.NAVER_MAP_CLIENT_ID || ''
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>같이가요 - 특가 할인과 함께하는 모임</title>
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>
        <script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${naverMapClientId}"></script>
        <script>
          window.KAKAO_KEY = '${kakaoKey}';
          window.NAVER_MAP_CLIENT_ID = '${naverMapClientId}';
        </script>
        <style>
          /* Pretendard 폰트 적용 */
          * {
            font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          }
          
          /* 이미지 슬라이더 */
          .slider-container {
            position: relative;
            overflow: hidden;
          }
          .slider-wrapper {
            display: flex;
            transition: transform 0.3s ease;
          }
          .slider-item {
            min-width: 100%;
            aspect-ratio: 1;
          }
          .slider-button {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
            z-index: 10;
          }
          .slider-button.prev { left: 0.5rem; }
          .slider-button.next { right: 0.5rem; }
          .slider-dots {
            position: absolute;
            bottom: 0.5rem;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 0.25rem;
          }
          .slider-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(255,255,255,0.5);
          }
          .slider-dot.active {
            background: white;
          }
          
          /* 하단 네비게이션 바 고정 */
          .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e5e7eb;
            z-index: 50;
          }
          
          /* 컨텐츠 영역에 하단 여백 추가 */
          .content-area {
            padding-bottom: 70px;
          }
          
          /* 모달 스타일 */
          .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 100;
            align-items: center;
            justify-content: center;
          }
          .modal.active {
            display: flex;
          }
          
          /* 포스팅 상세 슬라이드 업 */
          .detail-panel {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            transform: translateY(100%);
            transition: transform 0.3s ease;
            z-index: 60;
            overflow-y: auto;
          }
          .detail-panel.active {
            transform: translateY(0);
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app" class="content-area">
            <!-- 여기에 동적으로 화면이 렌더링됩니다 -->
        </div>

        <!-- 하단 네비게이션 바 -->
        <nav class="bottom-nav">
            <div class="flex justify-around items-center h-16">
                <button onclick="navigateTo('deals')" class="nav-item flex flex-col items-center justify-center flex-1 h-full">
                    <i class="fas fa-tag text-xl mb-1"></i>
                    <span class="text-xs">특가 할인</span>
                </button>
                <button onclick="navigateTo('gatherings')" class="nav-item flex flex-col items-center justify-center flex-1 h-full">
                    <i class="fas fa-users text-xl mb-1"></i>
                    <span class="text-xs">같이가요</span>
                </button>
                <button onclick="navigateTo('my')" class="nav-item flex flex-col items-center justify-center flex-1 h-full">
                    <i class="fas fa-user text-xl mb-1"></i>
                    <span class="text-xs">MY</span>
                </button>
            </div>
        </nav>

        <!-- 카카오 로그인 모달 -->
        <!-- 전화번호 인증 모달은 JavaScript에서 동적으로 생성됨 -->
        
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

// 네이버 Static Map API 프록시
app.get('/api/map/static', async (c) => {
  try {
    const lat = c.req.query('lat') || '37.5665'
    const lng = c.req.query('lng') || '126.9780'
    const width = c.req.query('w') || '400'
    const height = c.req.query('h') || '200'
    const zoom = c.req.query('zoom') || '16'
    const markers = c.req.query('markers') || `type:d|size:mid|pos:${lng} ${lat}`
    
    const clientId = c.env.NAVER_MAP_CLIENT_ID
    const clientSecret = c.env.NAVER_MAP_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return c.json({ success: false, error: 'Missing API credentials' }, 500)
    }
    
    // 네이버 Static Map API 호출
    const apiUrl = `https://maps.apigw.ntruss.com/map-static/v2/raster?` +
      `w=${width}&h=${height}&center=${lng},${lat}&level=${zoom}&markers=${encodeURIComponent(markers)}`
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-ncp-apigw-api-key-id': clientId,
        'x-ncp-apigw-api-key': clientSecret
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Naver API error:', response.status, errorText)
      return c.json({ success: false, error: 'Failed to fetch map', details: errorText, status: response.status }, 500)
    }
    
    // 이미지를 그대로 반환
    const imageBlob = await response.arrayBuffer()
    
    return new Response(imageBlob, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400' // 24시간 캐시
      }
    })
  } catch (error) {
    console.error('Static map error:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// 카카오톡 채널 친구 추가 상태 저장
app.post('/api/user/channel-added', async (c) => {
  try {
    const { user_id } = await c.req.json()
    
    await c.env.DB.prepare(
      'UPDATE users SET kakao_channel_added = 1 WHERE id = ?'
    ).bind(user_id).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Channel added error:', error)
    return c.json({ success: false, error: 'Failed to save channel status' }, 500)
  }
})

// 관리자 이메일 알림
app.post('/api/admin/email-notification', async (c) => {
  try {
    const { type, data } = await c.req.json()
    
    const ADMIN_EMAIL = 'gatchigayo2024@gmail.com'
    
    let subject = ''
    let message = ''
    
    if (type === 'gathering_created') {
      subject = '[같이가요] 새로운 포스팅 작성'
      message = `
새로운 같이가요 포스팅이 작성되었습니다.

작성자: ${data.user_name}
제목: ${data.gathering_title}
포스팅 ID: ${data.gathering_id}

카카오톡 채널로 메시지를 보내세요:
https://center-pf.kakao.com/

프로덕션 확인:
https://gachi-gayo.pages.dev
      `
    } else if (type === 'application_submitted') {
      subject = '[같이가요] 새로운 동행 신청'
      message = `
새로운 동행 신청이 있습니다.

신청자: ${data.user_name}
포스팅: ${data.gathering_title}
작성자: ${data.author_name}
포스팅 ID: ${data.gathering_id}

카카오톡 채널로 작성자와 신청자에게 메시지를 보내세요:
https://center-pf.kakao.com/

프로덕션 확인:
https://gachi-gayo.pages.dev
      `
    }
    
    // TODO: 실제 이메일 발송 구현
    // 현재는 로그만 출력
    console.log('📧 관리자 이메일 알림:', { to: ADMIN_EMAIL, subject, message })
    
    // 실제 프로덕션에서는 SendGrid, Mailgun 등의 서비스 사용
    // 예: await sendEmail({ to: ADMIN_EMAIL, subject, text: message })
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Email notification error:', error)
    return c.json({ success: false, error: 'Failed to send notification' }, 500)
  }
})

// ============================================
// 관리자 대시보드 API
// ============================================

// 대시보드 통계
app.get('/api/admin/stats', async (c) => {
  try {
    // 사용자 수
    const userCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first()
    
    // 특가할인 수
    const dealCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM special_deals'
    ).first()
    
    // 같이가요 포스팅 수
    const gatheringCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM gatherings'
    ).first()
    
    // 동행 신청 수
    const applicationCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM gathering_applications'
    ).first()
    
    // 지인 신청 수
    const groupRequestCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM group_chat_requests'
    ).first()
    
    // 최근 활동 (최근 10개)
    const recentActivities = await c.env.DB.prepare(`
      SELECT 
        'gathering' as type,
        g.id,
        g.title,
        g.created_at,
        u.name as user_name
      FROM gatherings g
      JOIN users u ON g.user_id = u.id
      ORDER BY g.created_at DESC
      LIMIT 10
    `).all()
    
    return c.json({
      success: true,
      stats: {
        users: userCount?.count || 0,
        deals: dealCount?.count || 0,
        gatherings: gatheringCount?.count || 0,
        applications: applicationCount?.count || 0,
        groupRequests: groupRequestCount?.count || 0
      },
      recentActivities: recentActivities.results
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500)
  }
})

// 사용자 목록 조회
app.get('/api/admin/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM gatherings WHERE user_id = u.id) as gathering_count,
        (SELECT COUNT(*) FROM gathering_applications WHERE user_id = u.id) as application_count,
        b.id as blocked_id,
        b.reason as block_reason
      FROM users u
      LEFT JOIN blocked_users b ON u.id = b.user_id
      ORDER BY u.created_at DESC
    `).all()
    
    return c.json({ success: true, users: results })
  } catch (error) {
    console.error('Admin users error:', error)
    return c.json({ success: false, error: 'Failed to fetch users' }, 500)
  }
})

// 사용자 차단
app.post('/api/admin/users/:id/block', async (c) => {
  try {
    const userId = c.req.param('id')
    const { admin_id, reason } = await c.req.json()
    
    // 이미 차단되었는지 확인
    const existing = await c.env.DB.prepare(
      'SELECT * FROM blocked_users WHERE user_id = ?'
    ).bind(userId).first()
    
    if (existing) {
      return c.json({ success: false, error: '이미 차단된 사용자입니다.' }, 400)
    }
    
    await c.env.DB.prepare(
      'INSERT INTO blocked_users (user_id, admin_id, reason) VALUES (?, ?, ?)'
    ).bind(userId, admin_id, reason || '').run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Block user error:', error)
    return c.json({ success: false, error: 'Failed to block user' }, 500)
  }
})

// 사용자 차단 해제
app.delete('/api/admin/users/:id/unblock', async (c) => {
  try {
    const userId = c.req.param('id')
    
    await c.env.DB.prepare(
      'DELETE FROM blocked_users WHERE user_id = ?'
    ).bind(userId).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Unblock user error:', error)
    return c.json({ success: false, error: 'Failed to unblock user' }, 500)
  }
})

// 특가할인 관리 API
// 특가할인 생성
// 이미지 업로드 API (ImgBB를 통한 업로드)
app.post('/api/admin/upload-image', async (c) => {
  try {
    const { image, filename } = await c.req.json()
    
    if (!image) {
      return c.json({ success: false, error: 'No image provided' }, 400)
    }
    
    console.log('📤 서버: 이미지 업로드 시작')
    
    // Base64 데이터에서 실제 데이터 부분만 추출
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    
    // ImgBB API 키 (환경 변수 또는 기본값)
    const IMGBB_API_KEY = c.env.IMGBB_API_KEY || '46c880e8ef76835f02b13e40650a2c14'
    
    // FormData 생성
    const formData = new FormData()
    formData.append('image', base64Data)
    if (filename) {
      formData.append('name', filename.replace(/\.[^/.]+$/, '')) // 확장자 제거
    }
    
    // ImgBB API 호출
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    })
    
    console.log('📥 서버: ImgBB 응답 상태:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 서버: ImgBB 오류:', errorText)
      return c.json({ 
        success: false, 
        error: `ImgBB API 오류: ${response.status}` 
      }, 500)
    }
    
    const data = await response.json()
    
    if (data.success && data.data && data.data.url) {
      console.log('✅ 서버: 업로드 성공:', data.data.url)
      return c.json({ 
        success: true, 
        url: data.data.url,
        thumbnail: data.data.thumb?.url,
        display_url: data.data.display_url
      })
    } else {
      console.error('❌ 서버: ImgBB 응답 실패:', data)
      return c.json({ 
        success: false, 
        error: data.error?.message || 'ImgBB 업로드 실패' 
      }, 500)
    }
  } catch (error) {
    console.error('❌ 서버: 이미지 업로드 오류:', error)
    return c.json({ 
      success: false, 
      error: `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    }, 500)
  }
})

app.post('/api/admin/deals', async (c) => {
  try {
    const data = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO special_deals 
      (title, subtitle, content, images, place_name, place_address, place_lat, place_lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.title,
      data.subtitle || '',
      data.content,
      data.images, // JSON string
      data.place_name,
      data.place_address,
      data.place_lat || null,
      data.place_lng || null
    ).run()
    
    const newDeal = await c.env.DB.prepare(
      'SELECT * FROM special_deals WHERE id = ?'
    ).bind(result.meta.last_row_id).first()
    
    return c.json({ success: true, deal: newDeal })
  } catch (error) {
    console.error('Create deal error:', error)
    return c.json({ success: false, error: 'Failed to create deal' }, 500)
  }
})

// 특가할인 수정
app.put('/api/admin/deals/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE special_deals 
      SET title = ?, subtitle = ?, content = ?, images = ?, 
          place_name = ?, place_address = ?, place_lat = ?, place_lng = ?
      WHERE id = ?
    `).bind(
      data.title,
      data.subtitle || '',
      data.content,
      data.images,
      data.place_name,
      data.place_address,
      data.place_lat || null,
      data.place_lng || null,
      id
    ).run()
    
    const updated = await c.env.DB.prepare(
      'SELECT * FROM special_deals WHERE id = ?'
    ).bind(id).first()
    
    return c.json({ success: true, deal: updated })
  } catch (error) {
    console.error('Update deal error:', error)
    return c.json({ success: false, error: 'Failed to update deal' }, 500)
  }
})

// 특가할인 삭제
app.delete('/api/admin/deals/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare('DELETE FROM special_deals WHERE id = ?').bind(id).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete deal error:', error)
    return c.json({ success: false, error: 'Failed to delete deal' }, 500)
  }
})

// 같이가요 관리 API
// 같이가요 수정
app.put('/api/admin/gatherings/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE gatherings 
      SET title = ?, content = ?, date_text = ?, time_text = ?, 
          place_name = ?, place_address = ?, current_people = ?, max_people = ?, question = ?
      WHERE id = ?
    `).bind(
      data.title,
      data.content,
      data.date_text,
      data.time_text,
      data.place_name,
      data.place_address,
      data.current_people || 1,
      data.max_people,
      data.question || '',
      id
    ).run()
    
    const updated = await c.env.DB.prepare(
      'SELECT * FROM gatherings WHERE id = ?'
    ).bind(id).first()
    
    return c.json({ success: true, gathering: updated })
  } catch (error) {
    console.error('Update gathering error:', error)
    return c.json({ success: false, error: 'Failed to update gathering' }, 500)
  }
})

// 같이가요 삭제
app.delete('/api/admin/gatherings/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare('DELETE FROM gatherings WHERE id = ?').bind(id).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete gathering error:', error)
    return c.json({ success: false, error: 'Failed to delete gathering' }, 500)
  }
})

// 동행 신청 목록 조회 (관리자용 - 전화번호 포함)
app.get('/api/admin/applications', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        ga.*,
        g.title as gathering_title,
        g.place_name,
        g.date_text,
        g.time_text,
        applicant.name as applicant_name,
        applicant.phone as applicant_phone,
        author.name as author_name,
        author.phone as author_phone
      FROM gathering_applications ga
      JOIN gatherings g ON ga.gathering_id = g.id
      JOIN users applicant ON ga.user_id = applicant.id
      JOIN users author ON g.user_id = author.id
      ORDER BY ga.created_at DESC
    `).all()
    
    return c.json({ success: true, applications: results })
  } catch (error) {
    console.error('Admin applications error:', error)
    return c.json({ success: false, error: 'Failed to fetch applications' }, 500)
  }
})

// 지인 신청 목록 조회 (관리자용 - 전화번호 포함)
app.get('/api/admin/group-requests', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        gr.*,
        u.name as user_name,
        u.phone as user_phone,
        d.title as deal_title,
        d.place_name
      FROM group_chat_requests gr
      JOIN users u ON gr.user_id = u.id
      JOIN special_deals d ON gr.deal_id = d.id
      ORDER BY gr.created_at DESC
    `).all()
    
    return c.json({ success: true, requests: results })
  } catch (error) {
    console.error('Admin group requests error:', error)
    return c.json({ success: false, error: 'Failed to fetch group requests' }, 500)
  }
})

// ============================================
// 이메일 알림 함수
// ============================================

async function sendEmailNotification(type: string, data: any, env: any) {
  try {
    const RESEND_API_KEY = env.RESEND_API_KEY || 're_TBVnupir_DGdB7P9GgffTR9aKDQRWNhPe'
    const ADMIN_EMAIL = env.ADMIN_EMAIL || 'contact@gatchigayo.com'
    
    let subject = ''
    let html = ''
    
    switch(type) {
      case 'signup':
        subject = '🎉 새로운 회원가입'
        html = `
          <h2>새로운 회원이 가입했습니다</h2>
          <p><strong>이름:</strong> ${data.name}</p>
          <p><strong>전화번호:</strong> ${data.phone}</p>
          <p><strong>가입일시:</strong> ${data.created_at}</p>
        `
        break
        
      case 'gathering_created':
        subject = '📝 새로운 같이가요 포스팅'
        html = `
          <h2>새로운 같이가요 포스팅이 작성되었습니다</h2>
          <p><strong>작성자:</strong> ${data.user_name} (${data.user_phone})</p>
          <p><strong>제목:</strong> ${data.title}</p>
          <p><strong>장소:</strong> ${data.place_name}</p>
          <p><strong>날짜:</strong> ${data.date_text} ${data.time_text}</p>
          <p><strong>작성일시:</strong> ${data.created_at}</p>
        `
        break
        
      case 'gathering_application':
        subject = '👥 새로운 동행 신청'
        html = `
          <h2>새로운 동행 신청이 발생했습니다</h2>
          <p><strong>신청자:</strong> ${data.applicant_name} (${data.applicant_phone})</p>
          <p><strong>포스팅 제목:</strong> ${data.gathering_title}</p>
          <p><strong>작성자:</strong> ${data.author_name} (${data.author_phone})</p>
          <p><strong>신청 답변:</strong> ${data.answer || '없음'}</p>
          <p><strong>신청일시:</strong> ${data.created_at}</p>
        `
        break
        
      case 'group_chat_request':
        subject = '🎪 지인들과 같이가기 신청'
        html = `
          <h2>지인들과 같이가기 신청이 발생했습니다</h2>
          <p><strong>신청자:</strong> ${data.user_name} (${data.user_phone})</p>
          <p><strong>특가할인:</strong> ${data.deal_title}</p>
          <p><strong>신청일시:</strong> ${data.created_at}</p>
        `
        break
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Gatchi-Gayo <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: subject,
        html: html
      })
    })
    
    if (!response.ok) {
      console.error('이메일 전송 실패:', await response.text())
      return false
    }
    
    console.log('✅ 관리자 이메일 전송 성공:', type)
    return true
  } catch (error) {
    console.error('❌ 이메일 전송 오류:', error)
    return false
  }
}

export default app
