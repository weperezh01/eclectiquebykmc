import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useActionData, Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { pool } from "../lib/db";

export const meta: MetaFunction = () => [
  { title: "Checkout | Éclectique by KMC" },
  { name: "description", content: "Completa tu compra de forma segura." }
];

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const name = formData.get("name")?.toString();
    const phone = formData.get("phone")?.toString();
    const address = formData.get("address")?.toString();
    const city = formData.get("city")?.toString();
    const postalCode = formData.get("postalCode")?.toString();
    const country = formData.get("country")?.toString();
    const cartItems = formData.get("cartItems")?.toString();
    const total = formData.get("total")?.toString();

    if (!email || !name || !phone || !address || !city || !cartItems || !total) {
      return json({ error: "Todos los campos marcados con * son requeridos" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: "Email inválido" }, { status: 400 });
    }

    let parsedItems;
    try {
      parsedItems = JSON.parse(cartItems);
    } catch {
      return json({ error: "Error en los datos del carrito" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Create orders table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          address TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          postal_code VARCHAR(20),
          country VARCHAR(100),
          items JSONB NOT NULL,
          total NUMERIC(12,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(20) DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Save order
      const result = await client.query(`
        INSERT INTO orders (email, name, phone, address, city, postal_code, country, items, total, currency, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        email,
        name,
        phone,
        address,
        city,
        postalCode,
        country,
        JSON.stringify(parsedItems),
        parseFloat(total),
        'USD',
        'Pedido realizado desde la web. Pendiente de procesamiento.'
      ]);

      const orderId = result.rows[0].id;

      return json({
        success: true,
        orderId,
        message: "¡Pedido realizado exitosamente! Te contactaremos pronto para coordinar el pago y envío."
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error processing order:', error);
    return json({ error: "Error al procesar el pedido. Inténtalo de nuevo." }, { status: 500 });
  }
}

export default function Checkout() {
  const { state, clearCart } = useCart();
  const { items, total, itemCount } = state;
  const actionData = useActionData<typeof action>();
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      window.location.href = '/cart';
    }
  }, [items.length, orderPlaced]);

  // Clear cart when order is successful
  useEffect(() => {
    if (actionData?.success) {
      clearCart();
      setOrderPlaced(true);
    }
  }, [actionData?.success, clearCart]);

  // Show success message
  if (actionData?.success && orderPlaced) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Pedido Realizado Exitosamente!
            </h1>
            
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 mb-4">
                Gracias por tu pedido. Hemos recibido tu solicitud y te contactaremos pronto para coordinar el pago y envío.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900">
                  Número de pedido: #{actionData.orderId}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Guarda este número para futuras referencias.
                </p>
              </div>

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
            <span className="text-gray-900 font-medium">Checkout</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
          Finalizar Compra
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Form method="post" id="checkout-form" className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Información de Contacto y Envío
              </h2>

              {actionData?.error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
                  <p className="text-red-700 font-medium">{actionData.error}</p>
                </div>
              )}

              {/* Hidden fields for cart data */}
              <input type="hidden" name="cartItems" value={JSON.stringify(items)} />
              <input type="hidden" name="total" value={total.toFixed(2)} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
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
                    required
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
                    name="phone"
                    required
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
                    name="address"
                    required
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
                    name="city"
                    required
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
                    name="postalCode"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                    placeholder="12345"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                    País
                  </label>
                  <select
                    id="country"
                    name="country"
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

              <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Información Importante</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Te contactaremos por email para coordinar el método de pago</li>
                  <li>• Los costos de envío se calcularán según tu ubicación</li>
                  <li>• El tiempo de procesamiento es de 1-3 días hábiles</li>
                  <li>• Aceptamos transferencias bancarias, PayPal y otros métodos</li>
                </ul>
              </div>
            </Form>
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

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)} USD</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  * Envío se calculará por separado
                </p>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="w-full rounded-xl bg-accent px-6 py-4 text-center font-semibold text-white hover:bg-accent/90 transition-colors shadow-lg"
              >
                Realizar Pedido
              </button>

              <Link
                to="/cart"
                className="block w-full text-center mt-3 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Volver al carrito
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}