import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => ([
  { title: "Admin · About | Éclectique by KMC" },
]);

export default function AdminAboutPage() {
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    bio: "",
    image: "/images/kmc.webp"
  });

  // Image upload state
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setVerifying(true);
    
    // Temporary bypass for admin access - remove when proper auth is set up
    const tempAdminAccess = () => {
      // Mark that user has admin access for this session
      sessionStorage.setItem('eclectique_admin_access', 'true');
      localStorage.setItem('eclectique_admin_bypass', 'true');
      setIsAdmin(true);
      setVerifying(false);
      loadCurrentContent();
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
          loadCurrentContent();
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

  const loadCurrentContent = async () => {
    try {
      // For now, load from the static content file
      // In the future, this could be from a database
      const response = await fetch('/admin/about/content');
      if (response.ok) {
        const data = await response.json();
        setForm(data);
      } else {
        // Use default values if API doesn't exist yet
        setForm({
          bio: "¡Hola! Soy Karina, una apasionada de la moda y el estilo personal. A través de Éclectique by KMC, comparto mis looks favoritos y descubrimientos de moda que pueden inspirarte a crear tu propio estilo único. Me encanta encontrar piezas versátiles que se adapten a diferentes ocasiones y presupuestos.",
          image: "/images/kmc.webp"
        });
      }
    } catch (error) {
      console.error('Error loading content:', error);
      // Use default values
      setForm({
        bio: "¡Hola! Soy Karina, una apasionada de la moda y el estilo personal. A través de Éclectique by KMC, comparto mis looks favoritos y descubrimientos de moda que pueden inspirarte a crear tu propio estilo único. Me encanta encontrar piezas versátiles que se adapten a diferentes ocasiones y presupuestos.",
        image: "/images/kmc.webp"
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      setForm({ ...form, image: result.url });
      setSuccess('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error?.message || 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const saveContent = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    
    try {
      const response = await fetch('/admin/about/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save content');
      }
      
      setSuccess('Content saved successfully!');
    } catch (error: any) {
      console.error('Error saving content:', error);
      setError(error?.message || 'Error saving content');
    } finally {
      setSaving(false);
    }
  };

  if (verifying) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold">Admin · About</h1>
        <p className="mt-2 text-sm text-gray-600">Verifying admin permissions...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · About</h1>
          <p className="mt-1 text-sm text-gray-600">Edit the About page content and image.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/about" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-black/5">
            View Page
          </Link>
          <Link to="/admin/guides" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-black/5">
            Manage Guides
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Bio Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">About Bio</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio Text
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[120px]"
                rows={6}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell visitors about yourself..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Write a compelling bio that introduces you to your audience.
              </p>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Image</h3>
          
          {/* Tabs */}
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => setImageMode('url')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                imageMode === 'url'
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paste URL
            </button>
            <button
              type="button"
              onClick={() => setImageMode('upload')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                imageMode === 'upload'
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upload File
            </button>
          </div>

          {uploadError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {uploadError}
            </div>
          )}

          <div className="space-y-4">
            {imageMode === 'url' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://example.com/image.jpg or /images/kmc.webp"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Paste a direct link to an image or path to a local image.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-accent transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <svg
                      className="w-8 h-8 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG, WebP up to 5MB
                    </span>
                  </label>
                </div>
              </div>
            )}
            
            {/* Image Preview */}
            {form.image && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="w-64 h-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <img
                    src={form.image}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={saveContent}
            disabled={saving || !form.bio.trim()}
            className="rounded-md bg-black px-6 py-2 text-white disabled:opacity-60 hover:bg-gray-800 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            to="/about"
            className="rounded-md border border-gray-300 px-6 py-2 hover:bg-black/5 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </main>
  );
}