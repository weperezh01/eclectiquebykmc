import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getAllDeals, getPublicDeals, createDeal, initDatabase } from "../lib/db";

type DealItem = {
  title: string;
  image_url: string;
  href: string;
  original_price?: number;
  sale_price?: number;
  discount_percentage?: number;
  is_featured?: boolean;
};

type DealVideo = {
  id?: number;
  platform: string;
  video_url: string;
  title?: string;
  is_primary?: boolean;
};

type Deal = {
  slug: string;
  title: string;
  intro: string;
  coverImage?: string;
  discountPercentage?: number;
  isPublic?: boolean;
  videos?: DealVideo[];
  items: DealItem[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Initialize database tables if they don't exist
    await initDatabase();
    
    // Check if this is an admin request
    const url = new URL(request.url);
    const referer = request.headers.get('referer') || '';
    const isAdminRequest = referer.includes('/admin/') || url.searchParams.get('admin') === 'true';
    
    // Get deals from database
    const deals = isAdminRequest ? await getAllDeals() : await getPublicDeals();
    
    console.log('=== API DEALS LOADER ===');
    console.log('Is admin request:', isAdminRequest);
    console.log('Loaded deals from database:', deals.length);
    deals.forEach((deal, i) => {
      console.log(`Deal ${i + 1} (${deal.slug}):`, {
        title: deal.title,
        isPublic: deal.isPublic,
        videosCount: deal.videos?.length || 0,
        itemsCount: deal.items?.length || 0,
        discountPercentage: deal.discountPercentage
      });
    });
    return json(deals);
  } catch (error) {
    console.error('Error in deals loader:', error);
    return json([], { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const method = request.method;
    
    if (method === "POST") {
      const dealData: Deal = await request.json();
      
      // Validate required fields
      if (!dealData.slug || !dealData.title || !dealData.intro) {
        return json({ error: "Missing required fields" }, { status: 400 });
      }

      await createDeal(dealData);
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error('Error in deals action:', error);
    return json({ error: error.message || "Server error" }, { status: 500 });
  }
}