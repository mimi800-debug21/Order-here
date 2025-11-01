import { neon } from '@neondatabase/serverless';

// Update order status
export async function PUT(request, { params }) {
  const { id } = params;
  const { status } = await request.json();
  const sql = neon(process.env.DATABASE_URL);
  try {
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete order
export async function DELETE(request, { params }) {
  const { id } = params;
  const sql = neon(process.env.DATABASE_URL);
  try {
    await sql`DELETE FROM orders WHERE id = ${id}`;
    return new Response(JSON.stringify({ message: 'Order deleted successfully' }), {
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