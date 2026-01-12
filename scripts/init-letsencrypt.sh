#!/bin/bash

# Let's Encrypt SSL 인증서 초기 발급 스크립트
# 사용법: ./scripts/init-letsencrypt.sh your-email@example.com

if [ -z "$1" ]; then
    echo "사용법: $0 <your-email@example.com>"
    exit 1
fi

EMAIL=$1
DOMAIN=${DOMAIN:-dev-leo.site}

echo "=========================================="
echo "Let's Encrypt SSL 인증서 발급 시작"
echo "도메인: $DOMAIN"
echo "이메일: $EMAIL"
echo "=========================================="

# .env.prod 파일에서 DOMAIN 읽기
if [ -f .env.prod ]; then
    export $(grep -v '^#' .env.prod | grep DOMAIN | xargs)
    if [ ! -z "$DOMAIN" ]; then
        echo "도메인을 .env.prod에서 읽었습니다: $DOMAIN"
    fi
fi

# Nginx가 실행 중인지 확인
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "office-reservation-nginx.*Up"; then
    echo "Nginx 컨테이너를 먼저 시작합니다..."
    docker-compose -f docker-compose.prod.yml up -d nginx
    sleep 5
fi

# Certbot으로 인증서 발급
echo "인증서를 발급합니다..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "인증서 발급 성공!"
    echo "Nginx를 재시작하여 HTTPS를 활성화합니다..."
    docker-compose -f docker-compose.prod.yml restart nginx
    echo "=========================================="
    echo "HTTPS가 활성화되었습니다!"
    echo "https://$DOMAIN 으로 접속하세요."
else
    echo "=========================================="
    echo "인증서 발급 실패!"
    echo "다음을 확인하세요:"
    echo "1. 도메인이 서버 IP를 가리키고 있는지"
    echo "2. 80 포트가 열려있는지"
    echo "3. 방화벽 설정"
    exit 1
fi
