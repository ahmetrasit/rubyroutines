import { useState, useCallback } from 'react';

/**
 * Retry configuration for mutations
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Function to determine if error should trigger retry */
  shouldRetry?: (error: any, attempt: number) => boolean;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors and 5xx server errors
    if (error?.data?.code === 'INTERNAL_SERVER_ERROR') return true;
    if (error?.message?.includes('fetch failed')) return true;
    if (error?.message?.includes('network')) return true;
    return false;
  },
};

/**
 * Hook to add retry logic to mutations
 */
export function useRetryMutation<TData, TVariables>(
  mutateFn: (variables: TVariables) => Promise<TData>,
  config: RetryConfig = {}
) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const mutateWithRetry = useCallback(
    async (variables: TVariables): Promise<TData> => {
      let lastError: any;
      let attempt = 0;

      while (attempt <= mergedConfig.maxRetries) {
        try {
          const result = await mutateFn(variables);
          setRetryCount(0);
          setIsRetrying(false);
          return result;
        } catch (error) {
          lastError = error;

          // Check if we should retry
          if (
            attempt < mergedConfig.maxRetries &&
            mergedConfig.shouldRetry(error, attempt)
          ) {
            attempt++;
            setRetryCount(attempt);
            setIsRetrying(true);

            // Calculate delay with exponential backoff
            const delay = Math.min(
              mergedConfig.initialDelay * Math.pow(mergedConfig.backoffMultiplier, attempt - 1),
              mergedConfig.maxDelay
            );

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // Don't retry
            setRetryCount(0);
            setIsRetrying(false);
            throw error;
          }
        }
      }

      setRetryCount(0);
      setIsRetrying(false);
      throw lastError;
    },
    [mutateFn, mergedConfig]
  );

  return {
    mutateWithRetry,
    retryCount,
    isRetrying,
  };
}
