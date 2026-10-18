export type Product = {
  id: number;
  slug: string;
  name: string;
  price: number;
  category: string;
  image: string;
  discount: number;
  description: string;
  stock: number;
  sku: string;
  mrp?: number | null;
  subcategory?: string | null;
  brand?: string | null;
  material?: string | null;
  gender?: string | null;
  tags?: string[];
  featured?: boolean;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  images?: { id: string; url: string; sortOrder: number; isPrimary: boolean }[];
  variants?: {
    id: string;
    size: string | null;
    colorName: string | null;
    colorHex: string | null;
    sku: string | null;
    stock: number;
  }[];
};

export const seedProducts: Product[] = [
  { id: 1, slug: 'running-shoes', name: 'Running Shoes', price: 7499, category: 'footwear', image: '/image/shoe.jpg', discount: 15, description: 'Lightweight everyday trainers with a cushioned sole for walks, workouts and the miles in between.', stock: 18, sku: 'KLT-FT-001' },
  { id: 2, slug: 'smartphone', name: 'Smartphone', price: 74999, category: 'electronics', image: '/image/phone.jpg', discount: 0, description: 'A capable everyday smartphone with a vivid display, reliable battery and plenty of room for your essentials.', stock: 8, sku: 'KLT-EL-002' },
  { id: 3, slug: 'guitar', name: 'Guitar', price: 18999, category: 'instruments', image: '/image/guitar.jpg', discount: 10, description: 'A versatile acoustic guitar with a warm, balanced tone for practice, songwriting and small gatherings.', stock: 11, sku: 'KLT-IN-003' },
  { id: 4, slug: 'jeans', name: 'Jeans', price: 4499, category: 'clothing', image: '/image/jeans.jpg', discount: 20, description: 'A dependable denim staple with a comfortable everyday fit and easy-to-style wash.', stock: 24, sku: 'KLT-CL-004' },
  { id: 5, slug: 'shirt', name: 'Shirt', price: 2499, category: 'clothing', image: '/image/shirt.jpg', discount: 0, description: 'A clean, versatile shirt designed for comfortable all-day wear.', stock: 31, sku: 'KLT-CL-005' },
  { id: 6, slug: 'laptop', name: 'Laptop', price: 99999, category: 'electronics', image: '/image/laptop.png', discount: 5, description: 'A practical laptop for everyday productivity, browsing and entertainment.', stock: 6, sku: 'KLT-EL-006' },
  { id: 7, slug: 'backpack', name: 'Backpack', price: 4999, category: 'accessories', image: '/image/backpack.webp', discount: 25, description: 'A roomy, hard-wearing backpack for daily commutes, classes and weekend plans.', stock: 14, sku: 'KLT-AC-007' },
  { id: 8, slug: 'boot', name: 'Boot', price: 7999, category: 'footwear', image: '/image/boot.png', discount: 12, description: 'A sturdy everyday boot with a supportive fit and a versatile profile.', stock: 9, sku: 'KLT-FT-008' },
  { id: 9, slug: 'headphones', name: 'Headphones', price: 12999, category: 'electronics', image: '/image/headphone2.jpeg', discount: 0, description: 'Comfortable over-ear headphones for focused listening at home or on the move.', stock: 13, sku: 'KLT-EL-009' },
  { id: 10, slug: 'hoodie', name: 'Hoodie', price: 3299, category: 'clothing', image: '/image/hoodie.jpg', discount: 18, description: 'A soft, easy-layer hoodie for cooler mornings and relaxed weekends.', stock: 19, sku: 'KLT-CL-010' },
  { id: 11, slug: 'jersey', name: 'Jersey', price: 3299, category: 'clothing', image: '/image/jersey.webp', discount: 0, description: 'A comfortable sports jersey made for match days and everyday fans.', stock: 16, sku: 'KLT-CL-011' },
  { id: 12, slug: 'backpack-2', name: 'Backpack 2', price: 3299, category: 'accessories', image: '/image/backpack2.jpg', discount: 30, description: 'A compact everyday carry bag with useful storage for your daily essentials.', stock: 7, sku: 'KLT-AC-012' },
  { id: 13, slug: 'football-shirt', name: 'Football Shirt', price: 3299, category: 'clothing', image: '/image/football-shirt.webp', discount: 8, description: 'A lightweight football shirt for training sessions, game days and casual wear.', stock: 22, sku: 'KLT-CL-013' },
  { id: 14, slug: 'jacket', name: 'Jacket', price: 6999, category: 'clothing', image: '/image/jacket.jpg', discount: 0, description: 'A versatile outer layer built for easy styling through changing weather.', stock: 10, sku: 'KLT-CL-014' },
  { id: 15, slug: 'sniker', name: 'Sniker', price: 3499, category: 'footwear', image: '/image/snicker.jpg', discount: 22, description: 'An everyday sneaker with a simple profile and a comfortable, flexible feel.', stock: 12, sku: 'KLT-FT-015' },
];

export const products = seedProducts;
export const categories = [...new Set(seedProducts.map((product) => product.category))];

export function sellingPrice(price: number, discount: number) {
  return Number((price * (1 - discount / 100)).toFixed(2));
}

export function discountedPrice(product: Pick<Product, 'price' | 'discount' | 'mrp'>) {
  return sellingPrice(product.price, product.discount);
}