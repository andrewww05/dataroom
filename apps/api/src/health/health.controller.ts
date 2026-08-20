import type { HealthResponse } from '@dataroom/shared';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: '@dataroom/api',
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
