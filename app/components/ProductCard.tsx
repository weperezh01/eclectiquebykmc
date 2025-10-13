import { Link } from "@remix-run/react";
import type { Product } from "../types/product";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/tienda/${product.slug}`} prefetch="intent">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover"/>
          ) : null}
        </div>
      </Link>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold">{product.title}</h3>
        <p className="mt-1 text-sm text-gray-600">
          {product.condition === "nuevo" ? "Nuevo" : `Usado${product.grade ? ` · Grado ${product.grade}` : ""}`}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold">{product.currency} {product.price.toFixed(2)}</span>
          <Link to={`/tienda/${product.slug}`} className="text-sm text-accent hover:underline" prefetch="intent">
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}

