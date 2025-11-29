import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData, Form, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { pool } from "../lib/db";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";

export const meta: MetaFunction = () => [
  { title: "Pago Seguro | Éclectique by KMC" },
  { name: "description", content: "Completa tu pago de forma segura con múltiples opciones." }
];

export async function loader() {
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
          stripeConfig: null,
          configured: false 
        });
      }

      const config = configResult.rows[0];

      return json({
        stripeConfig: {
          publicKey: config.public_key,
          environment: config.environment,
          configured: true
        },
        configured: true
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error loading Stripe config:', error);
    return json({ 
      stripeConfig: null,
      configured: false 
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const action = formData.get("action");
    
    console.log('Action received:', action);
    console.log('Form data entries:', Array.from(formData.entries()));
    
    if (action === "create-intent") {
      const itemsJson = formData.get("items")?.toString();
      const customerInfoJson = formData.get("customerInfo")?.toString();
      const total = parseFloat(formData.get("total")?.toString() || "0");
      const paymentMethod = formData.get("paymentMethod")?.toString();
      
      console.log('Items JSON:', itemsJson);
      console.log('Customer Info JSON:', customerInfoJson);
      console.log('Total:', total);
      console.log('Payment Method:', paymentMethod);
      
      if (!itemsJson || !customerInfoJson || !total || itemsJson === "" || customerInfoJson === "") {
        console.log('Missing required fields:');
        console.log('- itemsJson:', !!itemsJson, itemsJson);
        console.log('- customerInfoJson:', !!customerInfoJson, customerInfoJson);
        console.log('- total:', !!total, total);
        return json({ error: "Faltan campos requeridos. Por favor intenta de nuevo." }, { status: 400 });
      }
      
      let items, customerInfo;
      try {
        items = JSON.parse(itemsJson);
        customerInfo = JSON.parse(customerInfoJson);
      } catch (parseError) {
        console.log('JSON parsing error:', parseError);
        console.log('itemsJson value:', itemsJson);
        console.log('customerInfoJson value:', customerInfoJson);
        return json({ error: "Error procesando datos del formulario. Intenta de nuevo." }, { status: 400 });
      }
      
      // Validate total
      const calculatedTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      if (Math.abs(calculatedTotal - total) > 0.01) {
        console.log('Total mismatch:', calculatedTotal, 'vs', total);
        return json({ error: "Total mismatch" }, { status: 400 });
      }

      // Si el método de pago es Stripe, usar la API de Stripe directamente
      if (paymentMethod === 'stripe') {
        try {
          // Importar Stripe aquí para evitar problemas de SSR
          const Stripe = await import('stripe').then(m => m.default);
          
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
              return json({ error: "Stripe no está configurado" }, { status: 400 });
            }

            const config = configResult.rows[0];
            
            if (!config.secret_key) {
              return json({ error: "Clave secreta de Stripe no configurada" }, { status: 400 });
            }

            // Inicializar Stripe
            const stripe = new Stripe(config.secret_key, {
              apiVersion: '2024-06-20'
            });

            // Generar nuestro ID interno antes de crear el intent en Stripe
            const internalId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Crear Payment Intent en Stripe
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

            // Crear tabla de payment_intents con todas las columnas necesarias
            await client.query(`
              CREATE TABLE IF NOT EXISTS payment_intents (
                id SERIAL PRIMARY KEY,
                intent_id VARCHAR(255) UNIQUE NOT NULL,
                stripe_intent_id VARCHAR(255),
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

            // Agregar columnas que puedan faltar en tablas existentes
            await client.query(`
              DO $$ 
              BEGIN 
                -- Add stripe_intent_id column if missing
                IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payment_intents' AND column_name = 'stripe_intent_id'
                ) THEN
                  ALTER TABLE payment_intents ADD COLUMN stripe_intent_id VARCHAR(255);
                END IF;
                
                -- Add updated_at column if missing
                IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payment_intents' AND column_name = 'updated_at'
                ) THEN
                  ALTER TABLE payment_intents ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                END IF;
                
                -- Add notes column if missing
                IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payment_intents' AND column_name = 'notes'
                ) THEN
                  ALTER TABLE payment_intents ADD COLUMN notes TEXT;
                END IF;
              END $$;
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

            console.log('Stripe Payment Intent created successfully:', paymentIntent.id);

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
          
          if (error.type && error.type.includes('Stripe')) {
            return json({ 
              error: "Error de Stripe: " + error.message,
              details: error.type
            }, { status: 400 });
          }

          return json({ 
            error: "Error creando intento de pago",
            details: error instanceof Error ? error.message : "Unknown error"
          }, { status: 500 });
        }
      }
      
      // Para otros métodos de pago, usar el sistema anterior
      const client = await pool.connect();
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Add payment_method column if it doesn't exist (for existing tables)
        await client.query(`
          DO $$ 
          BEGIN 
            BEGIN
              ALTER TABLE payment_intents ADD COLUMN payment_method VARCHAR(50);
            EXCEPTION
              WHEN duplicate_column THEN NULL;
            END;
          END $$;
        `);

        // Generate a unique payment intent ID
        const intentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Save payment intent
        await client.query(`
          INSERT INTO payment_intents (
            intent_id, amount, currency, customer_email, customer_name, 
            customer_phone, shipping_address, items, status, payment_method
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
          'pending',
          paymentMethod || 'other'
        ]);

        console.log('Payment intent created successfully:', intentId);
        
        return json({
          success: true,
          intentId,
          amount: total,
          currency: 'USD',
          clientSecret: paymentMethod === 'stripe' ? null : `${intentId}_secret_mock`
        });
        
      } finally {
        client.release();
      }
    }
    
    if (action === "confirm-payment") {
      const intentId = formData.get("intentId")?.toString();
      const paymentMethod = formData.get("paymentMethod")?.toString();
      const transactionId = formData.get("transactionId")?.toString();
      
      console.log('CONFIRM PAYMENT DEBUG:');
      console.log('- intentId:', intentId);
      console.log('- paymentMethod:', paymentMethod);
      console.log('- transactionId:', transactionId);
      console.log('- Form data entries:', Array.from(formData.entries()));
      
      if (!intentId) {
        console.log('ERROR: Missing payment intent ID');
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

        // Agregar columnas que puedan faltar en la tabla orders
        await client.query(`
          DO $$ 
          BEGIN 
            BEGIN
              ALTER TABLE orders ADD COLUMN notes TEXT;
            EXCEPTION
              WHEN duplicate_column THEN NULL;
            END;
            BEGIN
              ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            EXCEPTION
              WHEN duplicate_column THEN NULL;
            END;
          END $$;
        `);

        // Parse shipping address - handle both string and object cases
        let shippingAddress;
        try {
          shippingAddress = typeof intent.shipping_address === 'string' 
            ? JSON.parse(intent.shipping_address)
            : intent.shipping_address;
        } catch (e) {
          console.error('Error parsing shipping address:', e);
          shippingAddress = {};
        }

        // Create order with only essential columns
        console.log('=== CREATING ORDER ===');
        console.log('Intent data:', {
          customer_email: intent.customer_email,
          customer_name: intent.customer_name,
          customer_phone: intent.customer_phone,
          amount: intent.amount,
          currency: intent.currency,
          items: intent.items
        });
        console.log('Shipping address parsed:', shippingAddress);
        console.log('Intent ID to save:', intentId);
        console.log('Raw intent.items:', intent.items);
        console.log('Type of intent.items:', typeof intent.items);
        
        // Ensure items is properly formatted for PostgreSQL JSONB
        let itemsForDB;
        try {
          if (typeof intent.items === 'string') {
            // If it's already a string, try to parse and re-stringify to validate
            itemsForDB = JSON.stringify(JSON.parse(intent.items));
          } else {
            // If it's an object, stringify it
            itemsForDB = JSON.stringify(intent.items);
          }
          console.log('Items for DB (formatted):', itemsForDB);
        } catch (itemsError) {
          console.error('Error formatting items for DB:', itemsError);
          console.log('Using fallback empty array');
          itemsForDB = '[]';
        }
        
        console.log('=====================');
        
        const orderResult = await client.query(`
          INSERT INTO orders (
            email, name, phone, address, city, postal_code, country,
            items, total, currency, status, payment_intent_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          intent.customer_email,
          intent.customer_name,
          intent.customer_phone,
          shippingAddress.address || 'N/A',
          shippingAddress.city || 'N/A',
          shippingAddress.postalCode || 'N/A',
          shippingAddress.country || 'N/A',
          itemsForDB,
          intent.amount,
          intent.currency,
          'paid',
          intentId
        ]);
        
        console.log('Order created successfully with ID:', orderResult.rows[0].id);

        const orderId = orderResult.rows[0].id;

        // Update payment intent status
        await client.query(`
          UPDATE payment_intents 
          SET status = 'completed' 
          WHERE intent_id = $1
        `, [intentId]);

        console.log('=== PREPARING JSON RESPONSE ===');
        console.log('orderId:', orderId);
        console.log('intent.items type:', typeof intent.items);
        console.log('intent.items value:', intent.items);
        
        let itemsForResponse;
        try {
          itemsForResponse = typeof intent.items === 'string' ? JSON.parse(intent.items) : intent.items;
          console.log('itemsForResponse prepared:', itemsForResponse);
        } catch (e) {
          console.error('Error parsing intent.items for response:', e);
          itemsForResponse = [];
        }

        const responseObject = {
          success: true,
          orderId,
          order: {
            email: intent.customer_email,
            name: intent.customer_name,
            phone: intent.customer_phone,
            shippingAddress,
            items: itemsForResponse,
            total: intent.amount,
            currency: intent.currency,
            paymentMethod: paymentMethod || 'stripe',
            transactionId: transactionId || null
          }
        };

        console.log('Final response object:', JSON.stringify(responseObject, null, 2));
        console.log('=== RETURNING JSON RESPONSE ===');

        // Return JSON so the same page can show a cheerful success view with details
        return json(responseObject);
        
      } finally {
        client.release();
      }
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error('Payment action error:', error);
    return json({ error: "Payment processing failed" }, { status: 500 });
  }
}

type CustomerInfo = {
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

export default function PaymentPage() {
  const { state, clearCart } = useCart();
  const { items, total, itemCount } = state;
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const submit = useSubmit();
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: "",
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Estados Unidos"
  });

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'bank_transfer'>('stripe');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<any | null>(null);
  const [stripeConfig, setStripeConfig] = useState<any>(loaderData?.stripeConfig || null);
  const [stripeJs, setStripeJs] = useState<Stripe | null>(null);
  const [stripeElements, setStripeElements] = useState<StripeElements | null>(null);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [intentIdFallback, setIntentIdFallback] = useState('');

  // Set payment method based on Stripe configuration
  useEffect(() => {
    console.log('Loader data:', loaderData);
    if (loaderData?.configured && loaderData?.stripeConfig) {
      setStripeConfig(loaderData.stripeConfig);
      setPaymentMethod('stripe');
    } else {
      // If Stripe is not configured, default to PayPal
      setPaymentMethod('paypal');
    }
  }, [loaderData]);

  // Redirect if cart is empty (but not if we're in success state or just completed purchase)
  useEffect(() => {
    console.log('=== REDIRECT CHECK ===');
    console.log('items.length:', items.length);
    console.log('step:', step);
    console.log('orderId:', orderId);
    console.log('Would redirect?', items.length === 0 && step !== 'success' && !orderId);
    
    if (items.length === 0 && step !== 'success' && !orderId) {
      console.log('REDIRECTING TO CART - cart empty and not in success state');
      window.location.href = '/cart';
    }
  }, [items.length, step, orderId]);

  // Handle action response
  useEffect(() => {
    console.log('=== actionData changed ===');
    console.log('actionData:', actionData);
    
    if (actionData) {
      if (actionData.error) {
        console.log('Action error:', actionData.error);
        setError(actionData.error);
        setProcessing(false);
      } else if (actionData.success && actionData.intentId) {
        console.log('Payment intent created:', actionData.intentId);
        setPaymentIntent(actionData);
        setStep('payment');
        setError(null);
        setProcessing(false);
        try {
          window.localStorage.setItem('checkout_intent_id', actionData.intentId);
          if (actionData.clientSecret) {
            window.localStorage.setItem('checkout_intent_client_secret', actionData.clientSecret);
          }
        } catch {}
      } else if (actionData.success && actionData.orderId) {
        console.log('=== PAYMENT CONFIRMED - SHOWING SUCCESS PAGE ===');
        console.log('orderId:', actionData.orderId);
        console.log('order details:', actionData.order);
        
        // Payment confirmed -> show success within the same page
        setOrderId(String(actionData.orderId));
        setOrderSummary(actionData.order || null);
        setStep('success');
        setProcessing(false);
        console.log('Step set to success, orderId set to:', String(actionData.orderId));
        
        // Clear cart and storage after state is set (use setTimeout to ensure state updates first)
        setTimeout(() => {
          console.log('Clearing cart and localStorage...');
          try {
            clearCart();
            window.localStorage.removeItem('checkout_intent_id');
            window.localStorage.removeItem('checkout_intent_client_secret');
          } catch {}
        }, 500); // Increased timeout to ensure state updates
      }
    }
  }, [actionData]);

  // Initialize Stripe Payment Element when we have clientSecret
  useEffect(() => {
    const setupStripe = async () => {
      try {
        if (
          paymentMethod === 'stripe' &&
          stripeConfig?.configured &&
          stripeConfig?.publicKey &&
          paymentIntent?.clientSecret &&
          !stripeElements
        ) {
          const stripe = await loadStripe(stripeConfig.publicKey);
          if (!stripe) return;
          setStripeJs(stripe);
          const elements = stripe.elements({ clientSecret: paymentIntent.clientSecret });
          setStripeElements(elements);
          const paymentElement = elements.create('payment');
          paymentElement.mount('#payment-element');
          setPaymentElementReady(true);
        }
      } catch (e) {
        console.error('Stripe setup error:', e);
        setError('No se pudo inicializar Stripe. Intenta de nuevo.');
      }
    };
    setupStripe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, stripeConfig, paymentIntent]);

  // Handle return from Stripe (if a redirect happened)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const redirectStatus = params.get('redirect_status');
      if (redirectStatus) {
        const storedId = window.localStorage.getItem('checkout_intent_id') || '';
        const storedClientSecret = window.localStorage.getItem('checkout_intent_client_secret') || '';
        if (storedId) {
          setIntentIdFallback(storedId);
        }
        // If we can retrieve status as succeeded, auto-submit to create order
        (async () => {
          try {
            if (!stripeJs && stripeConfig?.publicKey) {
              const s = await loadStripe(stripeConfig.publicKey);
              if (s) setStripeJs(s);
            }
            const sj = stripeJs;
            if (sj && storedClientSecret) {
              const pi = await sj.retrievePaymentIntent(storedClientSecret);
              const status = pi.paymentIntent?.status;
              if (status === 'succeeded' || status === 'processing' || status === 'requires_capture') {
                // Submit confirmation via Remix to create the order
                const fd = new FormData();
                fd.append('action', 'confirm-payment');
                fd.append('intentId', storedId || intentIdFallback);
                fd.append('paymentMethod', 'stripe');
                if (pi.paymentIntent?.id) fd.append('transactionId', pi.paymentIntent.id);
                submit(fd, { method: 'POST' });
              }
            }
          } catch {}
        })();
      }
    } catch {}
  }, [stripeJs, stripeConfig]);

  // Clear cart when payment is confirmed (will redirect to confirmation page)
  useEffect(() => {
    if (step === 'payment' && !paymentIntent) {
      // If we're on payment step but no intent, go back to info
      setStep('info');
    }
  }, [step, paymentIntent]);

  const handleCustomerInfoSubmit = (e: React.FormEvent) => {
    setError(null);
    
    // Basic validation
    if (!customerInfo.email || !customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.city) {
      e.preventDefault();
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    setProcessing(true);
    // Form submission will continue to Remix action
  };

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    setError(null);
    if (paymentMethod === 'stripe') {
      e.preventDefault();
      const formEl = e.currentTarget as HTMLFormElement | null; // capture before await
      try {
        setProcessing(true);
        if (!stripeJs || !stripeElements) {
          setProcessing(false);
          setError('Stripe no está listo. Actualiza la página e intenta de nuevo.');
          return;
        }
        const result = await stripeJs.confirmPayment({
          elements: stripeElements,
          confirmParams: {
            return_url: `${window.location.origin}/checkout/payment?return=1`
          },
          redirect: 'if_required'
        });
        if (result.error) {
          setProcessing(false);
          setError(result.error.message || 'No se pudo procesar el pago');
          return;
        }
        const status = result.paymentIntent?.status;
        console.log('=== STRIPE PAYMENT RESULT ===');
        console.log('Payment status:', status);
        console.log('Payment intent ID:', result.paymentIntent?.id);
        console.log('Full result object:', result);
        console.log('==============================');
        
        if (status === 'succeeded' || status === 'processing' || status === 'requires_capture') {
          // Submit form to create the order on our server using fetch
          console.log('Stripe payment succeeded, submitting order confirmation...');
          try {
            const formData = new FormData();
            formData.append('action', 'confirm-payment');
            formData.append('intentId', paymentIntent?.intentId || intentIdFallback);
            formData.append('paymentMethod', paymentMethod);
            formData.append('transactionId', result.paymentIntent.id);
            
            console.log('=== SUBMITTING THROUGH REMIX useSubmit ===');
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
              console.log(`  ${key}: ${value}`);
            }
            
            // Use Remix's useSubmit hook for proper form submission
            console.log('Submitting through useSubmit...');
            console.log('Current step before submit:', step);
            console.log('Current orderId before submit:', orderId);
            submit(formData, { method: 'POST' });
            console.log('Submit called successfully');
            
          } catch (submitError: any) {
            setProcessing(false);
            setError('Error enviando confirmación: ' + (submitError?.message || 'Desconocido'));
            console.error('Form submission error:', submitError);
          }
          return;
        }
        setProcessing(false);
        setError('Pago no completado. Intenta nuevamente.');
      } catch (err: any) {
        setProcessing(false);
        setError(err?.message || 'Error procesando el pago');
      }
    } else {
      setProcessing(true);
      // Let the form submit for non-Stripe methods
    }
  };

  if (step === 'success') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Gracias por tu compra! 🎉
            </h1>
            <p className="text-gray-600 mb-6">Tu pago se procesó correctamente.</p>
            
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 mb-6">Recibirás un email de confirmación en breve con los detalles.</p>
              
              {orderId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900">
                    Número de pedido: #{orderId}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Guarda este número para futuras referencias.
                  </p>
                </div>
              )}

              {/* Order details */}
              {orderSummary && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Cliente</p>
                      <p className="font-medium text-gray-900">{orderSummary.name}</p>
                      <p className="text-gray-700">{orderSummary.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Envío</p>
                      <p className="font-medium text-gray-900">{orderSummary?.shippingAddress?.address || '—'}</p>
                      <p className="text-gray-700">
                        {orderSummary?.shippingAddress?.city || '—'} {orderSummary?.shippingAddress?.postalCode || ''}
                      </p>
                      <p className="text-gray-700">{orderSummary?.shippingAddress?.country || '—'}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Resumen de tu compra</h3>
                    <div className="space-y-3">
                      {(orderSummary.items || []).map((it: any, idx: number) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={it.image_url || it.image || '/images/placeholder-product.webp'} alt={it.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{it.title}</p>
                            <p className="text-xs text-gray-600">Cantidad: {it.quantity || 1}</p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ${((it.price || 0) * (it.quantity || 1)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total</span>
                        <span className="font-semibold text-gray-900">${(orderSummary.total || 0).toFixed(2)} {orderSummary.currency || 'USD'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Método de pago</span>
                        <span className="text-gray-900 capitalize">{orderSummary.paymentMethod || 'stripe'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Link
                  to="/affiliates"
                  className="block w-full rounded-xl bg-accent px-6 py-3 text-center font-semibold text-white hover:bg-accent/90 transition-colors"
                >
                  Continuar Comprando
                </Link>
                
                <Link
                  to="/"
                  className="block w-full rounded-xl border border-gray-300 px-6 py-3 text-center font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Inicio</Link>
            <span>›</span>
            <Link to="/cart" className="hover:text-gray-700">Carrito</Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">
              {step === 'info' ? 'Información' : 'Pago'}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'info' ? 'text-accent' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'info' ? 'bg-accent text-white' : 'bg-green-600 text-white'
              }`}>
                {step === 'info' ? '1' : '✓'}
              </div>
              <span className="font-medium">Información</span>
            </div>
            
            <div className={`w-16 h-1 ${step === 'payment' || step === 'success' ? 'bg-accent' : 'bg-gray-300'}`} />
            
            <div className={`flex items-center space-x-2 ${
              step === 'payment' ? 'text-accent' : step === 'success' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment' ? 'bg-accent text-white' : 
                step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step === 'success' ? '✓' : '2'}
              </div>
              <span className="font-medium">Pago</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'info' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Información de Contacto y Envío
                </h2>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <Form method="post" className="space-y-6" onSubmit={(e) => {
                  // Update hidden inputs before submission
                  const form = e.currentTarget;
                  const customerInfoInput = form.querySelector('input[name="customerInfo"]') as HTMLInputElement;
                  const itemsInput = form.querySelector('input[name="items"]') as HTMLInputElement;
                  const totalInput = form.querySelector('input[name="total"]') as HTMLInputElement;
                  const paymentMethodInput = form.querySelector('input[name="paymentMethod"]') as HTMLInputElement;
                  
                  if (customerInfoInput) customerInfoInput.value = JSON.stringify(customerInfo);
                  if (itemsInput) itemsInput.value = JSON.stringify(items);
                  if (totalInput) totalInput.value = total.toString();
                  if (paymentMethodInput) paymentMethodInput.value = paymentMethod;
                  
                  handleCustomerInfoSubmit(e);
                }}>
                  <input type="hidden" name="action" value="create-intent" />
                  <input type="hidden" name="items" value="" />
                  <input type="hidden" name="customerInfo" value="" />
                  <input type="hidden" name="total" value="" />
                  <input type="hidden" name="paymentMethod" value="" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        autoComplete="name"
                        required
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="tel"
                        autoComplete="tel"
                        required
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address-line1"
                        autoComplete="address-line1"
                        required
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        placeholder="Calle, número, apartamento, etc."
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="address-level2"
                        autoComplete="address-level2"
                        required
                        value={customerInfo.city}
                        onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        placeholder="Tu ciudad"
                      />
                    </div>

                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postal-code"
                        autoComplete="postal-code"
                        value={customerInfo.postalCode}
                        onChange={(e) => setCustomerInfo({...customerInfo, postalCode: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        placeholder="12345"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                        País *
                      </label>
                      <select
                        id="country"
                        name="country"
                        autoComplete="country"
                        required
                        value={customerInfo.country}
                        onChange={(e) => setCustomerInfo({...customerInfo, country: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                      >
                        <option value="Estados Unidos">Estados Unidos</option>
                        <option value="México">México</option>
                        <option value="España">España</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Chile">Chile</option>
                        <option value="Perú">Perú</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-accent px-6 py-4 text-center font-semibold text-white hover:bg-accent/90 transition-colors shadow-lg disabled:opacity-50"
                  >
                    {processing ? 'Procesando...' : 'Continuar al Pago'}
                  </button>
                </Form>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Método de Pago
                </h2>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  {/* Stripe Payment */}
                  {stripeConfig?.configured ? (
                    <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      paymentMethod === 'stripe' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                    }`} onClick={() => setPaymentMethod('stripe')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            paymentMethod === 'stripe' ? 'border-accent bg-accent' : 'border-gray-300'
                          }`} />
                          <div>
                            <p className="font-semibold text-gray-900">Tarjeta de Crédito/Débito</p>
                            <p className="text-sm text-gray-600">Visa, Mastercard, American Express</p>
                            {stripeConfig.environment === 'sandbox' && (
                              <p className="text-xs text-orange-600 font-medium">Modo Pruebas</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                          <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-100 opacity-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          <div>
                            <p className="font-semibold text-gray-500">Tarjeta de Crédito/Débito</p>
                            <p className="text-sm text-gray-400">No configurado - Contacta al administrador</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-5 bg-gray-400 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                          <div className="w-8 h-5 bg-gray-400 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PayPal */}
                  <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    paymentMethod === 'paypal' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => setPaymentMethod('paypal')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          paymentMethod === 'paypal' ? 'border-accent bg-accent' : 'border-gray-300'
                        }`} />
                        <div>
                          <p className="font-semibold text-gray-900">PayPal</p>
                          <p className="text-sm text-gray-600">Paga con tu cuenta PayPal</p>
                        </div>
                      </div>
                      <div className="w-16 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">PayPal</div>
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    paymentMethod === 'bank_transfer' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                  }`} onClick={() => setPaymentMethod('bank_transfer')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          paymentMethod === 'bank_transfer' ? 'border-accent bg-accent' : 'border-gray-300'
                        }`} />
                        <div>
                          <p className="font-semibold text-gray-900">Transferencia Bancaria</p>
                          <p className="text-sm text-gray-600">Te enviaremos los datos bancarios</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Payment Form Fields */}
                <div className="mb-8">
                  {paymentMethod === 'stripe' && stripeConfig?.configured && (
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                      <h3 className="font-semibold text-gray-900 mb-4">Pago Seguro</h3>
                      {stripeConfig.environment === 'sandbox' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                          <p className="text-orange-800 text-sm">
                            <strong>Modo Pruebas:</strong> Usa 4242 4242 4242 4242 con cualquier fecha futura y CVC.
                          </p>
                        </div>
                      )}
                      <div id="payment-element" className="bg-white rounded-lg p-4 border border-gray-200" />
                      {!paymentElementReady && (
                        <p className="text-sm text-gray-500">Cargando formulario de pago seguro…</p>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className="bg-blue-50 rounded-xl p-6 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.415c-.36-.2-.778-.370-1.25-.512a12.71 12.71 0 0 0-1.73-.231h-5.464a1.044 1.044 0 0 0-1.027.874l-.872 5.52a.641.641 0 0 0 .633.74h2.19c4.298 0 7.664-1.746 8.647-6.797.03-.149.054-.294.077-.437.23-1.867-.064-3.138-1.012-4.287"/>
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Pagar con PayPal</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Serás redirigido a PayPal para completar tu pago de forma segura.
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-gray-500">
                          Al continuar, aceptas los términos de PayPal y autorizas el pago de ${total.toFixed(2)} USD.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'bank_transfer' && (
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Transferencia Bancaria</h3>
                      <div className="bg-white rounded-lg p-4 border border-green-200 space-y-3">
                        <p className="text-sm text-gray-700">
                          Al seleccionar este método, recibirás por email los siguientes datos bancarios:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Número de cuenta</li>
                          <li>• Código SWIFT/BIC</li>
                          <li>• Nombre del beneficiario</li>
                          <li>• Referencia de pago</li>
                        </ul>
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800">
                            <strong>Importante:</strong> Tu pedido se procesará una vez confirmemos la transferencia (1-3 días hábiles).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="flex-1 rounded-xl border border-gray-300 px-6 py-4 text-center font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ← Volver
                  </button>
                  
                  <Form id="confirm-payment-form" method="post" className="flex-1" onSubmit={handlePayment}>
                    <input type="hidden" name="action" value="confirm-payment" />
                    <input type="hidden" name="intentId" value={paymentIntent?.intentId || intentIdFallback} />
                    <input type="hidden" name="paymentMethod" value={paymentMethod} />
                    <input type="hidden" name="transactionId" value={`tx_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`} />
                    <button
                      type="submit"
                      disabled={processing || (paymentMethod === 'stripe' && stripeConfig?.configured && !paymentElementReady)}
                      className="w-full rounded-xl bg-accent px-6 py-4 text-center font-semibold text-white hover:bg-accent/90 transition-colors shadow-lg disabled:opacity-50"
                    >
                      {processing ? 'Procesando Pago...' : `Pagar $${total.toFixed(2)} USD`}
                    </button>
                  </Form>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Resumen del Pedido
              </h3>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.image_url || '/images/placeholder-product.webp'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Cantidad: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-gray-900">Calculado después</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pago Seguro</p>
                    <p className="text-xs text-gray-600">Tus datos están protegidos con encriptación SSL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
