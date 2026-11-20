import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface StaffManagementRequest extends Request {
  user: { id: string; email: string; role: string; tenantId: string | null };
}

@Injectable()
export class StaffManagementGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StaffManagementRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    try {
      const user = await this.jwt.verifyAsync<StaffManagementRequest['user']>(authorization.slice(7));
      if (user.role !== 'tenant_admin' && user.role !== 'super_admin') {
        throw new ForbiddenException('Tenant Admin access required');
      }
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
