import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { accountsAPI, transactionsAPI, chartsAPI } from '../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../utils/format';
import { RefreshCw, Plus, TrendingUp, TrendingDown } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
};

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    tension?: number;
  }[];
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [netWorth, setNetWorth] = useState(0);
  const [cashflowData, setCashflowData] = useState<ChartData | null>(null);
  const [expenseData, setExpenseData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // If user hasn't connected a bank account, redirect to onboarding
    if (!user.hasBankConnected) {
      navigate('/onboarding/bank-connection');
      return;
    }
    
    loadData();
  }, [user, navigate]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load accounts
      const accountsResponse = await accountsAPI.getAccounts();
      setAccounts(accountsResponse.data);
      
      // Calculate net worth
      const total = accountsResponse.data.reduce((sum: number, acc: Account) => sum + acc.balance, 0);
      setNetWorth(total);
      
      // Load recent transactions
      const transactionsResponse = await transactionsAPI.getLatest();
      setRecentTransactions(transactionsResponse.data);
      
      // Load cashflow data
      const cashflowResponse = await chartsAPI.getCashflow('3m');
      setCashflowData({
        labels: cashflowResponse.data.labels,
        datasets: [
          {
            label: 'Income',
            data: cashflowResponse.data.income,
            backgroundColor: 'rgba(74, 222, 128, 0.2)',
            borderColor: 'rgba(74, 222, 128, 1)',
            tension: 0.4,
          },
          {
            label: 'Expenses',
            data: cashflowResponse.data.expenses,
            backgroundColor: 'rgba(248, 113, 113, 0.2)',
            borderColor: 'rgba(248, 113, 113, 1)',
            tension: 0.4,
          },
        ],
      });
      
      // Load expense breakdown
      const expenseResponse = await chartsAPI.getExpenseBreakdown('1m');
      const categories = Object.keys(expenseResponse.data);
      const amounts = Object.values(expenseResponse.data) as number[];
      
      // Generate colors for categories
      const backgroundColors = [
        'rgba(99, 102, 241, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(234, 179, 8, 0.8)',
      ];
      
      setExpenseData({
        labels: categories,
        datasets: [
          {
            label: 'Expenses by Category',
            data: amounts,
            backgroundColor: backgroundColors.slice(0, categories.length),
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1,
          },
        ],
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  const handleAddAccount = () => {
    navigate('/accounts/add');
  };
  
  const handleViewAllTransactions = () => {
    navigate('/transactions');
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white rounded-lg shadow p-6"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-white rounded-lg shadow p-6"></div>
              <div className="h-96 bg-white rounded-lg shadow p-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.name?.split(' ')[0] || 'User'}</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Net Worth */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Net Worth
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(netWorth)}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Income */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    This Month's Income
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(5000)} {/* Replace with actual data */}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Expenses */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    This Month's Expenses
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(3200)} {/* Replace with actual data */}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Cashflow Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Cash Flow</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm rounded-md bg-indigo-100 text-indigo-700">3M</button>
                <button className="px-3 py-1 text-sm rounded-md text-gray-500 hover:bg-gray-100">6M</button>
                <button className="px-3 py-1 text-sm rounded-md text-gray-500 hover:bg-gray-100">1Y</button>
              </div>
            </div>
            <div className="h-80">
              {cashflowData ? (
                <Line
                  data={cashflowData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(Number(value)),
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No cashflow data available
                </div>
              )}
            </div>
          </div>
          
          {/* Expense Categories */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h2>
            <div className="h-64">
              {expenseData ? (
                <Doughnut
                  data={expenseData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                        labels: {
                          boxWidth: 12,
                          padding: 15,
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No expense data available
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Accounts & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Accounts */}
          <div className="lg:col-span-1">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Accounts</h3>
                  <button
                    onClick={handleAddAccount}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </button>
                </div>
              </div>
              <div className="bg-white overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {accounts.length > 0 ? (
                    accounts.map((account) => (
                      <li key={account.id} className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {account.name}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {account.type.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(account.balance, account.currency)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-6 py-4 text-center text-sm text-gray-500">
                      No accounts found. Add your first account to get started.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Transactions</h3>
                  <button
                    onClick={handleViewAllTransactions}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="bg-white overflow-hidden">
                {recentTransactions.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {recentTransactions.map((transaction) => (
                      <li key={transaction.id} className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {transaction.description}
                            </p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDate(transaction.date)}
                              </span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-xs font-medium text-gray-500 capitalize">
                                {transaction.category}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <p className={`text-sm font-medium ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                            }`}>
                              {transaction.type === 'expense' ? '-' : ''}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding a transaction or connecting your bank account.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
