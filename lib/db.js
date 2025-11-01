// Safe database client that only initializes when DATABASE_URL is available

export function createDbClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  
  const { neon } = require('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL);
}

// Alternative approach using dynamic import for server-side only
export async function getDbClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  
  const { neon } = await import('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL);
}