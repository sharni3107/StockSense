// Thrown deliberately by our own logic (validation, business rules).
// The error handler middleware knows how to turn this into a clean JSON response
// instead of leaking raw database/stack details to the frontend.
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
