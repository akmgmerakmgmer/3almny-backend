import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return { success: true, data: { message: 'API OK' } };
  }

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }
}
