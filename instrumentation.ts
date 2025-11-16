/**
 * Instrumentation
 *
 * Runs on server startup (both dev and production).
 * Used for environment validation and other initialization tasks.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env-validation');

    try {
      validateEnv();
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      // Exit in production to fail fast
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
}
