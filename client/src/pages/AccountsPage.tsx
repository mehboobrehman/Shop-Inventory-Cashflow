import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAccounts, deposit, withdraw, updateAccount, syncAccount, createAccount } from '../services/account';
import { Account, AccountType } from '@shop/shared';

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Form states
  const [transactionData, setTransactionData] = useState({
    amount: '',
    description: '',
  });
  const [settingsData, setSettingsData] = useState({
    name: '',
    autoSyncEnabled: false,
    merchantId: '',
    apiKey: '',
    secret: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Account modal state
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [createData, setCreateData] = useState<{
    type: AccountType;
    name: string;
    initialBalance: string;
    merchantId: string;
    apiKey: string;
    secret: string;
  }>({
    type: AccountType.JAZZCASH,
    name: '',
    initialBalance: '',
    merchantId: '',
    apiKey: '',
    secret: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      toast.error('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeposit = (account: Account) => {
    setSelectedAccount(account);
    setTransactionData({ amount: '', description: '' });
    setIsDepositOpen(true);
  };

  const handleOpenWithdraw = (account: Account) => {
    setSelectedAccount(account);
    setTransactionData({ amount: '', description: '' });
    setIsWithdrawOpen(true);
  };

  const handleOpenSettings = (account: Account) => {
    setSelectedAccount(account);
    const creds = account.credentials ?? { merchantId: '', apiKey: '', secret: '' };
    setSettingsData({
      name: account.name,
      autoSyncEnabled: account.autoSyncEnabled,
      merchantId: creds.merchantId,
      apiKey: creds.apiKey,
      secret: creds.secret,
    });
    setIsSettingsOpen(true);
  };

  const handleDepositSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const amountNum = parseFloat(transactionData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      await deposit(selectedAccount.id, {
        amount: amountNum,
        description: transactionData.description || undefined,
      });
      toast.success('Deposit recorded successfully');
      setIsDepositOpen(false);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to complete deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const amountNum = parseFloat(transactionData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount greater than zero');
      return;
    }

    if (amountNum > selectedAccount.currentBalance) {
      toast.error('Insufficient balance in account');
      return;
    }

    try {
      setIsSubmitting(true);
      await withdraw(selectedAccount.id, {
        amount: amountNum,
        description: transactionData.description || undefined,
      });
      toast.success('Withdrawal recorded successfully');
      setIsWithdrawOpen(false);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to complete withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      setIsSubmitting(true);
      await updateAccount(selectedAccount.id, {
        name: settingsData.name,
        autoSyncEnabled: settingsData.autoSyncEnabled,
        credentials: {
          merchantId: settingsData.merchantId || undefined,
          apiKey: settingsData.apiKey || undefined,
          secret: settingsData.secret || undefined,
        },
      });
      toast.success('Account settings updated successfully');
      setIsSettingsOpen(false);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update account settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncClick = async (account: Account) => {
    try {
      toast.info(`Syncing ${account.name}...`);
      const result = await syncAccount(account.id);
      if (result.fallback) {
        toast.warning(result.message);
      } else {
        toast.success(result.message);
      }
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Sync failed');
    }
  };

  const handleOpenCreateAccount = () => {
    setCreateData({
      type: AccountType.JAZZCASH,
      name: '',
      initialBalance: '',
      merchantId: '',
      apiKey: '',
      secret: '',
    });
    setIsCreateAccountOpen(true);
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const initialBalanceNum = createData.initialBalance ? parseFloat(createData.initialBalance) : undefined;
    if (initialBalanceNum !== undefined && (isNaN(initialBalanceNum) || initialBalanceNum < 0)) {
      toast.error('Please enter a valid initial balance');
      return;
    }
    try {
      setIsSubmitting(true);
      await createAccount({
        type: createData.type,
        name: createData.name,
        initialBalance: initialBalanceNum,
        credentials: {
          merchantId: createData.merchantId || undefined,
          apiKey: createData.apiKey || undefined,
          secret: createData.secret || undefined,
        },
      });
      toast.success('Account created successfully');
      setIsCreateAccountOpen(false);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTransactions = (account: Account) => {
    navigate(`/accounts/transactions/${account.id}`);
  };

  const formatPKR = (amount: number) => {
    return `PKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case AccountType.JAZZCASH:
        return (
          <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
            JC
          </div>
        );
      case AccountType.EASYPISA:
        return (
          <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
            EP
          </div>
        );
      case AccountType.BANK:
        return (
          <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
            BK
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
            AC
          </div>
        );
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Account Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your shop balances, record manual transactions, and configure credentials.
          </p>
        </div>
        <button
          onClick={handleOpenCreateAccount}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-colors text-sm"
        >
          + Create Account
        </button>
      </div>

      {/* Visual Balance Summary Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-blue-200">Combined Net Balance</span>
          <div className="text-3xl font-extrabold mt-1 tracking-tight">
            {formatPKR(totalBalance)}
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm text-blue-100">
          <div>
            <span className="text-xs text-blue-300 block">Total Active Accounts</span>
            <span className="font-extrabold text-lg">{accounts.length} Accounts</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
          <p className="font-semibold text-base">No accounts found</p>
          <p className="text-xs text-gray-400 mt-1">Click "+ Create Account" to create your JazzCash, Easypaisa, or Bank account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getAccountIcon(account.type)}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{account.name}</h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 uppercase">
                        {account.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenSettings(account)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title="Account Settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4">
                  <span className="text-gray-500 text-xs block font-medium">Current Balance</span>
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {formatPKR(account.currentBalance)}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span>Auto Sync:</span>
                    <span className={account.autoSyncEnabled ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                      {account.autoSyncEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Synced:</span>
                    <span>{formatDate(account.lastSyncAt)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-5 py-3 flex space-x-2 border-t border-gray-200">
                <button
                  onClick={() => handleOpenDeposit(account)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg shadow-sm text-xs transition-colors text-center"
                >
                  Deposit
                </button>
                <button
                  onClick={() => handleOpenTransactions(account)}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold py-2 px-3 rounded-lg text-xs transition-colors text-center"
                  title="View History"
                >
                  History
                </button>
                <button
                  onClick={() => handleOpenWithdraw(account)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg shadow-sm text-xs transition-colors text-center"
                >
                  Withdraw
                </button>
                <button
                  onClick={() => handleSyncClick(account)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-3 rounded-lg text-xs transition-colors text-center"
                  title="Sync now"
                >
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositOpen && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Deposit into {selectedAccount.name}
            </h2>
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deposit Amount (PKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-mono text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Remarks (Optional)
                </label>
                <textarea
                  placeholder="e.g. Shop manual deposit"
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none h-20"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDepositOpen(false)}
                  disabled={isSubmitting}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Submit Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {isWithdrawOpen && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Withdraw from {selectedAccount.name}
            </h2>
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Withdrawal Amount (PKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-mono text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <span className="text-xs text-gray-500 mt-1 block">
                  Available Balance: {formatPKR(selectedAccount.currentBalance)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Remarks (Optional)
                </label>
                <textarea
                  placeholder="e.g. Shop operational expense"
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none h-20"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(false)}
                  disabled={isSubmitting}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Submit Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {isSettingsOpen && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Account Settings — {selectedAccount.name}
            </h2>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Account Display Name
                </label>
                <input
                  type="text"
                  required
                  value={settingsData.name}
                  onChange={(e) => setSettingsData({ ...settingsData, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSyncEnabled"
                  checked={settingsData.autoSyncEnabled}
                  onChange={(e) => setSettingsData({ ...settingsData, autoSyncEnabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoSyncEnabled" className="ml-2 block text-xs text-gray-900 font-medium">
                  Enable Automatic API Sync
                </label>
              </div>

              <hr className="my-3 border-gray-200" />
              <h3 className="font-semibold text-gray-900 text-xs">Merchant API Credentials</h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Merchant ID</label>
                <input
                  type="text"
                  placeholder={settingsData.merchantId === '********' ? '********' : 'Merchant ID'}
                  value={settingsData.merchantId}
                  onChange={(e) => setSettingsData({ ...settingsData, merchantId: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  placeholder={settingsData.apiKey === '********' ? '********' : 'API Key'}
                  value={settingsData.apiKey}
                  onChange={(e) => setSettingsData({ ...settingsData, apiKey: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">API Secret</label>
                <input
                  type="password"
                  placeholder={settingsData.secret === '********' ? '********' : 'Secret Key'}
                  value={settingsData.secret}
                  onChange={(e) => setSettingsData({ ...settingsData, secret: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isCreateAccountOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Create New Account</h2>
            <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account Type</label>
                <select
                  value={createData.type}
                  onChange={(e) => setCreateData({ ...createData, type: e.target.value as AccountType })}
                  className="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={AccountType.JAZZCASH}>JazzCash</option>
                  <option value={AccountType.EASYPISA}>Easypaisa</option>
                  <option value={AccountType.BANK}>Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main JazzCash Shop Wallet"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Balance (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={createData.initialBalance}
                  onChange={(e) => setCreateData({ ...createData, initialBalance: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;