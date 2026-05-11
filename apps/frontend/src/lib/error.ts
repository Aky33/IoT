import { ApiError } from "./api";

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}
