# API 라우팅 목록

모든 API 엔드포인트는 `/api` 프리픽스를 사용합니다.

## 🔐 인증 (Auth)

| Method | Endpoint | 설명 | 인증 필요 | 권한 |
|--------|----------|------|----------|------|
| POST | `/api/auth/register` | 회원가입 | ❌ | - |
| POST | `/api/auth/login` | 로그인 | ❌ | - |
| GET | `/api/auth/google` | Google OAuth 로그인 시작 | ❌ | - |
| GET | `/api/auth/google/callback` | Google OAuth 콜백 | ❌ | - |

## 👥 사용자 관리 (Users)

모든 엔드포인트는 **관리자(ADMIN)만** 접근 가능합니다.

| Method | Endpoint | 설명 | 인증 필요 | 권한 |
|--------|----------|------|----------|------|
| GET | `/api/users` | 회원 목록 조회 (페이지네이션) | ✅ | ADMIN |
| PATCH | `/api/users/:id/role` | 회원 역할 변경 | ✅ | ADMIN |
| DELETE | `/api/users/:id` | 회원 탈퇴 | ✅ | ADMIN |

### 쿼리 파라미터 (GET /api/users)
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 20)
- `search` (optional): 검색어 (이름 또는 이메일)

## 🏢 회의실 관리 (Rooms)

| Method | Endpoint | 설명 | 인증 필요 | 권한 |
|--------|----------|------|----------|------|
| GET | `/api/rooms` | 회의실 목록 조회 | ✅ | USER, ADMIN |
| GET | `/api/rooms/admin` | 회의실 목록 조회 (관리자, 페이지네이션) | ✅ | ADMIN |
| POST | `/api/rooms` | 회의실 추가 | ✅ | ADMIN |
| PATCH | `/api/rooms/:id` | 회의실 수정 | ✅ | ADMIN |
| DELETE | `/api/rooms/:id` | 회의실 삭제 | ✅ | ADMIN |

### 쿼리 파라미터 (GET /api/rooms/admin)
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 20)

## 📅 예약 관리 (Reservations)

| Method | Endpoint | 설명 | 인증 필요 | 권한 |
|--------|----------|------|----------|------|
| GET | `/api/reservations` | 예약 내역 조회 | ✅ | USER, ADMIN |
| POST | `/api/reservations` | 예약 생성 | ✅ | USER, ADMIN |
| PATCH | `/api/reservations/:id/status` | 예약 상태 업데이트 (승인/거절) | ✅ | ADMIN |
| PATCH | `/api/reservations/:id/cancel` | 예약 취소 | ✅ | USER, ADMIN |

### 예약 상태 (Status)
- `PENDING`: 대기 중
- `CONFIRMED`: 승인됨
- `REJECTED`: 거절됨
- `CANCELED`: 취소됨

## 🏥 헬스 체크 (Health)

| Method | Endpoint | 설명 | 인증 필요 | 권한 |
|--------|----------|------|----------|------|
| GET | `/api` | 서버 상태 확인 | ❌ | - |

## 📚 Swagger 문서

- Swagger UI: `/api` (Swagger 문서 경로)

## 🔑 인증 방식

대부분의 엔드포인트는 JWT Bearer 토큰 인증이 필요합니다.

**요청 헤더:**
```
Authorization: Bearer <JWT_TOKEN>
```

## 📝 예시

### 회원가입
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

### 로그인
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 예약 생성
```bash
POST /api/reservations
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "roomId": 1,
  "startAt": "2026-01-15T10:00:00Z",
  "endAt": "2026-01-15T12:00:00Z",
  "reason": "팀 미팅"
}
```

### 예약 상태 업데이트 (관리자)
```bash
PATCH /api/reservations/:id/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

또는

```bash
PATCH /api/reservations/:id/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "REJECTED",
  "reason": "회의실 정원 초과"
}
```
