import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { useState } from "react";
import { pool, getProductImages } from "../lib/db";
import ProductImageGallery from "../components/ProductImageGallery";
import { useCart } from "../context/CartContext";

type ProductImage = {
  id: number;
  image_url: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

type Product = {
  id: number;
  title: string;
  description: string;
  type: string;
  marketplace: string;
  link_url: string;
  image_url: string;
  price: number;
  currency: string;
  featured: boolean;
  active: boolean;
  categorias: string[];
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const product = data?.product as Product;
  if (!product) {
    return [
      { title: "Producto no encontrado | Éclectique by KMC" },
      { name: "description", content: "El producto solicitado no fue encontrado." }
    ];
  }

  return [
    { title: `${product.title} | Éclectique by KMC` },
    { name: "description", content: product.description || `Descubre ${product.title} en nuestra colección exclusiva.` },
    { property: "og:title", content: product.title },
    { property: "og:description", content: product.description || `Descubre ${product.title} en nuestra colección exclusiva.` },
    { property: "og:image", content: product.image_url },
    { property: "og:type", content: "product" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { id } = params;
    
    if (!id) {
      throw new Response("Product ID is required", { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          id,
          titulo as title,
          descripcion as description,
          tipo as type,
          marketplace,
          enlace_url as link_url,
          imagen_url as image_url,
          precio as price,
          moneda as currency,
          destacado as featured,
          activo as active,
          categorias,
          fecha_creacion as created_at,
          fecha_actualizacion as updated_at
        FROM productos 
        WHERE id = $1 AND activo = true
      `, [id]);

      if (result.rows.length === 0) {
        throw new Response("Product not found", { status: 404 });
      }

      const product = result.rows[0];
      
      // Get additional images for this product
      const images = await getProductImages(product.id);
      product.images = images;
      
      return json({ product });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error('Error fetching product:', error);
    throw new Response("Failed to fetch product", { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const message = formData.get("message")?.toString();
    const productId = params.id;

    if (!name || !email || !message) {
      return json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: "Email inválido" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Get product info
      const productResult = await client.query(`
        SELECT titulo FROM productos WHERE id = $1
      `, [productId]);

      const productName = productResult.rows[0]?.titulo || 'Producto';

      // Save inquiry to database (you might want to create a table for this)
      await client.query(`
        CREATE TABLE IF NOT EXISTS product_inquiries (
          id SERIAL PRIMARY KEY,
          product_id INTEGER,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        INSERT INTO product_inquiries (product_id, name, email, message)
        VALUES ($1, $2, $3, $4)
      `, [productId, name, email, `Consulta sobre: ${productName}\n\n${message}`]);

      return json({ success: "¡Mensaje enviado! Nos pondremos en contacto contigo pronto." });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error processing inquiry:', error);
    return json({ error: "Error al enviar el mensaje. Inténtalo de nuevo." }, { status: 500 });
  }
}

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { addItem, openCart } = useCart();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    if (product.type === 'propio' && product.price) {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency || 'USD',
        image_url: product.image_url || '/images/placeholder-product.webp',
        type: product.type,
        description: product.description
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (product.type === 'propio' && product.price) {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency || 'USD',
        image_url: product.image_url || '/images/placeholder-product.webp',
        type: product.type,
        description: product.description
      });
      openCart();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <a href="/" className="hover:text-gray-700">Inicio</a>
            <span>›</span>
            <a href="/affiliates" className="hover:text-gray-700">Productos</a>
            <span>›</span>
            <span className="text-gray-900 font-medium">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images Gallery */}
          <div className="space-y-4">
            <ProductImageGallery 
              images={product.images || []}
              fallbackImage={product.image_url || "/images/placeholder-product.webp"}
              productTitle={product.title}
            />
            
            {product.type === 'propio' && (
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-2 text-sm font-medium text-accent">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Producto Exclusivo
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {product.title}
              </h1>
              
              {product.price && (
                <div className="mt-4">
                  <p className="text-3xl font-bold text-accent">
                    ${product.price} {product.currency}
                  </p>
                </div>
              )}

              {product.description && (
                <div className="mt-6">
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {product.categorias && product.categorias.length > 0 && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    {product.categorias.map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 border border-gray-200"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Buttons for Own Products */}
            {product.type === 'propio' && product.price && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Comprar Producto
                </h3>
                
                <div className="space-y-4">
                  {/* Price Display */}
                  <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-3xl font-bold text-accent">
                      ${product.price} {product.currency || 'USD'}
                    </p>
                    {product.description && (
                      <p className="text-gray-600 mt-2 max-w-md mx-auto">
                        {product.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleAddToCart}
                      className="w-full inline-flex items-center justify-center gap-3 rounded-xl border-2 border-accent px-6 py-4 text-accent font-semibold hover:bg-accent hover:text-white transition-all duration-200 group"
                    >
                      <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {addedToCart ? '¡Agregado!' : 'Agregar al Carrito'}
                    </button>
                    
                    <button
                      onClick={handleBuyNow}
                      className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-accent px-6 py-4 text-white font-semibold hover:bg-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl group"
                    >
                      <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Comprar Ahora
                    </button>
                  </div>
                  
                  {/* Success message */}
                  {addedToCart && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Producto agregado al carrito
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                ¿Te interesa este producto?
              </h3>
              
              {actionData?.success ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-green-700 font-medium">{actionData.success}</p>
                  </div>
                </div>
              ) : (
                <Form method="post" className="space-y-6">
                  {actionData?.error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                      <p className="text-red-700 font-medium">{actionData.error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      Mensaje
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
                      placeholder="Cuéntanos qué te interesa de este producto, preguntas sobre disponibilidad, precios, etc."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-accent px-6 py-4 font-semibold text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all duration-200 shadow-sm"
                  >
                    Enviar Consulta
                  </button>
                </Form>
              )}
            </div>

            {/* Back to products */}
            <div className="text-center">
              <a
                href="/affiliates"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a productos
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}