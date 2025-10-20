import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// ============================================
// API 라우트
// ============================================

// 인증 관련 API
app.post('/api/auth/login', async (c) => {
  try {
    const { kakao_id, name, phone } = await c.req.json()
    
    // 사용자 조회 또는 생성
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE kakao_id = ?'
    ).bind(kakao_id).first()

    if (existingUser) {
      return c.json({ success: true, user: existingUser })
    }

    // 새 사용자 생성
    const result = await c.env.DB.prepare(
      'INSERT INTO users (kakao_id, name, phone) VALUES (?, ?, ?)'
    ).bind(kakao_id, name, phone).run()

    const newUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(result.meta.last_row_id).first()

    return c.json({ success: true, user: newUser })
  } catch (error) {
    return c.json({ success: false, error: 'Login failed' }, 500)
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
    
    const result = await c.env.DB.prepare(`
      INSERT INTO gatherings 
      (user_id, special_deal_id, title, content, date_text, time_text, place_name, place_address, place_lat, place_lng, max_people, question)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.user_id,
      data.special_deal_id,
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

    const newGathering = await c.env.DB.prepare(
      'SELECT * FROM gatherings WHERE id = ?'
    ).bind(result.meta.last_row_id).first()

    // TODO: 관리자에게 이메일 알림
    
    return c.json({ success: true, gathering: newGathering })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create gathering' }, 500)
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

    // TODO: 관리자에게 이메일 알림
    
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
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>
        <script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${naverMapClientId}"></script>
        <script>
          window.KAKAO_KEY = '${kakaoKey}';
          window.NAVER_MAP_CLIENT_ID = '${naverMapClientId}';
        </script>
        <style>
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
        <div id="loginModal" class="modal">
            <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h2 class="text-xl font-bold mb-4">로그인이 필요합니다</h2>
                <p class="text-gray-600 mb-6">이 기능을 사용하려면 카카오 로그인이 필요합니다.</p>
                <button onclick="kakaoLogin()" class="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg mb-2">
                    <i class="fas fa-comment"></i> 카카오로 가입하기
                </button>
                <button onclick="closeLoginModal()" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg">
                    취소
                </button>
            </div>
        </div>

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

export default app
