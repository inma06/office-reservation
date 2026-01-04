import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check', description: '서버 상태 확인' })
  @ApiResponse({ status: 200, description: '서버가 정상 작동 중입니다.' })
  getHello(): string {
    return this.appService.getHello();
  }
}
