import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import Grid from "../components/Grid";
import Card from "../components/Card";
import { FaPercent, FaTags, FaFire, FaGift } from "react-icons/fa6";

export const meta: MetaFunction = () => ([
  { title: "Shop Deals | Éclectique by KMC" },
  { name: "description", content: "Discover exclusive deals and promotional products curated for special offers." },
]);

// Deal categories with React Icons
const dealCategories = [
  {
    name: "Flash Sales",
    icon: FaFire,
    blurb: "Limited time offers",
    bgColor: "bg-red-50",
    hoverBg: "hover:bg-red-100",
    borderColor: "border-red-200",
    hoverBorder: "hover:border-red-300",
    iconColor: "text-red-600"
  },
  {
    name: "Daily Deals",
    icon: FaPercent,
    blurb: "Special discounts today",
    bgColor: "bg-green-50",
    hoverBg: "hover:bg-green-100",
    borderColor: "border-green-200",
    hoverBorder: "hover:border-green-300",
    iconColor: "text-green-600"
  },
  {
    name: "Bundle Offers",
    icon: FaTags,
    blurb: "More for less",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
    borderColor: "border-blue-200",
    hoverBorder: "hover:border-blue-300",
    iconColor: "text-blue-600"
  },
  {
    name: "Gift Sets",
    icon: FaGift,
    blurb: "Perfect for gifting",
    bgColor: "bg-purple-50",
    hoverBg: "hover:bg-purple-100",
    borderColor: "border-purple-200",
    hoverBorder: "hover:border-purple-300",
    iconColor: "text-purple-600"
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
  categorias: string[];
};

export default function ShopDealsIndex() {
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
    marketplace: "Flash Sales",
    precio: "",
    moneda: "USD",
    destacado: false,
    categorias: ["Shop Deals"] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products?activo=true&category=Shop%20Deals');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setItems(data as Producto[]);
    } catch (e: any) {
      setError(e?.message || 'Error loading deals');
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
        categorias: form.categorias,
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
      setSavedMsg('Deal added');
      setForm({ 
        titulo: "", 
        descripcion: "", 
        enlace_url: "", 
        imagen_url: "", 
        marketplace: "Flash Sales", 
        precio: "", 
        moneda: "USD", 
        destacado: false,
        categorias: ["Shop Deals"]
      });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Could not save');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2500);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-900 via-orange-900 to-red-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/20 px-4 py-2 text-sm font-medium text-amber-300 mb-6">
            <FaPercent className="h-4 w-4" />
            Exclusive Deals
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Discover Amazing
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">
              Shop Deals
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-200 leading-relaxed mb-8">
            Explore our carefully curated selection of promotional products and exclusive deals. 
            Limited-time offers on premium fashion and lifestyle pieces.
          </p>
          
          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <a
              href="/shop-deals/guides"
              className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 hover:border-white/30"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View Deal Guides
            </a>
            <div className="text-sm text-gray-300 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              💡 Pro tip: Check guides for bundle savings
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Deal Categories Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Deal Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse our curated deals by category
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dealCategories.map((category) => (
              <div
                key={category.name}
                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`flex-shrink-0 p-3 rounded-xl ${category.bgColor} ${category.hoverBg} border ${category.borderColor} ${category.hoverBorder} transition-all duration-300`}>
                      <category.icon 
                        size={48} 
                        className={`${category.iconColor} transition-transform duration-300 group-hover:scale-110`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-300">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1 font-medium">
                        {category.blurb}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 rounded-full p-2 bg-gray-100 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <FaTags className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Admin Section */}
        {isAdmin && (
          <section className="mb-16 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-white via-amber-50/5 to-white p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Deal</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Title</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200" 
                  value={form.titulo} 
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Enter deal title..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Category</label>
                <select 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200" 
                  value={form.marketplace} 
                  onChange={(e) => setForm({ ...form, marketplace: e.target.value })}
                >
                  <option>Flash Sales</option>
                  <option>Daily Deals</option>
                  <option>Bundle Offers</option>
                  <option>Gift Sets</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200" 
                  value={form.descripcion} 
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Add a brief description of the deal..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Link</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200" 
                  value={form.enlace_url} 
                  onChange={(e) => setForm({ ...form, enlace_url: e.target.value })} 
                  placeholder="https://marketplace.com/deal..." 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Deal Image</label>
                
                {/* Upload File Option */}
                <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50/50">
                  <h6 className="text-sm font-medium mb-2 text-gray-700">Upload from Device</h6>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        console.log('Shop deals file selected:', file.name, file.size, file.type);
                        setError(null);
                        
                        // Show loading state
                        setError('Uploading...');
                        
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        try {
                          console.log('Making upload request...');
                          const response = await fetch('/admin/upload', {
                            method: 'POST',
                            body: formData
                          });
                          
                          console.log('Response status:', response.status);
                          
                          if (!response.ok) {
                            const errorText = await response.text();
                            console.log('Error response:', errorText);
                            throw new Error(`Server error: ${response.status}`);
                          }
                          
                          const result = await response.json();
                          console.log('Upload result:', result);
                          console.log('Setting shop deals image to:', result.url);
                          setForm({ ...form, imagen_url: result.url });
                          setError('Upload successful!');
                          setTimeout(() => setError(null), 2000);
                        } catch (error: any) {
                          console.error('Upload error:', error);
                          setError(`Upload failed: ${error.message}`);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600 transition-all duration-200"
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">Max 10MB (JPEG, PNG, WebP)</span>
                  </div>
                </div>

                {/* URL Option */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <h6 className="text-sm font-medium mb-2 text-gray-700">Or Enter Image URL</h6>
                  <input 
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200" 
                    type="url"
                    value={form.imagen_url} 
                    onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} 
                    placeholder="https://example.com/deal-image.jpg or /images/uploads/deal.jpg" 
                  />
                </div>

                {/* Preview */}
                {form.imagen_url && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Preview: {form.imagen_url}</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={form.imagen_url} 
                        alt="Deal preview" 
                        className="w-16 h-16 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{form.imagen_url}</p>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, imagen_url: '' })}
                          className="text-xs text-red-600 hover:text-red-800 mt-1 font-medium transition-colors duration-200"
                        >
                          Remove image
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sale Price</label>
                  <input 
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200" 
                    value={form.precio} 
                    onChange={(e) => setForm({ ...form, precio: e.target.value })} 
                    placeholder="19.99" 
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                  <input 
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200" 
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
                    className="w-5 h-5 text-amber-500 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
                  />
                  <span>Mark as Featured Deal</span>
                </label>
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-4">
              <button 
                onClick={submit} 
                disabled={saving || !form.titulo.trim()} 
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-white font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Deal...
                  </>
                ) : (
                  <>
                    <FaPercent className="h-4 w-4" />
                    Add Deal
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

        {/* Deal Listings Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Current Deals
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't miss these limited-time offers and exclusive deals
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading latest deals...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 rounded-2xl bg-red-50 border border-red-200">
              <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-700 font-medium text-lg">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full flex items-center justify-center mb-6">
                <FaPercent className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Deals Available</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We're working on new exciting deals for you. Check back soon for amazing offers!
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent pointer-events-none"></div>
              <Grid>
                {items.map((p) => (
                  <div key={p.id} className="group relative">
                    <Card
                      title={p.titulo}
                      image={p.imagen_url || "/images/aff/organizer.webp"}
                      href={p.enlace_url || '#'}
                      note={p.precio ? `🔥 ${p.precio} ${p.moneda || ''} - Deal!` : p.descripcion || undefined}
                      label={`Get Deal`}
                    />
                    {/* Special deal badge */}
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg transform rotate-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      HOT DEAL
                    </div>
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
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