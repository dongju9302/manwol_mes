#!/bin/bash
set -e

echo "========================================="
echo "🚀 Manwol MES 배포 시작: $(date)"
echo "========================================="

cd /home/ubuntu/manwol_mes

echo "📥 [1/4] Docker Hub에서 최신 이미지 가져오는 중..."
docker pull dongju9302/manwol_mes:latest

echo "🔄 [2/4] 전체 서비스 기동 (nginx, nextjs, db)..."
# --remove-orphans: 더 이상 사용하지 않는 컨테이너(예: 서비스명 변경 시 잔존 컨테이너) 제거
docker compose --env-file .env.production up -d --remove-orphans

echo "🔄 [3/4] Next.js 컨테이너 최신 이미지로 강제 재생성..."
# nextjs만 새 이미지로 재생성 (nginx, db는 변경 없으면 유지)
docker compose --env-file .env.production up -d --no-deps --force-recreate nextjs

echo "🧹 [4/4] 사용하지 않는 옛날 이미지 정리 중..."
docker image prune -f

echo "✅ 배포 완료: $(date)"
echo "========================================="

# 현재 실행 중인 컨테이너 상태 출력 (배포 로그 확인용)
docker compose ps
