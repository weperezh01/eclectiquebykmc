import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "../lib/db";

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { id } = params;
    
    if (!id) {
      return json({ error: "Order ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          id,
          email,
          name,
          phone,
          address,
          city,
          postal_code,
          country,
          items,
          total,
          currency,
          status,
          payment_intent_id,
          notes,
          created_at,
          updated_at
        FROM orders 
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return json({ error: "Order not found" }, { status: 404 });
      }

      const order = result.rows[0];
      order.items = JSON.parse(order.items);
      
      return json({ order });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return json({ error: "Failed to fetch order" }, { status: 500 });
  }
}