import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Account, CreateAccountDTO, UpdateAccountDTO, DepositDTO, WithdrawalDTO, AccountTransaction, PaginationMeta } from '@shop/shared';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

interface AccountTransactionListResponse {
  items: AccountTransaction[];
  pagination: PaginationMeta;
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
  };
}

/**
 * Fetch all accounts.
 */
export const getAccounts = async (): Promise<Account[]> => {
  const response = await api.get('/accounts');
  return response.data.data;
};

/**
 * Fetch single account by ID.
 */
export const getAccountById = async (id: string): Promise<Account> => {
  const response = await api.get(`/accounts/${id}`);
  return response.data.data;
};

/**
 * Create a new account.
 */
export const createAccount = async (data: CreateAccountDTO): Promise<Account> => {
  const response = await api.post('/accounts', data);
  return response.data.data;
};

/**
 * Update account settings and credentials.
 */
export const updateAccount = async (
  id: string, 
  data: UpdateAccountDTO & { credentials?: { merchantId?: string; apiKey?: string; secret?: string } }
): Promise<Account> => {
  const response = await api.put(`/accounts/${id}`, data);
  return response.data.data;
};

/**
 * Record a manual deposit.
 */
export const deposit = async (id: string, data: DepositDTO): Promise<{ account: Account; transaction: any }> => {
  const response = await api.post(`/accounts/${id}/deposit`, data);
  return response.data.data;
};

/**
 * Record a manual withdrawal.
 */
export const withdraw = async (id: string, data: WithdrawalDTO): Promise<{ account: Account; transaction: any }> => {
  const response = await api.post(`/accounts/${id}/withdraw`, data);
  return response.data.data;
};

/**
 * Trigger account sync simulation.
 */
export const syncAccount = async (id: string): Promise<{ message: string; fallback: boolean }> => {
  const response = await api.post(`/accounts/${id}/sync`);
  return response.data.data;
};

/**
 * Fetch account transaction history with pagination.
 */
export const getAccountTransactions = async (
  accountId: string,
  params?: {
    type?: 'DEPOSIT' | 'WITHDRAWAL';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }
): Promise<AccountTransactionListResponse> => {
  const queryParams = new URLSearchParams();
  if (params) {
    if (params.type) queryParams.append('type', params.type);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
  }
  const response = await api.get(`/accounts/${accountId}/transactions?${queryParams.toString()}`);
  return response.data.data;
};

export default {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deposit,
  withdraw,
  syncAccount,
  getAccountTransactions,
};
