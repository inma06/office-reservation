import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { UpdateReservationStatusDto } from '../dto/update-reservation-status.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('reservations')
@Controller('reservations')
@UseGuards(RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '예약 상태 업데이트',
    description: '관리자만 예약 상태를 CONFIRMED 또는 REJECTED로 변경할 수 있습니다.',
  })
  @ApiParam({
    name: 'id',
    description: '예약 ID (UUID)',
    type: String,
  })
  @ApiBody({
    type: UpdateReservationStatusDto,
    description: '예약 상태 업데이트 정보',
  })
  @ApiResponse({
    status: 200,
    description: '예약 상태가 성공적으로 업데이트되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (PENDING 상태가 아니거나, REJECTED 시 reason이 없음)',
  })
  @ApiResponse({
    status: 404,
    description: '예약을 찾을 수 없습니다.',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, updateStatusDto);
  }
}

