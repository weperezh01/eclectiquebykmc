type VideoEmbedProps = {
  platform: string;
  url: string;
  className?: string;
};

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function extractInstagramPostId(url: string): string | null {
  const patterns = [
    /(?:instagram\.com\/p\/|instagram\.com\/reel\/)([^\/\?]+)/,
    /(?:instagram\.com\/tv\/)([^\/\?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function extractFacebookVideoUrl(url: string): string | null {
  // Facebook videos need the full URL for embedding
  const patterns = [
    /https?:\/\/(www\.)?facebook\.com\/.*\/videos\/[^\/\?&]+/,
    /https?:\/\/(www\.)?facebook\.com\/watch\?v=[^&\n?#]+/,
    /https?:\/\/fb\.watch\/[^\/\?&]+/,
    /https?:\/\/(www\.)?facebook\.com\/[^\/]+\/posts\/[^\/\?&]+/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[0]) {
      return match[0];
    }
  }

  return url; // Return original URL if no specific pattern matches
}

function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[^\/]+\/video\/([^\/\?&]+)/,
    /tiktok\.com\/t\/([^\/\?&]+)/,
    /vm\.tiktok\.com\/([^\/\?&]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export default function VideoEmbed({ platform, url, className = "" }: VideoEmbedProps) {
  if (platform === 'youtube') {
    const videoId = extractYouTubeVideoId(url);
    
    if (!videoId) {
      return (
        <div className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${className}`}>
          Invalid YouTube URL. Please check the URL format.
        </div>
      );
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    return (
      <div className={`relative w-full ${className}`}>
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full rounded-lg"
          />
        </div>
      </div>
    );
  }

  if (platform === 'instagram') {
    const postId = extractInstagramPostId(url);
    
    if (!postId) {
      return (
        <div className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${className}`}>
          Invalid Instagram URL. Please use format: instagram.com/p/POST_ID or instagram.com/reel/POST_ID
        </div>
      );
    }

    // Instagram embed using oEmbed approach
    return (
      <div className={`relative w-full ${className}`}>
        <div className="max-w-lg mx-auto">
          <blockquote 
            className="instagram-media" 
            data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
            data-instgrm-version="14"
            style={{
              background: '#FFF',
              border: '0',
              borderRadius: '3px',
              boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
              margin: '1px',
              maxWidth: '540px',
              minWidth: '326px',
              padding: '0',
              width: '100%'
            }}
          >
            <div style={{ padding: '16px' }}>
              <a 
                href={`https://www.instagram.com/p/${postId}/`}
                style={{
                  background: '#FFFFFF',
                  lineHeight: '0',
                  padding: '0 0',
                  textAlign: 'center',
                  textDecoration: 'none',
                  width: '100%'
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <div style={{
                    backgroundColor: '#F4F4F4',
                    borderRadius: '50%',
                    flexGrow: '0',
                    height: '40px',
                    marginRight: '14px',
                    width: '40px'
                  }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: '1', justifyContent: 'center' }}>
                    <div style={{
                      backgroundColor: '#F4F4F4',
                      borderRadius: '4px',
                      flexGrow: '0',
                      height: '14px',
                      marginBottom: '6px',
                      width: '100px'
                    }}></div>
                    <div style={{
                      backgroundColor: '#F4F4F4',
                      borderRadius: '4px',
                      flexGrow: '0',
                      height: '14px',
                      width: '60px'
                    }}></div>
                  </div>
                </div>
                <div style={{ padding: '19% 0' }}></div>
                <div style={{ height: '50px', margin: '0 auto 12px', width: '50px' }}>
                  {/* Instagram icon placeholder */}
                  <svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1">
                    <circle fill="#F4F4F4" cx="30" cy="30" r="30"/>
                    <path fill="#FFFFFF" d="M30,25 C32.7614237,25 35,27.2385763 35,30 C35,32.7614237 32.7614237,35 30,35 C27.2385763,35 25,32.7614237 25,30 C25,27.2385763 27.2385763,25 30,25 Z M30,27 C28.3431458,27 27,28.3431458 27,30 C27,31.6568542 28.3431458,33 30,33 C31.6568542,33 33,31.6568542 33,30 C33,28.3431458 31.6568542,27 30,27 Z"/>
                  </svg>
                </div>
                <div style={{ paddingTop: '8px' }}>
                  <div style={{
                    color: '#3897f0',
                    fontFamily: 'Arial,sans-serif',
                    fontSize: '14px',
                    fontStyle: 'normal',
                    fontWeight: '550',
                    lineHeight: '18px'
                  }}>View this post on Instagram</div>
                </div>
              </a>
            </div>
          </blockquote>
          <script async src="//www.instagram.com/embed.js"></script>
        </div>
      </div>
    );
  }

  if (platform === 'facebook') {
    const videoUrl = extractFacebookVideoUrl(url);
    
    if (!videoUrl) {
      return (
        <div className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${className}`}>
          Invalid Facebook URL. Please check the URL format.
        </div>
      );
    }

    // Facebook videos often have embed restrictions, so we provide an elegant link-based experience
    // that matches the look and feel of embedded videos
    return (
      <div className={`relative w-full ${className}`}>
        <div className="aspect-video w-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg overflow-hidden">
          <div className="h-full w-full flex items-center justify-center text-white p-6">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 opacity-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Facebook Video</h3>
              <p className="text-blue-100 mb-6 max-w-md">
                Click to watch this video on Facebook. Due to privacy settings, 
                this video cannot be embedded directly.
              </p>
              <a 
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch on Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (platform === 'tiktok') {
    const videoId = extractTikTokVideoId(url);
    
    if (!videoId) {
      return (
        <div className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${className}`}>
          Invalid TikTok URL. Please use format: tiktok.com/@user/video/VIDEO_ID
        </div>
      );
    }

    // TikTok embed using oEmbed approach
    return (
      <div className={`relative w-full ${className}`}>
        <div className="max-w-lg mx-auto">
          <blockquote 
            className="tiktok-embed" 
            cite={url}
            data-video-id={videoId}
            style={{ maxWidth: '605px', minWidth: '325px' }}
          >
            <section>
              <a 
                target="_blank" 
                title="TikTok" 
                href={url}
                rel="noopener noreferrer"
              >
                <div className="rounded-lg border border-gray-200 bg-black p-6 text-center text-white">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">TikTok Video</h3>
                  <p className="text-sm text-gray-300 mb-4">Click to watch on TikTok</p>
                  <div className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Watch Video
                  </div>
                </div>
              </a>
            </section>
          </blockquote>
          <script async src="https://www.tiktok.com/embed.js"></script>
        </div>
      </div>
    );
  }

  // Fallback for unknown platforms
  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 ${className}`}>
      <p><strong>Platform:</strong> {platform}</p>
      <p><strong>URL:</strong> <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{url}</a></p>
    </div>
  );
}