import {
  IsUUID,
  IsInt,
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
} from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class CreateReservationDto {
  @IsUUID()
  userId: string;

  @IsInt()
  roomId: number;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

