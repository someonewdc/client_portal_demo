import { ConflictException, NotFoundException } from '@nestjs/common';

import { LiveRequestAdvanceConflictError } from '../application/live-request-advance-conflict.error.js';
import { RequestNotFoundError } from '../application/request-not-found.error.js';

export function mapApplicationError(error: unknown): never {
  if (error instanceof RequestNotFoundError) {
    throw new NotFoundException('The requested resource was not found');
  }
  if (error instanceof LiveRequestAdvanceConflictError) {
    throw new ConflictException('The live request cannot advance past the issued invoice');
  }

  throw error;
}
