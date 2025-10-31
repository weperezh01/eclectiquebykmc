import type { MetaFunction } from "@remix-run/node";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@remix-run/react";

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
  activo?: boolean;
  fecha_creacion?: string;
};

export const meta: MetaFunction = () => ([
  { title: "Admin · Productos | Éclectique by KMC" },
]);

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Producto[]>([]);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [marketplaceFilter, setMarketplaceFilter] = useState<string|undefined>(undefined);
  const [categories, setCategories] = useState<{ id: number; nombre: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string|undefined>(undefined);
  const [sortBy, setSortBy] = useState<'fecha' | 'titulo'>('fecha');
  const [ascending, setAscending] = useState(false);

  // Create modal form
  const [openAdd, setOpenAdd] = useState(false);
  const [saving, setSaving] = useState(false);
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
    activo: true,
    categorias: ""
  });

  // Edit modal
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
    categorias: ""
  });
  const [uploadingImg, setUploadingImg] = useState(false);

  const initials = (s?: string | null) => (s?.trim()?.charAt(0)?.toUpperCase() || 'P');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let data = items.filter((p) => showInactive ? true : p.activo !== false);
    if (needle) {
      data = data.filter((p) =>
        p.titulo?.toLowerCase().includes(needle) ||
        (p.descripcion || '').toLowerCase().includes(needle) ||
        (p.marketplace || '').toLowerCase().includes(needle)
      );
    }
    data.sort((a, b) => {
      if (sortBy === 'titulo') {
        const at = a.titulo.toLowerCase();
        const bt = b.titulo.toLowerCase();
        return ascending ? at.localeCompare(bt) : bt.localeCompare(at);
      } else {
        const ad = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
        const bd = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
        return ascending ? ad - bd : bd - ad;
      }
    });
    return data;
  }, [items, query, showInactive, sortBy, ascending]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', '500');
      params.set('activo', 'null');
      if (marketplaceFilter) params.set('marketplace', marketplaceFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch('/api/products?' + params.toString());
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setVerifying(true);
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (r) => {
        if (r.ok) {
          const me = await r.json();
          if (me?.rol !== 'admin') {
            navigate('/');
            return;
          }
          setIsAdmin(true);
          setVerifying(false);
          // precargar categorías
          fetch('/api/products/_meta/categories')
            .then(async (rc) => { if (rc.ok) setCategories(await rc.json()); })
            .catch(() => {});
          load();
        } else {
          navigate('/login');
        }
      })
      .catch(() => navigate('/login'));
  }, []);

  const createProduct = async () => {
    setSaving(true);
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
        activo: !!form.activo,
        categorias: form.categorias ? form.categorias.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('No se pudo crear');
      setOpenAdd(false);
      setForm({ titulo: "", descripcion: "", tipo: 'afiliado', marketplace: 'Amazon', enlace_url: "", imagen_url: "", precio: "", moneda: "USD", destacado: false, activo: true, categorias: "" });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Error creando producto');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const payload: any = { ...editForm };
      if (!payload.enlace_url) delete payload.enlace_url;
      if (!payload.imagen_url) delete payload.imagen_url;
      if (!payload.descripcion) delete payload.descripcion;
      payload.precio = editForm.precio ? Number(editForm.precio) : undefined;
      payload.categorias = editForm.categorias ? editForm.categorias.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const res = await fetch(`/api/products/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('No se pudo actualizar');
      setEditId(null);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Error guardando cambios');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: number, value: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activo: value }),
      });
      if (!res.ok) throw new Error('Error');
      await load();
    } catch (e) {
      alert('No se pudo actualizar');
    }
  };

  const toggleFeatured = async (id: number, value: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ destacado: value }),
      });
      if (!res.ok) throw new Error('Error');
      await load();
    } catch (e) {
      alert('No se pudo actualizar');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      await load();
    } catch (e) {
      alert('Error eliminando');
    }
  };

  if (verifying) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold">Admin · Productos</h1>
        <p className="mt-2 text-sm text-gray-600">Verificando permisos de administrador...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Productos</h1>
          <p className="mt-1 text-sm text-gray-600">Gestiona productos propios y de afiliado.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/affiliates" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-black/5">View Affiliates</Link>
          <button onClick={() => setOpenAdd(true)} className="rounded-md bg-black px-3 py-2 text-sm text-white">Nuevo producto</button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          placeholder="Buscar por título, descripción o marketplace"
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Mostrar inactivos
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Marketplace:
          <select value={marketplaceFilter || ''} onChange={(e) => setMarketplaceFilter(e.target.value || undefined)} className="rounded border border-gray-300 px-2 py-1">
            <option value="">Todos</option>
            {['Amazon','Walmart','LTK','Shein','DH Gate','AliExpress','Poshmark','Mercari','eBay','TikTok','TikTok Showcase','Pinterest','Instagram','Propio','Otro'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Categoría:
          <select value={categoryFilter || ''} onChange={(e) => setCategoryFilter(e.target.value || undefined)} className="rounded border border-gray-300 px-2 py-1">
            <option value="">Todas</option>
            {categories.map(c => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Ordenar por:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rounded border border-gray-300 px-2 py-1">
            <option value="fecha">Fecha</option>
            <option value="titulo">Título</option>
          </select>
        </label>
        <button onClick={() => setAscending((v) => !v)} className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-black/5">{ascending ? 'Asc' : 'Desc'}</button>
        <button onClick={load} className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-black/5">Aplicar filtros</button>
      </div>

      {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}
      {loading ? (
        <p className="mt-6 text-sm text-gray-600">Cargando...</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Marketplace</th>
                <th className="px-3 py-2 text-left">Precio</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 align-top">
                  <td className="px-3 py-2">{p.id}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded bg-gray-100 flex items-center justify-center">
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt={p.titulo} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-500">{initials(p.titulo)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{p.titulo}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 max-w-md">{p.descripcion}</div>
                        {p.enlace_url ? (
                          <a href={p.enlace_url} target="_blank" rel="nofollow sponsored noopener noreferrer" className="text-xs text-blue-700 hover:underline">
                            {p.enlace_url}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{p.tipo}</td>
                  <td className="px-3 py-2">{p.marketplace || '—'}</td>
                  <td className="px-3 py-2">{p.precio ? `${p.precio} ${p.moneda || ''}` : '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(p.id, !(p.activo !== false))} className={`rounded px-2 py-1 text-white ${p.activo !== false ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-600 hover:bg-gray-700'}`}>{p.activo !== false ? 'Activo' : 'Inactivo'}</button>
                      <button onClick={() => toggleFeatured(p.id, !(p.destacado || false))} className={`rounded px-2 py-1 ${p.destacado ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'border border-gray-300 text-gray-700 hover:bg-black/5'}`}>{p.destacado ? 'Destacado' : 'Normal'}</button>
                    </div>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button
                      className="rounded bg-black px-3 py-1 text-white"
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
                          activo: p.activo !== false,
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={() => remove(p.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear */}
      {openAdd ? (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nuevo producto</h3>
              <button onClick={() => setOpenAdd(false)} className="rounded border border-gray-300 px-2 py-1 text-sm">Cerrar</button>
            </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Título</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Tipo</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}>
                  <option value="afiliado">Afiliado</option>
                  <option value="propio">Propio</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Descripción</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Marketplace</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.marketplace} onChange={(e) => setForm({ ...form, marketplace: e.target.value })} disabled={form.tipo !== 'afiliado'}>
                  <option>Amazon</option>
                  <option>LTK</option>
                  <option>Walmart</option>
                  <option>TikTok</option>
                  <option>Pinterest</option>
                  <option>Instagram</option>
                  <option>Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Enlace</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.enlace_url} onChange={(e) => setForm({ ...form, enlace_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Imagen (URL)</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.imagen_url} onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} placeholder="https://.../imagen.jpg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Categorías (separadas por coma)</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={form.categorias} onChange={(e) => setForm({ ...form, categorias: e.target.value })} placeholder="ej: belleza, hogar, viaje" />
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
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} />
                  Destacado
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                  Activo
                </label>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button onClick={createProduct} disabled={saving || !form.titulo.trim()} className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Crear'}</button>
              <button onClick={() => setOpenAdd(false)} className="rounded-md border border-gray-300 px-4 py-2">Cancelar</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal editar */}
      {editId !== null ? (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editar producto</h3>
              <button onClick={() => setEditId(null)} className="rounded border border-gray-300 px-2 py-1 text-sm">Cerrar</button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Título</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.titulo} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Tipo</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.tipo} onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value as any })}>
                  <option value="afiliado">Afiliado</option>
                  <option value="propio">Propio</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Descripción</label>
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
                  <option>Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Enlace</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.enlace_url} onChange={(e) => setEditForm({ ...editForm, enlace_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Imagen (URL)</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.imagen_url} onChange={(e) => setEditForm({ ...editForm, imagen_url: e.target.value })} placeholder="https://.../imagen.jpg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Categorías (separadas por coma)</label>
                <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.categorias} onChange={(e) => setEditForm({ ...editForm, categorias: e.target.value })} placeholder="ej: belleza, hogar, viaje" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">Precio</label>
                  <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.precio} onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })} placeholder="Opcional" />
                </div>
                <div className="w-32">
                  <label className="block text-sm text-gray-700 mb-1">Moneda</label>
                  <input className="w-full rounded-md border border-gray-300 px-3 py-2" value={editForm.moneda} onChange={(e) => setEditForm({ ...editForm, moneda: e.target.value })} placeholder="USD" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={editForm.destacado} onChange={(e) => setEditForm({ ...editForm, destacado: e.target.checked })} />
                  Destacado
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={editForm.activo} onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })} />
                  Activo
                </label>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={saveEdit} disabled={saving} className="rounded-md bg-black px-4 py-2 text-white">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
              <label className="inline-flex items-center gap-2 text-sm">
                <span>Imagen (archivo):</span>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingImg(true);
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await fetch(`/api/products/${editId}/image`, { method: 'POST', body: fd, credentials: 'include' });
                    if (!res.ok) throw new Error('No se pudo subir imagen');
                    await load();
                  } catch (err: any) {
                    alert(err?.message || 'Error subiendo imagen');
                  } finally {
                    setUploadingImg(false);
                  }
                }} />
              </label>
              {uploadingImg ? <span className="text-sm text-gray-600">Subiendo...</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
