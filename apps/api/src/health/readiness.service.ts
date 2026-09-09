import type { BeforeApplicationShutdown } from '@nestjs/common';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { DATABASE_HEALTH, type DatabaseHealthPort } from './database-health.port.js';

@Injectable()
export class ReadinessService implements BeforeApplicationShutdown {
  private readonly logger = new Logger(ReadinessService.name);
  private acceptingTraffic = false;

  constructor(@Inject(DATABASE_HEALTH) private readonly databaseHealth: DatabaseHealthPort) {}

  async isReady(): Promise<boolean> {
    if (!this.acceptingTraffic) {
      return false;
    }

    try {
      await this.databaseHealth.ping();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Database readiness ping failed: ${message}`);
      return false;
    }
  }

  markReady(): void {
    this.acceptingTraffic = true;
  }

  markNotReady(): void {
    this.acceptingTraffic = false;
  }

  beforeApplicationShutdown(): void {
    this.markNotReady();
  }
}
