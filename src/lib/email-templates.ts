function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
}

function emailFrame(title: string, content: string) {
  return `<!doctype html><html lang="en"><body style="margin:0;background:#f7f4f2;font-family:Arial,sans-serif;color:#27212d"><main style="max-width:600px;margin:32px auto;padding:32px;background:#fff"><p style="color:#563b63;font-size:12px;letter-spacing:2px;font-weight:bold">KARMA LOKDRUEL TSHONGLEY</p><h1 style="font-size:24px">${escapeHtml(title)}</h1>${content}<p style="border-top:1px solid #e9e3e8;padding-top:16px;color:#766f78;font-size:12px">Questions? Reply to this email or visit our contact page.</p></main></body></html>`;
}

export function orderConfirmationEmail(order: { orderId: string; name: string; total: number }) {
  return { subject: `Order received: ${order.orderId}`, html: emailFrame('Thanks for your order.', `<p>Hello ${escapeHtml(order.name)},</p><p>We received order <strong>${escapeHtml(order.orderId)}</strong>.</p><p>Order total: <strong>$${order.total.toFixed(2)}</strong></p>`) };
}

export function shippedEmail(order: { orderId: string; name: string; trackingNumber: string }) {
  return { subject: `Your order is on its way: ${order.orderId}`, html: emailFrame('Your order has shipped.', `<p>Hello ${escapeHtml(order.name)},</p><p>Order <strong>${escapeHtml(order.orderId)}</strong> is on its way.</p><p>Tracking reference: <strong>${escapeHtml(order.trackingNumber)}</strong></p>`) };
}

export function deliveredEmail(order: { orderId: string; name: string }) {
  return { subject: `Delivered: ${order.orderId}`, html: emailFrame('Your order has arrived.', `<p>Hello ${escapeHtml(order.name)},</p><p>Order <strong>${escapeHtml(order.orderId)}</strong> is marked delivered. We hope it feels right at home.</p>`) };
}

export function abandonedCartEmail(customer: { name: string; cartUrl: string; itemNames: string[] }) {
  const items = customer.itemNames.map((name) => `<li>${escapeHtml(name)}</li>`).join('');
  let safeUrl = 'https://karma-s-website.vercel.app/cart';
  try {
    const parsedUrl = new URL(customer.cartUrl);
    if (parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'karma-s-website.vercel.app') {
      safeUrl = escapeHtml(parsedUrl.toString());
    }
  } catch {
    safeUrl = 'https://karma-s-website.vercel.app/cart';
  }
  return { subject: 'Your saved finds are still here', html: emailFrame('Still thinking it over?', `<p>Hello ${escapeHtml(customer.name)},</p><p>Your bag is waiting with:</p><ul>${items}</ul><p><a href="${safeUrl}" style="color:#563b63">Return to your bag</a></p>`) };
}