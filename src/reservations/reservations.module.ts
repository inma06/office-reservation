import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from '../entities/reservation.entity';
import { Room } from '../entities/room.entity';
import { SlackService } from './slack.service';
import { ReservationScheduler } from './reservation.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Room])],
  controllers: [ReservationsController],
  providers: [ReservationsService, SlackService, ReservationScheduler],
  exports: [ReservationsService],
})
export class ReservationsModule {}

