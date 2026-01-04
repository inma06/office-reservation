import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { CreateReservationDto } from '../dto/create-reservation.dto';

describe('ReservationsService - 중복 예약 방지 테스트', () => {
  let service: ReservationsService;
  let reservationRepository: Repository<Reservation>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    reservationRepository = module.get<Repository<Reservation>>(
      getRepositoryToken(Reservation),
    );
    dataSource = module.get<DataSource>(DataSource);

    // 각 테스트 전에 mock 초기화
    jest.clearAllMocks();
    mockQueryRunner.manager.find.mockResolvedValue([]);
    mockQueryRunner.manager.create.mockImplementation((entity, data) => ({
      ...data,
      id: 'test-id',
      createdAt: new Date(),
    }));
    mockQueryRunner.manager.save.mockImplementation((entity) => Promise.resolve(entity));
  });

  describe('중복 예약 방지', () => {
    const baseDate = new Date('2024-01-15T10:00:00Z');
    const userId = 'user-123';
    const roomId = 1;

    it('정상적인 예약은 성공해야 함', async () => {
      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2시간
      };

      const result = await service.create(dto, userId);

      expect(mockQueryRunner.manager.find).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('완전히 겹치는 시간대 예약은 거부되어야 함', async () => {
      const existingReservation = {
        id: 'existing-id',
        userId: 'other-user',
        roomId,
        startAt: baseDate,
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
        status: ReservationStatus.CONFIRMED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([existingReservation]);

      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).not.toHaveBeenCalled();
    });

    it('부분적으로 겹치는 시간대 (새 예약의 시작이 기존 예약 내부) 예약은 거부되어야 함', async () => {
      const existingReservation = {
        id: 'existing-id',
        userId: 'other-user',
        roomId,
        startAt: baseDate,
        endAt: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000), // 10:00 ~ 14:00
        status: ReservationStatus.CONFIRMED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([existingReservation]);

      const dto: CreateReservationDto = {
        roomId,
        startAt: new Date(baseDate.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 11:00
        endAt: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000).toISOString(), // 13:00
      };

      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('부분적으로 겹치는 시간대 (새 예약의 종료가 기존 예약 내부) 예약은 거부되어야 함', async () => {
      const existingReservation = {
        id: 'existing-id',
        userId: 'other-user',
        roomId,
        startAt: new Date(baseDate.getTime() + 1 * 60 * 60 * 1000), // 11:00
        endAt: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000), // 13:00
        status: ReservationStatus.CONFIRMED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([existingReservation]);

      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(), // 10:00
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 12:00
      };

      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('새 예약이 기존 예약을 완전히 포함하는 경우 거부되어야 함', async () => {
      const existingReservation = {
        id: 'existing-id',
        userId: 'other-user',
        roomId,
        startAt: new Date(baseDate.getTime() + 1 * 60 * 60 * 1000), // 11:00
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000), // 12:00
        status: ReservationStatus.CONFIRMED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([existingReservation]);

      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(), // 10:00
        endAt: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 14:00
      };

      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('경계 케이스: 새 예약의 시작 시간이 기존 예약의 종료 시간과 정확히 같으면 허용되어야 함', async () => {
      const existingReservation = {
        id: 'existing-id',
        userId: 'other-user',
        roomId,
        startAt: baseDate,
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000), // 10:00 ~ 12:00
        status: ReservationStatus.CONFIRMED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([existingReservation]);

      const dto: CreateReservationDto = {
        roomId,
        startAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 12:00 (정확히 종료 시간)
        endAt: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 14:00
      };

      const result = await service.create(dto, userId);

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('경계 케이스: 새 예약의 종료 시간이 기존 예약의 시작 시간과 정확히 같으면 허용되어야 함', async () => {
      const existingReservation = {
        id: 'existing-id',
        userId: 'other-user',
        roomId,
        startAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000), // 12:00
        endAt: new Date(baseDate.getTime() + 4 * 60 * 60 * 1000), // 14:00
        status: ReservationStatus.CONFIRMED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([existingReservation]);

      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(), // 10:00
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 12:00 (정확히 시작 시간)
      };

      const result = await service.create(dto, userId);

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('REJECTED 상태의 예약은 중복 체크에서 제외되어야 함', async () => {
      const rejectedReservation = {
        id: 'rejected-id',
        userId: 'other-user',
        roomId,
        startAt: baseDate,
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
        status: ReservationStatus.REJECTED,
        reason: '거절됨',
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([]); // REJECTED는 조회되지 않음

      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      const result = await service.create(dto, userId);

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('CANCELED 상태의 예약은 중복 체크에서 제외되어야 함', async () => {
      const canceledReservation = {
        id: 'canceled-id',
        userId: 'other-user',
        roomId,
        startAt: baseDate,
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
        status: ReservationStatus.CANCELED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([]); // CANCELED는 조회되지 않음

      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      const result = await service.create(dto, userId);

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('PENDING 상태의 예약과 겹치면 거부되어야 함', async () => {
      const pendingReservation = {
        id: 'pending-id',
        userId: 'other-user',
        roomId,
        startAt: baseDate,
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
        status: ReservationStatus.PENDING,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([pendingReservation]);

      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('다른 방(roomId)의 예약과는 겹쳐도 허용되어야 함', async () => {
      const otherRoomReservation = {
        id: 'other-room-id',
        userId: 'other-user',
        roomId: 999, // 다른 방
        startAt: baseDate,
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
        status: ReservationStatus.CONFIRMED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([]); // 다른 방이므로 조회되지 않음

      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(),
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      };

      const result = await service.create(dto, userId);

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('여러 개의 기존 예약 중 하나라도 겹치면 거부되어야 함', async () => {
      const reservation1 = {
        id: 'reservation-1',
        userId: 'user-1',
        roomId,
        startAt: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000), // 08:00 ~ 10:00
        endAt: baseDate,
        status: ReservationStatus.CONFIRMED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      const reservation2 = {
        id: 'reservation-2',
        userId: 'user-2',
        roomId,
        startAt: baseDate, // 10:00 ~ 12:00
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
        status: ReservationStatus.CONFIRMED,
        reason: null,
        createdAt: new Date(),
      } as Reservation;

      mockQueryRunner.manager.find.mockResolvedValue([reservation1, reservation2]);

      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(), // 10:00
        endAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 12:00
      };

      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('종료 시간이 시작 시간보다 빠르면 BadRequestException을 던져야 함', async () => {
      const dto: CreateReservationDto = {
        roomId,
        startAt: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        endAt: baseDate.toISOString(), // 시작 시간보다 빠름
      };

      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
      // 트랜잭션이 시작되기 전에 예외가 발생하므로 트랜잭션 관련 메서드는 호출되지 않아야 함
      expect(mockQueryRunner.connect).not.toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('종료 시간이 시작 시간과 같으면 BadRequestException을 던져야 함', async () => {
      const dto: CreateReservationDto = {
        roomId,
        startAt: baseDate.toISOString(),
        endAt: baseDate.toISOString(), // 시작 시간과 같음
      };

      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
      // 트랜잭션이 시작되기 전에 예외가 발생하므로 트랜잭션 관련 메서드는 호출되지 않아야 함
      expect(mockQueryRunner.connect).not.toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });
  });
});

