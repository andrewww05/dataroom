import { Test } from '@nestjs/testing';

import { HealthController } from './health.controller';

// #### Scenario: FR-OPS-010 health endpoint responds after setup
describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('reports ok', () => {
    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
