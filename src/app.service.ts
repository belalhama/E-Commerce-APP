import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'E-Commerce Backend API',
      timestamp: new Date().toISOString(),
    };
  }
}
