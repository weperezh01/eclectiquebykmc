import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import Grid from "../components/Grid";
import Card from "../components/Card";

export const meta: MetaFunction = () => ([
  { title: "Tienda | Éclectique by KMC" },
  { name: "description", content: "Compra productos nuevos y usados en excelente estado." },
]);

type Producto = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  enlace_url?: string | null;
  imagen_url?: string | null;
  precio?: number | null;
  moneda?: string | null;
};

export default function ShopIndex() {
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/products?activo=true&marketplace=Propio');
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setItems(data);
      } catch (e: any) {
        setError(e?.message || 'Error cargando productos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Tienda</h1>
      <p className="mt-2 text-gray-600">Productos propios disponibles.</p>

      <section className="mt-8">
        {loading ? (
          <p className="text-sm text-gray-600">Cargando...</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">No hay productos disponibles por ahora.</p>
        ) : (
          <Grid>
            {items.map((p) => (
              <Card
                key={p.id}
                title={p.titulo}
                image={p.imagen_url || "/images/featured/organizer.webp"}
                href={p.enlace_url || '#'}
                note={p.precio ? `${p.precio} ${p.moneda || ''}` : p.descripcion || undefined}
                label={p.enlace_url ? 'Ver' : 'Detalles'}
              />
            ))}
          </Grid>
        )}
      </section>
    </main>
  );
}
