import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getAccounts, deposit, withdraw, getAccountTransactions } from '../services/account';
import { Account, AccountTransaction, TransactionType, AccountType, TransactionSource } from '@shop/shared';
import { useNavigate } from 'react-router-dom';

export const CashflowPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeAccountFilter, setActiveAccountFilter] = useState<string>('ALL');

  // Summary Metrics
  const [totalNetBalance, setTotalNetBalance] = useState<number>(0);
  const [totalDepositsSummary, setTotalDepositsSummary] = useState<number>(0);
  const [totalWithdrawalsSummary, setTotalWithdrawalsSummary] = useState<number>(0);

  // Modal State for New Cashflow Log
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [logType, setLogType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [logAccountId, setLogAccountId] = useState<string>('');
  const [logAmount, setLogAmount] = useState<string>('');
  const [logCategory, setLogCategory] = useState<string>('Sales / General Deposit');
  const [logDescription, setLogDescription] = useState<string>('');
  const [isSubmittingLog, setIsSubmittingLog] = useState<boolean>(false);

  // Fetch accounts & recent transactions across accounts
  const fetchCashflowData = useCallback(async () => {
    setLoading(true);
    try {
      const accs = await getAccounts();
      setAccounts(accs);

      // Compute total net balance
      const net = accs.reduce((sum, a) => sum + Number(a.currentBalance), 0);
      setTotalNetBalance(net);

      if (accs.length > 0 && !logAccountId) {
        setLogAccountId(accs[0].id);
      }

      // Fetch transactions for all or selected account
      const selectedId = activeAccountFilter === 'ALL' ? (accs[0]?.id || '') : activeAccountFilter;
      if (selectedId) {
        const txRes = await getAccountTransactions(selectedId, { limit: 25 });
        setRecentTransactions(txRes.items || []);
        if (txRes.summary) {
          setTotalDepositsSummary(txRes.summary.totalDeposits);
          setTotalWithdrawalsSummary(txRes.summary.totalWithdrawals);
        }
      }
    } catch (error) {
      toast.error('Failed to load cashflow data');
    } finally {
      setLoading(false);
    }
  }, [activeAccountFilter, logAccountId]);

  useEffect(() => {
    fetchCashflowData();
  }, [fetchCashflowData]);

  // Open Log Modal helper
  const handleOpenLogModal = (type: 'DEPOSIT' | 'WITHDRAWAL', defaultAccountId?: string) => {
    setLogType(type);
    if (defaultAccountId) {
      setLogAccountId(defaultAccountId);
    } else if (accounts.length > 0) {
      setLogAccountId(accounts[0].id);
    }
    setLogAmount('');
    setLogCategory(type === 'DEPOSIT' ? 'Sales / General Deposit' : 'Expense / Vendor Payment');
    setLogDescription('');
    setIsLogModalOpen(true);
  };

  // Submit Transaction Log
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(logAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    if (!logAccountId) {
      toast.error('Please select an account');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === logAccountId);
    if (logType === 'WITHDRAWAL' && selectedAcc && amountNum > Number(selectedAcc.currentBalance)) {
      toast.error(`Insufficient balance in ${selectedAcc.name}. Available: PKR ${Number(selectedAcc.currentBalance).toFixed(2)}`);
      return;
    }

    setIsSubmittingLog(true);
    try {
      const desc = `[${logCategory}] ${logDescription}`.trim();
      if (logType === 'DEPOSIT') {
        await deposit(logAccountId, { amount: amountNum, description: desc });
        toast.success(`Recorded Deposit of PKR ${amountNum.toFixed(2)} into ${selectedAcc?.name}`);
      } else {
        await withdraw(logAccountId, { amount: amountNum, description: desc });
        toast.success(`Recorded Withdrawal of PKR ${amountNum.toFixed(2)} from ${selectedAcc?.name}`);
      }
      setIsLogModalOpen(false);
      fetchCashflowData();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to record transaction');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const formatPKR = (num: number) => {
    return `PKR ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAccountBadge = (type: AccountType) => {
    switch (type) {
      case AccountType.JAZZCASH:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">JazzCash</span>;
      case AccountType.EASYPISA:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800">Easypaisa</span>;
      case AccountType.BANK:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">Bank</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-800">Cash</span>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Cashflow & Account Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time balance tracking, income vs expense breakdowns, and transaction logs.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleOpenLogModal('DEPOSIT')}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm text-xs transition-colors"
          >
            + Record Income / Deposit
          </button>
          <button
            onClick={() => handleOpenLogModal('WITHDRAWAL')}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm text-xs transition-colors"
          >
            - Record Expense / Withdraw
          </button>
        </div>
      </div>

      {/* Top 3 Visual Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Net Balance Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Cash & Bank Balance</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">💰</span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mt-2">
            {formatPKR(totalNetBalance)}
          </div>
          <p className="text-xs text-gray-400 mt-2">Across all JazzCash, Easypaisa, and Bank accounts</p>
        </div>

        {/* Total Deposits Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Recorded Deposits (Income)</span>
            <span className="p-2 bg-green-50 text-green-600 rounded-xl font-bold text-sm">📈</span>
          </div>
          <div className="text-3xl font-extrabold text-green-700 mt-2">
            {formatPKR(totalDepositsSummary)}
          </div>
          <p className="text-xs text-gray-400 mt-2">Sum of sales and manual deposits</p>
        </div>

        {/* Total Withdrawals Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Recorded Withdrawals (Expenses)</span>
            <span className="p-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm">📉</span>
          </div>
          <div className="text-3xl font-extrabold text-red-700 mt-2">
            {formatPKR(totalWithdrawalsSummary)}
          </div>
          <p className="text-xs text-gray-400 mt-2">Sum of shop operational expenses and withdrawals</p>
        </div>
      </div>

      {/* Account Cards Breakdown Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Accounts & Liquidity Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{acc.name}</h3>
                    {getAccountBadge(acc.type)}
                  </div>
                  <button
                    onClick={() => navigate(`/accounts/transactions/${acc.id}`)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    History →
                  </button>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">Available Balance</span>
                  <div className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {formatPKR(acc.currentBalance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-150 flex gap-2">
                <button
                  onClick={() => handleOpenLogModal('DEPOSIT', acc.id)}
                  className="flex-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs transition-colors"
                >
                  + Deposit
                </button>
                <button
                  onClick={() => handleOpenLogModal('WITHDRAWAL', acc.id)}
                  className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs transition-colors"
                >
                  - Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Cashflow Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Account Transaction History</h2>
            <p className="text-xs text-gray-500">Showing recent deposits and withdrawals</p>
          </div>

          {/* Account Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-600">Filter Account:</span>
            <select
              value={activeAccountFilter}
              onChange={(e) => setActiveAccountFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-xl text-xs bg-white font-semibold"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading transactions...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No transaction logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Category / Remarks</th>
                  <th className="px-5 py-3.5 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {tx.type === TransactionType.DEPOSIT ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          + Deposit
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          - Withdrawal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {formatPKR(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-600">
                      {tx.source === TransactionSource.SALE ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">POS Sale</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Manual Log</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 max-w-xs truncate">
                      {tx.description || '-'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900 text-right">
                      {formatPKR(tx.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cashflow Transaction Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {logType === 'DEPOSIT' ? '🟢 Record Income / Deposit' : '🔴 Record Expense / Withdrawal'}
            </h2>

            <form onSubmit={handleLogSubmit} className="space-y-4">
              {/* Account Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Account</label>
                <select
                  value={logAccountId}
                  onChange={(e) => setLogAccountId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type}) — Balance: PKR {Number(a.currentBalance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (PKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={logAmount}
                  onChange={(e) => setLogAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-base font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={logCategory}
                  onChange={(e) => setLogCategory(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none"
                >
                  {logType === 'DEPOSIT' ? (
                    <>
                      <option value="Sales / General Deposit">Sales / General Deposit</option>
                      <option value="Capital Injection">Capital Injection</option>
                      <option value="Refund / Credit">Refund / Credit</option>
                      <option value="Other Income">Other Income</option>
                    </>
                  ) : (
                    <>
                      <option value="Expense / Vendor Payment">Expense / Vendor Payment</option>
                      <option value="Shop Rent / Utilities">Shop Rent / Utilities</option>
                      <option value="Salary / Wages">Salary / Wages</option>
                      <option value="Owner Draw / Personal">Owner Draw / Personal</option>
                      <option value="Misc Expense">Misc Expense</option>
                    </>
                  )}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks / Reference (Optional)</label>
                <textarea
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="Additional context or bill reference..."
                  rows={2}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className={`px-5 py-2 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50 ${
                    logType === 'DEPOSIT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSubmittingLog ? 'Saving...' : logType === 'DEPOSIT' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowPage;