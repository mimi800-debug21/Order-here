import { neon } from '@neondatabase/serverless';

// Update dish
export async function PUT(request, { params }) {
  const { id } = params;
  const { name, price, desc, tags } = await request.json();
  const sql = neon(process.env.DATABASE_URL);
  try {
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete dish
export async function DELETE(request, { params }) {
  const { id } = params;
  const sql = neon(process.env.DATABASE_URL);
  try {
    await sql`DELETE FROM dishes WHERE id = ${id}`;
    return new Response(JSON.stringify({ message: 'Dish deleted successfully' }), {
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