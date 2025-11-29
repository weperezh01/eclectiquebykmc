import React, { useState } from 'react';

type ProductImage = {
  id: number;
  image_url: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

type Props = {
  images: ProductImage[];
  fallbackImage?: string;
  productTitle?: string;
};

export default function ProductImageGallery({ 
  images = [], 
  fallbackImage = "/images/placeholder-product.webp", 
  productTitle = "Product" 
}: Props) {
  // Sort images - primary first, then by sort_order, then by creation date
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Use sorted images or fallback
  const displayImages = sortedImages.length > 0 ? sortedImages : [
    { 
      id: 0, 
      image_url: fallbackImage, 
      alt_text: productTitle, 
      sort_order: 0, 
      is_primary: true, 
      created_at: new Date().toISOString() 
    }
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentImage = displayImages[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 border border-gray-200 shadow-sm">
        <img
          src={currentImage.image_url}
          alt={currentImage.alt_text || productTitle}
          className="h-full w-full object-cover transition-opacity duration-300"
        />
        
        {/* Navigation arrows - only show if multiple images */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-all duration-200 backdrop-blur-sm"
              aria-label="Imagen anterior"
            >
              <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-all duration-200 backdrop-blur-sm"
              aria-label="Imagen siguiente"
            >
              <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
            {currentImageIndex + 1} / {displayImages.length}
          </div>
        )}

        {/* Primary badge */}
        {images.length > 0 && currentImage.is_primary && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-accent/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Principal
          </div>
        )}
      </div>

      {/* Thumbnail Grid - only show if multiple images */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={image.id || `fallback-${index}`}
              onClick={() => goToImage(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                index === currentImageIndex
                  ? 'border-accent ring-2 ring-accent/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image.image_url}
                alt={image.alt_text || `${productTitle} imagen ${index + 1}`}
                className="h-full w-full object-cover"
              />
              
              {/* Primary indicator on thumbnail */}
              {image.is_primary && (
                <div className="absolute top-1 right-1 rounded-full bg-accent p-1">
                  <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Mobile swipe indicator */}
      {displayImages.length > 1 && (
        <div className="flex justify-center space-x-2 md:hidden">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`h-2 w-2 rounded-full transition-all duration-200 ${
                index === currentImageIndex
                  ? 'bg-accent'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}