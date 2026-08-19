export class AppError extends Error {
  /**
   * Cria um erro de negocio com status HTTP e codigo identificador.
   */
  constructor(message, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
