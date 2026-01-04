#!/bin/bash

# 로그인 테스트 스크립트

echo "=== 로그인 테스트 ==="
echo ""

# 1. 먼저 회원가입 (이미 가입된 경우 409 에러가 나올 수 있음)
echo "1. 회원가입 (이미 가입된 경우 무시)"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "테스트 사용자"
  }')

echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""
echo ""

# 2. 정상적인 로그인
echo "2. 정상적인 로그인 테스트"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# access_token 추출
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
  echo ""
  echo "✅ 로그인 성공!"
  echo "Access Token: $ACCESS_TOKEN"
  echo ""
  echo "3. 토큰을 사용한 예약 생성 테스트"
  curl -s -X POST http://localhost:3000/reservations \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
      "roomId": 1,
      "startAt": "2024-01-15T10:00:00Z",
      "endAt": "2024-01-15T12:00:00Z"
    }' | jq '.' 2>/dev/null || echo "예약 생성 실패 (방이 없을 수 있음)"
else
  echo ""
  echo "❌ 로그인 실패"
fi

echo ""
echo ""

# 3. 잘못된 비밀번호 테스트
echo "4. 잘못된 비밀번호 테스트 (401 에러 예상)"
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }' | jq '.' 2>/dev/null || echo "401 Unauthorized"

echo ""
echo ""

# 4. 존재하지 않는 이메일 테스트
echo "5. 존재하지 않는 이메일 테스트 (401 에러 예상)"
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notfound@example.com",
    "password": "password123"
  }' | jq '.' 2>/dev/null || echo "401 Unauthorized"

echo ""
echo "=== 테스트 완료 ==="

