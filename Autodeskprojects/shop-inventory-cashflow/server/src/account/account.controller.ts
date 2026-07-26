import { Request, Response } from 'express';
import { z } from 'zod';
import { AccountService } from './account.service';
import { success, error, validationError } from '../utils/response.util';
import { AccountType } from '@shop/shared';

const accountService = new AccountService();

// Zod schemas for validation
const CreateAccountSchema = z.object({
  type: z.nativeEnum(AccountType, { required_error: 'Type is required' }),
  name: z.string().min(1, 'Name is required'),
  initialBalance: z.number().min(0, 'Initial balance cannot be negative').optional(),
  credentials: z.object({
    merchantId: z.string().optional(),
    apiKey: z.string().optional(),
    secret: z.string().optional(),
  }).optional(),
});

const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  autoSyncEnabled: z.boolean().optional(),
  credentials: z.object({
    merchantId: z.string().optional(),
    apiKey: z.string().optional(),
    secret: z.string().optional(),
  }).optional(),
});

const DepositWithdrawSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  description: z.string().optional(),
});

export class AccountController {
  async getAccounts(_req: Request, res: Response) {
    try {
      const accounts = await accountService.getAccounts();
      return res.json(success(accounts));
    } catch (err: any) {
      console.error('Get accounts error:', err);
      return res.status(500).json(error('Failed to retrieve accounts'));
    }
  }

  async getAccountById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await accountService.getAccountById(id);
      if (!account) {
        return res.status(404).json(error('Account not found'));
      }
      return res.json(success(account));
    } catch (err: any) {
      console.error('Get account error:', err);
      return res.status(500).json(error('Failed to retrieve account'));
    }
  }

  async createAccount(req: Request, res: Response) {
    try {
      const parsed = CreateAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(i => i.message);
        return res.status(400).json(validationError(errorMessages));
      }

      const account = await accountService.createAccount(parsed.data);
      return res.status(201).json(success(account));
    } catch (err: any) {
      console.error('Create account error:', err);
      if (err.message === 'Account name already exists') {
        return res.status(409).json(error(err.message));
      }
      return res.status(500).json(error('Failed to create account'));
    }
  }

  async updateAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = UpdateAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(i => i.message);
        return res.status(400).json(validationError(errorMessages));
      }

      const account = await accountService.updateAccount(id, parsed.data);
      if (!account) {
        return res.status(404).json(error('Account not found'));
      }
      return res.json(success(account));
    } catch (err: any) {
      console.error('Update account error:', err);
      return res.status(500).json(error('Failed to update account'));
    }
  }

  async deposit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = DepositWithdrawSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(i => i.message);
        return res.status(400).json(validationError(errorMessages));
      }

      const result = await accountService.deposit(id, parsed.data.amount, parsed.data.description);
      return res.json(success(result));
    } catch (err: any) {
      console.error('Deposit error:', err);
      if (err.message === 'Account not found') {
        return res.status(404).json(error(err.message));
      }
      return res.status(500).json(error(err.message || 'Failed to deposit'));
    }
  }

  async withdraw(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = DepositWithdrawSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(i => i.message);
        return res.status(400).json(validationError(errorMessages));
      }

      const result = await accountService.withdraw(id, parsed.data.amount, parsed.data.description);
      return res.json(success(result));
    } catch (err: any) {
      console.error('Withdraw error:', err);
      if (err.message === 'Account not found') {
        return res.status(404).json(error(err.message));
      }
      if (err.message === 'Insufficient balance') {
        return res.status(400).json(error(err.message));
      }
      return res.status(500).json(error(err.message || 'Failed to withdraw'));
    }
  }

  async sync(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await accountService.getAccountById(id);
      if (!account) {
        return res.status(404).json(error('Account not found'));
      }
      // Stub for merchant API sync
      return res.json(success({
        message: 'API sync not implemented yet. Please use manual deposit/withdrawal.',
        fallback: true
      }));
    } catch (err: any) {
      console.error('Sync error:', err);
      return res.status(500).json(error('Failed to sync account'));
    }
  }

  async getAccountTransactions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Verify account exists
      const account = await accountService.getAccountById(id);
      if (!account) {
        return res.status(404).json(error('Account not found'));
      }
      // Parse query parameters
      const { type, startDate, endDate, page, limit } = req.query;
      const result = await accountService.getAccountTransactions(id, {
        type: type as any,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.json(success(result));
    } catch (err: any) {
      console.error('Get account transactions error:', err);
      return res.status(500).json(error('Failed to retrieve transactions'));
    }
  }
}
