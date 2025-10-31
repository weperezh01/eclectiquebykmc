import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import Grid from "../components/Grid";
import Card from "../components/Card";
import { content } from "../content/links";
import { SiEbay } from "react-icons/si";
import { FaBagShopping, FaStore, FaTiktok } from "react-icons/fa6";

export const meta: MetaFunction = () => ([
  { title: "Shops | Éclectique by KMC" },
  { name: "description", content: "Individual listings from Poshmark, Mercari, eBay and TikTok Showcase." },
]);

// Shop platforms with React Icons (matching footer icons)
const shopPlatforms = [
  {
    name: "Poshmark",
    icon: FaStore,
    href: content.shops.find(s => s.name === "Poshmark")?.href || "#",
    blurb: "Curated pre-loved fashion",
    bgColor: "bg-rose-50",
    hoverBg: "hover:bg-rose-100",
    borderColor: "border-rose-200",
    hoverBorder: "hover:border-rose-300",
    iconColor: "text-rose-600"
  },
  {
    name: "Mercari",
    icon: FaBagShopping,
    href: content.shops.find(s => s.name === "Mercari")?.href || "#",
    blurb: "Unique finds and deals",
    bgColor: "bg-red-50",
    hoverBg: "hover:bg-red-100",
    borderColor: "border-red-200",
    hoverBorder: "hover:border-red-300",
    iconColor: "text-red-600"
  },
  {
    name: "eBay",
    icon: SiEbay,
    href: content.shops.find(s => s.name === "eBay")?.href || "#",
    blurb: "Collectibles and vintage",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
    borderColor: "border-blue-200",
    hoverBorder: "hover:border-blue-300",
    iconColor: "text-blue-700"
  },
  {
    name: "TikTok Showcase",
    icon: FaTiktok,
    href: content.shops.find(s => s.name === "TikTok Showcase")?.href || "#",
    blurb: "Quick showcases and reviews",
    bgColor: "bg-gray-50",
    hoverBg: "hover:bg-gray-100",
    borderColor: "border-gray-200",
    hoverBorder: "hover:border-gray-300",
    iconColor: "text-gray-700"
  },
];

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
      setError(e?.message || 'Error loading products');
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
      setSavedMsg('Product added');
      setForm({ titulo: "", descripcion: "", enlace_url: "", imagen_url: "", marketplace: "Poshmark", precio: "", moneda: "USD", destacado: false });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not save');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2500);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-medium text-accent mb-6">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Curated Marketplace
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Discover Our
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-400 to-accent">
              Exclusive Shops
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-300 leading-relaxed">
            Explore individual listings from our carefully curated selection across premium marketplaces. 
            Each piece chosen for its unique style and exceptional quality.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Platform Cards Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse our presence across leading fashion marketplaces
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shopPlatforms.map((shop) => (
              <a
                key={shop.name}
                href={shop.href}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`flex-shrink-0 p-3 rounded-xl ${shop.bgColor} ${shop.hoverBg} border ${shop.borderColor} ${shop.hoverBorder} transition-all duration-300`}>
                      <shop.icon 
                        size={48} 
                        className={`${shop.iconColor} transition-transform duration-300 group-hover:scale-110`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-accent transition-colors duration-300">
                        {shop.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1 font-medium">
                        {shop.blurb}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 rounded-full p-2 bg-gray-100 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Admin Section */}
        {isAdmin && (
          <section className="mb-16 rounded-2xl border border-accent/20 bg-gradient-to-br from-white via-accent/5 to-white p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-accent/10 p-2">
                <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Listing</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Title</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={form.titulo} 
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Enter product title..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marketplace</label>
                <select 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={form.marketplace} 
                  onChange={(e) => setForm({ ...form, marketplace: e.target.value })}
                >
                  <option>Poshmark</option>
                  <option>Mercari</option>
                  <option>eBay</option>
                  <option>TikTok Showcase</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={form.descripcion} 
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Add a brief description..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Link</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={form.enlace_url} 
                  onChange={(e) => setForm({ ...form, enlace_url: e.target.value })} 
                  placeholder="https://marketplace.com/product..." 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={form.imagen_url} 
                  onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} 
                  placeholder="https://example.com/image.jpg" 
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                  <input 
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                    value={form.precio} 
                    onChange={(e) => setForm({ ...form, precio: e.target.value })} 
                    placeholder="29.99" 
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                  <input 
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                    value={form.moneda} 
                    onChange={(e) => setForm({ ...form, moneda: e.target.value })} 
                    placeholder="USD" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.destacado} 
                    onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                    className="w-5 h-5 text-accent border-gray-300 rounded focus:ring-accent focus:ring-2"
                  />
                  <span>Mark as Featured</span>
                </label>
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-4">
              <button 
                onClick={submit} 
                disabled={saving || !form.titulo.trim()} 
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-white font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Listing
                  </>
                )}
              </button>
              {savedMsg && (
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {savedMsg}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-red-700 font-medium">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Product Listings Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Current Listings
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover unique pieces from our curated collection
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
              <p className="text-gray-600 font-medium">Loading our latest finds...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 rounded-2xl bg-red-50 border border-red-200">
              <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-700 font-medium text-lg">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Listings Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We're currently updating our inventory. Check back soon for our latest curated pieces!
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent pointer-events-none"></div>
              <Grid>
                {items.map((p) => (
                  <div key={p.id} className="group relative">
                    <Card
                      title={p.titulo}
                      image={p.imagen_url || "/images/aff/organizer.webp"}
                      href={p.enlace_url || '#'}
                      note={p.precio ? `${p.precio} ${p.moneda || ''}` : p.descripcion || undefined}
                      label={p.marketplace ? `Shop on ${p.marketplace}` : 'View Product'}
                    />
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                  </div>
                ))}
              </Grid>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
