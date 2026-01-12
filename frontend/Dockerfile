# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# 환경 변수를 빌드 시 주입 (ARG를 ENV로 변환)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 빌드
RUN npm run build

# Production stage (nginx)
FROM nginx:alpine

# 빌드된 정적 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 설정 파일 복사 (옵션)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
