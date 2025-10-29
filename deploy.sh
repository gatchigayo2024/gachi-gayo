#!/bin/bash
set -e

echo "🚀 프로덕션 배포 시작..."
echo ""

# 프로젝트 이름
PROJECT_NAME="gatchi-gayo"

# 1. Git 상태 확인
echo "📋 Git 상태 확인..."
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  커밋되지 않은 변경사항이 있습니다."
  read -p "계속하시겠습니까? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 2. 빌드
echo ""
echo "📦 빌드 중..."
npm run build

# 3. 환경 변수 확인
echo ""
echo "🔑 환경 변수 확인..."
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "⚠️  CLOUDFLARE_API_TOKEN이 설정되지 않았습니다."
  echo "Deploy 탭에서 설정하거나 다음 명령어를 실행하세요:"
  echo "export CLOUDFLARE_API_TOKEN=your_token_here"
  echo ""
  read -p "계속하시겠습니까? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 4. D1 마이그레이션 확인
echo ""
echo "🗄️  D1 마이그레이션 확인..."
read -p "프로덕션 데이터베이스 마이그레이션을 실행하시겠습니까? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npx wrangler d1 migrations apply webapp-production
fi

# 5. 환경 변수 설정 확인
echo ""
echo "🔐 Cloudflare Pages Secrets 확인..."
echo "다음 환경 변수가 설정되어 있는지 확인하세요:"
echo "  - ALIGO_API_KEY"
echo "  - ALIGO_USER_ID"
echo "  - ALIGO_SENDER"
echo "  - KAKAO_JAVASCRIPT_KEY"
echo ""
echo "설정되지 않았다면 다음 명령어로 설정하세요:"
echo "  npx wrangler pages secret put ALIGO_API_KEY --project-name $PROJECT_NAME"
echo ""
read -p "환경 변수가 모두 설정되었습니까? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 환경 변수를 먼저 설정해주세요."
  exit 1
fi

# 6. 배포
echo ""
echo "☁️  Cloudflare Pages에 배포 중..."
npx wrangler pages deploy dist --project-name $PROJECT_NAME

echo ""
echo "✅ 배포 완료!"
echo ""
echo "🌐 프로덕션 URL: https://$PROJECT_NAME.pages.dev"
echo ""
echo "📋 배포 후 체크리스트:"
echo "  1. 페이지 접속 확인"
echo "  2. SMS 인증 테스트 (실제 전화번호)"
echo "  3. 카카오 공유 테스트"
echo "  4. 네이버 지도 테스트"
echo ""
echo "📊 로그 확인: npx wrangler pages deployment tail --project-name $PROJECT_NAME"
echo ""
