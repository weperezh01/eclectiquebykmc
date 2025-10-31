import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getAllGuides, createGuide, initDatabase } from "../lib/db";

type GuideItem = {
  title: string;
  image: string;
  href: string;
};

type Guide = {
  slug: string;
  title: string;
  intro: string;
  items: GuideItem[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Initialize database tables if they don't exist
    await initDatabase();
    
    // Get guides from database
    const guides = await getAllGuides();
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