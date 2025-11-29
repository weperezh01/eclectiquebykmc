import { getAllDeals, getPublicDeals, getDealBySlug } from "./db";

// Function to get public deals for the public-facing deals page
export async function getDeals() {
  try {
    // Get public deals from database
    const dbDeals = await getPublicDeals();
    
    // Return deals from database
    return dbDeals || [];
  } catch (error) {
    console.error('Error loading deals from database:', error);
    // Return empty array on error
    return [];
  }
}

// Admin function that gets all deals (public and private)
export async function getAllDealsForAdmin() {
  try {
    // Get all deals from database (admin needs to see private ones too)
    const dbDeals = await getAllDeals();
    
    // Return deals from database
    return dbDeals || [];
  } catch (error) {
    console.error('Error loading deals from database:', error);
    // Return empty array on error
    return [];
  }
}

export async function getDeal(slug: string) {
  try {
    // Get deal from database
    const dbDeal = await getDealBySlug(slug);
    
    return dbDeal;
  } catch (error) {
    console.error('Error loading deal from database:', error);
    // Return null on error
    return null;
  }
}