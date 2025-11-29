import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getAllGuides, getPublicGuides, createGuide, initDatabase } from "../lib/db";

type GuideItem = {
  title: string;
  image: string;
  href: string;
  is_featured?: boolean;
};

type GuideVideo = {
  id?: number;
  platform: string;
  video_url: string;
  youtube_url?: string; // Keep for backward compatibility
  title?: string;
  is_primary?: boolean;
};

type Guide = {
  slug: string;
  title: string;
  intro: string;
  youtubeUrl?: string;
  coverImage?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  guideType?: string;
  videos?: GuideVideo[];
  items: GuideItem[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Initialize database tables if they don't exist
    await initDatabase();
    
    // Check if this is an admin request (from /admin/guides)
    const url = new URL(request.url);
    const referer = request.headers.get('referer') || '';
    const isAdminRequest = referer.includes('/admin/') || url.searchParams.get('admin') === 'true';
    const typeFilter = url.searchParams.get('type');
    
    // Get guides from database
    let guides = isAdminRequest ? await getAllGuides() : await getPublicGuides();
    
    // Apply type filter if specified
    if (typeFilter && isAdminRequest) {
      guides = guides.filter(guide => guide.guideType === typeFilter);
    }
    
    console.log('=== API GUIDES LOADER ===');
    console.log('Is admin request:', isAdminRequest);
    console.log('Loaded guides from database:', guides.length);
    guides.forEach((guide, i) => {
      console.log(`Guide ${i + 1} (${guide.slug}):`, {
        title: guide.title,
        isPublic: guide.isPublic,
        videosCount: guide.videos?.length || 0,
        videos: guide.videos
      });
    });
    return json(guides);
  } catch (error) {
    console.error('Error in guides loader:', error);
    return json([], { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const method = request.method;
    
    if (method === "POST") {
      const guideData: Guide = await request.json();
      
      // Validate required fields
      if (!guideData.slug || !guideData.title || !guideData.intro) {
        return json({ error: "Missing required fields" }, { status: 400 });
      }

      await createGuide(guideData);
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error('Error in guides action:', error);
    return json({ error: error.message || "Server error" }, { status: 500 });
  }
}