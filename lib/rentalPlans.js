// The four rental plans offered per course.
// Keys match `rentalPlanSchema` in lib/validations.js and the price fields on Course.
export const RENTAL_PLANS = [
  { id: "15d", label: "15 days", days: 15, priceField: "price15dCents" },
  { id: "1mo", label: "1 month", days: 30, priceField: "price1moCents" },
  { id: "1yr", label: "1 year", days: 365, priceField: "price1yrCents" },
  { id: "2yr", label: "2 years", days: 730, priceField: "price2yrCents" },
];

export function getPlan(id) {
  return RENTAL_PLANS.find((p) => p.id === id) ?? null;
}

export function formatPriceCents(cents) {
  if (cents == null) return null;
  return `$${(cents / 100).toFixed(2)}`;
}
