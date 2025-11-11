import { useState, useEffect } from 'react';
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
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, DollarSign, Download, Maximize2, Info, X, RefreshCw } from 'lucide-react';
import { formatCurrency as formatUSD } from '../utils/format';
import { chartsAPI, accountsAPI } from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [cashflowData, setCashflowData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [networthData, setNetworthData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('6m');
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [showAIExplanation, setShowAIExplanation] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('USD');

  useEffect(() => {
    loadData();
  }, [range]);

  // Auto-refresh data every 5 minutes for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [range]);

  const loadData = async () => {
    try {
      setLoading(true);
      // 1) Refresh real-time balances first so charts reflect the latest numbers
      try { await accountsAPI.getBalances(); } catch (e) { /* non-fatal */ }

      const [summaryRes, cashflowRes, expenseRes, networthRes, accountsRes] = await Promise.all([
        chartsAPI.getSummary(),
        chartsAPI.getCashflow(range),
        chartsAPI.getExpenseBreakdown(range),
        chartsAPI.getNetWorth(range),
        accountsAPI.getAccounts(),
      ]);

      setSummary(summaryRes.data);
      setCashflowData(cashflowRes.data);
      setExpenseData(expenseRes.data);
      setNetworthData(networthRes.data);
      // Prefer the freshest balances from the balances call if present; otherwise use grouped accounts
      // balances endpoint updated the DB; however, we still derive the list from /accounts for institution grouping
      const accountsList = (accountsRes.data?.institutions || []).flatMap((inst: any) => inst.accounts || []);
      setAccounts(accountsList);
      
      // Set currency from first account
      if (accountsList.length > 0 && accountsList[0].currency) {
        setCurrency(accountsList[0].currency);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => formatUSD(amount, currency);

  const handleExport = async (chartType: string) => {
    try {
      const response = await chartsAPI.exportChart(chartType, range);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${chartType}-${range}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export chart:', error);
    }
  };

  // AI explanation for charts
  const getAIExplanation = (chartType: string) => {
    switch (chartType) {
      case 'cashflow':
        return "This cash flow chart shows your income and expenses over time. The green bars represent money coming in (income), while the red bars show money going out (expenses). When income exceeds expenses, you're building wealth. When expenses exceed income, you're depleting your savings.";
      case 'expenses':
        return "This expense breakdown shows where your money is going. The largest segments represent your biggest spending categories. Review this regularly to identify areas where you might be able to cut back and save more.";
      case 'networth':
        return "Your net worth trend shows how your financial position has changed over time. Rising net worth indicates you're building wealth through saving and investing. Declining net worth may signal financial stress or major purchases.";
      case 'assets-liabilities':
        return "This comparison shows your total assets versus liabilities. Assets are what you own (savings, investments, property), while liabilities are what you owe (loans, credit card debt). A healthy ratio means assets significantly exceed liabilities.";
      case 'asset-allocation':
        return "This pie chart shows how your assets are distributed across different account types. Diversification across checking, savings, investments, and other accounts helps manage risk and optimize returns.";
      case 'cashflow-line':
        return "This line chart shows your monthly net cash flow (income minus expenses). Positive values indicate you're saving money, while negative values mean you're spending more than you earn.";
      case 'stacked':
        return "This stacked bar chart shows your monthly income and expenses side by side. The green portion represents income, red represents expenses. The difference shows your monthly savings or deficit.";
      case 'cumulative':
        return "This cumulative chart shows how your net worth has grown or declined over time. An upward trend indicates healthy financial growth, while downward trends may require attention to spending or income.";
      default:
        return "This chart provides insights into your financial patterns and trends. Understanding these patterns can help you make better financial decisions.";
    }
  };

  const cashflowChartData = cashflowData
    ? {
        labels: cashflowData.data.map((d: any) => d.month),
        datasets: [
          {
            label: 'Inflow',
            data: cashflowData.data.map((d: any) => d.inflow),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
          },
          {
            label: 'Outflow',
            data: cashflowData.data.map((d: any) => d.outflow),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
          },
        ],
      }
    : null;

  const expenseChartData = expenseData
    ? {
        labels: expenseData.data.map((d: any) => d.category),
        datasets: [
          {
            data: expenseData.data.map((d: any) => d.amount),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(236, 72, 153, 0.8)',
              'rgba(251, 146, 60, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(234, 179, 8, 0.8)',
            ],
          },
        ],
      }
    : null;

  const networthChartData = networthData
    ? {
        labels: networthData.data.map((d: any) => d.month),
        datasets: [
          {
            label: 'Net Worth',
            data: networthData.data.map((d: any) => d.netWorth),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Assets',
            data: networthData.data.map((d: any) => d.assets),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Liabilities',
            data: networthData.data.map((d: any) => d.liabilities),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  // Assets vs Liabilities comparison
  const assetsVsLiabilitiesData = summary
    ? {
        labels: ['Assets', 'Liabilities'],
        datasets: [
          {
            label: 'Amount',
            data: [summary.totalAssets, summary.totalLiabilities],
            backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(239,68,68,0.8)'],
          },
        ],
      }
    : null;

  // Asset allocation pie (by account type/subtype)
  const allocationMap: Record<string, number> = {};
  accounts.forEach((acc) => {
    const key = acc.subtype || acc.type || 'Other';
    allocationMap[key] = (allocationMap[key] || 0) + (acc.currentBalance || 0);
  });
  const assetAllocationData = Object.keys(allocationMap).length
    ? {
        labels: Object.keys(allocationMap),
        datasets: [
          {
            data: Object.values(allocationMap),
            backgroundColor: [
              'rgba(59,130,246,0.8)',
              'rgba(168,85,247,0.8)',
              'rgba(236,72,153,0.8)',
              'rgba(34,197,94,0.8)',
              'rgba(234,179,8,0.8)',
              'rgba(14,165,233,0.8)',
            ],
          },
        ],
      }
    : null;

  // Monthly cash flow line (net)
  const monthlyCashflowLineData = cashflowData
    ? {
        labels: cashflowData.data.map((d: any) => d.month),
        datasets: [
          {
            label: 'Net Cash Flow',
            data: cashflowData.data.map((d: any) => d.net),
            borderColor: 'rgba(99,102,241,1)',
            backgroundColor: 'rgba(99,102,241,0.15)',
            fill: true,
            tension: 0.35,
          },
        ],
      }
    : null;

  // Replace Sankey/Waterfall with standard charts: stacked inflow/outflow bar and cumulative net line
  const stackedInOutData = cashflowData
    ? {
        labels: cashflowData.data.map((d: any) => d.month),
        datasets: [
          { label: 'Inflow', data: cashflowData.data.map((d: any) => d.inflow), backgroundColor: 'rgba(34,197,94,0.8)' },
          { label: 'Outflow', data: cashflowData.data.map((d: any) => d.outflow), backgroundColor: 'rgba(239,68,68,0.8)' },
        ],
      }
    : null;

  const cumulativeNetData = cashflowData
    ? (() => {
        const labels = cashflowData.data.map((d: any) => d.month);
        const nets = cashflowData.data.map((d: any) => d.net);
        const cumulative: number[] = [];
        nets.reduce((acc: number, cur: number, i: number) => {
          const val = acc + cur; cumulative[i] = val; return val;
        }, 0);
        return {
          labels,
          datasets: [
            { label: 'Cumulative Net', data: cumulative, borderColor: 'rgba(99,102,241,1)', backgroundColor: 'rgba(99,102,241,0.12)', fill: true, tension: 0.35 },
          ],
        };
      })()
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 15,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 15,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="input-field"
            >
              <option value="1m">Last 1 month</option>
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="24m">Last 24 months</option>
            </select>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      {summary && (
        <div className="px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Net Worth */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Net Worth</h3>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold dark:text-white mb-1">
                {formatCurrency(summary.netWorth)}
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+2.5%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
              </div>
            </div>

            {/* Total Assets */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Assets</h3>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold dark:text-white mb-1">
                {formatCurrency(summary.totalAssets)}
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+1.8%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
              </div>
            </div>

            {/* Total Liabilities */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Liabilities</h3>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold dark:text-white mb-1">
                {formatCurrency(summary.totalLiabilities)}
              </p>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">-0.5%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
              </div>
            </div>

            {/* Monthly Cash Flow */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Monthly Cash Flow</h3>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <p className={`text-2xl font-bold mb-1 ${summary.monthlyCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(summary.monthlyCashFlow)}
              </p>
              <div className="flex items-center gap-1">
                {summary.monthlyCashFlow >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm ${summary.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.monthlyCashFlow >= 0 ? '+' : ''}{(summary.monthlyCashFlow / 1000).toFixed(1)}K
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">this month</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cash Flow Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Cash Flow</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIExplanation(showAIExplanation === 'cashflow' ? null : 'cashflow')}
                  className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Ask AI"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport('cashflow')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setExpandedChart('cashflow');
                    setShowAIExplanation('cashflow');
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-80">
              {cashflowChartData ? (
                <Bar data={cashflowChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">No data available</p>
                </div>
              )}
            </div>
            {showAIExplanation === 'cashflow' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">{getAIExplanation('cashflow')}</p>
              </div>
            )}
          </div>

          {/* Expense Breakdown */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Expense Breakdown</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIExplanation(showAIExplanation === 'expenses' ? null : 'expenses')}
                  className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Ask AI"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport('expenses')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setExpandedChart('expenses');
                    setShowAIExplanation('expenses');
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-80">
              {expenseChartData ? (
                <Doughnut data={expenseChartData} options={doughnutOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">No data available</p>
                </div>
              )}
            </div>
            {showAIExplanation === 'expenses' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">{getAIExplanation('expenses')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Net Worth Trend */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-white">Net Worth Trend</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAIExplanation(showAIExplanation === 'networth' ? null : 'networth')}
                className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="Ask AI"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExport('networth')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setExpandedChart('networth');
                  setShowAIExplanation('networth');
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-80">
            {networthChartData ? (
              <Line data={networthChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            )}
          </div>
          {showAIExplanation === 'networth' && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">{getAIExplanation('networth')}</p>
            </div>
          )}
        </div>

        {/* Balance Sheet: Assets vs Liabilities and Asset Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Assets vs Liabilities</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIExplanation(showAIExplanation === 'assets-liabilities' ? null : 'assets-liabilities')}
                  className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Ask AI"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button onClick={() => handleExport('networth')} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => { setExpandedChart('assets-liabilities'); setShowAIExplanation('assets-liabilities'); }} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-80">
              {assetsVsLiabilitiesData ? (
                <Bar data={assetsVsLiabilitiesData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data available</p></div>
              )}
            </div>
            {showAIExplanation === 'assets-liabilities' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">{getAIExplanation('assets-liabilities')}</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Asset Allocation</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIExplanation(showAIExplanation === 'asset-allocation' ? null : 'asset-allocation')}
                  className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Ask AI"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button onClick={() => handleExport('networth')} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => { setExpandedChart('asset-allocation'); setShowAIExplanation('asset-allocation'); }} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-80">
              {assetAllocationData ? (
                <Doughnut data={assetAllocationData} options={doughnutOptions} />
              ) : (
                <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data available</p></div>
              )}
            </div>
            {showAIExplanation === 'asset-allocation' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">{getAIExplanation('asset-allocation')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cash Flow Statement: Monthly Net Line, Stacked In/Out, Cumulative Net */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Monthly Net Cash Flow</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIExplanation(showAIExplanation === 'cashflow-line' ? null : 'cashflow-line')}
                  className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Ask AI"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button onClick={() => { setExpandedChart('cashflow-line'); setShowAIExplanation('cashflow'); }} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-64">
              {monthlyCashflowLineData ? (
                <Line data={monthlyCashflowLineData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data available</p></div>
              )}
            </div>
            {showAIExplanation === 'cashflow-line' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">{getAIExplanation('cashflow-line')}</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Stacked Inflow vs Outflow</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIExplanation(showAIExplanation === 'stacked' ? null : 'stacked')}
                  className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Ask AI"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button onClick={() => { setExpandedChart('stacked'); setShowAIExplanation('cashflow'); }} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-64">
              {stackedInOutData ? (
                <Bar data={stackedInOutData} options={{ ...chartOptions, scales: { x: { stacked: true }, y: { stacked: true } } }} />
              ) : (
                <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data available</p></div>
              )}
            </div>
            {showAIExplanation === 'stacked' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">{getAIExplanation('stacked')}</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Cumulative Net</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIExplanation(showAIExplanation === 'cumulative' ? null : 'cumulative')}
                  className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Ask AI"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button onClick={() => { setExpandedChart('cumulative'); setShowAIExplanation('cashflow'); }} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-64">
              {cumulativeNetData ? (
                <Line data={cumulativeNetData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data available</p></div>
              )}
            </div>
            {showAIExplanation === 'cumulative' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">{getAIExplanation('cumulative')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Chart Modal */}
      {expandedChart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">
                {expandedChart === 'cashflow' && 'Cash Flow'}
                {expandedChart === 'expenses' && 'Expense Breakdown'}
                {expandedChart === 'networth' && 'Net Worth Trend'}
                {expandedChart === 'assets-liabilities' && 'Assets vs Liabilities'}
                {expandedChart === 'asset-allocation' && 'Asset Allocation'}
                {expandedChart === 'cashflow-line' && 'Monthly Net Cash Flow'}
                {expandedChart === 'stacked' && 'Stacked Inflow vs Outflow'}
                {expandedChart === 'cumulative' && 'Cumulative Net'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIExplanation(expandedChart)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <Info className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setExpandedChart(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="h-96 mb-4">
              {expandedChart === 'cashflow' && cashflowChartData && (
                <Bar data={cashflowChartData} options={chartOptions} />
              )}
              {expandedChart === 'expenses' && expenseChartData && (
                <Doughnut data={expenseChartData} options={doughnutOptions} />
              )}
              {expandedChart === 'networth' && networthChartData && (
                <Line data={networthChartData} options={chartOptions} />
              )}
              {expandedChart === 'assets-liabilities' && assetsVsLiabilitiesData && (
                <Bar data={assetsVsLiabilitiesData} options={chartOptions} />
              )}
              {expandedChart === 'asset-allocation' && assetAllocationData && (
                <Doughnut data={assetAllocationData} options={doughnutOptions} />
              )}
              {expandedChart === 'cashflow-line' && monthlyCashflowLineData && (
                <Line data={monthlyCashflowLineData} options={chartOptions} />
              )}
              {expandedChart === 'stacked' && stackedInOutData && (
                <Bar data={stackedInOutData} options={{ ...chartOptions, scales: { x: { stacked: true }, y: { stacked: true } } }} />
              )}
              {expandedChart === 'cumulative' && cumulativeNetData && (
                <Line data={cumulativeNetData} options={chartOptions} />
              )}
            </div>
            
            {showAIExplanation === expandedChart && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-blue-800 dark:text-blue-200">{getAIExplanation(expandedChart)}</p>
              </div>
            )}
            
            <button
              onClick={() => setExpandedChart(null)}
              className="btn-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}