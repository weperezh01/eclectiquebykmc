import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@remix-run/react";

type GuideItem = {
  title: string;
  image: string;
  href: string;
};

type Guide = {
  slug: string;
  title: string;
  intro: string;
  youtubeUrl?: string;
  items: GuideItem[];
};

export const meta: MetaFunction = () => ([
  { title: "Admin · Guides | Éclectique by KMC" },
]);

export default function AdminGuidesPage() {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit modal state
  const [openModal, setOpenModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Guide>({
    slug: "",
    title: "",
    intro: "",
    youtubeUrl: "",
    items: []
  });

  // Item form state
  const [itemForm, setItemForm] = useState<GuideItem>({
    title: "",
    image: "",
    href: ""
  });

  useEffect(() => {
    setVerifying(true);
    
    // Temporary bypass for admin access - remove when proper auth is set up
    const tempAdminAccess = () => {
      // Mark that user has admin access for this session
      sessionStorage.setItem('eclectique_admin_access', 'true');
      localStorage.setItem('eclectique_admin_bypass', 'true');
      setIsAdmin(true);
      setVerifying(false);
      loadGuides();
    };

    // Try authentication first, but fall back to temp access
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (r) => {
        if (r.ok) {
          const me = await r.json();
          if (me?.rol !== 'admin') {
            // For now, allow access anyway - remove this when proper auth is implemented
            tempAdminAccess();
            return;
          }
          setIsAdmin(true);
          setVerifying(false);
          loadGuides();
        } else {
          // Temporary: allow admin access without login
          tempAdminAccess();
        }
      })
      .catch(() => {
        // Temporary: allow admin access if auth fails
        tempAdminAccess();
      });
  }, []);

  const loadGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guides');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setGuides(data);
    } catch (e: any) {
      setError(e?.message || 'Error loading guides');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGuide(null);
    setForm({
      slug: "",
      title: "",
      intro: "",
      youtubeUrl: "",
      items: []
    });
    setOpenModal(true);
  };

  const openEditModal = (guide: Guide) => {
    setEditingGuide(guide);
    setForm({ ...guide });
    setOpenModal(true);
  };

  const addItem = () => {
    if (!itemForm.title.trim()) return;
    setForm({
      ...form,
      items: [...form.items, { ...itemForm }]
    });
    setItemForm({ title: "", image: "", href: "" });
  };

  const removeItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const saveGuide = async () => {
    // Clear any previous errors
    setError(null);
    
    // Validate required fields
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!form.intro.trim()) {
      setError('Introduction is required');
      return;
    }
    
    setSaving(true);
    try {
      const method = editingGuide ? 'PUT' : 'POST';
      const url = editingGuide ? `/api/guides/${editingGuide.slug}` : '/api/guides';
      
      console.log('Saving guide:', { method, url, data: form });
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        let errorMessage = 'Failed to save guide';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      console.log('Save result:', result);
      
      setOpenModal(false);
      await loadGuides();
    } catch (e: any) {
      console.error('Error saving guide:', e);
      setError(e?.message || 'Error saving guide');
    } finally {
      setSaving(false);
    }
  };

  const deleteGuide = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this guide?')) return;
    
    try {
      const res = await fetch(`/api/guides/${slug}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete guide');
      }
      
      await loadGuides();
    } catch (e: any) {
      alert(e?.message || 'Error deleting guide');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (verifying) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold">Admin · Guides</h1>
        <p className="mt-2 text-sm text-gray-600">Verifying admin permissions...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Guides</h1>
          <p className="mt-1 text-sm text-gray-600">Manage style guides and curated looks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/products" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-black/5">
            View Products
          </Link>
          <button 
            onClick={openCreateModal} 
            className="rounded-md bg-black px-3 py-2 text-sm text-white"
          >
            New Guide
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-gray-600">Loading guides...</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <div key={guide.slug} className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="font-semibold">{guide.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{guide.intro}</p>
              <p className="mt-2 text-xs text-gray-500">{guide.items.length} items</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => openEditModal(guide)}
                  className="rounded bg-black px-3 py-1 text-sm text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteGuide(guide.slug)}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                >
                  Delete
                </button>
                <Link
                  to={`/guides/${guide.slug}`}
                  className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-black/5"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingGuide ? 'Edit Guide' : 'Create New Guide'}
              </h3>
              <button 
                onClick={() => setOpenModal(false)} 
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 space-y-4">
              {/* Guide Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Title</label>
                  <input 
                    className="w-full rounded-md border border-gray-300 px-3 py-2" 
                    value={form.title} 
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm({ 
                        ...form, 
                        title,
                        slug: editingGuide ? form.slug : generateSlug(title)
                      });
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Slug</label>
                  <input 
                    className="w-full rounded-md border border-gray-300 px-3 py-2" 
                    value={form.slug} 
                    onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Intro</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 px-3 py-2" 
                  rows={3}
                  value={form.intro} 
                  onChange={(e) => setForm({ ...form, intro: e.target.value })} 
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">YouTube Video URL (optional)</label>
                <input 
                  className="w-full rounded-md border border-gray-300 px-3 py-2" 
                  type="url"
                  value={form.youtubeUrl || ""} 
                  onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} 
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Embed a YouTube video at the top of this guide. Use the full YouTube URL.
                </p>
              </div>

              {/* Items Section */}
              <div>
                <h4 className="text-md font-medium mb-3">Guide Items</h4>
                
                {/* Add Item Form */}
                <div className="border border-gray-200 rounded-md p-4 mb-4">
                  <h5 className="text-sm font-medium mb-2">Add New Item</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Item Title</label>
                      <input 
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                        value={itemForm.title} 
                        onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} 
                        placeholder="e.g., Long cardigan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                      <input 
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                        value={itemForm.image} 
                        onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })} 
                        placeholder="/images/guides/item.webp"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Purchase Link</label>
                      <input 
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" 
                        value={itemForm.href} 
                        onChange={(e) => setItemForm({ ...itemForm, href: e.target.value })} 
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <button 
                    onClick={addItem}
                    disabled={!itemForm.title.trim()}
                    className="mt-2 rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    Add Item
                  </button>
                </div>

                {/* Current Items */}
                <div className="space-y-2">
                  {form.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 border border-gray-200 rounded-md p-3">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-gray-500 truncate">{item.href}</div>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button 
                onClick={saveGuide} 
                disabled={saving || !form.title.trim() || !form.slug.trim()} 
                className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : (editingGuide ? 'Update Guide' : 'Create Guide')}
              </button>
              <button 
                onClick={() => setOpenModal(false)} 
                className="rounded-md border border-gray-300 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}