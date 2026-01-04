import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    // 가상의 구조: 실제 인증 시스템과 연동 시 request.user에서 가져옴
    // 현재는 헤더에서 역할을 가져오는 방식으로 구현 (실제 프로덕션에서는 JWT 등 사용)
    const request = context.switchToHttp().getRequest();
    
    // 실제 구현 시: const user = request.user;
    // 현재는 X-User-Role 헤더에서 역할을 가져오는 방식 (가상의 구조)
    const userRole = request.headers['x-user-role'] as UserRole;
    
    if (!userRole) {
      throw new ForbiddenException('인증 정보가 없습니다.');
    }

    const hasRole = requiredRoles.some((role) => role === userRole);
    
    if (!hasRole) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return true;
  }
}

