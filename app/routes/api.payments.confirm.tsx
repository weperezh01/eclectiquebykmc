import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "../lib/db";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { intentId, paymentMethod, transactionId } = await request.json();
    
    if (!intentId || !paymentMethod) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Update payment intent status
      const result = await client.query(`
        UPDATE payment_intents 
        SET 
          status = 'paid',
          payment_method = $2,
          stripe_intent_id = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE intent_id = $1
        RETURNING id, customer_email, customer_name, amount, items
      `, [intentId, paymentMethod, transactionId || null]);

      if (result.rows.length === 0) {
        return json({ error: "Payment intent not found" }, { status: 404 });
      }

      const paymentData = result.rows[0];

      // Create order from successful payment
      const orderResult = await client.query(`
        INSERT INTO orders (
          email, name, phone, address, city, postal_code, country,
          items, total, currency, status, payment_intent_id, notes
        )
        SELECT 
          customer_email,
          customer_name,
          customer_phone,
          (shipping_address->>'address')::TEXT,
          (shipping_address->>'city')::TEXT,
          (shipping_address->>'postalCode')::TEXT,
          (shipping_address->>'country')::TEXT,
          items,
          amount,
          currency,
          'paid',
          intent_id,
          'Pedido pagado automáticamente via ' || payment_method
        FROM payment_intents 
        WHERE intent_id = $1
        RETURNING id
      `, [intentId]);

      const orderId = orderResult.rows[0].id;

      // Update stock for own products (if you have inventory management)
      const items = JSON.parse(paymentData.items);
      for (const item of items) {
        if (item.type === 'propio') {
          // Here you could update stock levels
          console.log(`Processing stock for product ${item.id}, quantity: ${item.quantity}`);
        }
      }

      return json({
        success: true,
        orderId,
        message: "Payment confirmed successfully",
        redirectUrl: `/order-confirmation/${orderId}`
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    return json({ error: "Error confirming payment" }, { status: 500 });
  }
}