export class RequestFixtureMismatchError extends Error {
  constructor() {
    super('Stored requests do not match the demo fixture catalog');
    this.name = 'RequestFixtureMismatchError';
  }
}
