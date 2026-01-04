import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Reservation, ReservationStatus } from '../src/entities/reservation.entity';
import { User } from '../src/entities/user.entity';
import { Room } from '../src/entities/room.entity';

describe('ReservationsController (e2e) - 중복 예약 방지 테스트', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUserId: string;
  let testRoomId: number;
  let testRoom2Id: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();

    // 테스트용 User와 Room 생성
    const userRepository = dataSource.getRepository(User);
    const roomRepository = dataSource.getRepository(Room);

    // 기존 데이터 정리 (외래키 제약조건 때문에 순서 중요: Reservation 먼저 삭제)
    const reservationRepository = dataSource.getRepository(Reservation);
    await reservationRepository
      .createQueryBuilder()
      .delete()
      .execute();
    await userRepository
      .createQueryBuilder()
      .delete()
      .execute();
    await roomRepository
      .createQueryBuilder()
      .delete()
      .execute();

    // 테스트용 User 생성
    const testUser = userRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    const savedUser = await userRepository.save(testUser);
    testUserId = savedUser.id;

    // 추가 테스트용 Users 생성 (다른 userId들)
    for (let i = 1; i <= 5; i++) {
      const additionalUser = userRepository.create({
        id: `550e8400-e29b-41d4-a716-44665544000${i}`,
        email: `test${i}@example.com`,
        password: 'password123',
        name: `Test User ${i}`,
      });
      await userRepository.save(additionalUser);
    }

    // 테스트용 Room 생성 (ID는 자동 생성되도록 함)
    const testRoom1 = roomRepository.create({
      name: 'Test Room 1',
      capacity: 10,
      description: 'Test room for E2E tests',
      isActive: true,
    });
    const savedRoom1 = await roomRepository.save(testRoom1);
    testRoomId = savedRoom1.id;

    // 추가 테스트용 Room 생성
    const testRoom2 = roomRepository.create({
      name: 'Test Room 2',
      capacity: 20,
      description: 'Test room 2 for E2E tests',
      isActive: true,
    });
    const savedRoom2 = await roomRepository.save(testRoom2);
    testRoom2Id = savedRoom2.id;
  });

  afterAll(async () => {
    // 테스트 후 데이터 정리 (외래키 제약조건 때문에 순서 중요: Reservation 먼저 삭제)
    const reservationRepository = dataSource.getRepository(Reservation);
    const userRepository = dataSource.getRepository(User);
    const roomRepository = dataSource.getRepository(Room);

    await reservationRepository
      .createQueryBuilder()
      .delete()
      .execute();
    await userRepository
      .createQueryBuilder()
      .delete()
      .execute();
    await roomRepository
      .createQueryBuilder()
      .delete()
      .execute();
    await app.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 예약 데이터만 정리 (User와 Room은 유지)
    const reservationRepository = dataSource.getRepository(Reservation);
    await reservationRepository
      .createQueryBuilder()
      .delete()
      .execute();
  });

  describe('중복 예약 방지 E2E 테스트', () => {
    const baseDate = new Date('2024-01-15T10:00:00Z');

    it('정상적인 예약 생성이 성공해야 함', async () => {
      const createReservationDto = {
        userId: testUserId,
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(createReservationDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.roomId).toBe(testRoomId);
      expect(response.body.userId).toBe(testUserId);
    });

    it('완전히 겹치는 시간대 예약은 409 Conflict를 반환해야 함', async () => {
      // 첫 번째 예약 생성
      const firstReservation = {
        userId: testUserId,
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(firstReservation)
        .expect(201);

      // 동일한 시간대의 두 번째 예약 시도
      const secondReservation = {
        userId: '550e8400-e29b-41d4-a716-446655440001', // 다른 사용자
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(secondReservation)
        .expect(409);

      expect(response.body.message).toContain('이미 예약이 존재합니다');
    });

    it('부분적으로 겹치는 시간대 예약은 409 Conflict를 반환해야 함', async () => {
      // 첫 번째 예약: 10:00 ~ 12:00
      const firstReservation = {
        userId: testUserId,
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(firstReservation)
        .expect(201);

      // 두 번째 예약: 11:00 ~ 13:00 (겹침)
      const secondReservation = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        roomId: testRoomId,
        startAt: new Date(baseDate.getTime() + 1 * 60 * 60 * 1000).toISOString(),
        endAt: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(secondReservation)
        .expect(409);
    });

    it('경계 케이스: 정확히 종료 시간에서 시작하는 예약은 허용되어야 함', async () => {
      // 첫 번째 예약: 10:00 ~ 12:00
      const firstReservation = {
        userId: testUserId,
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(firstReservation)
        .expect(201);

      // 두 번째 예약: 12:00 ~ 14:00 (정확히 종료 시간에서 시작)
      const secondReservation = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        roomId: testRoomId,
        startAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        endAt: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(secondReservation)
        .expect(201);
    });

    it('경계 케이스: 정확히 시작 시간에서 종료하는 예약은 허용되어야 함', async () => {
      // 첫 번째 예약: 12:00 ~ 14:00
      const firstReservation = {
        userId: testUserId,
        roomId: testRoomId,
        startAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        endAt: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(firstReservation)
        .expect(201);

      // 두 번째 예약: 10:00 ~ 12:00 (정확히 시작 시간에서 종료)
      const secondReservation = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(secondReservation)
        .expect(201);
    });

    it('다른 방(roomId)의 예약과는 겹쳐도 허용되어야 함', async () => {
      // 방 1에 예약 생성
      const reservation1 = {
        userId: testUserId,
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(reservation1)
        .expect(201);

      // 방 2에 동일한 시간대 예약 생성 (허용되어야 함)
      const reservation2 = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        roomId: testRoom2Id,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(reservation2)
        .expect(201);
    });

    it('PENDING 상태의 예약과도 겹치면 거부되어야 함', async () => {
      // 첫 번째 예약 생성 (기본적으로 PENDING 상태)
      const firstReservation = {
        userId: testUserId,
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(firstReservation)
        .expect(201);

      // 겹치는 두 번째 예약 시도
      const secondReservation = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/reservations')
        .set('X-User-Role', 'USER')
        .send(secondReservation)
        .expect(409);
    });

    it('동시에 여러 예약 요청이 들어와도 하나만 성공해야 함', async () => {
      const reservationDto = {
        userId: testUserId,
        roomId: testRoomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      // 동시에 5개의 동일한 예약 요청
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post('/reservations')
          .set('X-User-Role', 'USER')
          .send({
            ...reservationDto,
            userId: `550e8400-e29b-41d4-a716-44665544000${i}`,
          }),
      );

      const results = await Promise.allSettled(promises);

      // 성공한 요청은 1개만 있어야 함
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 201,
      );
      const failed = results.filter(
        (r) =>
          r.status === 'fulfilled' && r.value.status === 409,
      );

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(4);
    });
  });
});

