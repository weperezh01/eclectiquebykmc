import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { pool } from "../lib/db";

export const meta: MetaFunction = () => [
  { title: "Confirmación de Pedido | Éclectique by KMC" },
  { name: "description", content: "Confirmación de tu pedido exitoso." }
];

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { orderId } = params;
    
    if (!orderId) {
      throw new Response("Order ID is required", { status: 400 });
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
          created_at
        FROM orders 
        WHERE id = $1
      `, [orderId]);

      if (result.rows.length === 0) {
        throw new Response("Order not found", { status: 404 });
      }

      const order = result.rows[0];
      order.items = JSON.parse(order.items);
      
      return json({ order });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error('Error fetching order:', error);
    throw new Response("Failed to fetch order", { status: 500 });
  }
}

export default function OrderConfirmationPage() {
  const { order } = useLoaderData<typeof loader>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Inicio</Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">Confirmación de Pedido</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            ¡Pedido Confirmado!
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gracias por tu compra. Tu pedido ha sido procesado exitosamente y recibirás actualizaciones por email.
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Resumen del Pedido
                </h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </div>
              </div>

              <div className="space-y-4">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-4 p-4 border border-gray-200 rounded-xl">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.image_url || '/images/placeholder-product.webp'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Cantidad: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${item.price} {item.currency} c/u
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Pagado</span>
                  <span>${parseFloat(order.total).toFixed(2)} {order.currency}</span>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Información de Envío
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Destinatario</h4>
                  <p className="text-gray-600">{order.name}</p>
                  <p className="text-gray-600">{order.email}</p>
                  {order.phone && <p className="text-gray-600">{order.phone}</p>}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dirección</h4>
                  <p className="text-gray-600">{order.address}</p>
                  <p className="text-gray-600">
                    {order.city}
                    {order.postal_code && `, ${order.postal_code}`}
                  </p>
                  <p className="text-gray-600">{order.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Detalles del Pedido
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Número de Pedido</p>
                  <p className="text-gray-600">#{order.id}</p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900">Fecha</p>
                  <p className="text-gray-600">{formatDate(order.created_at)}</p>
                </div>
                
                {order.payment_intent_id && (
                  <div>
                    <p className="font-medium text-gray-900">ID de Pago</p>
                    <p className="text-gray-600 font-mono text-xs break-all">{order.payment_intent_id}</p>
                  </div>
                )}
                
                <div>
                  <p className="font-medium text-gray-900">Estado</p>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">¿Necesitas Ayuda?</h4>
                <div className="space-y-3 text-sm">
                  <Link
                    to="/contact"
                    className="block text-accent hover:text-accent/80 transition-colors"
                  >
                    → Contactar Soporte
                  </Link>
                  <a
                    href={`mailto:contact@eclectiquebykmc.com?subject=Consulta sobre pedido #${order.id}`}
                    className="block text-accent hover:text-accent/80 transition-colors"
                  >
                    → Enviar Email
                  </a>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  to="/affiliates"
                  className="block w-full rounded-xl bg-accent px-4 py-3 text-center font-semibold text-white hover:bg-accent/90 transition-colors"
                >
                  Continuar Comprando
                </Link>
                
                <Link
                  to="/"
                  className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}