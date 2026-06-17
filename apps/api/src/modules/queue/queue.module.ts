import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Environment } from '../../config/environment';
import { AuthModule } from '../auth/auth.module';
import { QueueDashboardAuthService } from './queue-dashboard-auth.service';
import { QueueDashboardService } from './queue-dashboard.service';
import { QUEUE_DEFINITIONS, REDIS_CONNECTION } from './queue.constants';
import { createQueueProvider, parseRedisUrl } from './queue.helpers';
import type { RedisConnectionOptions } from './queue.types';

@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: REDIS_CONNECTION,
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<Environment, true>
      ): RedisConnectionOptions =>
        parseRedisUrl(configService.get('REDIS_URL', { infer: true })),
    },
    ...QUEUE_DEFINITIONS.map(([token, name]) =>
      createQueueProvider(token, name)
    ),
    QueueDashboardAuthService,
    QueueDashboardService,
  ],
  exports: [
    REDIS_CONNECTION,
    ...QUEUE_DEFINITIONS.map(([token]) => token),
    QueueDashboardAuthService,
    QueueDashboardService,
  ],
})
export class QueueModule {}
