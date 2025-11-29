import React, { useState, useEffect } from 'react';

type ProductImage = {
  id: number;
  image_url: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

type Props = {
  productId: number;
  onImagesChange?: (images: ProductImage[]) => void;
};

export default function ProductImageManager({ productId, onImagesChange }: Props) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New image form state
  const [newImageForm, setNewImageForm] = useState({
    image_url: '',
    alt_text: '',
    sort_order: 0,
    is_primary: false
  });

  // Load images
  const loadImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products/${productId}/images`);
      if (!response.ok) throw new Error('Failed to load images');
      
      const data = await response.json();
      setImages(data.images || []);
      onImagesChange?.(data.images || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadImages();
    }
  }, [productId]);

  // Add new image
  const addImage = async () => {
    if (!newImageForm.image_url.trim()) {
      setError('Image URL is required');
      return;
    }

    setError(null);

    try {
      const formData = new FormData();
      formData.append('action', 'add');
      formData.append('image_url', newImageForm.image_url);
      formData.append('alt_text', newImageForm.alt_text);
      formData.append('sort_order', newImageForm.sort_order.toString());
      formData.append('is_primary', newImageForm.is_primary.toString());

      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add image');
      }

      // Reset form and reload images
      setNewImageForm({
        image_url: '',
        alt_text: '',
        sort_order: 0,
        is_primary: false
      });

      await loadImages();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Upload file
  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/admin/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      setNewImageForm(prev => ({ ...prev, image_url: result.url }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete image
  const deleteImage = async (imageId: number) => {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      const formData = new FormData();
      formData.append('action', 'delete');
      formData.append('image_id', imageId.toString());

      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      await loadImages();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Set as primary
  const setPrimary = async (imageId: number) => {
    try {
      const formData = new FormData();
      formData.append('action', 'set_primary');
      formData.append('image_id', imageId.toString());

      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set primary image');
      }

      await loadImages();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Cargando imágenes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Galería de Imágenes</h3>
        <span className="text-sm text-gray-500">{images.length} imagen(es)</span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Current Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={image.image_url}
                  alt={image.alt_text || 'Product image'}
                  className="h-full w-full object-cover"
                />
              </div>
              
              {/* Primary badge */}
              {image.is_primary && (
                <div className="absolute top-2 left-2 rounded-full bg-accent px-2 py-1 text-xs font-medium text-white">
                  Principal
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <button
                    onClick={() => setPrimary(image.id)}
                    className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white transition-colors"
                  >
                    <svg className="h-3 w-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Principal
                  </button>
                )}
                
                <button
                  onClick={() => deleteImage(image.id)}
                  className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                >
                  <svg className="h-3 w-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>

              {/* Sort order indicator */}
              <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
                {image.sort_order}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Image Form */}
      <div className="border border-gray-200 rounded-xl p-6 bg-gray-50/50">
        <h4 className="text-md font-medium mb-4 text-gray-900">Agregar Nueva Imagen</h4>
        
        <div className="space-y-4">
          {/* Upload File Option */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h6 className="text-sm font-medium mb-2 text-gray-700">Subir desde Dispositivo</h6>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/80 transition-all duration-200"
                disabled={uploading}
              />
              {uploading && (
                <div className="flex items-center gap-2 text-accent font-medium">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subiendo...
                </div>
              )}
            </div>
          </div>

          {/* URL Option */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h6 className="text-sm font-medium mb-2 text-gray-700">O Ingresar URL de Imagen</h6>
            <input 
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
              type="url"
              value={newImageForm.image_url} 
              onChange={(e) => setNewImageForm(prev => ({ ...prev, image_url: e.target.value }))} 
              placeholder="https://example.com/image.jpg" 
            />
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Texto Alt</label>
              <input 
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                value={newImageForm.alt_text} 
                onChange={(e) => setNewImageForm(prev => ({ ...prev, alt_text: e.target.value }))} 
                placeholder="Descripción de la imagen" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Orden</label>
              <input 
                type="number"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200" 
                value={newImageForm.sort_order} 
                onChange={(e) => setNewImageForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))} 
                min="0"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input 
                type="checkbox"
                id="new-image-primary"
                checked={newImageForm.is_primary} 
                onChange={(e) => setNewImageForm(prev => ({ ...prev, is_primary: e.target.checked }))}
                className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent focus:ring-2"
              />
              <label htmlFor="new-image-primary" className="text-xs font-medium text-gray-700">
                Principal
              </label>
            </div>
          </div>

          {/* Preview */}
          {newImageForm.image_url && (
            <div className="border border-gray-200 rounded-lg p-3 bg-white">
              <p className="text-xs text-gray-600 mb-2">Vista Previa:</p>
              <div className="flex items-center gap-3">
                <img 
                  src={newImageForm.image_url} 
                  alt="Vista previa" 
                  className="w-16 h-16 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{newImageForm.image_url}</p>
                  <button
                    type="button"
                    onClick={() => setNewImageForm(prev => ({ ...prev, image_url: '' }))}
                    className="text-xs text-red-600 hover:text-red-800 mt-1 font-medium transition-colors duration-200"
                  >
                    Quitar imagen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={addImage}
            disabled={!newImageForm.image_url.trim() || uploading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar Imagen
          </button>
        </div>
      </div>
    </div>
  );
}