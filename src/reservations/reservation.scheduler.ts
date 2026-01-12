import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { SlackService } from './slack.service';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class ReservationScheduler {
  private readonly logger = new Logger(ReservationScheduler.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private slackService: SlackService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendReservationNotifications() {
    try {
      // 현재 UTC 시간
      const now = dayjs.utc();
      
      // 10분 후 ~ 11분 후 사이 (startAt >= NOW() + 10m AND startAt < NOW() + 11m)
      const tenMinutesLater = now.add(10, 'minute');
      const elevenMinutesLater = now.add(11, 'minute');

      this.logger.debug(
        `예약 알림 체크: 현재 UTC ${now.format('YYYY-MM-DD HH:mm:ss')}, 범위 ${tenMinutesLater.format('HH:mm:ss')} ~ ${elevenMinutesLater.format('HH:mm:ss')}`,
      );

      // 알림을 받지 않은 예약 조회 (디버깅용: 모든 CONFIRMED 예약 확인)
      const allUpcomingReservations = await this.reservationRepository.find({
        where: {
          isNotified: false,
          status: ReservationStatus.CONFIRMED,
        },
        relations: ['user', 'room'],
        order: { startAt: 'ASC' },
      });

      this.logger.debug(
        `CONFIRMED이고 알림 미발송 예약 수: ${allUpcomingReservations.length}`,
      );
      if (allUpcomingReservations.length > 0) {
        allUpcomingReservations.slice(0, 5).forEach((res) => {
          const startAtUTC = dayjs.utc(res.startAt);
          const minutesUntilStart = startAtUTC.diff(now, 'minute');
          this.logger.debug(
            `예약 ID ${res.id}: 시작 ${startAtUTC.format('YYYY-MM-DD HH:mm:ss')} UTC (${minutesUntilStart}분 후), 회의실: ${res.room.name}`,
          );
        });
      }

      // 알림을 받지 않은 예약 조회
      // 10분 후 ~ 11분 후 사이 (startAt >= NOW() + 10m AND startAt < NOW() + 11m)
      // QueryBuilder를 사용하여 정확한 범위 조건 적용
      const reservations = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.user', 'user')
        .leftJoinAndSelect('reservation.room', 'room')
        .where('reservation.isNotified = :isNotified', { isNotified: false })
        .andWhere('reservation.status = :status', {
          status: ReservationStatus.CONFIRMED,
        })
        .andWhere('reservation.startAt >= :tenMinutesLater', {
          tenMinutesLater: tenMinutesLater.toDate(),
        })
        .andWhere('reservation.startAt < :elevenMinutesLater', {
          elevenMinutesLater: elevenMinutesLater.toDate(),
        })
        .getMany();

      if (reservations.length === 0) {
        this.logger.debug('알림 대상 예약이 없습니다.');
        return;
      }

      this.logger.log(`${reservations.length}개의 예약 알림을 전송합니다.`);

      // 각 예약에 대해 알림 전송
      for (const reservation of reservations) {
        try {
          // UTC 시간을 한국 시간(KST, UTC+9)으로 변환하여 포맷팅
          const startTime = dayjs
            .utc(reservation.startAt)
            .tz('Asia/Seoul')
            .format('HH:mm');

          // 슬랙 메시지 생성
          const message = [
            '🔔 회의실 예약 알림',
            '',
            `회의실: ${reservation.room.name}`,
            `예약자: ${reservation.user.name}`,
            `시간: ${startTime} (곧 시작됩니다!)`,
          ].join('\n');

          // 슬랙 알림 전송
          const success = await this.slackService.sendNotification(message);

          if (success) {
            // 전송 성공 시 isNotified를 true로 업데이트
            reservation.isNotified = true;
            await this.reservationRepository.save(reservation);
            this.logger.log(
              `예약 알림 전송 성공: 예약 ID ${reservation.id}, 회의실 ${reservation.room.name}`,
            );
          } else {
            this.logger.error(
              `예약 알림 전송 실패: 예약 ID ${reservation.id}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `예약 알림 처리 중 오류 발생 (예약 ID: ${reservation.id}): ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`예약 알림 스케줄러 실행 중 오류 발생: ${error.message}`);
    }
  }
}
