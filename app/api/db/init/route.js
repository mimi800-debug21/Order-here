import { getDbClient } from '../../../../utils/db';

export async function POST() {
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
    
    // Insert demo dishes if table is empty
    const dishCountResult = await sql`SELECT COUNT(*) as count FROM dishes`;
    const dishCount = parseInt(dishCountResult[0].count);
    
    if (dishCount === 0) {
      await sql`
        INSERT INTO dishes (name, price, description, tags) 
        VALUES 
          ('Margherita', 7.5, 'Tomate, Mozzarella, Basilikum', 'vegetarisch'),
          ('Spaghetti Bolognese', 9.9, 'Hausgemachte Soße', ''),
          ('Rotes Thai Curry', 11.5, 'Mit Gemüse & Kokos', 'scharf,vegan')
      `;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database initialized successfully',
        tablesCreated: ['dishes', 'orders', 'order_dishes'],
        demoDishesAdded: dishCount === 0
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Database initialization error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}