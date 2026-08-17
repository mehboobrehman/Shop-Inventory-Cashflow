import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAccounts, getAccountTransactions } from '../services/account';
import { Account, AccountTransaction, TransactionType, TransactionSource } from '@shop/shared';

const AccountTransactionsPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accountId || '');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [summary, setSummary] = useState<{ totalDeposits: number; totalWithdrawals: number } | null>(null);

  // Fetch all accounts for dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (error) {
        toast.error('Failed to load accounts');
      }
    };
    fetchAccounts();
  }, []);

  // Set selected account from route param
  useEffect(() => {
    if (accountId) {
      setSelectedAccountId(accountId);
    }
  }, [accountId]);

  // Fetch transactions when filters change
  useEffect(() => {
    if (!selectedAccountId) return;
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const result = await getAccountTransactions(selectedAccountId, {
          type: typeFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          limit,
        });
        setTransactions(result.items);
        setPagination(result.pagination);
        setSummary(result.summary);
      } catch (error) {
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [selectedAccountId, typeFilter, startDate, endDate, page, limit]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedAccountId, typeFilter, startDate, endDate]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);



  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAccountId = e.target.value;
    setSelectedAccountId(newAccountId);
    if (newAccountId) {
      navigate(`/accounts/transactions/${newAccountId}`, { replace: true });
    } else {
      navigate('/accounts/transactions', { replace: true });
    }
  };

  const handleClearFilters = () => {
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getSourceIcon = (source: TransactionSource) => {
    switch (source) {
      case TransactionSource.MANUAL:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Manual
          </span>
        );
      case TransactionSource.SALE:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Sale
          </span>
        );
      case TransactionSource.AUTO_SYNC:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Auto
          </span>
        );
      default:
        return null;
    }
  };

  const getPaginationItems = () => {
    if (!pagination) return [];
    const items = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      if (currentPage <= 3) {
        items.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        items.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return items;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {selectedAccount ? `Transactions — ${selectedAccount.name}` : 'Account Transactions'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View deposit and withdrawal history for your accounts.
          </p>
        </div>

        {/* Filters & Account Selector */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Account Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Account</label>
              <select
                value={selectedAccountId}
                onChange={handleAccountChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select an account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value={TransactionType.DEPOSIT}>Deposit</option>
                <option value={TransactionType.WITHDRAWAL}>Withdrawal</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                disabled={!typeFilter && !startDate && !endDate}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : !selectedAccountId ? (
            <div className="p-8 text-center text-gray-500">
              <p>Please select an account to view transactions.</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No transactions found for the selected filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(tx.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {tx.type === TransactionType.DEPOSIT ? (
                            <span className="text-green-600 font-semibold">Deposit</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Withdrawal</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={tx.type === TransactionType.DEPOSIT ? '' : ''}>
                            {tx.type === TransactionType.DEPOSIT ? '+' : '-'}
                          </span>
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col space-y-1">
                            {getSourceIcon(tx.source)}
                            {tx.source === TransactionSource.SALE && tx.saleId && (
                              <Link
                                to={`/sales/${tx.saleId}`}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                                title="View Sale Details"
                              >
                                View Sale →
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {tx.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(tx.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Row */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm font-medium text-gray-700">
                  <span className="mr-4">Total Deposits: <span className="text-green-600 font-bold">{formatCurrency(summary?.totalDeposits ?? 0)}</span></span>
                  <span>Total Withdrawals: <span className="text-red-600 font-bold">{formatCurrency(summary?.totalWithdrawals ?? 0)}</span></span>
                </div>
                {pagination && (
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      {getPaginationItems().map((item, idx) =>
                        typeof item === 'number' ? (
                          <button
                            key={idx}
                            onClick={() => setPage(item)}
                            className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                              pagination.page === item
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {item}
                          </button>
                        ) : (
                          <span key={idx} className="px-2 text-gray-500">...</span>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back to Accounts Button */}
        <div className="mt-6">
          <Link
            to="/accounts"
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
          >
            ← Back to Accounts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountTransactionsPage;
