import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { Room } from '../entities/room.entity';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationStatusDto } from '../dto/update-reservation-status.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private dataSource: DataSource,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
    userId: string,
  ): Promise<Reservation> {
    const { roomId, startAt, endAt, status, reason } = createReservationDto;

    // DTO의 startAt, endAt은 string이므로 Date로 변환
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    // 종료 시간이 시작 시간보다 빠르면 400 에러
    if (endDate <= startDate) {
      throw new BadRequestException(
        '종료 시간은 시작 시간보다 늦어야 합니다.',
      );
    }

    // Room 존재 여부 확인
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    // TypeORM Transaction 사용
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 동일한 roomId에 대해 CONFIRMED 또는 PENDING 상태인 예약이 있는지 확인
      const existingReservations = await queryRunner.manager.find(Reservation, {
        where: {
          roomId,
          status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        },
      });

      // 중복 조건: (existingStart < newEnd) AND (existingEnd > newStart)
      const hasConflict = existingReservations.some((existing) => {
        const existingStart = new Date(existing.startAt);
        const existingEnd = new Date(existing.endAt);
        return existingStart < endDate && existingEnd > startDate;
      });

      if (hasConflict) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw new ConflictException(
          '해당 시간대에 이미 예약이 존재합니다.',
        );
      }

      // 새 예약 생성
      const reservation = queryRunner.manager.create(Reservation, {
        userId,
        roomId,
        startAt: startDate,
        endAt: endDate,
        status: status || ReservationStatus.PENDING,
        reason: reason || null,
      });

      const savedReservation = await queryRunner.manager.save(reservation);

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return savedReservation;
    } catch (error) {
      // 이미 rollback된 경우를 체크
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      await queryRunner.release();
      throw error;
    }
  }

  async findAll(userId: string, userRole: string): Promise<Reservation[]> {
    const whereCondition: any = {};

    // 일반 유저는 본인 예약만 조회
    if (userRole === 'USER') {
      whereCondition.userId = userId;
    }
    // 관리자는 모든 예약 조회 (whereCondition이 빈 객체이므로 모든 예약 조회)

    return await this.reservationRepository.find({
      where: whereCondition,
      relations: ['room'],
      order: {
        createdAt: 'DESC', // 최신 예약이 먼저
      },
    });
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateReservationStatusDto,
  ): Promise<Reservation> {
    const { status, reason } = updateStatusDto;

    // 예약 조회
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['room'],
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // 상태 전이 검증: PENDING 상태에서만 CONFIRMED 또는 REJECTED로 변경 가능
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        `이미 처리된 예약입니다. 현재 상태: ${reservation.status}. PENDING 상태인 예약만 상태를 변경할 수 있습니다.`,
      );
    }

    // REJECTED로 변경 시 reason 필수 검증
    if (status === ReservationStatus.REJECTED) {
      if (!reason || reason.trim().length === 0) {
        throw new BadRequestException(
          '예약을 거절할 때는 사유(reason)가 필수입니다.',
        );
      }
      reservation.reason = reason;
    } else {
      // CONFIRMED로 변경 시 reason은 null로 설정 (기존 reason 유지하지 않음)
      reservation.reason = null;
    }

    // 상태 업데이트 (updatedAt은 UpdateDateColumn으로 자동 갱신됨)
    reservation.status = status;

    return await this.reservationRepository.save(reservation);
  }

  async cancel(id: string, userId: string): Promise<Reservation> {
    // 예약 조회
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['room'],
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // 본인 예약인지 확인
    if (reservation.userId !== userId) {
      throw new ForbiddenException('본인의 예약만 취소할 수 있습니다.');
    }

    // 상태 검증: PENDING 또는 CONFIRMED 상태만 취소 가능
    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `취소할 수 없는 예약입니다. 현재 상태: ${reservation.status}. PENDING 또는 CONFIRMED 상태인 예약만 취소할 수 있습니다.`,
      );
    }

    // 상태를 CANCELED로 변경 (updatedAt은 UpdateDateColumn으로 자동 갱신됨)
    reservation.status = ReservationStatus.CANCELED;

    return await this.reservationRepository.save(reservation);
  }
}

