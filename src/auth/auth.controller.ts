import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @CurrentUser() user: User) {
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as any;
    const email = profile.email;
    const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || email.split('@')[0];
    
    const user = await this.authService.validateOAuthUser(email, name);
    const result = await this.authService.login(user);

    // 프론트엔드로 리다이렉트하면서 JWT 토큰과 user 정보를 쿼리 스트링으로 전달
    const frontendUrl = process.env.FRONTEND_URL || 'https://dev-leo.site';
    const { password, ...userWithoutPassword } = user;
    const userParam = encodeURIComponent(JSON.stringify(userWithoutPassword));
    const redirectUrl = `${frontendUrl}?token=${result.access_token}&user=${userParam}`;
    res.redirect(redirectUrl);
  }
}

