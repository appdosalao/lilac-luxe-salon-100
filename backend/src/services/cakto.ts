import axios from 'axios';

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

type CaktoOrder = {
  id: string;
  refId?: string | null;
  status?: string | null;
  type?: string | null;
  subscription?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    docType?: string | null;
    docNumber?: string | null;
  } | null;
  product?: {
    id?: string | null;
    name?: string | null;
    type?: string | null;
  } | null;
  offer?: {
    id?: string | null;
    name?: string | null;
  } | null;
  sck?: string | null;
};

const baseUrl = 'https://api.cakto.com.br';

let cachedToken: { value: string; expiresAtMs: number } | null = null;

const getAccessToken = async (): Promise<string | null> => {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs > now + 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.CAKTO_CLIENT_ID ?? '';
  const clientSecret = process.env.CAKTO_CLIENT_SECRET ?? '';
  if (!clientId || !clientSecret) return null;

  const form = new URLSearchParams();
  form.set('client_id', clientId);
  form.set('client_secret', clientSecret);

  const res = await axios.post<TokenResponse>(`${baseUrl}/public_api/token/`, form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15_000
  });

  const accessToken = res.data?.access_token;
  const expiresIn = Number(res.data?.expires_in ?? 0);
  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) return null;

  cachedToken = { value: accessToken, expiresAtMs: now + expiresIn * 1000 };
  return accessToken;
};

const api = axios.create({ baseURL: `${baseUrl}/public_api`, timeout: 15_000 });

export const caktoGetOrder = async (orderId: string): Promise<CaktoOrder | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await api.get<CaktoOrder>(`/orders/${orderId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.data?.id) return null;
    return res.data;
  } catch {
    return null;
  }
};

export const caktoFindOrderByRefId = async (refId: string): Promise<CaktoOrder | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await api.get<{ results?: CaktoOrder[] }>(`/orders/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { refId }
    });
    const first = res.data?.results?.[0];
    if (!first?.id) return null;
    return first;
  } catch {
    return null;
  }
};

