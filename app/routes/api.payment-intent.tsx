import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "../lib/db";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    console.log('Payment intent request body:', body);
    
    const { items, customerInfo, total } = body;
    
    if (!items || !customerInfo || !total) {
      console.log('Missing fields - items:', !!items, 'customerInfo:', !!customerInfo, 'total:', !!total);
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate total matches cart calculation
    const calculatedTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return json({ error: "Total mismatch" }, { status: 400 });
    }

    console.log('Attempting database connection...');
    const client = await pool.connect();
    console.log('Database connection successful');
    try {
      // Create payment_intents table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS payment_intents (
          id SERIAL PRIMARY KEY,
          intent_id VARCHAR(255) UNIQUE NOT NULL,
          amount NUMERIC(12,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          customer_email VARCHAR(255) NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(20),
          shipping_address JSONB,
          items JSONB NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          payment_method VARCHAR(50),
          stripe_intent_id VARCHAR(255),
          paypal_order_id VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Generate a unique payment intent ID
      const intentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save payment intent
      await client.query(`
        INSERT INTO payment_intents (
          intent_id, amount, currency, customer_email, customer_name, 
          customer_phone, shipping_address, items, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        intentId,
        total,
        'USD',
        customerInfo.email,
        customerInfo.name,
        customerInfo.phone || null,
        JSON.stringify({
          address: customerInfo.address,
          city: customerInfo.city,
          postalCode: customerInfo.postalCode,
          country: customerInfo.country
        }),
        JSON.stringify(items),
        'pending'
      ]);

      console.log('Payment intent created successfully:', intentId);

      return json({
        success: true,
        intentId,
        amount: total,
        currency: 'USD',
        // In a real implementation, you'd create a Stripe PaymentIntent here
        clientSecret: `${intentId}_secret_mock`
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return json({ 
      error: "Error creating payment intent",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}