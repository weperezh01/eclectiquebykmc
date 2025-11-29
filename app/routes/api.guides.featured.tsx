import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getFeaturedGuides } from "../lib/db";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const featuredGuides = await getFeaturedGuides();
    
    // Separate by type
    const featuredLooks = featuredGuides.filter(guide => guide.guideType === 'Look');
    const featuredDeals = featuredGuides.filter(guide => guide.guideType === 'Deal');
    
    return json({
      looks: featuredLooks,
      deals: featuredDeals
    });
  } catch (error) {
    console.error('Error loading featured guides:', error);
    return json({ looks: [], deals: [] }, { status: 500 });
  }
}