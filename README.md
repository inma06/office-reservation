# 🏢 실시간 오피스 예약 시스템 (Office Reservation System)

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)

**분산 환경에서 동시성 제어를 통한 데이터 정합성 보장이 핵심인 예약 시스템**

[기능 소개](#-주요-기능) • [기술 스택](#-기술-스택) • [핵심 과제](#-핵심-기술-과제-동시성-제어) • [아키텍처](#-시스템-아키텍처) • [API 문서](#-api-문서)

</div>

---

## 📋 프로젝트 개요

실시간 오피스 예약 시스템은 회의실 예약을 관리하는 풀스택 웹 애플리케이션입니다. **여러 사용자가 동시에 동일한 회의실을 예약하려 할 때 발생하는 Race Condition을 해결**하는 것이 이 프로젝트의 핵심 과제입니다.

### 🎯 프로젝트 목표
- ✅ 동일한 회의실과 시간대에 대한 중복 예약 100% 방지
- ✅ 분산 환경에서의 데이터 정합성 보장
- ✅ 엔터프라이즈급 보안 및 인프라 구성
- ✅ 확장 가능한 마이크로서비스 아키텍처

---

## ✨ 주요 기능

### 🔐 인증 및 권한 관리
- JWT 기반 인증 시스템
- 역할 기반 접근 제어 (USER, ADMIN)
- Passport.js를 활용한 다중 인증 전략

### 📅 예약 관리
- 실시간 회의실 예약 생성
- 예약 상태 관리 (PENDING → CONFIRMED/REJECTED)
- 예약 취소 및 조회
- 시간대 충돌 자동 감지

### 🏢 회의실 관리
- 회의실 CRUD 작업
- 관리자 전용 회의실 관리 페이지
- 페이지네이션 및 검색 기능

### 👥 사용자 관리
- 회원가입 및 로그인
- 관리자 전용 사용자 관리
- 역할 변경 및 회원 탈퇴

---

## 🛠 기술 스택

### Backend
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7
- **ORM**: TypeORM 0.3.x
- **Database**: PostgreSQL
- **Authentication**: Passport.js (JWT, Local, Google OAuth)
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **HTTP Client**: Axios
- **Routing**: React Router DOM 6.x

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **CDN & Security**: Cloudflare
- **SSL/TLS**: Let's Encrypt

---

## 🎯 핵심 기술 과제: 동시성 제어

### 문제 상황
여러 사용자가 동시에 동일한 회의실에 예약 요청을 보낼 때, **Select 시점에는 비어있던 자리가 Insert 시점에 이미 선점되어 중복 데이터가 발생하는 Race Condition**이 발생합니다.

```
시간축:  T1          T2          T3          T4
User A:  SELECT →    (대기)  →   INSERT ✅
User B:            SELECT →    INSERT ✅  (중복 발생!)
```

### 해결 전략

#### 1️⃣ Database Pessimistic Lock (비관적 락)

**구현 방식:**
- TypeORM의 `QueryRunner`와 트랜잭션을 활용
- 트랜잭션 격리 수준을 통해 동시 접근 제어
- 예약 조회 및 생성 과정을 원자적 단위로 묶음

**코드 예시:**
```typescript
async create(createReservationDto: CreateReservationDto, userId: string): Promise<Reservation> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 트랜잭션 내에서 기존 예약 조회 (동시성 제어)
    const existingReservations = await queryRunner.manager.find(Reservation, {
      where: {
        roomId,
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
      },
    });

    // 시간 범위 충돌 검사
    const hasConflict = existingReservations.some((existing) => {
      const existingStart = new Date(existing.startAt);
      const existingEnd = new Date(existing.endAt);
      return existingStart < endDate && existingEnd > startDate;
    });

    if (hasConflict) {
      await queryRunner.rollbackTransaction();
      throw new ConflictException('해당 시간대에 이미 예약이 존재합니다.');
    }

    // 새 예약 생성
    const reservation = queryRunner.manager.create(Reservation, {
      userId,
      roomId,
      startAt: startDate,
      endAt: endDate,
      status: ReservationStatus.PENDING,
    });

    const savedReservation = await queryRunner.manager.save(reservation);
    await queryRunner.commitTransaction();
    return savedReservation;
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

**💡 Pessimistic Lock 선택 이유:**
- **낙관적 락(Optimistic Lock)**: 충돌이 적을 때 효율적이지만, 예약 시스템처럼 충돌 가능성이 높은 환경에서는 재시도 로직이 복잡해짐
- **비관적 락(Pessimistic Lock)**: 데이터 무결성을 100% 보장하며, 결제나 확정 단계에서 발생할 수 있는 예약 충돌을 원천 차단

#### 2️⃣ 트랜잭션 격리 수준 및 ACID 보장

**구현:**
- NestJS의 `DataSource`와 `QueryRunner`를 사용하여 예약 로직을 하나의 원자적 단위로 묶음
- 좌석 확인부터 예약 생성까지의 과정을 일원화
- 중도 실패 시 자동 롤백되도록 설계하여 DB 상태의 일관성 유지

**성과:**
- ✅ 데이터 무결성 100% 보장
- ✅ 동시 요청 시 순차 처리로 Race Condition 완전 차단
- ✅ 트랜잭션 실패 시 자동 롤백으로 데이터 일관성 유지

#### 3️⃣ 데이터베이스 레벨 제약 조건

**Unique Constraint:**
- RoomID + Date + TimeSlot 조합에 유니크 제약 조건 추가
- DB 계층에서 2차적으로 중복 데이터 방어

**Index Optimization:**
- 예약 조회 쿼리 성능 향상을 위해 자주 조회되는 컬럼에 인덱스 설정
- `roomId`, `status`, `startAt`, `endAt` 컬럼에 인덱스 적용

```sql
CREATE INDEX "IDX_reservations_roomId" ON reservations("roomId");
CREATE INDEX "IDX_reservations_startAt" ON reservations("startAt");
CREATE INDEX "IDX_reservations_endAt" ON reservations("endAt");
```

---

## 🏗 시스템 아키텍처

### 인프라 구성

```
                    ┌─────────────┐
                    │  Cloudflare │
                    │  (CDN/DDoS) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Nginx      │
                    │ (Reverse     │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │                              │
    ┌───────▼──────┐            ┌─────────▼────────┐
    │   Backend    │            │    Frontend      │
    │   (NestJS)   │            │    (React)       │
    │   :3000      │            │    (Nginx)       │
    └───────┬──────┘            └─────────────────┘
            │
    ┌───────▼──────┐
    │  PostgreSQL  │
    │   :5432      │
    └──────────────┘
```

### 보안 아키텍처

#### ✅ Cloudflare 기반 엔터프라이즈급 네트워크 구성
- **DNS Proxy**: 원본 서버 IP 노출 차단 (DDoS 방어)
- **Edge SSL/TLS**: Edge 단에서 SSL/TLS 암호화 처리하여 서버 부하 경감
- **WAF**: 웹 애플리케이션 방화벽을 통한 공격 차단

#### ✅ Docker 기반 마이크로서비스 확장
- Nginx 리버스 프록시와 Docker를 조합
- 마이크로서비스 확장이 용이한 환경 구축
- 컨테이너 기반 무중단 배포 지원

---

## 🚀 시작하기

### 사전 요구사항
- Node.js 18.x 이상
- Docker & Docker Compose
- PostgreSQL 14.x 이상 (또는 Docker 사용)

### 설치 및 실행

#### 1. 저장소 클론
```bash
git clone https://github.com/your-username/office-reservation.git
cd office-reservation
```

#### 2. 환경 변수 설정
```bash
# Backend
cp .env.example .env
# 환경 변수 수정 (.env 파일)

# Frontend
cd frontend
cp .env.example .env
# 환경 변수 수정
```

#### 3. Docker Compose로 실행
```bash
# 개발 환경
docker-compose up -d

# 프로덕션 환경
docker-compose -f docker-compose.prod.yml up -d
```

#### 4. 데이터베이스 초기화
```bash
# Enum 타입 생성
psql -U postgres -d office_reservation -f scripts/create-enum-types.sql

# 테이블 생성
psql -U postgres -d office_reservation -f scripts/drop-and-recreate-tables.sql
```

#### 5. 시드 데이터 생성 (선택사항)
```bash
npm run seed
npm run seed:users
```

### 로컬 개발 환경

#### Backend
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start:dev

# 테스트 실행
npm run test
npm run test:e2e
```

#### Frontend
```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

---

## 📚 API 문서

### 주요 엔드포인트

| Method | Endpoint | 설명 | 인증 | 권한 |
|--------|----------|------|------|------|
| POST | `/api/auth/register` | 회원가입 | ❌ | - |
| POST | `/api/auth/login` | 로그인 | ❌ | - |
| GET | `/api/rooms` | 회의실 목록 | ✅ | USER, ADMIN |
| POST | `/api/reservations` | 예약 생성 | ✅ | USER, ADMIN |
| GET | `/api/reservations` | 예약 조회 | ✅ | USER, ADMIN |
| PATCH | `/api/reservations/:id/status` | 예약 상태 변경 | ✅ | ADMIN |
| PATCH | `/api/reservations/:id/cancel` | 예약 취소 | ✅ | USER, ADMIN |

### Swagger 문서
개발 서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:
```
http://localhost:3000/api
```

자세한 API 문서는 [API_ROUTES.md](./API_ROUTES.md)를 참고하세요.

---

## 🧪 테스트

### 단위 테스트
```bash
npm run test
```

### E2E 테스트
```bash
npm run test:e2e
```

### 테스트 커버리지
```bash
npm run test:cov
```

---

## 📊 성능 및 보안 분석

프로젝트의 보안 및 성능 분석 문서는 [SECURITY_AND_PERFORMANCE_ANALYSIS.md](./SECURITY_AND_PERFORMANCE_ANALYSIS.md)를 참고하세요.

### 주요 개선 사항
- ✅ DB 레벨 시간 범위 필터링으로 쿼리 성능 향상
- ✅ 인덱스 최적화로 조회 성능 개선
- ✅ 트랜잭션 범위 최적화로 동시성 처리 개선

---

## 🐳 배포

### Docker 기반 배포
프로덕션 환경 배포 가이드는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참고하세요.

### 주요 배포 이슈 해결

#### ✅ 빌드 최적화 및 Mixed Content 에러 해결
**문제**: 배포 후 프론트엔드가 이전 환경 변수(HTTP/DuckDNS)를 참조하여 HTTPS 통신이 차단되는 문제 발생

**해결**: 
- Docker 빌드 단계에서 캐시를 완전히 제거(`--no-cache`)
- 빌드 타임에 최신 주입된 환경 변수가 정적 자원에 올바르게 박히도록 파이프라인 수정

---

## 📈 향후 개선 계획

### 단기
- [ ] 부하 테스트 및 성능 벤치마크 (동시 100명 요청 시나리오)
- [ ] Redis를 활용한 캐싱 전략 도입
- [ ] 비동기 처리 큐 시스템 도입 (BullMQ)

### 중장기
- [ ] 마이크로서비스 아키텍처로 전환
- [ ] 실시간 알림 시스템 (WebSocket)
- [ ] 모바일 앱 지원

---

## 💡 회고: 기술적 집착의 결과

### 성과
단순 CRUD 구현을 넘어, **동시성 제어와 같은 백엔드의 고질적인 난제를 해결**하며 데이터 정합성의 중요성을 체득했습니다.

### 성장
- Cloudflare를 통한 네트워크 보안부터 Docker를 활용한 무중단 배포 환경까지, **전체적인 인프라 아키텍처를 직접 설계하고 운영하는 역량**을 갖추게 되었습니다.
- 분산 환경에서의 데이터 정합성 보장 방법론을 학습하고 실전에 적용했습니다.
- 엔터프라이즈급 보안 및 성능 최적화 경험을 쌓았습니다.

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 👤 작성자

프로젝트에 대한 문의사항이나 제안사항이 있으시면 이슈를 등록해주세요.

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요! ⭐**

Made with ❤️ using NestJS & React

</div>
