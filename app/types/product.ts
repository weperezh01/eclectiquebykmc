export type ProductCondition = "nuevo" | "usado";

export interface Product {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  condition: ProductCondition;
  grade?: "A" | "B" | "C"; // para usados
  images: string[];
  stock: number;
  categories?: string[];
  createdAt?: string;
}

