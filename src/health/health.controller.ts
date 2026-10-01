import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      // Nest does not log HTTP exceptions, so keep the cause in the logs.
      this.logger.error(
        'Database is unreachable',
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException('Database is unreachable');
    }

    return { status: 'ok' };
  }
}
