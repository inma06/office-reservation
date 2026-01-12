# 배포 가이드 - dev-leo.site

이 가이드는 `dev-leo.site` 도메인으로 프로덕션 환경에 배포하는 방법을 설명합니다.

## 사전 준비사항

1. **도메인 DNS 설정**
   - `dev-leo.site`와 `www.dev-leo.site`가 AWS EC2 인스턴스의 공인 IP를 가리키도록 A 레코드 설정
   - DNS 전파가 완료될 때까지 기다리기 (보통 몇 분~몇 시간 소요)

2. **포트 열기**
   - AWS Security Group에서 80, 443 포트 인바운드 규칙 추가
   - HTTP (80): Let's Encrypt 인증용
   - HTTPS (443): 실제 서비스

## 1. 환경 변수 설정

`.env.prod` 파일을 생성하고 필요한 값들을 설정하세요:

```bash
cp env.prod.template .env.prod
```

`.env.prod` 파일에서 다음 값들을 설정하세요:

```bash
# 도메인 설정
DOMAIN=dev-leo.site

# CORS 설정
CORS_ORIGIN=https://dev-leo.site

# API Base URL
API_BASE_URL=https://dev-leo.site/api

# Google OAuth 콜백 URL
GOOGLE_CALLBACK_URL=https://dev-leo.site/auth/google/callback

# 기타 필수 설정들...
```

## 2. 초기 배포 (HTTP만)

SSL 인증서를 발급하기 전에 먼저 HTTP로 서비스를 시작합니다:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

서비스가 정상적으로 시작되었는지 확인:

```bash
docker-compose -f docker-compose.prod.yml ps
```

## 3. SSL 인증서 발급

Let's Encrypt SSL 인증서를 발급합니다:

```bash
./scripts/init-letsencrypt.sh your-email@example.com
```

또는 수동으로:

```bash
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d dev-leo.site \
  -d www.dev-leo.site
```

인증서가 발급되면 Nginx가 자동으로 HTTPS 설정을 사용합니다.

## 4. Nginx 재시작 (HTTPS 활성화)

인증서 발급 후 Nginx를 재시작하여 HTTPS를 활성화합니다:

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## 5. Google OAuth 설정

### Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 프로젝트 선택 또는 생성
3. "API 및 서비스" > "사용자 인증 정보"로 이동
4. "OAuth 2.0 클라이언트 ID" 생성
5. 승인된 리디렉션 URI에 추가:
   ```
   https://dev-leo.site/auth/google/callback
   ```

### .env.prod 파일 설정

`.env.prod` 파일에 Google OAuth 정보를 추가:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://dev-leo.site/auth/google/callback
```

### 백엔드 재시작

환경 변수 변경 후 백엔드를 재시작:

```bash
docker-compose -f docker-compose.prod.yml restart backend
```

## 6. 서비스 확인

### HTTP → HTTPS 리다이렉트 확인
```bash
curl -I http://dev-leo.site
# 301 리다이렉트 응답이 나와야 합니다
```

### HTTPS 접속 확인
```bash
curl -I https://dev-leo.site
# 200 OK 응답이 나와야 합니다
```

### 브라우저에서 확인
- https://dev-leo.site 접속
- SSL 인증서가 정상적으로 표시되는지 확인
- 프론트엔드가 정상적으로 로드되는지 확인
- API 호출이 정상적으로 작동하는지 확인

## 7. 자동 인증서 갱신

Certbot 서비스가 12시간마다 자동으로 인증서를 갱신합니다. 수동으로 갱신하려면:

```bash
docker-compose -f docker-compose.prod.yml exec certbot certbot renew
```

## 문제 해결

### 인증서 발급 실패
- 도메인이 서버 IP를 가리키고 있는지 확인
- 80 포트가 열려있는지 확인
- 방화벽 설정 확인
- DNS 전파 완료 대기

### HTTPS 접속 불가
- 인증서가 정상적으로 발급되었는지 확인:
  ```bash
  docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/dev-leo.site/
  ```
- Nginx 로그 확인:
  ```bash
  docker-compose -f docker-compose.prod.yml logs nginx
  ```

### API 호출 실패
- CORS 설정 확인 (`.env.prod`의 `CORS_ORIGIN`)
- 백엔드 로그 확인:
  ```bash
  docker-compose -f docker-compose.prod.yml logs backend
  ```

## 서비스 관리

### 서비스 시작
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 서비스 중지
```bash
docker-compose -f docker-compose.prod.yml down
```

### 서비스 재시작
```bash
docker-compose -f docker-compose.prod.yml restart
```

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```
