import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import Grid from "../components/Grid";
import Card from "../components/Card";
import { content } from "../content/links";

export const meta: MetaFunction = () => ([
  { title: "Our Shops | Éclectique by KMC" },
  { name: "description", content: "Explore our curated shops across multiple platforms - Poshmark, Mercari, eBay and more." },
]);

type Producto = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tipo: 'afiliado' | 'propio';
  marketplace?: string | null;
  enlace_url?: string | null;
  imagen_url?: string | null;
  precio?: number | null;
  moneda?: string | null;
};

export default function TiendasIndex() {
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin form
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    enlace_url: "",
    imagen_url: "",
    marketplace: "Poshmark",
    precio: "",
    moneda: "USD",
    destacado: false,
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products?activo=true');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const allow = new Set(['Poshmark','Mercari','eBay','TikTok Showcase']);
      const filtered = (data as any[]).filter(p => (p.tipo === 'afiliado') && (p.marketplace && allow.has(String(p.marketplace))));
      setItems(filtered);
    } catch (e: any) {
      setError(e?.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // check admin
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (r) => {
        if (r.ok) {
          const me = await r.json();
          setIsAdmin(me?.rol === 'admin');
        }
      })
      .catch(() => {});
    load();
  }, []);

  const submit = async () => {
    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      const payload: any = {
        titulo: form.titulo,
        descripcion: form.descripcion || undefined,
        tipo: 'afiliado',
        marketplace: form.marketplace,
        enlace_url: form.enlace_url || undefined,
        imagen_url: form.imagen_url || undefined,
        precio: form.precio ? Number(form.precio) : undefined,
        moneda: form.moneda || undefined,
        destacado: !!form.destacado,
      };
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.message || msg; } catch {}
        throw new Error(msg || `Error ${res.status}`);
      }
      setSavedMsg('Producto agregado');
      setForm({ titulo: "", descripcion: "", enlace_url: "", imagen_url: "", marketplace: "Poshmark", precio: "", moneda: "USD", destacado: false });
      await load();
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2500);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Tiendas</h1>
      <p className="mt-2 text-gray-600">Publicaciones individuales de Poshmark, Mercari, eBay y TikTok Showcase.</p>

      {/* Enlaces superiores a plataformas */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {content.shops.map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <img src={s.logo} alt={`${s.name} logo`} className="h-10 w-10 rounded object-contain ring-1 ring-black/5" />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold group-hover:text-accent">{s.name}</div>
              <div className="truncate text-xs text-gray-600">{s.blurb}</div>
            </div>
            <svg className="ml-auto text-gray-400 group-hover:text-accent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        ))}
      </section>

      {isAdmin ? (
        <section className="mt-6 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Agregar publicación</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Título</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Marketplace</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.marketplace} onChange={(e) => setForm({ ...form, marketplace: e.target.value })}>
                <option>Poshmark</option>
                <option>Mercari</option>
                <option>eBay</option>
                <option>TikTok Showcase</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Descripción</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Enlace</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.enlace_url} onChange={(e) => setForm({ ...form, enlace_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Imagen (URL)</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.imagen_url} onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} placeholder="https://.../imagen.jpg" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">Precio</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="w-32">
                <label className="block text-sm text-gray-700 mb-1">Moneda</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} placeholder="USD" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} />
              Destacado
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={submit} disabled={saving || !form.titulo.trim()} className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Agregar'}</button>
            {savedMsg ? <span className="text-sm text-green-700">{savedMsg}</span> : null}
            {error ? <span className="text-sm text-red-700">{error}</span> : null}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        {loading ? (
          <p className="text-sm text-gray-600">Cargando...</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">No hay productos publicados por ahora.</p>
        ) : (
          <Grid>
            {items.map((p) => (
              <Card
                key={p.id}
                title={p.titulo}
                image={p.imagen_url || "/images/aff/organizer.webp"}
                href={p.enlace_url || '#'}
                note={p.precio ? `${p.precio} ${p.moneda || ''}` : p.descripcion || undefined}
                label={p.marketplace ? `Ver en ${p.marketplace}` : 'Ver'}
              />
            ))}
          </Grid>
        )}
      </section>
    </main>
  );
}
