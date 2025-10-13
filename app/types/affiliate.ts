export interface AffiliateItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  image?: string;
  platform: "Amazon" | "eBay" | "Etsy" | "Otro";
  url: string; // debe incluir parámetros de afiliado
  price?: number;
  currency?: string;
  categories?: string[];
}

