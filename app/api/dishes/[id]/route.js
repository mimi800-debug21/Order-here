import { getDbClient, initializeDatabase } from '../../../../utils/db';

// Update dish
export async function PUT(request, { params }) {
  try {
    await initializeDatabase(); // Ensure tables exist
    const { id } = params;
    const { name, price, desc, tags } = await request.json();
    const sql = getDbClient();
    const [dish] = await sql`
      UPDATE dishes 
      SET name = ${name}, price = ${price}, description = ${desc}, tags = ${tags} 
      WHERE id = ${id} 
      RETURNING id::text, name, price, description as desc, tags, created_at
    `;
    return new Response(JSON.stringify(dish), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('PUT /api/dishes/[id] error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete dish
export async function DELETE(request, { params }) {
  try {
    await initializeDatabase(); // Ensure tables exist
    const { id } = params;
    const sql = getDbClient();
    await sql`DELETE FROM dishes WHERE id = ${id}`;
    return new Response(JSON.stringify({ message: 'Dish deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('DELETE /api/dishes/[id] error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}