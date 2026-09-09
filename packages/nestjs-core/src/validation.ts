import { ValidationPipe } from '@nestjs/common';
import type { Type } from '@nestjs/common';

const GLOBAL_VALIDATION_OPTIONS = {
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
} as const;

export function createGlobalValidationPipe(): ValidationPipe {
  return new ValidationPipe(GLOBAL_VALIDATION_OPTIONS);
}

export function dtoValidationPipe(expectedType: Type<unknown>): ValidationPipe {
  return new ValidationPipe({ ...GLOBAL_VALIDATION_OPTIONS, expectedType });
}
