import { neon } from '@neondatabase/serverless';

export async function GET() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    // First get the orders
    const orders = await sql`
      SELECT id::text, customer_name, destination, status, created_at 
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '48 hours'
      ORDER BY created_at DESC
    `;
    
    // Then get the dishes for each order
    if (orders.length > 0) {
      const orderIds = orders.map(order => `'${order.id}'`).join(',');
      if (orderIds) { // Only run the query if there are orders
        const orderDishes = await sql`
          SELECT od.order_id, d.id::text, d.name, od.price 
          FROM order_dishes od
          JOIN dishes d ON od.dish_id = d.id
          WHERE od.order_id = ANY(ARRAY[${sql.placeholder('orderIds')}])
        `.values({ orderIds: orderIds.split(',') });
        
        // Group dishes by order
        const dishesByOrder = {};
        orderDishes.forEach(od => {
          if (!dishesByOrder[od.order_id]) {
            dishesByOrder[od.order_id] = [];
          }
          dishesByOrder[od.order_id].push({
            id: od.id,
            name: od.name,
            price: parseFloat(od.price)
          });
        });
        
        // Add dishes to each order
        orders.forEach(order => {
          order.dishes = dishesByOrder[order.id] || [];
        });
      }
    }
    
    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  const { customerName, destination, dishes } = await request.json();
  const sql = neon(process.env.DATABASE_URL);
  try {
    // Insert the order
    const [newOrder] = await sql`
      INSERT INTO orders (customer_name, destination, status) 
      VALUES (${customerName}, ${destination}, 'open') 
      RETURNING id::text, customer_name, destination, status, created_at
    `;
    
    // Insert order dishes
    if (dishes && dishes.length > 0) {
      for (const dish of dishes) {
        await sql`
          INSERT INTO order_dishes (order_id, dish_id, price) 
          VALUES (${newOrder.id}, ${dish.id}, ${dish.price})
        `;
      }
    }
    
    // Return the complete order with dishes
    return new Response(JSON.stringify({
      ...newOrder,
      dishes: dishes || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}