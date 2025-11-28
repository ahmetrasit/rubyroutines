/**
 * Health check endpoint for network status monitoring
 * Responds to HEAD and GET requests for connectivity checks
 */

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
