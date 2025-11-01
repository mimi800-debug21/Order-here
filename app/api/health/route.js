// Health check API route - 2025-11-01
export async function GET() {
  return new Response(
    JSON.stringify({ 
      status: 'available',
      timestamp: new Date().toISOString(),
      message: 'API is running'
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}