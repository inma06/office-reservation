# ReservationsService.create() 보안 및 성능 분석

## 🔒 보안 취약점

### 1. **인가(Authorization) 부재** ⚠️ HIGH
**문제점:**
- `userId`가 현재 인증된 사용자와 일치하는지 검증하지 않음
- 공격자가 다른 사용자의 ID로 예약을 생성할 수 있음

**해결방안:**
```typescript
// 인증 미들웨어/가드에서 userId를 추출하고 검증
// 또는 DTO에서 userId를 제거하고 서비스에서 주입
```

### 2. **날짜 유효성 검증 부족** ⚠️ MEDIUM
**문제점:**
- `new Date(invalidString)`은 `Invalid Date`를 반환하지만 체크하지 않음
- `isNaN(startDate.getTime())` 체크 없음

**해결방안:**
```typescript
const startDate = new Date(startAt);
if (isNaN(startDate.getTime())) {
  throw new BadRequestException('유효하지 않은 시작 시간입니다.');
}
```

### 3. **입력 길이 제한 없음** ⚠️ LOW
**문제점:**
- `reason` 필드에 길이 제한이 없어 DoS 공격 가능

**해결방안:**
- DTO에 `@MaxLength(500)` 추가

### 4. **트랜잭션 타임아웃 미설정** ⚠️ MEDIUM
**문제점:**
- 트랜잭션이 무한정 대기할 수 있음

## ⚡ 성능 병목 지점

### 1. **인덱스 부재** ⚠️ HIGH
**문제점:**
- `roomId`와 `status`에 대한 복합 인덱스가 없음
- 예약이 많아질수록 전체 테이블 스캔 발생

**해결방안:**
```typescript
// reservation.entity.ts에 인덱스 추가
@Index(['roomId', 'status'])
@Index(['roomId', 'startAt', 'endAt']) // 시간 범위 쿼리 최적화
@Entity('reservations')
export class Reservation { ... }
```

### 2. **불필요한 데이터 로딩** ⚠️ MEDIUM
**문제점:**
- 모든 컬럼을 가져옴 (`SELECT *`)
- `reason`, `createdAt` 등 불필요한 데이터도 로드

**해결방안:**
```typescript
// 필요한 컬럼만 선택
const existingReservations = await queryRunner.manager
  .createQueryBuilder(Reservation, 'r')
  .select(['r.id', 'r.startAt', 'r.endAt'])
  .where('r.roomId = :roomId', { roomId })
  .andWhere('r.status IN (:...statuses)', { 
    statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] 
  })
  .getMany();
```

### 3. **애플리케이션 레벨 필터링** ⚠️ HIGH
**문제점:**
- 시간 범위 체크를 DB가 아닌 애플리케이션에서 수행
- 모든 예약을 메모리로 가져온 후 필터링

**해결방안:**
```typescript
// DB 레벨에서 시간 범위 필터링
const hasConflict = await queryRunner.manager
  .createQueryBuilder(Reservation, 'r')
  .where('r.roomId = :roomId', { roomId })
  .andWhere('r.status IN (:...statuses)', { 
    statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] 
  })
  .andWhere('r.startAt < :endDate', { endDate })
  .andWhere('r.endAt > :startDate', { startDate })
  .getCount() > 0;
```

### 4. **트랜잭션 범위 과다** ⚠️ LOW
**문제점:**
- 트랜잭션이 불필요하게 길게 유지됨
- 동시성 처리 시 대기 시간 증가

## 📋 권장 개선 사항 우선순위

### 🔥 긴급 (즉시 수정)
1. 인가 검증 추가
2. DB 레벨 시간 범위 필터링
3. 인덱스 추가

### ⚡ 중요 (단기간 내 수정)
4. 날짜 유효성 검증 강화
5. 필요한 컬럼만 선택
6. 입력 길이 제한

### 📝 개선 (중장기)
7. 트랜잭션 타임아웃 설정
8. 캐싱 전략 고려 (Redis 등)
9. 비동기 처리 고려 (큐 시스템)

