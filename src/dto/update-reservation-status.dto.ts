import { IsEnum, IsString, ValidateIf, MaxLength } from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class UpdateReservationStatusDto {
  @IsEnum([ReservationStatus.CONFIRMED, ReservationStatus.REJECTED], {
    message: 'status는 CONFIRMED 또는 REJECTED만 가능합니다.',
  })
  status: ReservationStatus.CONFIRMED | ReservationStatus.REJECTED;

  @ValidateIf((o) => o.status === ReservationStatus.REJECTED)
  @IsString({ message: '예약 거절 시 사유는 필수입니다.' })
  @MaxLength(500, { message: '사유는 500자 이하로 입력해주세요.' })
  reason?: string;
}

