// This route is only for runtime testing, not for build time
export async function GET() {
  // Respond immediately without database access during build
  // This will work at runtime when DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: 'DATABASE_URL not configured' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  try {
    // Import dynamically to avoid build issues
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    // Simple test query to check connection
    const result = await sql`SELECT 1 as test`;
    
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Database connection successful',
        test: result[0].test
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}