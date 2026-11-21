const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatPrice(value) {
  const number = Number(value);

  return currencyFormatter.format(Number.isFinite(number) ? number : 0);
}

export function formatCount(value) {
  const number = Number(value);

  return compactNumberFormatter.format(Number.isFinite(number) ? number : 0);
}
