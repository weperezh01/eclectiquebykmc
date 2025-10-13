import type { AffiliateItem } from "../types/affiliate";

export const affiliateItems: AffiliateItem[] = [
  {
    id: "a-001",
    slug: "lentes-sol-elegantes",
    title: "Lentes de sol elegantes",
    description: "Estilo clásico, protección UV400.",
    image: "/images/placeholder.svg",
    platform: "Amazon",
    url: "https://www.amazon.com/dp/B0EXAMPLE?tag=TU_TAG_AFILIADO",
    price: 24.99,
    currency: "USD",
    categories: ["accesorios"],
  },
  {
    id: "a-002",
    slug: "zapatillas-artesanales",
    title: "Zapatillas artesanales",
    description: "Comodidad y estilo casual.",
    image: "/images/placeholder.svg",
    platform: "Etsy",
    url: "https://www.etsy.com/listing/EXAMPLE?aff_platform=api&cns=1",
    categories: ["calzado"],
  },
];
