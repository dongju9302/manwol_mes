# Let's Encrypt 인증서 자동 갱신

## 구조
- 스크립트: /home/ubuntu/manwol_mes/scripts/renew-cert.sh
- crontab: 매일 새벽 3시 실행 (0 3 * * *)
- 로그: /home/ubuntu/manwol_mes/logs/cert-renew.log
- 갱신 시점: 만료 30일 전부터 자동 시도

## 주요 시나리오

### 평상시 (만료 30일 이전)
- certbot이 "Cert not yet due for renewal" 응답
- 갱신 안 함, 로그만 기록

### 갱신 임박 (만료 30일 이내)
- certbot이 Let's Encrypt에 갱신 요청
- 성공 시 새 인증서 발급 + nginx reload
- 실패 시 다음날 재시도 (30일 여유)

## 점검 방법

### 로그 확인
```bash
tail -30 ~/manwol_mes/logs/cert-renew.log
```

### 인증서 만료일 확인
```bash
echo | openssl s_client -connect manwol-mes.duckdns.org:443 -servername manwol-mes.duckdns.org 2>/dev/null | openssl x509 -noout -dates
```

### crontab 확인
```bash
crontab -l
```

## 수동 실행 (긴급 시)
```bash
~/manwol_mes/scripts/renew-cert.sh
```

## 알려진 이슈

### DuckDNS ↔ Let's Encrypt 일시적 DNS 문제
- 매일 자동 시도라 한 번 실패해도 다음날 재시도
- 30일 여유 안에서 통계적으로 거의 확실히 성공
- 만약 만료 14일 전인데도 갱신 안 됐으면 수동 점검 필요

## 만료 임박 시 수동 갱신
```bash
docker run --rm \
  -v /var/lib/docker/volumes/manwol_mes_certbot-etc/_data:/etc/letsencrypt \
  -v /var/lib/docker/volumes/manwol_mes_certbot-www/_data:/var/www/certbot \
  certbot/certbot:latest \
  renew --webroot --webroot-path=/var/www/certbot --force-renewal
docker exec manwol-nginx nginx -s reload
```
