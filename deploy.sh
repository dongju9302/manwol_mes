#!/bin/bash
set -e

echo "========================================="
echo "🚀 Manwol MES 배포 시작: $(date)"
echo "========================================="

cd /home/ubuntu/manwol_mes

echo "📥 [1/5] Docker Hub에서 최신 이미지 가져오는 중..."
docker pull dongju9302/manwol_mes:latest

echo "🔄 [2/5] 전체 서비스 기동 (없는 컨테이너만 새로 띄움, 있으면 유지)..."
# --remove-orphans: 더 이상 사용하지 않는 컨테이너 제거
docker compose --env-file .env.production up -d --remove-orphans

echo "🔄 [3/5] Next.js 컨테이너 최신 이미지로 강제 재생성..."
# nextjs만 새 이미지로 재생성 (nginx, db는 변경 없으면 유지)
docker compose --env-file .env.production up -d --no-deps --force-recreate nextjs

echo "🔧 [4/5] Nginx 설정 graceful reload..."
# nginx.conf 변경 시 컨테이너 재기동 없이 새 설정 반영 (다운타임 없음)
if docker ps --format '{{.Names}}' | grep -q manwol-nginx; then
  docker exec manwol-nginx nginx -t && docker exec manwol-nginx nginx -s reload
  echo "Nginx 설정 reload 완료"
else
  echo "Nginx 컨테이너가 없음 - reload 스킵"
fi

echo "🧹 [5/5] 사용하지 않는 옛날 이미지 정리 중..."
docker image prune -f

echo "✅ 배포 완료: $(date)"
echo "========================================="

# 현재 실행 중인 컨테이너 상태 출력
docker compose ps
