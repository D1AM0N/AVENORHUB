import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface TenantScopedRequest extends Request {
  user: { id: string; email: string; role: string; tenantId: string | null };
  tenantId: string;
}

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantScopedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    let user: TenantScopedRequest['user'];
    try {
      user = await this.jwt.verifyAsync<TenantScopedRequest['user']>(authorization.slice(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (
      !user ||
      typeof user !== 'object' ||
      typeof user.id !== 'string' ||
      typeof user.email !== 'string' ||
      typeof user.role !== 'string' ||
      typeof user.tenantId !== 'string' && user.tenantId !== null
    ) {
      throw new UnauthorizedException('Invalid authentication payload');
    }

    const requestedTenantIds = this.requestedTenantIds(request);
    if (new Set(requestedTenantIds).size > 1) {
      throw new BadRequestException('Conflicting tenantId values were supplied');
    }
    if (user.role === 'super_admin') {
      if (requestedTenantIds.length === 0) throw new BadRequestException('tenantId is required');
      request.user = user;
      request.tenantId = requestedTenantIds[0];
      return true;
    }

    if (!user.tenantId) throw new BadRequestException('Authenticated user has no tenantId');
    if (requestedTenantIds.some((tenantId) => tenantId !== user.tenantId)) {
      throw new ForbiddenException('You can only access data in your tenant');
    }
    request.user = user;
    request.tenantId = user.tenantId;
    return true;
  }

  private requestedTenantIds(request: Request): string[] {
    const values = [
      request.query.tenantId,
      (request.body as { tenantId?: unknown } | undefined)?.tenantId,
    ].filter((tenantId) => tenantId !== undefined);
    const requestedIds: string[] = [];
    for (const tenantId of values) {
      if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
        throw new BadRequestException('tenantId must be a non-empty string');
      }
      requestedIds.push(tenantId.trim());
    }
    return requestedIds;
  }
}
