export class LiveRequestAdvanceConflictError extends Error {
  constructor() {
    super('Live request cannot advance past the issued invoice');
    this.name = 'LiveRequestAdvanceConflictError';
  }
}
