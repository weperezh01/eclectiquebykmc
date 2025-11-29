import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "../lib/db";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { intentId, paymentMethod, transactionId } = await request.json();
    
    if (!intentId) {
      return json({ error: "Missing payment intent ID" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Get payment intent
      const intentResult = await client.query(`
        SELECT * FROM payment_intents WHERE intent_id = $1
      `, [intentId]);

      if (intentResult.rows.length === 0) {
        return json({ error: "Payment intent not found" }, { status: 404 });
      }

      const intent = intentResult.rows[0];

      // Create orders table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          address TEXT,
          city VARCHAR(255),
          postal_code VARCHAR(20),
          country VARCHAR(255),
          items JSONB NOT NULL,
          total NUMERIC(12,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(20) DEFAULT 'pending',
          payment_intent_id VARCHAR(255),
          payment_method VARCHAR(50),
          transaction_id VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Parse shipping address - handle both string and JSONB
      let shippingAddress: any = {};
      try {
        shippingAddress = typeof intent.shipping_address === 'string'
          ? JSON.parse(intent.shipping_address)
          : intent.shipping_address || {};
      } catch (e) {
        console.error('Error parsing shipping address:', e);
        shippingAddress = {};
      }

      // Create order
      const orderResult = await client.query(`
        INSERT INTO orders (
          email, name, phone, address, city, postal_code, country,
          items, total, currency, status, payment_intent_id, 
          payment_method, transaction_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `, [
        intent.customer_email,
        intent.customer_name,
        intent.customer_phone,
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.postalCode,
        shippingAddress.country,
        intent.items,
        intent.amount,
        intent.currency,
        'paid',
        intentId,
        paymentMethod || 'stripe',
        transactionId
      ]);

      const orderId = orderResult.rows[0].id;

      // Update payment intent status
      await client.query(`
        UPDATE payment_intents 
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
        WHERE intent_id = $1
      `, [intentId]);

      return json({
        success: true,
        orderId,
        status: 'paid'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    return json({ error: "Error confirming payment" }, { status: 500 });
  }
}
