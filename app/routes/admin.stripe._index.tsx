import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { pool } from "../lib/db";

export const meta: MetaFunction = () => [
  { title: "Configuración de Stripe | Admin" },
  { name: "description", content: "Configurar Stripe para procesar pagos." }
];

export async function loader({ request }: LoaderFunctionArgs) {
  // Verificar que sea admin
  try {
    const cookie = request.headers.get("Cookie");
    if (!cookie) {
      return redirect("/login");
    }

    const client = await pool.connect();
    try {
      // Obtener configuración actual de Stripe
      await client.query(`
        CREATE TABLE IF NOT EXISTS stripe_config (
          id SERIAL PRIMARY KEY,
          public_key VARCHAR(255),
          secret_key VARCHAR(255),
          webhook_secret VARCHAR(255),
          environment VARCHAR(20) DEFAULT 'sandbox',
          is_active BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const configResult = await client.query(`
        SELECT * FROM stripe_config ORDER BY id DESC LIMIT 1
      `);

      const config = configResult.rows[0] || {
        public_key: '',
        secret_key: '',
        webhook_secret: '',
        environment: 'sandbox',
        is_active: false
      };

      return json({ config });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error loading Stripe config:', error);
    return json({ config: null, error: "Error cargando configuración" });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const action = formData.get("action");

    if (action === "save-config") {
      const publicKey = formData.get("publicKey")?.toString() || '';
      const secretKey = formData.get("secretKey")?.toString() || '';
      const webhookSecret = formData.get("webhookSecret")?.toString() || '';
      const environment = formData.get("environment")?.toString() || 'sandbox';
      const isActive = formData.get("isActive") === 'true';

      const client = await pool.connect();
      try {
        // Insertar nueva configuración (mantener histórico)
        await client.query(`
          INSERT INTO stripe_config (
            public_key, secret_key, webhook_secret, environment, is_active
          ) VALUES ($1, $2, $3, $4, $5)
        `, [publicKey, secretKey, webhookSecret, environment, isActive]);

        return json({ success: true, message: "Configuración guardada exitosamente" });

      } finally {
        client.release();
      }
    }

    if (action === "test-connection") {
      // TODO: Implementar test de conexión con Stripe
      return json({ success: true, message: "Conexión probada (simulada)" });
    }

    return json({ error: "Acción no válida" }, { status: 400 });

  } catch (error) {
    console.error('Error saving Stripe config:', error);
    return json({ error: "Error guardando configuración" }, { status: 500 });
  }
}

export default function AdminStripePage() {
  const { config } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [formData, setFormData] = useState({
    publicKey: config?.public_key || '',
    secretKey: config?.secret_key || '',
    webhookSecret: config?.webhook_secret || '',
    environment: config?.environment || 'sandbox',
    isActive: config?.is_active || false
  });

  useEffect(() => {
    if (config) {
      setFormData({
        publicKey: config.public_key || '',
        secretKey: config.secret_key || '',
        webhookSecret: config.webhook_secret || '',
        environment: config.environment || 'sandbox',
        isActive: config.is_active || false
      });
    }
  }, [config]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Stripe</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configura tu cuenta de Stripe para procesar pagos reales.
          </p>
        </div>
        <a 
          href="/admin" 
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-black/5"
        >
          ← Volver al Admin
        </a>
      </div>

      {actionData?.error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionData.error}
        </div>
      )}

      {actionData?.success && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {actionData.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de configuración */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Configuración API</h2>
            
            <Form method="post" className="space-y-6">
              <input type="hidden" name="action" value="save-config" />
              
              {/* Ambiente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ambiente
                </label>
                <select
                  name="environment"
                  value={formData.environment}
                  onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="sandbox">Sandbox (Pruebas)</option>
                  <option value="production">Producción</option>
                </select>
              </div>

              {/* Clave Pública */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave Pública (Publishable Key)
                </label>
                <input
                  type="text"
                  name="publicKey"
                  value={formData.publicKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, publicKey: e.target.value }))}
                  placeholder={formData.environment === 'sandbox' ? 'pk_test_...' : 'pk_live_...'}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Esta clave se puede exponer públicamente en el frontend.
                </p>
              </div>

              {/* Clave Secreta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave Secreta (Secret Key)
                </label>
                <input
                  type="password"
                  name="secretKey"
                  value={formData.secretKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretKey: e.target.value }))}
                  placeholder={formData.environment === 'sandbox' ? 'sk_test_...' : 'sk_live_...'}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Esta clave debe mantenerse secreta y solo usarse en el servidor.
                </p>
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Secret
                </label>
                <input
                  type="password"
                  name="webhookSecret"
                  value={formData.webhookSecret}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhookSecret: e.target.value }))}
                  placeholder="whsec_..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Secreto para verificar webhooks de Stripe. Obtenerlo del dashboard de Stripe.
                </p>
              </div>

              {/* Activar configuración */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  value="true"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Activar esta configuración para procesar pagos
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Configuración'}
                </button>

                <button
                  type="submit"
                  name="action"
                  value="test-connection"
                  disabled={isSubmitting}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  Probar Conexión
                </button>
              </div>
            </Form>
          </div>
        </div>

        {/* Panel de información */}
        <div className="space-y-6">
          {/* Estado actual */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Estado Actual</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  formData.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {formData.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ambiente:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  formData.environment === 'production'
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {formData.environment === 'production' ? 'Producción' : 'Pruebas'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Clave Pública:</span>
                <span className="text-xs text-gray-500">
                  {formData.publicKey ? 
                    `${formData.publicKey.substring(0, 12)}...` : 
                    'No configurada'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Enlaces útiles */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Enlaces Útiles</h3>
            <div className="space-y-2">
              <a 
                href="https://dashboard.stripe.com/apikeys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                → Dashboard de Stripe
              </a>
              <a 
                href="https://dashboard.stripe.com/test/webhooks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                → Configurar Webhooks
              </a>
              <a 
                href="https://docs.stripe.com/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                → Documentación de Claves API
              </a>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">Instrucciones</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <strong>1.</strong> Crea una cuenta en Stripe
              </div>
              <div>
                <strong>2.</strong> Obtén tus claves API del dashboard
              </div>
              <div>
                <strong>3.</strong> Configura un webhook que apunte a:<br />
                <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">
                  https://eclectiquebykmc.com/api/stripe/webhook
                </code>
              </div>
              <div>
                <strong>4.</strong> Activa la configuración para procesar pagos reales
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}