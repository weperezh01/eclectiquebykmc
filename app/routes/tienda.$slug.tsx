import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { products } from "../data/products";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ product });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: "Producto | Éclectique" }];
  const { product } = data;
  return [
    { title: `${product.title} | Éclectique by KMC` },
    { name: "description", content: product.description ?? "Producto" },
  ];
};

export default function ProductDetail() {
  const { product } = useLoaderData<typeof loader>();
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/tienda" className="text-sm text-gray-500 hover:underline">← Volver a la tienda</Link>
      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-gray-100">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover"/>
          ) : (
            <div className="aspect-[4/3]" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="mt-2 text-gray-700">{product.description}</p>
          <p className="mt-4 text-sm text-gray-600">
            {product.condition === "nuevo" ? "Nuevo" : `Usado${product.grade ? ` · Grado ${product.grade}` : ""}`} · Stock: {product.stock}
          </p>
          <div className="mt-6 flex items-center gap-4">
            <span className="text-2xl font-extrabold">{product.currency} {product.price.toFixed(2)}</span>
            <button className="rounded-md bg-accent px-6 py-3 font-semibold text-black hover:opacity-90" disabled>
              Añadir al carrito
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500">Carrito y pago estarán disponibles en la siguiente iteración.</p>
        </div>
      </div>
    </main>
  );
}

