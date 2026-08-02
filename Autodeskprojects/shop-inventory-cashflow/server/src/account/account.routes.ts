import { Router } from 'express';
import { AccountController } from './account.controller';
import { AuthMiddleware } from '../auth/auth.middleware';
import { auditLogMiddleware } from '../middleware/audit';

const router = Router();
const accountController = new AccountController();
const authMiddleware = new AuthMiddleware();

// All account routes are protected
router.use(authMiddleware.authenticate);

router.get('/', accountController.getAccounts);
router.post('/', accountController.createAccount);
router.get('/:id', accountController.getAccountById);
router.put('/:id', accountController.updateAccount);
router.post('/:id/deposit', auditLogMiddleware('DEPOSIT', 'Account'), accountController.deposit);
router.post('/:id/withdraw', auditLogMiddleware('WITHDRAWAL', 'Account'), accountController.withdraw);
router.post('/:id/sync', accountController.sync);
router.get('/:id/transactions', accountController.getAccountTransactions);

export default router;
