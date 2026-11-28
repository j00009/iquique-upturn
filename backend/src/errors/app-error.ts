export class AppError extends Error {
  constructor(
    public readonly codigo: number,
    message: string,
    public readonly detalle: unknown = null,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
