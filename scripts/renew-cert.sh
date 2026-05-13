#!/bin/bash
# ============================================================
# Let's Encrypt 인증서 자동 갱신 스크립트
# crontab 으로 매일 실행
# 만료 30일 이내일 때만 실제 갱신
# 갱신 성공 시 nginx graceful reload
# ============================================================

set -e

LOG_FILE="/home/ubuntu/manwol_mes/logs/cert-renew.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "" >> "$LOG_FILE"
echo "[$TIMESTAMP] === 인증서 갱신 작업 시작 ===" >> "$LOG_FILE"

# Certbot 갱신 시도 (만료 30일 이내일 때만 실제 갱신)
docker run --rm \
  -v /var/lib/docker/volumes/manwol_mes_certbot-etc/_data:/etc/letsencrypt \
  -v /var/lib/docker/volumes/manwol_mes_certbot-www/_data:/var/www/certbot \
  certbot/certbot:latest \
  renew \
  --webroot \
  --webroot-path=/var/www/certbot \
  --non-interactive \
  --deploy-hook "echo '[갱신 성공] 새 인증서 발급됨'" \
  >> "$LOG_FILE" 2>&1

RENEW_EXIT=$?

if [ $RENEW_EXIT -eq 0 ]; then
  echo "[$TIMESTAMP] Certbot 종료 코드: 0 (정상)" >> "$LOG_FILE"

  if docker ps --format '{{.Names}}' | grep -q manwol-nginx; then
    if docker exec manwol-nginx nginx -t > /dev/null 2>&1; then
      docker exec manwol-nginx nginx -s reload
      echo "[$TIMESTAMP] Nginx reload 완료" >> "$LOG_FILE"
    else
      echo "[$TIMESTAMP] Nginx 설정 검증 실패 - reload 스킵" >> "$LOG_FILE"
    fi
  else
    echo "[$TIMESTAMP] Nginx 컨테이너 없음 - reload 스킵" >> "$LOG_FILE"
  fi
else
  echo "[$TIMESTAMP] Certbot 종료 코드: $RENEW_EXIT (에러)" >> "$LOG_FILE"
fi

echo "[$TIMESTAMP] === 인증서 갱신 작업 종료 ===" >> "$LOG_FILE"
