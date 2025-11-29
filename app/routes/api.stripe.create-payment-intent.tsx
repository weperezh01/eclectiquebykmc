import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import Stripe from "stripe";
import { pool } from "../lib/db";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { items, customerInfo, total } = await request.json();

    if (!items || !customerInfo || !total) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validar total
    const calculatedTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return json({ error: "Total mismatch" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Obtener configuración activa de Stripe
      const configResult = await client.query(`
        SELECT secret_key, environment, is_active 
        FROM stripe_config 
        WHERE is_active = true 
        ORDER BY id DESC 
        LIMIT 1
      `);

      if (configResult.rows.length === 0) {
        return json({ error: "Stripe not configured" }, { status: 400 });
      }

      const config = configResult.rows[0];
      
      if (!config.secret_key) {
        return json({ error: "Stripe secret key not configured" }, { status: 400 });
      }

      // Inicializar Stripe
      const stripe = new Stripe(config.secret_key, {
        apiVersion: '2024-06-20'
      });

      // Generar ID interno y crear Payment Intent en Stripe
      const internalId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Stripe usa centavos
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          internal_intent_id: internalId,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone || '',
          items: JSON.stringify(items)
        },
        description: `Pedido de ${items.length} productos - ${customerInfo.name}`
      });

      // Guardar en nuestra base de datos
      await client.query(`
        CREATE TABLE IF NOT EXISTS payment_intents (
          id SERIAL PRIMARY KEY,
          intent_id VARCHAR(255) UNIQUE NOT NULL,
          stripe_intent_id VARCHAR(255) UNIQUE,
          amount NUMERIC(12,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          customer_email VARCHAR(255) NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(20),
          shipping_address JSONB,
          items JSONB NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          payment_method VARCHAR(50),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        INSERT INTO payment_intents (
          intent_id, stripe_intent_id, amount, currency, customer_email, customer_name, 
          customer_phone, shipping_address, items, status, payment_method
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        internalId,
        paymentIntent.id,
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
        'pending',
        'stripe'
      ]);

      console.log('Stripe Payment Intent created:', paymentIntent.id);

      return json({
        success: true,
        intentId: internalId,
        stripeIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: total,
        currency: 'USD'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return json({ 
        error: "Stripe error: " + error.message,
        details: error.type
      }, { status: 400 });
    }

    return json({ 
      error: "Error creating payment intent",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
