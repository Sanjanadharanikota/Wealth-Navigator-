import { useState, useEffect } from 'react';
import { Search, Filter, X, DollarSign, Tag, Download, BarChart3, Info } from 'lucide-react';
import { transactionsAPI } from '../utils/api';
import { formatCurrency as formatUSD } from '../utils/format';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [visualizationData, setVisualizationData] = useState<any>(null);
  const [chartTab, setChartTab] = useState<'breakdown' | 'timeseries' | 'byCategory'>('breakdown');
  const [timeAggregation, setTimeAggregation] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [currency, setCurrency] = useState<string>('USD');

  // Dynamically fetch categories from transactions
  const categories = ['All', ...new Set(transactions.flatMap(t => t.category || ['Uncategorized']))];

  // Date range options
  const dateRangeOptions = [
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'Last 180 days', value: '180' },
    { label: 'Last 365 days', value: '365' },
    { label: 'Financial Year 2024-25', value: 'fy24-25' },
    { label: 'Financial Year 2023-24', value: 'fy23-24' },
    { label: 'Custom date range', value: 'custom' },
  ];

  useEffect(() => {
    loadTransactions();
  }, [search, selectedCategory, dateRange]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      
      if (search) params.search = search;
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await transactionsAPI.getTransactions(params);
      const txns = response.data.transactions || [];
      setTransactions(txns);
      
      // Set currency from first transaction
      if (txns.length > 0 && txns[0].isoCurrencyCode) {
        setCurrency(txns[0].isoCurrencyCode);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => formatUSD(amount, currency);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleMarkRecurring = async (id: string) => {
    try {
      await transactionsAPI.updateTransaction(id, { isRecurring: true });
      loadTransactions();
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Failed to mark as recurring:', error);
    }
  };

  // Function to download statement
  const downloadStatement = async (days: string) => {
    try {
      // In a real implementation, this would call an API endpoint to generate and download the statement
      // For now, we'll simulate the download
      console.log(`Downloading statement for ${days} days`);
      
      // Create a simple CSV content
      let csvContent = 'Date,Description,Category,Amount\n';
      transactions.forEach(transaction => {
        csvContent += `${transaction.date},"${transaction.name}","${transaction.category[0] || 'Uncategorized'}",${transaction.amount}\n`;
      });
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `statement-${days}-days.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowDownloadOptions(false);
    } catch (error) {
      console.error('Failed to download statement:', error);
    }
  };

  // Function to show visualization
  const showVisualizationChart = () => {
    buildBreakdownData();
    setChartTab('breakdown');
    setShowAIExplanation(false);
    setShowVisualization(true);
  };

  // Helpers to build chart data
  const palette = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(234, 179, 8, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(251, 146, 60, 0.8)',
    'rgba(14, 165, 233, 0.8)'
  ];

  const buildBreakdownData = () => {
    const categoryTotals: { [key: string]: number } = {};
    transactions.forEach((transaction) => {
      const category = transaction.category?.[0] || 'Uncategorized';
      if (!categoryTotals[category]) categoryTotals[category] = 0;
      if (transaction.amount < 0) categoryTotals[category] += Math.abs(transaction.amount);
    });
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    setVisualizationData({
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
        },
      ],
    });
  };

  const startOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const res = new Date(date.setDate(diff));
    res.setHours(0, 0, 0, 0);
    return res;
  };

  const formatKey = (date: Date, agg: 'daily' | 'weekly' | 'monthly') => {
    if (agg === 'daily') return date.toISOString().slice(0, 10);
    if (agg === 'weekly') return startOfWeek(date).toISOString().slice(0, 10);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const buildTimeSeriesData = () => {
    const series: { [key: string]: { income: number; expenses: number } } = {};
    transactions.forEach((t) => {
      const key = formatKey(new Date(t.date), timeAggregation);
      if (!series[key]) series[key] = { income: 0, expenses: 0 };
      if (t.amount >= 0) series[key].income += t.amount; else series[key].expenses += Math.abs(t.amount);
    });
    const labels = Object.keys(series).sort();
    setVisualizationData({
      labels,
      datasets: [
        { label: 'Income', data: labels.map((k) => series[k].income), borderColor: 'rgba(34, 197, 94, 1)', backgroundColor: 'rgba(34, 197, 94, 0.2)', tension: 0.3, fill: true },
        { label: 'Expenses', data: labels.map((k) => series[k].expenses), borderColor: 'rgba(239, 68, 68, 1)', backgroundColor: 'rgba(239, 68, 68, 0.2)', tension: 0.3, fill: true },
      ],
    });
  };

  const buildCategoryBarData = () => {
    const totals: { [key: string]: number } = {};
    transactions.forEach((t) => {
      const cat = t.category?.[0] || 'Uncategorized';
      if (!totals[cat]) totals[cat] = 0;
      totals[cat] += Math.abs(t.amount);
    });
    const labels = Object.keys(totals);
    setVisualizationData({
      labels,
      datasets: [
        {
          label: 'Total Amount',
          data: labels.map((k) => totals[k]),
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
        },
      ],
    });
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: chartTab === 'breakdown'
          ? 'Expense Breakdown by Category'
          : chartTab === 'timeseries'
            ? `Income vs Expenses (${timeAggregation})`
            : 'Transactions by Category',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
    },
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold dark:text-white">Transactions</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDownloadOptions(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={showVisualizationChart}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="input-field pl-10 w-full"
          />
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium dark:text-white">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field w-full"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Date Range</label>
                <select
                  onChange={(e) => {
                    const days = parseInt(e.target.value);
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - days);
                    setDateRange({
                      start: startDate.toISOString().split('T')[0],
                      end: endDate.toISOString().split('T')[0],
                    });
                  }}
                  className="input-field w-full"
                >
                  <option value="">Select range</option>
                  {dateRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Transactions List */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium dark:text-white">{transaction.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.date)} • {transaction.category[0] || 'Uncategorized'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.accountId?.name || 'Account'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No transactions found
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">Transaction Details</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p className="font-medium dark:text-white">{selectedTransaction.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                <p className={`text-xl font-bold ${selectedTransaction.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {formatCurrency(selectedTransaction.amount)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-medium dark:text-white">{formatDate(selectedTransaction.date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium dark:text-white">{selectedTransaction.category[0] || 'Uncategorized'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Account</p>
                <p className="font-medium dark:text-white">{selectedTransaction.accountId?.name || 'Account'}</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleMarkRecurring(selectedTransaction._id)}
                  className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Mark as Recurring
                </button>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-dark-600 rounded-lg font-medium dark:text-white hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Options Modal */}
      {showDownloadOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">Download Statement</h3>
              <button
                onClick={() => setShowDownloadOptions(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {dateRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (option.value === 'custom') {
                      // Handle custom date range
                      alert('Custom date range functionality would be implemented here');
                    } else {
                      downloadStatement(option.value);
                    }
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visualization Modal */}
      {showVisualization && visualizationData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">Visualizations</h3>
              <button
                onClick={() => setShowVisualization(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => { setChartTab('breakdown'); buildBreakdownData(); setShowAIExplanation(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm ${chartTab === 'breakdown' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 dark:text-gray-200'}`}
              >
                Breakdown
              </button>
              <button
                onClick={() => { setChartTab('timeseries'); buildTimeSeriesData(); setShowAIExplanation(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm ${chartTab === 'timeseries' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 dark:text-gray-2 00'}`}
              >
                Time Series
              </button>
              <button
                onClick={() => { setChartTab('byCategory'); buildCategoryBarData(); setShowAIExplanation(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm ${chartTab === 'byCategory' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 dark:text-gray-200'}`}
              >
                By Category
              </button>
              {chartTab === 'timeseries' && (
                <select
                  value={timeAggregation}
                  onChange={(e) => { const v = e.target.value as 'daily' | 'weekly' | 'monthly'; setTimeAggregation(v); buildTimeSeriesData(); setShowAIExplanation(false); }}
                  className="ml-auto input-field"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}
              <button
                onClick={() => setShowAIExplanation(!showAIExplanation)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md"
                title="Ask AI"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <div className="h-80">
              {chartTab === 'breakdown' && visualizationData && (
                <Doughnut data={visualizationData} options={doughnutOptions} />
              )}
              {chartTab === 'timeseries' && visualizationData && (
                <Line data={visualizationData} options={chartOptions} />
              )}
              {chartTab === 'byCategory' && visualizationData && (
                <Bar data={visualizationData} options={chartOptions} />
              )}
            </div>

            {showAIExplanation && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  {chartTab === 'breakdown' && 'This donut shows where your spending concentrates. Larger slices indicate higher spend categories; target the top 2-3 to cut costs.'}
                  {chartTab === 'timeseries' && 'This trend shows income vs. expenses over time. Consistent gaps where expenses exceed income indicate cash flow stress; aim for positive gaps.'}
                  {chartTab === 'byCategory' && 'This bar chart compares category totals. Use it to spot unusually high categories month-to-month and set caps.'}
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-200 mt-2 font-medium">
                  Tip: Reduce food delivery by 15% to save each month; reallocate to investments.
                </p>
              </div>
            )}
            
            <button
              onClick={() => setShowVisualization(false)}
              className="btn-primary w-full mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}