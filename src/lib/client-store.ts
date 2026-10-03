export type CartLine = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  discount: number;
};

const CART_KEY = 'karma-cart';
const WISHLIST_KEY = 'karma-wishlist';

export function readCart(): CartLine[] {
  try {
    const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeCart(cart: CartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('karma-store-change'));
}

export function readWishlist(): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    return Array.isArray(value) ? value.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

export function writeWishlist(wishlist: number[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  window.dispatchEvent(new Event('karma-store-change'));
}

export function addProductToCart(product: Omit<CartLine, 'quantity'>, quantity = 1) {
  const cart = readCart();
  const existing = cart.find((line) => line.id === product.id);
  if (existing) existing.quantity = Math.min(existing.quantity + quantity, 99);
  else cart.push({ ...product, quantity });
  writeCart(cart);
}