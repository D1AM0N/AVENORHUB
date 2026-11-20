import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getDashboard() {
    return { status: 'ok' };
  }
}
