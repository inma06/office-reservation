#!/bin/bash

# AWS Ubuntu 서버에 Docker와 Docker Compose 설치 스크립트
# 사용법: sudo bash install-docker.sh

set -e  # 에러 발생 시 스크립트 중단

echo "========================================="
echo "Docker 및 Docker Compose 설치를 시작합니다"
echo "========================================="

# 1. 시스템 업데이트
echo "[1/7] 시스템 패키지 업데이트 중..."
apt-get update
apt-get upgrade -y

# 2. 필요한 패키지 설치
echo "[2/7] 필요한 패키지 설치 중..."
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. Docker 공식 GPG 키 추가
echo "[3/7] Docker 공식 GPG 키 추가 중..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# 4. Docker 저장소 추가
echo "[4/7] Docker 저장소 추가 중..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Docker 설치
echo "[5/7] Docker 설치 중..."
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Docker Compose (standalone) 설치 (선택사항 - 이미 plugin으로 설치됨)
# 최신 버전의 standalone Docker Compose를 원하는 경우 아래 주석을 해제하세요
# DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
# echo "[6/7] Docker Compose (standalone) 설치 중... (버전: $DOCKER_COMPOSE_VERSION)"
# curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# chmod +x /usr/local/bin/docker-compose

# 7. Docker 서비스 시작 및 자동 시작 설정
echo "[6/7] Docker 서비스 시작 및 자동 시작 설정 중..."
systemctl start docker
systemctl enable docker

# 8. 현재 사용자를 docker 그룹에 추가 (sudo 없이 docker 사용 가능)
echo "[7/7] 현재 사용자를 docker 그룹에 추가 중..."
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    echo "사용자 '$SUDO_USER'를 docker 그룹에 추가했습니다."
    echo "변경사항을 적용하려면 로그아웃 후 다시 로그인하거나 다음 명령을 실행하세요:"
    echo "  newgrp docker"
else
    echo "SUDO_USER가 설정되지 않았습니다. 수동으로 사용자를 docker 그룹에 추가하세요:"
    echo "  sudo usermod -aG docker \$USER"
    echo "  newgrp docker"
fi

# 설치 확인
echo ""
echo "========================================="
echo "설치 완료!"
echo "========================================="
echo ""
echo "Docker 버전:"
docker --version
echo ""
echo "Docker Compose 버전:"
docker compose version
echo ""
echo "Docker 서비스 상태:"
systemctl status docker --no-pager | head -n 3
echo ""
echo "설치가 완료되었습니다!"
echo ""
