// Update order status
export async function PUT(request, { params }) {
  if (!process.env.DATABASE_URL) {
    return new Response(
      JSON.stringify({ error: 'DATABASE_URL not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { initializeDatabase, getDbClient } = await import('../../../../utils/db');
    await initializeDatabase(); // Ensure tables exist
    const { id } = params;
    const { status } = await request.json();
    const sql = getDbClient();
    const [order] = await sql`
      UPDATE orders 
      SET status = ${status} 
      WHERE id = ${id} 
      RETURNING id::text, customer_name, destination, status, created_at
    `;
    
    // Get the dishes for the order
    const orderDishes = await sql`
      SELECT d.id::text, d.name, od.price 
      FROM order_dishes od
      JOIN dishes d ON od.dish_id = d.id
      WHERE od.order_id = ${id}
    `;
    
    const orderWithDishes = {
      ...order,
      dishes: orderDishes.map(od => ({
        id: od.id,
        name: od.name,
        price: parseFloat(od.price)
      }))
    };
    
    return new Response(JSON.stringify(orderWithDishes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('PUT /api/orders/[id] error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete order
export async function DELETE(request, { params }) {
  if (!process.env.DATABASE_URL) {
    return new Response(
      JSON.stringify({ error: 'DATABASE_URL not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { initializeDatabase, getDbClient } = await import('../../../../utils/db');
    await initializeDatabase(); // Ensure tables exist
    const { id } = params;
    const sql = getDbClient();
    await sql`DELETE FROM orders WHERE id = ${id}`;
    return new Response(JSON.stringify({ message: 'Order deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('DELETE /api/orders/[id] error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}