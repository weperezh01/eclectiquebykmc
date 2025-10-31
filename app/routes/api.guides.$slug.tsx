import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getGuideBySlug, updateGuide, deleteGuide } from "../lib/db";

type GuideItem = {
  title: string;
  image: string;
  href: string;
};

type Guide = {
  title: string;
  intro: string;
  items: GuideItem[];
};

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    if (!params.slug) {
      return json({ error: "Slug required" }, { status: 400 });
    }

    const guide = await getGuideBySlug(params.slug);
    
    if (!guide) {
      return json({ error: "Guide not found" }, { status: 404 });
    }

    return json(guide);
  } catch (error) {
    console.error('Error loading guide:', error);
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
      const updatedGuide: Guide = await request.json();
      
      if (!updatedGuide.title || !updatedGuide.intro) {
        return json({ error: "Missing required fields" }, { status: 400 });
      }

      await updateGuide(slug, updatedGuide);
      return json({ success: true });
    }

    if (method === "DELETE") {
      const deleted = await deleteGuide(slug);
      
      if (!deleted) {
        return json({ error: "Guide not found" }, { status: 404 });
      }

      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error('Error in guide action:', error);
    return json({ error: error.message || "Server error" }, { status: 500 });
  }
}