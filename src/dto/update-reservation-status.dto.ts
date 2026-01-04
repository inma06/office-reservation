import {
  IsEnum,
  IsString,
  ValidateIf,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../entities/reservation.entity';

export class UpdateReservationStatusDto {
  @ApiProperty({
    description: '예약 상태 (CONFIRMED 또는 REJECTED만 가능)',
    enum: [ReservationStatus.CONFIRMED, ReservationStatus.REJECTED],
    example: ReservationStatus.CONFIRMED,
  })
  @IsEnum([ReservationStatus.CONFIRMED, ReservationStatus.REJECTED], {
    message: 'status는 CONFIRMED 또는 REJECTED만 가능합니다.',
  })
  status: ReservationStatus.CONFIRMED | ReservationStatus.REJECTED;

  @ApiPropertyOptional({
    description: '예약 거절 사유 (REJECTED 상태일 때 필수)',
    example: '회의실 정원 초과',
    maxLength: 500,
  })
  @ValidateIf((o) => o.status === ReservationStatus.REJECTED)
  @IsNotEmpty({ message: '예약 거절 시 사유(reason)는 필수입니다.' })
  @IsString({ message: '예약 거절 시 사유는 문자열이어야 합니다.' })
  @MaxLength(500, { message: '사유는 500자 이하로 입력해주세요.' })
  reason?: string;
}

