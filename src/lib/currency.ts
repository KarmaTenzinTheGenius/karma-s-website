export const CURRENCY_CODE = 'BTN';
export const CURRENCY_SYMBOL = 'Nu.';
export const CURRENCY_NAME = 'Bhutanese Ngultrum';
export const CURRENCY_LOCALE = 'en-BT';

export const FREE_SHIPPING_THRESHOLD = 2500;
export const STANDARD_SHIPPING_FEE = 150;
export const EXPRESS_SHIPPING_FEE = 450;
export const COD_FEE = 100;

export function formatMoney(amount: number) {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY_SYMBOL} ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function roundMoney(amount: number) {
  return Number(amount.toFixed(2));
}
