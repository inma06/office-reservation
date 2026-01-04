import {
  IsUUID,
  IsInt,
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
} from 'class-validator';
import { ReservationStatus } from '../entities/reservation.entity';

export class UpdateReservationDto {
  @IsInt()
  @IsOptional()
  roomId?: number;

  @IsDateString()
  @IsOptional()
  startAt?: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

