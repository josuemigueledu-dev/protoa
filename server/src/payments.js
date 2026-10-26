// Payments adapter. The server only asks one question: which plan is this user on?
// Real providers (App Store, Play Billing, web checkout via RevenueCat or Stripe) implement the same
// interface once the owner picks them in docs/specs/launch-plan.md; none exists yet.
//
//   planOf(userId) -> 'free' | 'plus'

// For tests and local development: plans are set by hand.
export function fakePayments(plans = {}) {
  const map = new Map(Object.entries(plans));
  return {
    name: 'fake',
    async planOf(userId) { return map.get(userId) || 'free'; },
    set(userId, plan) { map.set(userId, plan); },
  };
}

// Used while no provider is configured: everyone is on the free plan.
export const freeForAll = { name: 'none', async planOf() { return 'free'; } };

const stub = name => ({
  name,
  async planOf() { throw new Error(`${name} payments are not implemented yet`); },
});
export const appStorePayments = () => stub('app-store');
export const playBillingPayments = () => stub('play-billing');
export const webCheckoutPayments = () => stub('web-checkout');
