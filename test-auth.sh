#!/bin/bash

# 회원가입 테스트 스크립트

echo "=== 회원가입 테스트 ==="
echo ""

# 1. 일반 사용자 회원가입
echo "1. 일반 사용자 회원가입 테스트"
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "일반 사용자"
  }' | jq '.'

echo ""
echo ""

# 2. 관리자 회원가입
echo "2. 관리자 회원가입 테스트"
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin1234",
    "name": "관리자",
    "role": "ADMIN"
  }' | jq '.'

echo ""
echo ""

# 3. 중복 이메일 테스트 (에러 케이스)
echo "3. 중복 이메일 테스트 (에러 케이스)"
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "중복 사용자"
  }' | jq '.'

echo ""
echo ""

# 4. 로그인 테스트
echo "4. 로그인 테스트"
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' | jq '.'

echo ""
echo "=== 테스트 완료 ==="

