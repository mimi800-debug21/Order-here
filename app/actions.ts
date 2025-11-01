"use server";
import { neon } from "@neondatabase/serverless";

export async function initializeTables() {
  const sql = neon(process.env.DATABASE_URL!);
  
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
}

export async function getDishes() {
  const sql = neon(process.env.DATABASE_URL!);
  const dishes = await sql`
    SELECT id::text, name, price, description as desc, tags 
    FROM dishes 
    ORDER BY created_at DESC
  `;
  return dishes;
}

export async function addDish(dish: { name: string; price: number; desc: string; tags: string }) {
  const sql = neon(process.env.DATABASE_URL!);
  const [result] = await sql`
    INSERT INTO dishes (name, price, description, tags) 
    VALUES (${dish.name}, ${dish.price}, ${dish.desc}, ${dish.tags}) 
    RETURNING id::text, name, price, description as desc, tags
  `;
  return result;
}

export async function updateDish(id: string, dish: { name: string; price: number; desc: string; tags: string }) {
  const sql = neon(process.env.DATABASE_URL!);
  const [result] = await sql`
    UPDATE dishes 
    SET name = ${dish.name}, price = ${dish.price}, description = ${dish.desc}, tags = ${dish.tags} 
    WHERE id = ${id} 
    RETURNING id::text, name, price, description as desc, tags
  `;
  return result;
}

export async function deleteDish(id: string) {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM dishes WHERE id = ${id}`;
}

export async function getOrders() {
  const sql = neon(process.env.DATABASE_URL!);
  
  // First get the orders
  const orders = await sql`
    SELECT id::text, customer_name, destination, status, created_at 
    FROM orders 
    WHERE created_at >= NOW() - INTERVAL '48 hours'
    ORDER BY created_at DESC
  `;
  
  // Then get the dishes for each order
  if (orders.length > 0) {
    const orderIds = orders.map((order: any) => order.id);
    const orderDishes = await sql`
      SELECT od.order_id::text, d.id::text, d.name, od.price 
      FROM order_dishes od
      JOIN dishes d ON od.dish_id = d.id
      WHERE od.order_id = ANY(${orderIds}::uuid[])
    `;
    
    // Group dishes by order
    const dishesByOrder: Record<string, any[]> = {};
    orderDishes.forEach((od: any) => {
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
    orders.forEach((order: any) => {
      order.dishes = dishesByOrder[order.id] || [];
    });
  }
  
  return orders;
}

export async function addOrder(order: { customerName: string; destination: string; dishes: {id: string; name: string; price: number}[] }) {
  const sql = neon(process.env.DATABASE_URL!);
  
  // Insert the order
  const [newOrder] = await sql`
    INSERT INTO orders (customer_name, destination, status) 
    VALUES (${order.customerName}, ${order.destination}, 'open') 
    RETURNING id::text, customer_name, destination, status, created_at
  `;
  
  // Insert order dishes
  if (order.dishes && order.dishes.length > 0) {
    for (const dish of order.dishes) {
      await sql`
        INSERT INTO order_dishes (order_id, dish_id, price) 
        VALUES (${newOrder.id}, ${dish.id}, ${dish.price})
      `;
    }
  }
  
  return {
    ...newOrder,
    dishes: order.dishes
  };
}

export async function updateOrderStatus(id: string, status: string) {
  const sql = neon(process.env.DATABASE_URL!);
  const [result] = await sql`
    UPDATE orders 
    SET status = ${status} 
    WHERE id = ${id} 
    RETURNING id::text, customer_name, destination, status, created_at
  `;
  
  // Also get the dishes for the order
  const orderDishes = await sql`
    SELECT d.id::text, d.name, od.price 
    FROM order_dishes od
    JOIN dishes d ON od.dish_id = d.id
    WHERE od.order_id = ${id}
  `;
  
  return {
    ...result,
    dishes: orderDishes.map((od: any) => ({
      id: od.id,
      name: od.name,
      price: parseFloat(od.price)
    }))
  };
}

export async function deleteOrder(id: string) {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM orders WHERE id = ${id}`;
}

export async function clearDoneOrders() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM orders WHERE status = 'done'`;
}

export async function clearAllOrders() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM orders`;
}

export async function clearAllDishes() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM dishes`;
}