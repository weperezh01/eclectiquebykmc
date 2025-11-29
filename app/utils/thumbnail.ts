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

export function getInstagramThumbnail(url: string): string | null {
  // Instagram doesn't provide direct thumbnail access
  // We'll return a placeholder for Instagram videos
  if (!url) return null;
  
  const patterns = [
    /(?:instagram\.com\/p\/|instagram\.com\/reel\/)([^\/\?]+)/,
    /(?:instagram\.com\/tv\/)([^\/\?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Return Instagram placeholder thumbnail
      return '/images/platforms/instagram-placeholder.svg';
    }
  }

  return null;
}

export function getFacebookThumbnail(url: string): string | null {
  // Facebook doesn't provide direct thumbnail access
  // We'll return a placeholder for Facebook videos
  if (!url) return null;
  
  const patterns = [
    /facebook\.com\/watch\?v=([^&\n?#]+)/,
    /facebook\.com\/.*\/videos\/([^\/\?&]+)/,
    /fb\.watch\/([^\/\?&]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Return Facebook placeholder thumbnail
      return '/images/platforms/facebook-placeholder.svg';
    }
  }

  return null;
}

export function getTikTokThumbnail(url: string): string | null {
  // TikTok doesn't provide direct thumbnail access
  // We'll return a placeholder for TikTok videos
  if (!url) return null;
  
  const patterns = [
    /tiktok\.com\/@[^\/]+\/video\/([^\/\?&]+)/,
    /tiktok\.com\/t\/([^\/\?&]+)/,
    /vm\.tiktok\.com\/([^\/\?&]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Return TikTok placeholder thumbnail
      return '/images/platforms/tiktok-placeholder.svg';
    }
  }

  return null;
}

export function getVideoThumbnail(platform: string, url: string): string | null {
  switch (platform) {
    case 'youtube':
      return getYouTubeThumbnail(url);
    case 'instagram':
      return getInstagramThumbnail(url);
    case 'facebook':
      return getFacebookThumbnail(url);
    case 'tiktok':
      return getTikTokThumbnail(url);
    default:
      return null;
  }
}

export function getGuideThumbnail(guide: {
  youtubeUrl?: string;
  coverImage?: string;
  videos?: Array<{ platform?: string; video_url?: string; youtube_url?: string; is_primary?: boolean }>;
  items: Array<{ image: string }>;
}): string {
  // First priority: Cover image if it exists
  if (guide.coverImage && guide.coverImage.trim() && guide.coverImage !== '') {
    // Check if it's a valid URL or path
    if (guide.coverImage.startsWith('http') || guide.coverImage.startsWith('/')) {
      return guide.coverImage;
    }
  }

  // Second priority: Primary video thumbnail from new video system
  if (guide.videos && guide.videos.length > 0) {
    // Look for the primary video first
    const primaryVideo = guide.videos.find(video => video.is_primary);
    if (primaryVideo) {
      const platform = primaryVideo.platform || 'youtube';
      const url = primaryVideo.video_url || primaryVideo.youtube_url;
      if (url) {
        const videoThumbnail = getVideoThumbnail(platform, url);
        if (videoThumbnail) {
          return videoThumbnail;
        }
      }
    }
    
    // If no primary video, use the first video
    const firstVideo = guide.videos[0];
    if (firstVideo) {
      const platform = firstVideo.platform || 'youtube';
      const url = firstVideo.video_url || firstVideo.youtube_url;
      if (url) {
        const videoThumbnail = getVideoThumbnail(platform, url);
        if (videoThumbnail) {
          return videoThumbnail;
        }
      }
    }
  }

  // Third priority: Legacy single YouTube video (backward compatibility)
  if (guide.youtubeUrl && guide.youtubeUrl.trim()) {
    const youtubeThumbnail = getYouTubeThumbnail(guide.youtubeUrl);
    if (youtubeThumbnail) {
      return youtubeThumbnail;
    }
  }

  // Fourth priority: Find the first item with a valid image
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