import type { HealthResponse } from '@dataroom/shared';
import { Controller, Get } from '@nestjs/common';

import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  /** Liveness has to answer before anyone can sign in, and to a probe that never will. */
  @Public()
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: '@dataroom/api',
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
