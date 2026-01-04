import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationStatusDto } from '../dto/update-reservation-status.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private dataSource: DataSource,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const { userId, roomId, startAt, endAt, status, reason } =
      createReservationDto;

    // DTO의 startAt, endAt은 string이므로 Date로 변환
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    // 종료 시간이 시작 시간보다 빠르면 400 에러
    if (endDate <= startDate) {
      throw new BadRequestException(
        '종료 시간은 시작 시간보다 늦어야 합니다.',
      );
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
      return savedReservation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateReservationStatusDto,
  ): Promise<Reservation> {
    const { status, reason } = updateStatusDto;

    // 예약 조회
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }

    // 상태 전이 검증: PENDING 상태에서만 CONFIRMED 또는 REJECTED로 변경 가능
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        'PENDING 상태인 예약만 상태를 변경할 수 있습니다.',
      );
    }

    // REJECTED로 변경 시 reason 필수
    if (status === ReservationStatus.REJECTED && !reason) {
      throw new BadRequestException(
        '예약을 거절할 때는 사유(reason)가 필요합니다.',
      );
    }

    // 상태 및 사유 업데이트
    reservation.status = status;
    reservation.reason = reason || reservation.reason;

    return await this.reservationRepository.save(reservation);
  }
}

