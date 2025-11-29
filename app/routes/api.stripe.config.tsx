import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "../lib/db";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const client = await pool.connect();
    try {
      // Obtener la configuración activa de Stripe
      const configResult = await client.query(`
        SELECT public_key, environment, is_active 
        FROM stripe_config 
        WHERE is_active = true 
        ORDER BY id DESC 
        LIMIT 1
      `);

      if (configResult.rows.length === 0) {
        return json({ 
          error: "Stripe not configured",
          configured: false 
        });
      }

      const config = configResult.rows[0];

      return json({
        publicKey: config.public_key,
        environment: config.environment,
        configured: true
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error loading Stripe config:', error);
    return json({ 
      error: "Error loading configuration",
      configured: false 
    }, { status: 500 });
  }
}