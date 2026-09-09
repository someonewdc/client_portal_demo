import { NotFoundException } from '@nestjs/common';

import { RequestNotFoundError } from '../application/request-not-found.error.js';

export function mapApplicationError(error: unknown): never {
  if (error instanceof RequestNotFoundError) {
    throw new NotFoundException('The requested resource was not found');
  }

  throw error;
}
