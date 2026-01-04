import {
  Controller,
  Get,
  Post,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationStatusDto } from '../dto/update-reservation-status.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '예약 내역 조회',
    description:
      '일반 유저는 본인이 예약한 내역만, 관리자는 모든 예약 내역을 조회할 수 있습니다. Room 정보가 포함되며, 최신 예약이 먼저 표시됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '예약 내역 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440001',
          },
          roomId: {
            type: 'number',
            example: 1,
          },
          startAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-15T10:00:00.000Z',
          },
          endAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-15T12:00:00.000Z',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELED'],
            example: 'PENDING',
          },
          reason: {
            type: 'string',
            nullable: true,
            example: '팀 미팅',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-15T09:00:00.000Z',
          },
          room: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                example: 1,
              },
              name: {
                type: 'string',
                example: '회의실 A',
              },
              capacity: {
                type: 'number',
                example: 10,
              },
              description: {
                type: 'string',
                nullable: true,
                example: '대형 회의실',
              },
              isActive: {
                type: 'boolean',
                example: true,
              },
            },
          },
        },
      },
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          roomId: 1,
          startAt: '2026-01-15T10:00:00.000Z',
          endAt: '2026-01-15T12:00:00.000Z',
          status: 'PENDING',
          reason: '팀 미팅',
          createdAt: '2026-01-15T09:00:00.000Z',
          room: {
            id: 1,
            name: '회의실 A',
            capacity: 10,
            description: '대형 회의실',
            isActive: true,
          },
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          userId: '550e8400-e29b-41d4-a716-446655440003',
          roomId: 2,
          startAt: '2026-01-14T14:00:00.000Z',
          endAt: '2026-01-14T16:00:00.000Z',
          status: 'CONFIRMED',
          reason: null,
          createdAt: '2026-01-14T13:00:00.000Z',
          room: {
            id: 2,
            name: '회의실 B',
            capacity: 5,
            description: '소형 회의실',
            isActive: true,
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: 403,
    description: '권한이 없습니다.',
  })
  async findAll(@CurrentUser() user: User) {
    return this.reservationsService.findAll(user.id, user.role);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '예약 생성',
    description: '로그인한 사용자가 새로운 예약을 생성합니다. 중복 예약은 자동으로 거부됩니다.',
  })
  @ApiBody({
    type: CreateReservationDto,
    description: '예약 생성 정보',
    examples: {
      basic: {
        summary: '기본 예약',
        description: '필수 정보만 포함한 기본 예약',
        value: {
          roomId: 1,
          startAt: '2026-01-15T10:00:00Z',
          endAt: '2026-01-15T12:00:00Z',
        },
      },
      withReason: {
        summary: '사유 포함 예약',
        description: '예약 사유를 포함한 예약',
        value: {
          roomId: 1,
          startAt: '2026-01-15T10:00:00Z',
          endAt: '2026-01-15T12:00:00Z',
          reason: '팀 미팅',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '예약이 성공적으로 생성되었습니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (종료 시간이 시작 시간보다 빠름)',
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: 409,
    description: '해당 시간대에 이미 예약이 존재합니다.',
  })
  async create(
    @Body() createReservationDto: CreateReservationDto,
    @CurrentUser() user: User,
  ) {
    return this.reservationsService.create(createReservationDto, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
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
    examples: {
      confirm: {
        summary: '예약 승인',
        description: '예약을 승인하는 경우',
        value: {
          status: 'CONFIRMED',
        },
      },
      reject: {
        summary: '예약 거절',
        description: '예약을 거절하는 경우 (reason 필수)',
        value: {
          status: 'REJECTED',
          reason: '회의실 정원 초과로 인한 거절',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '예약 상태가 성공적으로 업데이트되었습니다.',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        userId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440001',
        },
        roomId: {
          type: 'number',
          example: 1,
        },
        startAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-15T10:00:00.000Z',
        },
        endAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-15T12:00:00.000Z',
        },
        status: {
          type: 'string',
          enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELED'],
          example: 'CONFIRMED',
        },
        reason: {
          type: 'string',
          nullable: true,
          example: null,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-15T09:00:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-15T10:30:00.000Z',
        },
        room: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '회의실 A' },
            capacity: { type: 'number', example: 10 },
            description: { type: 'string', nullable: true },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      '잘못된 요청 (PENDING 상태가 아니거나, REJECTED 시 reason이 없음)',
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: 403,
    description: '권한이 없습니다. (ADMIN만 접근 가능)',
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

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '예약 취소',
    description:
      '유저가 본인의 예약을 취소합니다. PENDING 또는 CONFIRMED 상태인 예약만 취소할 수 있으며, 취소는 삭제가 아닌 상태 변경(Soft Update)입니다.',
  })
  @ApiParam({
    name: 'id',
    description: '예약 ID (UUID)',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: '예약이 성공적으로 취소되었습니다.',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        userId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440001',
        },
        roomId: {
          type: 'number',
          example: 1,
        },
        startAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-15T10:00:00.000Z',
        },
        endAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-15T12:00:00.000Z',
        },
        status: {
          type: 'string',
          enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELED'],
          example: 'CANCELED',
        },
        reason: {
          type: 'string',
          nullable: true,
          example: null,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-15T09:00:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-01-15T10:30:00.000Z',
        },
        room: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '회의실 A' },
            capacity: { type: 'number', example: 10 },
            description: { type: 'string', nullable: true },
            isActive: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      '잘못된 요청 (PENDING 또는 CONFIRMED 상태가 아님)',
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
  })
  @ApiResponse({
    status: 403,
    description: '본인의 예약만 취소할 수 있습니다.',
  })
  @ApiResponse({
    status: 404,
    description: '예약을 찾을 수 없습니다.',
  })
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.reservationsService.cancel(id, user.id);
  }
}

