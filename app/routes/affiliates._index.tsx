import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import Grid from "../components/Grid";
import Card from "../components/Card";
import Disclosure from "../components/Disclosure";
import ProductImageManager from "../components/ProductImageManager";
import { HOME_COPY, ogImage, content } from "../content/links";
import { SiWalmart } from "react-icons/si";
import MarketplaceIcon from "../components/MarketplaceIcon";

export const meta: MetaFunction = () => ([
  { title: "Affiliates | Éclectique by KMC" },
  {
    name: "description",
    content:
      "Affiliate recommendations and links to products from platforms like Amazon, LTK, Walmart, and others.",
  },
  { property: "og:title", content: "Affiliates — Éclectique by KMC" },
  { property: "og:description", content: HOME_COPY.disclosure },
  { property: "og:image", content: ogImage },
]);

// Affiliate platforms with React Icons (matching footer icons)
const affiliatePlatforms = [
  {
    name: "Amazon",
    icon: MarketplaceIcon,
    iconProps: { marketplace: "Amazon", size: 48 },
    href: content.affiliatesShops.find(s => s.name === "Amazon")?.href || "#",
    blurb: "Amazon Storefront",
    bgColor: "bg-amber-50",
    hoverBg: "hover:bg-amber-100",
    borderColor: "border-amber-200",
    hoverBorder: "hover:border-amber-300",
    iconColor: "text-amber-600"
  },
  {
    name: "Walmart",
    icon: SiWalmart,
    href: content.affiliatesShops.find(s => s.name === "Walmart")?.href || "#",
    blurb: "Walmart Selections",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
    borderColor: "border-blue-200",
    hoverBorder: "hover:border-blue-300",
    iconColor: "text-blue-700"
  },
  {
    name: "LTK",
    icon: MarketplaceIcon,
    iconProps: { marketplace: "LTK", size: 48 },
    href: content.affiliatesShops.find(s => s.name === "LTK")?.href || "#",
    blurb: "LTK Looks",
    bgColor: "bg-gray-50",
    hoverBg: "hover:bg-gray-100",
    borderColor: "border-gray-200",
    hoverBorder: "hover:border-gray-300",
    iconColor: "text-gray-700"
  },
  {
    name: "Shein",
    icon: MarketplaceIcon,
    iconProps: { marketplace: "Shein", size: 48 },
    href: content.affiliatesShops.find(s => s.name === "Shein")?.href || "#",
    blurb: "Shein Selections",
    bgColor: "bg-purple-50",
    hoverBg: "hover:bg-purple-100",
    borderColor: "border-purple-200",
    hoverBorder: "hover:border-purple-300",
    iconColor: "text-purple-700"
  },
  {
    name: "DH Gate",
    icon: MarketplaceIcon,
    iconProps: { marketplace: "DHGate", size: 48 },
    href: content.affiliatesShops.find(s => s.name === "DH Gate")?.href || "#",
    blurb: "DH Gate Selections",
    bgColor: "bg-green-50",
    hoverBg: "hover:bg-green-100",
    borderColor: "border-green-200",
    hoverBorder: "hover:border-green-300",
    iconColor: "text-green-700"
  },
  {
    name: "AliExpress",
    icon: MarketplaceIcon,
    iconProps: { marketplace: "AliExpress", size: 48 },
    href: content.affiliatesShops.find(s => s.name === "AliExpress")?.href || "#",
    blurb: "AliExpress Selections",
    bgColor: "bg-orange-50",
    hoverBg: "hover:bg-orange-100",
    borderColor: "border-orange-200",
    hoverBorder: "hover:border-orange-300",
    iconColor: "text-orange-700"
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
  destacado?: boolean;
};

export default function Affiliates() {
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin form state
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo: "afiliado" as 'afiliado' | 'propio',
    marketplace: "Amazon",
    enlace_url: "",
    imagen_url: "",
    precio: "",
    moneda: "USD",
    destacado: false,
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    titulo: "",
    descripcion: "",
    tipo: "afiliado" as 'afiliado' | 'propio',
    marketplace: "Amazon",
    enlace_url: "",
    imagen_url: "",
    precio: "",
    moneda: "USD",
    destacado: false,
    activo: true,
  });
  const [uploadingImg, setUploadingImg] = useState(false);

  const load = async (adminStatus: boolean = isAdmin) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products?activo=true');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as any[];
      const allow = new Set(['Amazon','Walmart','LTK','Shein','DH Gate','AliExpress']);
      // For admin users, show all products (including 'propio') to allow management
      // For regular users, show only affiliate products from allowed marketplaces
      const filtered = adminStatus 
        ? data.filter(p => (p.tipo === 'afiliado' && p.marketplace && allow.has(String(p.marketplace))) || p.tipo === 'propio')
        : data.filter(p => (p.tipo === 'afiliado') && (p.marketplace && allow.has(String(p.marketplace))));
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
          const isAdminUser = me?.rol === 'admin';
          setIsAdmin(isAdminUser);
          // Load products with correct admin status
          load(isAdminUser);
        } else {
          // Not admin, load as regular user
          load(false);
        }
      })
      .catch(() => {
        // Error checking auth, load as regular user
        load(false);
      });
  }, []);

  const submit = async () => {
    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      const payload: any = {
        titulo: form.titulo,
        descripcion: form.descripcion || undefined,
        tipo: form.tipo,
        marketplace: form.tipo === 'afiliado' ? form.marketplace : 'Propio',
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
      setForm({ titulo: "", descripcion: "", tipo: 'afiliado', marketplace: "Amazon", enlace_url: "", imagen_url: "", precio: "", moneda: "USD", destacado: false });
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Affiliate Partners
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Our Trusted
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-400 to-accent">
              Affiliate Partners
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-300 leading-relaxed mb-8">
            Discover carefully curated products from our favorite brands and platforms. 
            Each recommendation is personally tested and genuinely loved.
          </p>
          <div className="max-w-3xl mx-auto">
            <Disclosure text={HOME_COPY.disclosure} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Affiliate Storefronts Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop Our Storefronts
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Visit our curated collections across premium affiliate platforms
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {affiliatePlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.href}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex flex-col items-center text-center">
                  <div className={`flex-shrink-0 p-4 rounded-xl ${platform.bgColor} ${platform.hoverBg} border ${platform.borderColor} ${platform.hoverBorder} transition-all duration-300 mb-4`}>
                    {platform.iconProps ? (
                      <platform.icon 
                        {...platform.iconProps}
                        className={`${platform.iconColor} transition-transform duration-300 group-hover:scale-110`}
                      />
                    ) : (
                      <platform.icon 
                        size={48} 
                        className={`${platform.iconColor} transition-transform duration-300 group-hover:scale-110`}
                      />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-accent transition-colors duration-300 mb-2">
                    {platform.name}
                  </h3>
                  <p className="text-gray-600 text-sm font-medium mb-4">
                    {platform.blurb}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent group-hover:text-accent/80 transition-colors duration-300">
                    <span>Visit Storefront</span>
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type</label>
                <select 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={form.tipo} 
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
                >
                  <option value="afiliado">Affiliate Product</option>
                  <option value="propio">Own Product</option>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marketplace</label>
                <select 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={form.marketplace} 
                  onChange={(e) => setForm({ ...form, marketplace: e.target.value })} 
                  disabled={form.tipo !== 'afiliado'}
                >
                  <option>Amazon</option>
                  <option>Walmart</option>
                  <option>LTK</option>
                  <option>Shein</option>
                  <option>DH Gate</option>
                  <option>AliExpress</option>
                  <option>Other</option>
                </select>
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
                <label className="block text-sm font-semibold text-gray-700 mb-3">Product Image</label>
                
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
                        
                        console.log('Product file selected:', file.name, file.size, file.type);
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
                          console.log('Setting product image to:', result.url);
                          setForm({ ...form, imagen_url: result.url });
                          setError('Upload successful!');
                          setTimeout(() => setError(null), 2000);
                        } catch (error: any) {
                          console.error('Upload error:', error);
                          setError(`Upload failed: ${error.message}`);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/80 transition-all duration-200"
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">Max 10MB (JPEG, PNG, WebP)</span>
                  </div>
                </div>

                {/* URL Option */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <h6 className="text-sm font-medium mb-2 text-gray-700">Or Enter Image URL</h6>
                  <input 
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                    type="url"
                    value={form.imagen_url} 
                    onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} 
                    placeholder="https://example.com/image.jpg or /images/uploads/image.jpg" 
                  />
                </div>

                {/* Preview */}
                {form.imagen_url && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Preview: {form.imagen_url}</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={form.imagen_url} 
                        alt="Product preview" 
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
                    Add Product
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
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our handpicked selection of affiliate products, personally tested and recommended
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
              <p className="text-gray-600 font-medium">Loading our recommendations...</p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We're currently curating our latest recommendations. Check back soon for amazing affiliate products!
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent pointer-events-none"></div>
              <Grid>
                {items.map((p) => (
                  <div key={p.id} className="group relative">
                    {isAdmin && (
                      <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-gray-700 shadow-lg hover:bg-white border border-gray-200 transition-all duration-200"
                          onClick={() => {
                            setEditId(p.id);
                            setEditForm({
                              titulo: p.titulo || "",
                              descripcion: (p.descripcion as any) || "",
                              tipo: p.tipo,
                              marketplace: (p.marketplace as any) || "Amazon",
                              enlace_url: (p.enlace_url as any) || "",
                              imagen_url: (p.imagen_url as any) || "",
                              precio: p.precio ? String(p.precio) : "",
                              moneda: (p.moneda as any) || "USD",
                              destacado: !!p.destacado,
                              activo: true,
                            });
                          }}
                        >
                          <svg className="h-3 w-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="rounded-lg bg-red-500/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-red-600 transition-all duration-200"
                          onClick={async () => {
                            if (!confirm('Delete this product?')) return;
                            try {
                              const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE', credentials: 'include' });
                              if (!res.ok) throw new Error('Could not delete');
                              await load();
                            } catch (e) {
                              alert('Error deleting');
                            }
                          }}
                        >
                          <svg className="h-3 w-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                    <Card
                      title={p.titulo}
                      image={p.imagen_url || "/images/aff/organizer.webp"}
                      href={p.enlace_url || '#'}
                      note={p.descripcion || undefined}
                      label={p.marketplace ? `Shop on ${p.marketplace}` : 'View Product'}
                      productType={p.tipo}
                      productId={p.id}
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

      {/* Edit modal */}
      {isAdmin && editId !== null ? (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Edit Product</h3>
              </div>
              <button 
                onClick={() => setEditId(null)} 
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Title</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={editForm.titulo} 
                  onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                  placeholder="Enter product title..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type</label>
                <select 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={editForm.tipo} 
                  onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value as any })}
                >
                  <option value="afiliado">Affiliate Product</option>
                  <option value="propio">Own Product</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={editForm.descripcion} 
                  onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                  placeholder="Add a brief description..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marketplace</label>
                <select 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={editForm.marketplace} 
                  onChange={(e) => setEditForm({ ...editForm, marketplace: e.target.value })} 
                  disabled={editForm.tipo !== 'afiliado'}
                >
                  <option>Amazon</option>
                  <option>LTK</option>
                  <option>Walmart</option>
                  <option>TikTok</option>
                  <option>Pinterest</option>
                  <option>Instagram</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Link</label>
                <input 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                  value={editForm.enlace_url} 
                  onChange={(e) => setEditForm({ ...editForm, enlace_url: e.target.value })} 
                  placeholder="https://marketplace.com/product..." 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Product Image</label>
                
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
                        
                        console.log('Edit product file selected:', file.name, file.size, file.type);
                        setUploadingImg(true);
                        
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
                          console.log('Setting edit product image to:', result.url);
                          setEditForm({ ...editForm, imagen_url: result.url });
                        } catch (error: any) {
                          console.error('Upload error:', error);
                          alert(`Upload failed: ${error.message}`);
                        } finally {
                          setUploadingImg(false);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/80 transition-all duration-200"
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">Max 10MB (JPEG, PNG, WebP)</span>
                    {uploadingImg && (
                      <div className="flex items-center gap-2 text-accent font-medium">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>

                {/* URL Option */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <h6 className="text-sm font-medium mb-2 text-gray-700">Or Enter Image URL</h6>
                  <input 
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                    type="url"
                    value={editForm.imagen_url} 
                    onChange={(e) => setEditForm({ ...editForm, imagen_url: e.target.value })} 
                    placeholder="https://example.com/image.jpg or /images/uploads/image.jpg" 
                  />
                </div>

                {/* Preview */}
                {editForm.imagen_url && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Preview: {editForm.imagen_url}</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={editForm.imagen_url} 
                        alt="Product preview" 
                        className="w-16 h-16 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{editForm.imagen_url}</p>
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, imagen_url: '' })}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                  <input 
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                    value={editForm.precio} 
                    onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })} 
                    placeholder="29.99" 
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                  <input 
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                    value={editForm.moneda} 
                    onChange={(e) => setEditForm({ ...editForm, moneda: e.target.value })} 
                    placeholder="USD" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editForm.destacado} 
                    onChange={(e) => setEditForm({ ...editForm, destacado: e.target.checked })}
                    className="w-5 h-5 text-accent border-gray-300 rounded focus:ring-accent focus:ring-2"
                  />
                  <span>Mark as Featured</span>
                </label>
              </div>
            </div>
            
            {/* Image Gallery Section */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <ProductImageManager 
                productId={editId!} 
                onImagesChange={(images) => {
                  // Optional: update local state if needed
                  console.log('Images updated:', images);
                }}
              />
            </div>
            
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={async () => {
                  try {
                    const payload: any = { ...editForm };
                    if (!payload.titulo) throw new Error('Title required');
                    if (!payload.enlace_url) delete payload.enlace_url;
                    if (!payload.imagen_url) delete payload.imagen_url;
                    if (!payload.descripcion) delete payload.descripcion;
                    payload.precio = editForm.precio ? Number(editForm.precio) : undefined;
                    const res = await fetch(`/api/products/${editId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) throw new Error('Could not update');
                    await load();
                    setEditId(null);
                  } catch (e: any) {
                    alert(e?.message || 'Error saving changes');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-white font-semibold hover:bg-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}