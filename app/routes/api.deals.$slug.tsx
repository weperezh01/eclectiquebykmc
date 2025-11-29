import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getDealBySlug, updateDeal, deleteDeal } from "../lib/db";

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
  title: string;
  intro: string;
  coverImage?: string;
  discountPercentage?: number;
  isPublic?: boolean;
  videos?: DealVideo[];
  items: DealItem[];
};

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    if (!params.slug) {
      return json({ error: "Slug required" }, { status: 400 });
    }

    const deal = await getDealBySlug(params.slug);
    
    if (!deal) {
      return json({ error: "Deal not found" }, { status: 404 });
    }

    return json(deal);
  } catch (error) {
    console.error('Error loading deal:', error);
    return json({ error: "Server error" }, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const method = request.method;
    const slug = params.slug;

    if (!slug) {
      return json({ error: "Slug required" }, { status: 400 });
    }

    if (method === "PUT") {
      const updatedDeal: Deal = await request.json();
      
      console.log('=== API DEALS PUT REQUEST ===');
      console.log('Slug:', slug);
      console.log('Updated deal data received:', updatedDeal);
      console.log('Videos in request:', updatedDeal.videos);
      console.log('Videos length:', updatedDeal.videos?.length || 0);
      
      if (!updatedDeal.title || !updatedDeal.intro) {
        return json({ error: "Missing required fields" }, { status: 400 });
      }

      console.log('Calling updateDeal with:', updatedDeal);
      await updateDeal(slug, updatedDeal);
      console.log('updateDeal completed successfully');
      return json({ success: true });
    }

    if (method === "DELETE") {
      const deleted = await deleteDeal(slug);
      
      if (!deleted) {
        return json({ error: "Deal not found" }, { status: 404 });
      }

      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error('Error in deal action:', error);
    return json({ error: error.message || "Server error" }, { status: 500 });
  }
}