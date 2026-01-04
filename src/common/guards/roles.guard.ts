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

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('인증 정보가 없습니다.');
    }

    if (!user.role) {
      throw new ForbiddenException('사용자 역할 정보가 없습니다.');
    }

    const hasRole = requiredRoles.some((role) => role === user.role);
    
    if (!hasRole) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return true;
  }
}

