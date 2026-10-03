export type DemoOrder = {
  orderId: string;
  userId: string;
  items: { id: number; name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  codFee: number;
  total: number;
  customer: Record<string, string>;
  paymentMethod: string;
  status: string;
  timestamp: string;
};

export const demoOrders = new Map<string, DemoOrder>();
export const demoReviews: { id: string; productId: number; name: string; rating: number; comment: string; createdAt: string }[] = [];

export function validateCoupon(code: string, subtotal: number) {
  if (code.trim().toUpperCase() !== 'FLAT10') return { valid: false, discount: 0, message: 'That coupon code is not valid.' };
  if (subtotal < 50) return { valid: false, discount: 0, message: 'FLAT10 applies to orders over $50.' };
  return { valid: true, discount: Math.min(10, subtotal), message: '$10 discount applied.' };
}