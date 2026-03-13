export const stripePublishableKey =
  (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY ??
  (import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY ??
  '';

