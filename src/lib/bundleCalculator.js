/**
 * Cascading bundle price calculator — shared by create-payment-intent and create-checkout-session.
 *
 * Algorithm (greedy, largest pack first):
 *   For 16 items with bundles [(7,2499),(5,1799),(3,1099)] and single price 199:
 *     floor(16/7) = 2 packs → 2×2499 = 4998, remaining = 2
 *     floor(2/5)  = 0 packs
 *     floor(2/3)  = 0 packs
 *     2 singles   → 2×199  = 398
 *     total       = 5396 pence (£53.96)
 *
 * @param {number}  totalQty          - Total number of bottles in cart / order
 * @param {Array}   activeBundles     - [{ id, name, badge_text, min_qty, total_price_pence }]
 * @param {number}  avgSinglePencePer - Per-bottle price for remaining items (pence)
 * @returns {{ totalPence, breakdown, hasBundles }}
 *   breakdown: [{ label, packs, priceEach, subtotalPence }]
 */
export function applyBundles(totalQty, activeBundles, avgSinglePencePer) {
  if (!activeBundles?.length || totalQty === 0) {
    return {
      totalPence:  totalQty * avgSinglePencePer,
      breakdown:   [{ label: `${totalQty} × bottle`, packs: totalQty, priceEach: avgSinglePencePer, subtotalPence: totalQty * avgSinglePencePer }],
      hasBundles:  false,
    };
  }

  // Sort largest first for greedy application
  const sorted = [...activeBundles].sort((a, b) => b.min_qty - a.min_qty);

  let remaining  = totalQty;
  let totalPence = 0;
  const breakdown = [];

  for (const bundle of sorted) {
    const packs = Math.floor(remaining / bundle.min_qty);
    if (packs > 0) {
      const subtotal = packs * bundle.total_price_pence;
      totalPence    += subtotal;
      remaining     -= packs * bundle.min_qty;
      breakdown.push({
        label:         bundle.badge_text || bundle.name,
        bundleId:      bundle.id,
        packs,
        priceEach:     bundle.total_price_pence,
        subtotalPence: subtotal,
      });
    }
  }

  if (remaining > 0) {
    const subtotal = remaining * avgSinglePencePer;
    totalPence    += subtotal;
    breakdown.push({
      label:         `Single bottle${remaining > 1 ? 's' : ''}`,
      bundleId:      'single',
      packs:         remaining,
      priceEach:     avgSinglePencePer,
      subtotalPence: subtotal,
    });
  }

  return { totalPence, breakdown, hasBundles: true };
}
