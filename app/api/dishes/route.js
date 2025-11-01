import { neon } from '@neondatabase/serverless';

export async function GET() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const dishes = await sql`
      SELECT id::text, name, price, description as desc, tags, created_at 
      FROM dishes 
      ORDER BY created_at DESC
    `;
    return new Response(JSON.stringify(dishes), {
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
  const { name, price, desc, tags } = await request.json();
  const sql = neon(process.env.DATABASE_URL);
  try {
    const [dish] = await sql`
      INSERT INTO dishes (name, price, description, tags) 
      VALUES (${name}, ${price}, ${desc}, ${tags}) 
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