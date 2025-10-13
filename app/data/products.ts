import type { Product } from "../types/product";

export const products: Product[] = [
  {
    id: "p-001",
    slug: "bolso-cuero-kmc",
    title: "Bolso de cuero KMC",
    description: "Bolso artesanal de cuero genuino, edición limitada.",
    price: 129.99,
    currency: "USD",
    condition: "nuevo",
    images: ["/images/placeholder.svg"],
    stock: 5,
    categories: ["accesorios", "nuevo"],
  },
  {
    id: "p-002",
    slug: "chaqueta-denim-vintage",
    title: "Chaqueta denim vintage",
    description: "Pieza única en excelente estado (grado A).",
    price: 59.0,
    currency: "USD",
    condition: "usado",
    grade: "A",
    images: ["/images/placeholder.svg"],
    stock: 1,
    categories: ["ropa", "usado"],
  },
];
