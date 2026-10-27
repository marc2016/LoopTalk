export type AppErrorCode = "bad_request" | "unauthorized" | "not_found" | "conflict";

const statusByCode: Record<AppErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  not_found: 404,
  conflict: 409,
};

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  get status(): number {
    return statusByCode[this.code];
  }
}

export const notFound = (message = "Nicht gefunden.") => new AppError("not_found", message);
