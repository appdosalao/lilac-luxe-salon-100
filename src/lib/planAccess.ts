export type PlanoTipo = 'mensal' | 'vitalicio';

export type PaymentStatus = 'trial' | 'active' | 'overdue' | 'cancelled' | 'pending' | null;

export type LocalPlanState = {
  planType: PlanoTipo | null;
  isActive: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  planExpiresAt: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  paymentStatus: PaymentStatus;
};

export const getPlanStorageKey = (userId: string) => `plan:${userId}`;

export const readLocalPlanState = (userId: string): LocalPlanState | null => {
  try {
    const raw = localStorage.getItem(getPlanStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as LocalPlanState;
  } catch {
    return null;
  }
};

export const writeLocalPlanState = (userId: string, state: LocalPlanState) => {
  localStorage.setItem(getPlanStorageKey(userId), JSON.stringify(state));
};

export const isTrialValid = (state: LocalPlanState | null) => {
  if (!state) return false;
  if (state.paymentStatus !== 'trial') return false;
  if (!state.trialEndDate) return false;
  return new Date(state.trialEndDate).getTime() > Date.now();
};

export const checkUserAccess = (state: LocalPlanState | null) => {
  if (!state) return false;
  return state.isActive === true || isTrialValid(state);
};

export const getTrialDaysRemaining = (trialEndDate: string | null) => {
  if (!trialEndDate) return 0;
  const end = new Date(trialEndDate).getTime();
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

