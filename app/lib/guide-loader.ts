import { getAllGuides, getGuideBySlug } from "./db";
import { content } from "../content/links";

// Hybrid function that gets guides from both database and static content
export async function getGuides() {
  try {
    // Try to get guides from database first
    const dbGuides = await getAllGuides();
    
    // If database has guides, return them
    if (dbGuides && dbGuides.length > 0) {
      return dbGuides;
    }
    
    // Fallback to static content if database is empty
    return content.guides;
  } catch (error) {
    console.error('Error loading guides from database, falling back to static content:', error);
    // Fallback to static content on error
    return content.guides;
  }
}

export async function getGuide(slug: string) {
  try {
    // Try to get guide from database first
    const dbGuide = await getGuideBySlug(slug);
    
    if (dbGuide) {
      return dbGuide;
    }
    
    // Fallback to static content if not found in database
    return content.guides.find(g => g.slug === slug) || null;
  } catch (error) {
    console.error('Error loading guide from database, falling back to static content:', error);
    // Fallback to static content on error
    return content.guides.find(g => g.slug === slug) || null;
  }
}