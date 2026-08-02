import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../utils/crypto.util';
import { AccountType, TransactionType, TransactionSource } from '@shop/shared';
import { Prisma } from '../generated/prisma';

export class AccountService {
  private maskCredentials(encryptedStr: string | null) {
    if (!encryptedStr) return { merchantId: '', apiKey: '', secret: '' };
    try {
      const decrypted = decrypt(encryptedStr);
      const creds = JSON.parse(decrypted);
      return {
        merchantId: creds.merchantId ? '********' : '',
        apiKey: creds.apiKey ? '********' : '',
        secret: creds.secret ? '********' : '',
      };
    } catch (e) {
      console.error('Error decrypting credentials:', e);
      return { merchantId: '', apiKey: '', secret: '' };
    }
  }

  private mapToAccountResponse(account: any): any {
    return {
      id: account.id,
      type: account.type as AccountType,
      name: account.name,
      currentBalance: typeof account.currentBalance === 'object' && account.currentBalance.toNumber 
        ? account.currentBalance.toNumber() 
        : Number(account.currentBalance),
      autoSyncEnabled: account.autoSyncEnabled,
      lastSyncAt: account.lastSyncAt ? account.lastSyncAt.toISOString() : null,
      credentials: this.maskCredentials(account.encryptedCredentials),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  async getAccounts(): Promise<any[]> {
    const accounts = await prisma.account.findMany({
      orderBy: { type: 'asc' },
    });
    return accounts.map(account => this.mapToAccountResponse(account));
  }

  async getAccountById(id: string): Promise<any | null> {
    const account = await prisma.account.findUnique({
      where: { id },
    });
    if (!account) return null;
    return this.mapToAccountResponse(account);
  }

  async createAccount(input: { 
    type: AccountType; 
    name: string; 
    initialBalance?: number;
    credentials?: { merchantId?: string; apiKey?: string; secret?: string };
  }): Promise<any> {
    // Check for duplicate account name
    const existing = await prisma.account.findFirst({
      where: { name: input.name },
    });
    if (existing) {
      throw new Error('Account name already exists');
    }

    // Encrypt credentials if provided
    let encryptedCredentials: string | undefined;
    if (input.credentials && (input.credentials.merchantId || input.credentials.apiKey || input.credentials.secret)) {
      const credsToEncrypt = {
        merchantId: input.credentials.merchantId || '',
        apiKey: input.credentials.apiKey || '',
        secret: input.credentials.secret || '',
      };
      encryptedCredentials = encrypt(JSON.stringify(credsToEncrypt));
    }

    const account = await prisma.account.create({
      data: {
        type: input.type,
        name: input.name,
        currentBalance: input.initialBalance ? new Prisma.Decimal(input.initialBalance) : new Prisma.Decimal(0),
        autoSyncEnabled: false,
        encryptedCredentials,
      },
    });
    return this.mapToAccountResponse(account);
  }

  async updateAccount(
    id: string,
    input: { name?: string; autoSyncEnabled?: boolean; credentials?: { merchantId?: string; apiKey?: string; secret?: string } }
  ): Promise<any | null> {
    const existing = await prisma.account.findUnique({
      where: { id },
    });
    if (!existing) return null;

    let encryptedCredentials = existing.encryptedCredentials;
    if (input.credentials) {
      let existingCreds: any = {};
      if (existing.encryptedCredentials) {
        try {
          existingCreds = JSON.parse(decrypt(existing.encryptedCredentials));
        } catch (e) {
          // ignore
        }
      }

      const updatedCreds = {
        merchantId: input.credentials.merchantId && input.credentials.merchantId !== '********' 
          ? input.credentials.merchantId 
          : existingCreds.merchantId,
        apiKey: input.credentials.apiKey && input.credentials.apiKey !== '********' 
          ? input.credentials.apiKey 
          : existingCreds.apiKey,
        secret: input.credentials.secret && input.credentials.secret !== '********' 
          ? input.credentials.secret 
          : existingCreds.secret,
      };

      encryptedCredentials = encrypt(JSON.stringify(updatedCreds));
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        autoSyncEnabled: input.autoSyncEnabled !== undefined ? input.autoSyncEnabled : existing.autoSyncEnabled,
        encryptedCredentials,
      },
    });

    return this.mapToAccountResponse(updatedAccount);
  }

  async deposit(id: string, amount: number, description?: string): Promise<any> {
    return prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id },
      });
      if (!account) {
        throw new Error('Account not found');
      }

      // Convert currentBalance to Decimal robustly
      const rawBalance = account.currentBalance;
      const balanceBefore: Prisma.Decimal = rawBalance instanceof Prisma.Decimal
        ? rawBalance
        : new Prisma.Decimal(rawBalance);
      const amountDecimal = new Prisma.Decimal(amount);
      const balanceAfter = balanceBefore.add(amountDecimal);

      // Update account balance
      const updatedAccount = await tx.account.update({
        where: { id },
        data: {
          currentBalance: balanceAfter,
        },
      });

      // Create transaction record
      const transaction = await tx.accountTransaction.create({
        data: {
          accountId: id,
          type: TransactionType.DEPOSIT,
          amount: amountDecimal,
          balanceBefore,
          balanceAfter,
          source: TransactionSource.MANUAL,
          description: description || null,
        },
      });

      return {
        account: this.mapToAccountResponse(updatedAccount),
        transaction: {
          ...transaction,
          amount: transaction.amount.toNumber(),
          balanceBefore: transaction.balanceBefore.toNumber(),
          balanceAfter: transaction.balanceAfter.toNumber(),
          createdAt: transaction.createdAt.toISOString(),
        },
      };
    });
  }

  async withdraw(id: string, amount: number, description?: string): Promise<any> {
    return prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id },
      });
      if (!account) {
        throw new Error('Account not found');
      }

      const rawBalance = account.currentBalance;
      const balanceBefore: Prisma.Decimal = rawBalance instanceof Prisma.Decimal
        ? rawBalance
        : new Prisma.Decimal(rawBalance);
      const amountDecimal = new Prisma.Decimal(amount);
      if (balanceBefore.lt(amountDecimal)) {
        throw new Error('Insufficient balance');
      }
      const balanceAfter = balanceBefore.sub(amountDecimal);

      // Update account balance
      const updatedAccount = await tx.account.update({
        where: { id },
        data: {
          currentBalance: balanceAfter,
        },
      });

      // Create transaction record
      const transaction = await tx.accountTransaction.create({
        data: {
          accountId: id,
          type: TransactionType.WITHDRAWAL,
          amount: amountDecimal,
          balanceBefore,
          balanceAfter,
          source: TransactionSource.MANUAL,
          description: description || null,
        },
      });

      return {
        account: this.mapToAccountResponse(updatedAccount),
        transaction: {
          ...transaction,
          amount: transaction.amount.toNumber(),
          balanceBefore: transaction.balanceBefore.toNumber(),
          balanceAfter: transaction.balanceAfter.toNumber(),
          createdAt: transaction.createdAt.toISOString(),
        },
      };
    });
  }

  async getAccountTransactions(
    accountId: string,
    query: {
      type?: TransactionType;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ 
    items: Array<{
      id: string;
      accountId: string;
      type: TransactionType;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      source: TransactionSource;
      description: string | null;
      saleId: string | null;
      createdAt: string;
    }>;
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
  }> {
    const where: any = { accountId };
    if (query.type) {
      where.type = query.type;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const limit = query.limit || 20;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    // For summary totals, we consider the same WHERE clause (including type filter if present)
    const [total, transactions, depositsAgg, withdrawalsAgg] = await Promise.all([
      prisma.accountTransaction.count({ where }),
      prisma.accountTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.accountTransaction.aggregate({
        where: { ...where, type: TransactionType.DEPOSIT },
        _sum: { amount: true },
      }),
      prisma.accountTransaction.aggregate({
        where: { ...where, type: TransactionType.WITHDRAWAL },
        _sum: { amount: true },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const items = transactions.map(t => ({
      id: t.id,
      accountId: t.accountId,
      type: t.type as TransactionType,
      amount: t.amount.toNumber(),
      balanceBefore: t.balanceBefore.toNumber(),
      balanceAfter: t.balanceAfter.toNumber(),
      source: t.source as TransactionSource,
      description: t.description,
      saleId: t.saleId,
      createdAt: t.createdAt.toISOString(),
    }));

    const totalDeposits = depositsAgg._sum.amount?.toNumber() ?? 0;
    const totalWithdrawals = withdrawalsAgg._sum.amount?.toNumber() ?? 0;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalDeposits,
        totalWithdrawals,
      },
    };
  }
}
