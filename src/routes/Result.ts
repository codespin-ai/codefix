export type Result<TResult, TError> =
  | {
      success: true;
      result: TResult;
    }
  | {
      success: false;
      error: TError;
      message?: string;
    };

export function makeResult<TResult>(value: TResult): Result<TResult, void> {
  return {
    success: true,
    result: value,
  };
}

export function makeError<TError>(
  error: TError,
  message?: string
): Result<void, TError> {
  return {
    success: false,
    error,
    message,
  };
}
