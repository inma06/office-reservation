# Nginx 리버스 프록시 설정

이 디렉토리에는 프로덕션 환경에서 사용하는 Nginx 리버스 프록시 설정 파일들이 포함되어 있습니다.

## 파일 설명

- `nginx.conf`: HTTPS 설정이 포함된 메인 설정 파일 (SSL 인증서 발급 후 사용)
- `nginx-init.conf`: 초기 설정 파일 (SSL 인증서 발급 전 HTTP만 사용)
- `entrypoint.sh`: Nginx 컨테이너 시작 시 실행되는 스크립트 (인증서 존재 여부에 따라 적절한 설정 사용)

## 사용 방법

### 1. 초기 설정

1. `.env.prod` 파일에 `DOMAIN` 변수를 설정하세요:
   ```
   DOMAIN=your-domain.com
   ```

2. 도메인이 AWS EC2 인스턴스의 공인 IP를 가리키도록 DNS 설정을 완료하세요.

3. 초기에는 `nginx-init.conf`가 사용됩니다 (HTTP만 지원).

### 2. SSL 인증서 발급

SSL 인증서를 발급하려면 다음 명령을 실행하세요:

```bash
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com
```

### 3. Nginx 재시작

인증서 발급 후 Nginx 컨테이너를 재시작하면 자동으로 HTTPS 설정이 적용됩니다:

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

### 4. 자동 갱신

Certbot 서비스가 12시간마다 자동으로 인증서를 갱신합니다. 인증서가 갱신되면 Nginx가 자동으로 재로드됩니다.

## 포트 설정

- **80 포트**: HTTP 요청을 HTTPS로 리다이렉트 (Let's Encrypt 인증 경로 제외)
- **443 포트**: HTTPS 요청 처리 및 프록시

## 프록시 설정

- `/api/*`: 백엔드 서비스 (backend:3000)로 프록시
- `/*`: 프론트엔드 서비스 (frontend:80)로 프록시
