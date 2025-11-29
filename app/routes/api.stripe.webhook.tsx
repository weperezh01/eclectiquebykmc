import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "../lib/db";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const payload = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      console.error("Missing Stripe signature");
      return json({ error: "Missing signature" }, { status: 400 });
    }

    // TODO: Verificar signature del webhook usando Stripe SDK
    // const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

    // Por ahora, parseamos el evento directamente (SOLO PARA DESARROLLO)
    let event;
    try {
      event = JSON.parse(payload);
    } catch (error) {
      console.error("Invalid JSON payload");
      return json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log('Stripe webhook received:', event.type);

    const client = await pool.connect();
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          
          // Buscar por el ID de Stripe en nuestra base de datos
          const intentResult = await client.query(`
            SELECT * FROM payment_intents WHERE stripe_intent_id = $1
          `, [paymentIntent.id]);

          if (intentResult.rows.length === 0) {
            console.error('Payment intent not found:', paymentIntent.id);
            return json({ error: "Payment intent not found" }, { status: 404 });
          }

          const intent = intentResult.rows[0];

          // Asegurar columnas requeridas en orders (migración incremental)
          await client.query(`
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'payment_method'
              ) THEN
                ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
              END IF;
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'transaction_id'
              ) THEN
                ALTER TABLE orders ADD COLUMN transaction_id VARCHAR(255);
              END IF;
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'notes'
              ) THEN
                ALTER TABLE orders ADD COLUMN notes TEXT;
              END IF;
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'updated_at'
              ) THEN
                ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
              END IF;
            END $$;
          `);

          // Crear la orden
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

          // Parse shipping address (handle string or JSONB)
          let shippingAddress: any = {};
          try {
            shippingAddress = typeof intent.shipping_address === 'string'
              ? JSON.parse(intent.shipping_address)
              : intent.shipping_address || {};
          } catch (e) {
            console.error('Error parsing shipping address in webhook:', e);
            shippingAddress = {};
          }

          // Crear orden
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
            intent.intent_id,
            'stripe',
            paymentIntent.id
          ]);

          // Actualizar el payment intent como completado (buscar por stripe_intent_id)
          await client.query(`
            UPDATE payment_intents 
            SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
            WHERE stripe_intent_id = $1
          `, [paymentIntent.id]);

          console.log('Order created successfully:', orderResult.rows[0].id);
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          
          // Marcar payment intent como fallido (buscar por stripe_intent_id)
          await client.query(`
            UPDATE payment_intents 
            SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
            WHERE stripe_intent_id = $1
          `, [failedPayment.id]);

          console.log('Payment failed:', failedPayment.id);
          break;

        case 'customer.created':
          // Opcional: manejar creación de customers
          console.log('Customer created:', event.data.object.id);
          break;

        default:
          console.log('Unhandled event type:', event.type);
      }

      return json({ received: true });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return json({ error: "Webhook error" }, { status: 500 });
  }
}
