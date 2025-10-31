// Utility functions for getting guide thumbnails

export function getYouTubeThumbnail(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      // Return high quality thumbnail
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  }

  return null;
}

export function getGuideThumbnail(guide: {
  youtubeUrl?: string;
  items: Array<{ image: string }>;
}): string {
  // First priority: YouTube thumbnail (only if video exists)
  if (guide.youtubeUrl && guide.youtubeUrl.trim()) {
    const youtubeThumbnail = getYouTubeThumbnail(guide.youtubeUrl);
    if (youtubeThumbnail) {
      return youtubeThumbnail;
    }
  }

  // Second priority: Find the first item with a valid image
  if (guide.items && guide.items.length > 0) {
    for (const item of guide.items) {
      if (item.image && item.image.trim() && item.image !== '') {
        // Check if it's a valid URL or path
        if (item.image.startsWith('http') || item.image.startsWith('/')) {
          return item.image;
        }
      }
    }
  }

  // Fallback: Default placeholder
  return '/images/guide-placeholder.svg';
}