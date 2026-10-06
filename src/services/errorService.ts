export interface AppError {
  code: string;
  message: string;
  originalError?: unknown;
}

export function normalizeError(error: unknown): AppError {
  if (typeof error === 'string') {
    return { code: 'UNKNOWN_ERROR', message: error };
  }

  if (error && typeof error === 'object') {
    const err = error as { message?: string; code?: string; details?: string; hint?: string };
    return {
      code: err.code || 'APP_ERROR',
      message: err.message || err.details || 'An unexpected error occurred. Please try again.',
      originalError: error,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred.',
    originalError: error,
  };
}
