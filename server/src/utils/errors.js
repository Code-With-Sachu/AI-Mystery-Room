export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = true;
  }
}
export const badRequest = (m, code = "VALIDATION_ERROR") => new AppError(400, code, m);
export const notFound = (m = "Case not found.") => new AppError(404, "NOT_FOUND", m);
export const conflict = (m, code = "CONFLICT") => new AppError(409, code, m);
