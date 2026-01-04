import {
  IsInt,
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../entities/reservation.entity';

export class CreateReservationDto {
  @ApiProperty({
    description: '회의실 ID',
    example: 1,
    type: Number,
  })
  @IsInt()
  roomId: number;

  @ApiProperty({
    description: '예약 시작 시간 (ISO 8601 형식)',
    example: '2026-01-15T10:00:00Z',
    type: String,
  })
  @IsDateString()
  startAt: string;

  @ApiProperty({
    description: '예약 종료 시간 (ISO 8601 형식)',
    example: '2026-01-15T12:00:00Z',
    type: String,
  })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({
    description: '예약 상태 (기본값: PENDING)',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @ApiPropertyOptional({
    description: '예약 사유',
    example: '팀 미팅',
    type: String,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

