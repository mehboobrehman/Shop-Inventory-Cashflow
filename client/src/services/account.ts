import apiClient from './apiClient';
import { Account, AccountTransaction } from '@shop/shared';

export interface CreateAccountDTO {
  type: string;
  name: string;
  initialBalance?: number;
  credentials?: {
    merchantId?: string;
    apiKey?: string;
    secret?: string;
  };
}

export interface UpdateAccountDTO {
  name?: string;
  autoSyncEnabled?: boolean;
  credentials?: {
    merchantId?: string;
    apiKey?: string;
    secret?: string;
  };
}

export interface TransferDTO {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
}

export interface AccountTransactionQuery {
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AccountTransactionResult {
  items: AccountTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
  };
}

export const getAccounts = async (): Promise<Account[]> => {
  const response = await apiClient.get('/accounts');
  return response.data.data;
};

export const getAccountById = async (id: string): Promise<Account> => {
  const response = await apiClient.get(`/accounts/${id}`);
  return response.data.data;
};

export const createAccount = async (data: CreateAccountDTO): Promise<Account> => {
  const response = await apiClient.post('/accounts', data);
  return response.data.data;
};

export const updateAccount = async (id: string, data: UpdateAccountDTO): Promise<Account> => {
  const response = await apiClient.put(`/accounts/${id}`, data);
  return response.data.data;
};

export const deposit = async (id: string, data: { amount: number; description?: string } | number): Promise<{ account: Account; transaction: AccountTransaction }> => {
  const payload = typeof data === 'number' ? { amount: data } : data;
  const response = await apiClient.post(`/accounts/${id}/deposit`, payload);
  return response.data.data;
};

export const withdraw = async (id: string, data: { amount: number; description?: string } | number): Promise<{ account: Account; transaction: AccountTransaction }> => {
  const payload = typeof data === 'number' ? { amount: data } : data;
  const response = await apiClient.post(`/accounts/${id}/withdraw`, payload);
  return response.data.data;
};

export const syncAccount = async (id: string): Promise<any> => {
  const response = await apiClient.post(`/accounts/${id}/sync`);
  return response.data.data;
};

export const getAccountTransactions = async (accountId: string, query?: AccountTransactionQuery | number): Promise<AccountTransactionResult> => {
  const params: any = {};
  if (typeof query === 'number') {
    params.limit = query;
  } else if (query) {
    if (query.type) params.type = query.type;
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
  }
  const response = await apiClient.get(`/accounts/${accountId}/transactions`, { params });
  return response.data.data;
};

export const transferFunds = async (data: TransferDTO): Promise<any> => {
  const response = await apiClient.post('/accounts/transfer', data);
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
  transferFunds,
};
