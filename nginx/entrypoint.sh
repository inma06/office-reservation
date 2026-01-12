#!/bin/sh
set -e

# 인증서가 있으면 nginx.conf 사용, 없으면 nginx-init.conf 사용
if [ -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ]; then
    # SSL 인증서가 있으면 HTTPS 설정 사용
    sed "s/\$$DOMAIN/${DOMAIN}/g" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
    echo "Using HTTPS configuration with SSL certificate"
else
    # SSL 인증서가 없으면 초기 설정 사용 (HTTP만)
    cp /etc/nginx/conf.d/default-init.conf /etc/nginx/conf.d/default.conf
    echo "Using initial HTTP-only configuration"
fi

# Nginx 시작
exec nginx -g 'daemon off;'
