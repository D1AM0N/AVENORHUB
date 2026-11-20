import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreateBusinessDto, LoginDto, RegisterDto, SwitchTenantDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login(dto, request);
  }

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() request: Request) {
    return this.auth.register(dto, request);
  }

  @Post('businesses')
  createBusiness(@Body() dto: CreateBusinessDto, @Req() request: Request) {
    return this.auth.createBusiness(dto, request);
  }

  @Post('switch-tenant')
  switchTenant(
    @Body() dto: Pick<SwitchTenantDto, 'tenantId'> & Partial<Pick<SwitchTenantDto, 'userId' | 'email'>>,
    @Req() request: Request,
  ) {
    return this.auth.switchTenant(dto, request);
  }
}
