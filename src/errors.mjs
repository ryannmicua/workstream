export class WorkstreamError extends Error {
  constructor(message, code, action) {
    super(message);
    this.name = 'WorkstreamError';
    this.code = code;
    this.action = action || null;
  }
}
