type CheckoutParams = {
  baseUrl: string;
  sck: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  redirectUrl?: string | null;
};

export const buildCaktoCheckoutUrl = ({ baseUrl, sck, name, email, phone, redirectUrl }: CheckoutParams) => {
  const url = new URL(baseUrl);
  url.searchParams.set('sck', sck);
  if (name) url.searchParams.set('name', name);
  if (email) {
    url.searchParams.set('email', email);
    url.searchParams.set('confirmEmail', email);
  }
  if (phone) url.searchParams.set('phone', phone);
  if (redirectUrl) url.searchParams.set('redirect_url', redirectUrl);
  return url.toString();
};

