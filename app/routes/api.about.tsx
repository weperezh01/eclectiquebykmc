import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { HOME_COPY } from "../content/links";

// For now, we'll use the static content from links.ts
// In the future, this could be stored in a database

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Return current content
  return json({
    bio: HOME_COPY.bio,
    image: "/images/kmc.webp"
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = await request.json();
    
    // Validate input
    if (!data.bio || !data.bio.trim()) {
      return json({ error: 'Bio is required' }, { status: 400 });
    }

    // For now, we'll just return success
    // In a real implementation, you would save this to a database
    // or update the content file
    
    console.log('About content update requested:', data);
    
    // TODO: Implement actual content persistence
    // This could involve:
    // 1. Saving to database
    // 2. Updating a JSON file
    // 3. Triggering a content management system
    
    return json({ 
      success: true, 
      message: 'Content saved successfully',
      data 
    });
    
  } catch (error) {
    console.error('Error updating about content:', error);
    return json({ error: 'Failed to save content' }, { status: 500 });
  }
};