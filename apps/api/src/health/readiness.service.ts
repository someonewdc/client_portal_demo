import type { BeforeApplicationShutdown } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReadinessService implements BeforeApplicationShutdown {
  private acceptingTraffic = false;

  async isReady(): Promise<boolean> {
    return this.acceptingTraffic;
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
