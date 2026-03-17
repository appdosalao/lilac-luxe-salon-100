import axios from 'axios';

const env = (process.env.ASAAS_ENV || 'sandbox').toLowerCase();
const baseURL = env === 'production' ? 'https://www.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3';

export const asaas = axios.create({
  baseURL,
  headers: {
    access_token: process.env.ASAAS_API_KEY ?? '',
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

