import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sellingPrice } from '@/lib/products';
import { getAdminSession, getCustomerSession } from '@/lib/auth-server';
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  EXPRESS_SHIPPING_FEE,
  COD_FEE,
  roundMoney,
} from '@/lib/currency';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateOrderNumber() {
  let suffix = '';
  for (let index = 0; index < 8; index += 1) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `KLT-${suffix}`;
}

type IncomingItem = { id?: unknown; quantity?: unknown; variantId?: unknown };

export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Please sign in to place an order.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
  if (rawItems.length === 0) {
    return NextResponse.json({ success: false, message: 'Your bag is empty.' }, { status: 400 });
  }

  const customer = body?.customer && typeof body.customer === 'object' ? (body.customer as Record<string, string>) : {};
  const email = typeof customer.email === 'string' ? customer.email.trim().toLowerCase() : '';
  if (!email) {
    return NextResponse.json({ success: false, message: 'An email address is required for your order.' }, { status: 400 });
  }

  const paymentMethod = body?.paymentMethod === 'cod' ? 'cod' : 'mbob';
  const shippingMethod = body?.shippingMethod === 'express' ? 'express' : 'standard';
  const couponCode = typeof body?.coupon === 'string' ? body.coupon.trim().toUpperCase() : '';

  try {
    const productIds = rawItems.map((item) => Number(item.id)).filter((id) => Number.isInteger(id));
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, status: 'ACTIVE' },
      include: { variants: { where: { isActive: true } } },
    });

    const lines: { productId: number; variantId: string | null; size: string | null; colorName: string | null; name: string; sku: string; quantity: number; unitPrice: number }[] = [];
    for (const item of rawItems) {
      const id = Number(item.id);
      const quantity = Number(item.quantity);
      const product = dbProducts.find((entry) => entry.id === id);
      if (!product) {
        return NextResponse.json({ success: false, message: 'One or more items are no longer available.' }, { status: 400 });
      }
      const variant = typeof item.variantId === 'string'
        ? product.variants.find((entry) => entry.id === item.variantId)
        : null;
      if ((product.variants.length || item.variantId !== undefined && item.variantId !== null) && !variant) {
        return NextResponse.json({ success: false, message: `Choose an available size or colour for ${product.name}.` }, { status: 400 });
      }
      const currentStock = variant?.stock ?? product.stock;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > currentStock) {
        return NextResponse.json(
          { success: false, message: `${product.name} is only available in a quantity of ${currentStock}.` },
          { status: 400 },
        );
      }
      const unitPrice = roundMoney(sellingPrice(Number(product.price), product.discount));
      lines.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        size: variant?.size ?? null,
        colorName: variant?.colorName ?? null,
        name: product.name,
        sku: variant?.sku ?? product.sku,
        quantity,
        unitPrice,
      });
    }

    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));

    let discount = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      const now = new Date();
      const usable =
        coupon &&
        coupon.isActive &&
        (!coupon.startsAt || coupon.startsAt <= now) &&
        (!coupon.expiresAt || coupon.expiresAt >= now) &&
        (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
        subtotal >= Number(coupon.minimumAmount);

      if (!usable) {
        return NextResponse.json({ success: false, message: 'That coupon code cannot be applied to this order.' }, { status: 400 });
      }
      const amountOff = coupon.amountOff ? Number(coupon.amountOff) : 0;
      const percentOff = coupon.percentOff ? roundMoney((subtotal * coupon.percentOff) / 100) : 0;
      discount = Math.min(subtotal, Math.max(amountOff, percentOff));
      couponId = coupon.id;
    }

    const shipping = shippingMethod === 'express'
      ? EXPRESS_SHIPPING_FEE
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING_FEE;
    const codFee = paymentMethod === 'cod' ? COD_FEE : 0;
    const total = roundMoney(subtotal - discount + shipping + codFee);

    const order = await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        if (line.variantId) {
          const variantUpdate = await tx.productVariant.updateMany({
            where: { id: line.variantId, productId: line.productId, isActive: true, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (!variantUpdate.count) throw new Error(`Insufficient stock for ${line.name}.`);
        }
        const updated = await tx.product.updateMany({
          where: {
            id: line.productId,
            isActive: true,
            status: 'ACTIVE',
            stock: { gte: line.quantity },
          },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`Insufficient stock for ${line.name}.`);
        }
      }

      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.userId,
          email,
          status: paymentMethod === 'cod' ? 'CONFIRMED' : 'PENDING',
          paymentMethod,
          paymentStatus: 'PENDING',
          subtotal,
          discount,
          shipping: roundMoney(shipping + codFee),
          total,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              name: line.name,
              sku: line.sku,
              size: line.size,
              colorName: line.colorName,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
          },
        },
        include: { items: true },
      });
      await tx.stockMovement.createMany({
        data: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          change: -line.quantity,
          reason: 'order_placed',
          orderId: created.id,
        })),
      });

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: order.orderNumber,
          total: Number(order.total),
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          shipping: Number(order.shipping),
          paymentMethod: order.paymentMethod,
          status: order.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Order placement failed.', error);
    const message = error instanceof Error && error.message.startsWith('Insufficient stock')
      ? error.message
      : 'Your order could not be placed. Please try again.';
    return NextResponse.json({ success: false, message }, { status: 409 });
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Admin access is required.' }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { items: true },
    });
    return NextResponse.json({
      success: true,
      data: orders.map((order) => ({
        orderId: order.orderNumber,
        email: order.email,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        timestamp: order.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Order listing failed.', error);
    return NextResponse.json({ success: false, message: 'Orders could not be loaded.' }, { status: 503 });
  }
}
