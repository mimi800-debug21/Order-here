import { neon } from '@neondatabase/serverless';

export function getDbClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(process.env.DATABASE_URL);
}

export async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set, skipping database initialization');
    return;
  }
  
  try {
    const sql = getDbClient();
    
    // Create dishes table
    await sql`
      CREATE TABLE IF NOT EXISTS dishes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) DEFAULT 0,
        description TEXT,
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_name VARCHAR(255) NOT NULL,
        destination VARCHAR(255) DEFAULT 'N/A',
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create order_dishes junction table
    await sql`
      CREATE TABLE IF NOT EXISTS order_dishes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
        price DECIMAL(10, 2) DEFAULT 0
      );
    `;
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    // Don't throw the error during build, just log it
    // The tables will be created when the API is first called at runtime
  }
}