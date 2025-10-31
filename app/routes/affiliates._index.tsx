import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import Grid from "../components/Grid";
import Card from "../components/Card";
import Disclosure from "../components/Disclosure";
import { HOME_COPY, ogImage, content } from "../content/links";

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

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products?activo=true');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as any[];
      const allow = new Set(['Amazon','Walmart','LTK','Shein','DH Gate','AliExpress']);
      const filtered = data.filter(p => (p.tipo === 'afiliado') && (p.marketplace && allow.has(String(p.marketplace))));
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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Affiliates</h1>
      <div className="mt-3">
        <Disclosure text={HOME_COPY.disclosure} />
      </div>

      {/* Links to affiliate storefronts */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.affiliatesShops.map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
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
          <h2 className="text-lg font-semibold">Add product</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Title</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Type</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}>
                <option value="afiliado">Affiliate</option>
                <option value="propio">Own</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Marketplace</label>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.marketplace} onChange={(e) => setForm({ ...form, marketplace: e.target.value })} disabled={form.tipo !== 'afiliado'}>
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
              <label className="block text-sm text-gray-700 mb-1">Link</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.enlace_url} onChange={(e) => setForm({ ...form, enlace_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Image (URL)</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.imagen_url} onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} placeholder="https://.../image.jpg" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1">Price</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="Optional" />
              </div>
              <div className="w-32">
                <label className="block text-sm text-gray-700 mb-1">Currency</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} placeholder="USD" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} />
              Featured
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={submit} disabled={saving || !form.titulo.trim()} className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60">{saving ? 'Saving...' : 'Add'}</button>
            {savedMsg ? <span className="text-sm text-green-700">{savedMsg}</span> : null}
            {error ? <span className="text-sm text-red-700">{error}</span> : null}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        {loading ? (
          <p className="text-sm text-gray-600">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : (
          <Grid>
            {items.map((p) => (
              <div key={p.id} className="relative">
                {isAdmin ? (
                  <div className="absolute right-2 top-2 z-10 flex gap-2">
                    <button
                      className="rounded bg-black/80 px-2 py-1 text-xs text-white hover:bg-black"
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
                      Edit
                    </button>
                    <button
                      className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
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
                      Delete
                    </button>
                  </div>
                ) : null}
                <Card
                  title={p.titulo}
                  image={p.imagen_url || "/images/aff/organizer.webp"}
                  href={p.enlace_url || '#'}
                  note={p.descripcion || undefined}
                  label={p.marketplace ? `View on ${p.marketplace}` : 'View'}
                />
              </div>
            ))}
          </Grid>
        )}
      </section>

      {/* Edit modal */}
      {isAdmin && editId !== null ? (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit product</h3>
              <button onClick={() => setEditId(null)} className="rounded border border-gray-300 px-2 py-1 text-sm">Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Title</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.titulo} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Type</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.tipo} onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value as any })}>
                  <option value="afiliado">Affiliate</option>
                  <option value="propio">Own</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.descripcion} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Marketplace</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.marketplace} onChange={(e) => setEditForm({ ...editForm, marketplace: e.target.value })} disabled={editForm.tipo !== 'afiliado'}>
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
                <label className="block text-sm text-gray-700 mb-1">Link</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.enlace_url} onChange={(e) => setEditForm({ ...editForm, enlace_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Image (URL)</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.imagen_url} onChange={(e) => setEditForm({ ...editForm, imagen_url: e.target.value })} placeholder="https://.../image.jpg" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">Price</label>
                  <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.precio} onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })} placeholder="Optional" />
                </div>
                <div className="w-32">
                  <label className="block text-sm text-gray-700 mb-1">Currency</label>
                  <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.moneda} onChange={(e) => setEditForm({ ...editForm, moneda: e.target.value })} placeholder="USD" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editForm.destacado} onChange={(e) => setEditForm({ ...editForm, destacado: e.target.checked })} />
                Featured
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
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
                className="rounded-md bg-black px-4 py-2 text-white"
              >
                Save changes
              </button>
              <label className="inline-flex items-center gap-2 text-sm">
                <span>Image (file):</span>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingImg(true);
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await fetch(`/api/products/${editId}/image`, { method: 'POST', body: fd, credentials: 'include' });
                    if (!res.ok) throw new Error('Could not upload image');
                    await load();
                  } catch (err: any) {
                    alert(err?.message || 'Error uploading image');
                  } finally {
                    setUploadingImg(false);
                  }
                }} />
              </label>
              {uploadingImg ? <span className="text-sm text-gray-600">Uploading...</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}