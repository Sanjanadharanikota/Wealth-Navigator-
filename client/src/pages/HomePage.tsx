import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import {
  Link as LinkIcon,
  TrendingUp,
  DollarSign,
  Target,
  Camera,
  Eye,
  CheckCircle,
  Settings,
  Plus,
  Banknote,
  User,
  CreditCard,
  PieChart,
  PiggyBank,
  Landmark,
  LineChart,
  Lock,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { plaidAPI, transactionsAPI, chartsAPI, accountsAPI, goalsAPI } from '../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]); // Changed from accounts to institutions
  const [creditScore, setCreditScore] = useState<number | null>(null); // Will fetch from API
  const [mutualFunds, setMutualFunds] = useState<number | null>(null); // Will fetch from API
  const [loans, setLoans] = useState<number | null>(null); // Will fetch from API
  const [stocks, setStocks] = useState<number | null>(null); // Will fetch from API
  const [dataSharingEnabled, setDataSharingEnabled] = useState(true); // This should come from user settings
  const plaidLinkInitialized = useRef(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState<string>('USD');

  useEffect(() => {
    loadData();
    createLinkToken();
    loadGoals();
    loadInstitutions(); // Changed from loadAccounts to loadInstitutions
    
    // In a real app, fetch the actual data sharing setting from user profile
    // For now, we'll simulate it as enabled by default
    setDataSharingEnabled(true);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes] = await Promise.all([
        chartsAPI.getSummary(),
      ]);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      // Refresh balances first
      await accountsAPI.getBalances();
      // Then reload all data
      await loadData();
      await loadInstitutions();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadInstitutions = async () => {
    try {
      // Fetch connected institutions from the API
      const response = await accountsAPI.getAccounts();
      setInstitutions(response.data.institutions || []);
      
      // Set currency from first account
      const institutions = response.data.institutions || [];
      if (institutions.length > 0 && institutions[0].accounts && institutions[0].accounts.length > 0) {
        setCurrency(institutions[0].accounts[0].currency || 'USD');
      }
    } catch (error) {
      console.error('Failed to load institutions:', error);
    }
  };

  const loadGoals = async () => {
    try {
      const response = await goalsAPI.getGoals('active');
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error('Failed to load goals:', error);
      setGoals([]);
    }
  };

  const createLinkToken = async () => {
    try {
      setLinkError(null);
      const response = await plaidAPI.createLinkToken();
      setLinkToken(response.data.link_token);
    } catch (error) {
      console.error('Failed to create link token:', error);
      setLinkError('Failed to initialize bank connection. Please try again.');
    }
  };

  const onSuccess = async (publicToken: string) => {
    try {
      setLinkError(null);
      await plaidAPI.exchangeToken(publicToken);
      // Sync transactions after successful connection
      await plaidAPI.syncTransactions();
      setShowSuccessModal(true);
      // Reload data immediately and then again after delay
      await loadData();
      await loadInstitutions();
      setTimeout(async () => {
        await loadData();
        await loadInstitutions();
        setShowSuccessModal(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to exchange token:', error);
      setLinkError('Failed to connect bank account. Please try again.');
    }
  };

  // Initialize Plaid Link only when we have a token
  const { open, ready } = usePlaidLink(linkToken ? {
    token: linkToken,
    onSuccess,
    onExit: (err: any) => {
      if (err) {
        console.error('Plaid Link exited with error:', err);
        setLinkError('Bank connection was cancelled or failed.');
      }
    },
  } : {
    token: null,
    onSuccess: () => {},
  });
  
  // Mark as initialized after first render with token
  useEffect(() => {
    if (linkToken) {
      plaidLinkInitialized.current = true;
    }
  }, [linkToken]);

  const handleCheckBalance = async () => {
    try {
      const response = await accountsAPI.getBalances();
      setBalances(response.data.accounts || []);
      setShowBalanceModal(true);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const addNewGoal = () => {
    // Navigate to goals setup page
    navigate('/goals');
  };

  const addNewBankAccount = () => {
    if (ready && linkToken) {
      setLinkError(null);
      open();
    } else if (!linkToken) {
      setLinkError('Bank connection is not ready. Please refresh the page.');
    } else {
      setLinkError('Please wait for bank connection to initialize.');
    }
  };

  // Calculate total bank balance from institutions
  const totalBankBalance = institutions.reduce((total, institution) => total + (institution.totalBalance || 0), 0);

  // Function to display encrypted data
  const displayEncryptedData = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Enable data sharing to view financial information
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Hello, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-primary-100 text-sm">Welcome back to your finances</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Settings Button */}
            <button
              onClick={() => navigate('/profile')}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all active:scale-95"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
            
            {/* Bank Link Button */}
            <button
              onClick={addNewBankAccount}
              disabled={!ready}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              title="Connect Bank Account"
            >
              <LinkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Net Worth Card */}
        {summary && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <p className="text-primary-100 text-sm mb-1">Net Worth</p>
            {dataSharingEnabled ? (
              <p className="text-3xl font-bold text-white mb-4">
                {formatCurrency(summary.netWorth || 0)}
              </p>
            ) : (
              <p className="text-3xl font-bold text-white mb-4">
                **********
              </p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-primary-100">Assets</p>
                {dataSharingEnabled ? (
                  <p className="text-white font-semibold">
                    {formatCurrency(summary.totalAssets || 0)}
                  </p>
                ) : (
                  <p className="text-white font-semibold">
                    **********
                  </p>
                )}
              </div>
              <div>
                <p className="text-primary-100">Liabilities</p>
                {dataSharingEnabled ? (
                  <p className="text-white font-semibold">
                    {formatCurrency(summary.totalLiabilities || 0)}
                  </p>
                ) : (
                  <p className="text-white font-semibold">
                    **********
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Error Display */}
        {linkError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-red-600 dark:text-red-400">⚠️</div>
              <p className="text-red-800 dark:text-red-200 text-sm">{linkError}</p>
              <button
                onClick={() => setLinkError(null)}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Connect Bank Account CTA */}
        {institutions.length === 0 && (
          <div className="card p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Banknote className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold dark:text-white mb-2">Connect Your Bank Account</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Link your bank account to start tracking transactions and managing your finances.
            </p>
            <button
              onClick={addNewBankAccount}
              disabled={!ready}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ready ? 'Connect Bank Account' : 'Initializing...'}
            </button>
          </div>
        )}

        {/* Financial Overview */}
        <div>
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Financial Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Credit Score */}
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium dark:text-white">Credit Score</h3>
              </div>
              {dataSharingEnabled ? (
                creditScore !== null ? (
                  <>
                    <p className="text-2xl font-bold dark:text-white">{creditScore}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {creditScore >= 750 ? 'Excellent' : creditScore >= 700 ? 'Good' : creditScore >= 650 ? 'Fair' : 'Poor'}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Not available</p>
                )
              ) : (
                displayEncryptedData()
              )}
            </div>

            {/* Mutual Funds */}
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-medium dark:text-white">Mutual Funds</h3>
              </div>
              {dataSharingEnabled ? (
                mutualFunds !== null ? (
                  <>
                    <p className="text-2xl font-bold dark:text-white">{formatCurrency(mutualFunds)}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">+2.5% this month</p>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Not available</p>
                )
              ) : (
                displayEncryptedData()
              )}
            </div>

            {/* Loans */}
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-medium dark:text-white">Loans</h3>
              </div>
              {dataSharingEnabled ? (
                loans !== null ? (
                  <>
                    <p className="text-2xl font-bold dark:text-white">{formatCurrency(loans)}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">Outstanding</p>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Not available</p>
                )
              ) : (
                displayEncryptedData()
              )}
            </div>

            {/* Stocks */}
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <LineChart className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-medium dark:text-white">Stocks</h3>
              </div>
              {dataSharingEnabled ? (
                stocks !== null ? (
                  <>
                    <p className="text-2xl font-bold dark:text-white">{formatCurrency(stocks)}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">+1.8% today</p>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Not available</p>
                )
              ) : (
                displayEncryptedData()
              )}
            </div>
          </div>
        </div>

        {/* Bank Balances */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Bank Balances</h2>
            <button
              onClick={handleCheckBalance}
              className="text-sm text-primary-600 dark:text-primary-400 font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400">Total Balance</p>
              {dataSharingEnabled ? (
                <p className="text-xl font-bold dark:text-white">{formatCurrency(totalBankBalance)}</p>
              ) : (
                <p className="text-xl font-bold dark:text-white">**********</p>
              )}
            </div>
            
            <div className="space-y-3">
              {dataSharingEnabled ? (
                institutions.map((institution) => (
                  <div key={institution.institutionName} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium dark:text-white">{institution.institutionName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {institution.accounts.length} account{institution.accounts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="font-semibold dark:text-white">
                      {formatCurrency(institution.totalBalance)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-4">
                  {displayEncryptedData()}
                </div>
              )}
              
              {institutions.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    No bank accounts connected
                  </p>
                  <button
                    onClick={addNewBankAccount}
                    disabled={!ready}
                    className="btn-primary text-sm mt-2"
                  >
                    Connect Bank
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Financial Goals</h2>
            <button
              onClick={addNewGoal}
              className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>
          
          {dataSharingEnabled ? (
            goals.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {goals.map((goal) => (
                  <div key={goal._id} className="card p-4 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/goals')}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-medium dark:text-white">{goal.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{goal.category}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {Math.round(goal.progress || 0)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2.5 mb-3">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(goal.currentAmount || 0)}
                      </span>
                      <span className="font-medium dark:text-white">
                        {formatCurrency(goal.targetAmount || 0)}
                      </span>
                    </div>
                    
                    {goal.aiTip && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300">{goal.aiTip}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No financial goals yet
                </p>
                <button
                  onClick={addNewGoal}
                  className="btn-primary mx-auto"
                >
                  Set Your First Goal
                </button>
              </div>
            )
          ) : (
            <div className="card p-8">
              {displayEncryptedData()}
            </div>
          )}
        </div>

      </div>

      {/* Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Account Balances</h3>
            <div className="space-y-4 mb-6">
              {dataSharingEnabled ? (
                balances.map((account) => (
                  <div key={account._id || account.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium dark:text-white">{account.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        •••• {account.mask}
                      </p>
                    </div>
                    <p className="font-semibold text-lg dark:text-white">
                      {formatCurrency(account.currentBalance)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8">
                  {displayEncryptedData()}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowBalanceModal(false)}
              className="btn-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">
              Bank account connected successfully
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your transactions are being synced
            </p>
          </div>
        </div>
      )}
    </div>
  );
}