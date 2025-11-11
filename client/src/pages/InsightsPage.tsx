import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Lightbulb, BarChart3, PieChart, Calculator, Info } from 'lucide-react';
import { formatCurrency as formatUSD } from '../utils/format';
import { insightsAPI, accountsAPI } from '../utils/api';
import { Line, Bar, Bubble, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function InsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulationParams, setSimulationParams] = useState({
    monthlyInvestment: 10000,
    annualReturn: 12,
    years: 10,
  });
  const [simulationResult, setSimulationResult] = useState<number | null>(null);
  const [showAIExplain, setShowAIExplain] = useState<string | null>(null);

  // Charts state
  const [trendChart, setTrendChart] = useState<any>(null);
  const [scenarioChart, setScenarioChart] = useState<any>(null);
  const [debtPie, setDebtPie] = useState<any>(null);
  const [debtTimeline, setDebtTimeline] = useState<any>(null);
  const [riskReturn, setRiskReturn] = useState<any>(null);
  const [diversification, setDiversification] = useState<any>(null);
  const [roiLine, setRoiLine] = useState<any>(null);
  const [anomalyBar, setAnomalyBar] = useState<any>(null);
  const [currency, setCurrency] = useState<string>('USD');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      
      // Fetch real insights from API
      const [insightsRes, accountsRes] = await Promise.all([
        insightsAPI.getInsights(),
        accountsAPI.getAccounts()
      ]);
      
      const data = insightsRes.data;
      
      // Set currency from API response
      if (data.currency) {
        setCurrency(data.currency);
      }
      
      setTrends(data.trends);
      setInsights(data.insights);
      setRecommendations(data.recommendations);
      
      // Build trend chart from real data
      if (data.trendChartData && data.trendChartData.length > 0) {
        const labels = data.trendChartData.map((d: any) => d.month);
        const expenseData = data.trendChartData.map((d: any) => d.expenses / 1000); // Convert to thousands
        
        const currencySymbol = data.currency === 'USD' ? '$' : data.currency === 'INR' ? '₹' : data.currency;
        setTrendChart({
          labels,
          datasets: [
            { 
              label: `Expenses (${currencySymbol}K)`, 
              data: expenseData, 
              borderColor: 'rgba(239,68,68,1)', 
              backgroundColor: 'rgba(239,68,68,0.15)', 
              fill: true, 
              tension: 0.35 
            },
          ],
        });
      }
      
      // Build account-based charts
      const accounts = accountsRes.data?.institutions?.flatMap((inst: any) => inst.accounts || []) || [];
      
      // Asset allocation (diversification)
      if (accounts.length > 0) {
        const allocationMap: { [key: string]: number } = {};
        accounts.forEach((acc: any) => {
          const key = acc.subtype || acc.type || 'Other';
          allocationMap[key] = (allocationMap[key] || 0) + (acc.currentBalance || 0);
        });
        
        if (Object.keys(allocationMap).length > 0) {
          setDiversification({
            labels: Object.keys(allocationMap),
            datasets: [{ 
              data: Object.values(allocationMap), 
              backgroundColor: [
                'rgba(59,130,246,0.85)',
                'rgba(168,85,247,0.85)',
                'rgba(34,197,94,0.85)',
                'rgba(234,179,8,0.85)',
                'rgba(239,68,68,0.85)',
                'rgba(14,165,233,0.85)'
              ] 
            }],
          });
        }
      }
      
      // Set placeholder charts for features not yet implemented
      const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
      
      setScenarioChart({
        labels: months,
        datasets: [
          { label: 'Current Path', data: [20, 22, 24, 26, 28, 30], borderColor: 'rgba(59,130,246,1)', tension: 0.3 },
          { label: 'Optimized Path', data: [20, 23, 27, 32, 37, 43], borderColor: 'rgba(34,197,94,1)', tension: 0.3 },
        ],
      });
      
      // Debt charts - only show if user has liabilities
      const hasDebt = accounts.some((acc: any) => acc.currentBalance < 0);
      if (hasDebt) {
        setDebtTimeline({
          labels: months,
          datasets: [
            { label: 'Outstanding Debt', data: [100, 95, 89, 82, 74, 65], borderColor: 'rgba(59,130,246,1)', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 },
          ],
        });
        
        setDebtPie({
          labels: ['Interest Paid', 'Principal Paid'],
          datasets: [{ data: [30, 70], backgroundColor: ['rgba(234,179,8,0.9)', 'rgba(34,197,94,0.9)'] }],
        });
      }
      
      setRiskReturn({
        datasets: [
          { label: 'Conservative', data: [{ x: 5, y: 4, r: 15 }], backgroundColor: 'rgba(34,197,94,0.6)' },
          { label: 'Moderate', data: [{ x: 10, y: 8, r: 20 }], backgroundColor: 'rgba(59,130,246,0.6)' },
          { label: 'Aggressive', data: [{ x: 18, y: 14, r: 12 }], backgroundColor: 'rgba(239,68,68,0.6)' },
        ],
      });
      
      setRoiLine({
        labels: months,
        datasets: [{ label: 'Portfolio ROI (%)', data: [1.5, 2.1, 2.8, 3.5, 4.2, 5.0], borderColor: 'rgba(34,197,94,1)', backgroundColor: 'rgba(34,197,94,0.15)', fill: true, tension: 0.25 }],
      });
      
      setAnomalyBar({
        labels: months,
        datasets: [{ label: 'Unusual Transactions', data: [0, 1, 0, 2, 1, 0], backgroundColor: 'rgba(239,68,68,0.8)' }],
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load insights:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => formatUSD(amount, currency);

  // Function to calculate financial projections
  const calculateProjection = (monthlyInvestment: number, annualReturn: number, years: number) => {
    // Compound interest calculation
    const monthlyRate = annualReturn / 100 / 12;
    const months = years * 12;
    let total = 0;
    
    for (let i = 0; i < months; i++) {
      total = (total + monthlyInvestment) * (1 + monthlyRate);
    }
    
    return Math.round(total);
  };

  // Run simulation
  const runSimulation = () => {
    const result = calculateProjection(
      simulationParams.monthlyInvestment,
      simulationParams.annualReturn,
      simulationParams.years
    );
    setSimulationResult(result);
  };

  // Reset simulation
  const resetSimulation = () => {
    setSimulationParams({
      monthlyInvestment: 10000,
      annualReturn: 12,
      years: 10,
    });
    setSimulationResult(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold dark:text-white mb-2">Financial Insights</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Personalized recommendations to improve your financial health
            </p>
          </div>
          <button
            onClick={() => setShowSimulator(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Calculator className="w-5 h-5" />
            Simulator
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Trend Detection */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">Trend Detection</h2>
            <button onClick={() => setShowAIExplain(showAIExplain === 'trend' ? null : 'trend')} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Ask AI">
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="h-72">
            {trendChart ? <Line data={trendChart} options={{ plugins: { legend: { position: 'bottom' as const } } }} /> : <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data</p></div>}
          </div>
          {showAIExplain === 'trend' && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">Expenses rising ~12% MoM. Consider category caps and automated savings sweeps.</p>
            </div>
          )}
        </div>

        {/* Goal Simulation & Scenario Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">Scenario Comparison</h2>
              <button onClick={() => setShowAIExplain(showAIExplain === 'scenario' ? null : 'scenario')} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Ask AI">
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="h-72">
              {scenarioChart ? <Line data={scenarioChart} options={{ plugins: { legend: { position: 'bottom' as const } } }} /> : <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data</p></div>}
            </div>
            {showAIExplain === 'scenario' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">Without loan repayment, surplus grows faster. Consider prepayment timing.</p>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">Goal Projection</h2>
              <button onClick={() => setShowAIExplain(showAIExplain === 'goal' ? null : 'goal')} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Ask AI">
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="h-72 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">If you save {formatCurrency(simulationParams.monthlyInvestment)} monthly, in {simulationParams.years} years at {simulationParams.annualReturn}%</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(calculateProjection(simulationParams.monthlyInvestment, simulationParams.annualReturn, simulationParams.years))}</p>
              </div>
            </div>
            {showAIExplain === 'goal' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">Increase SIP by 10% yearly to reach your target 1–2 years sooner.</p>
              </div>
            )}
          </div>
        </div>

        {/* Debt Optimization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">Debt Repayment Timeline</h2>
              <button onClick={() => setShowAIExplain(showAIExplain === 'debt' ? null : 'debt')} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Ask AI">
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="h-72">
              {debtTimeline ? <Line data={debtTimeline} options={{ plugins: { legend: { display: false } } }} /> : <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data</p></div>}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">Interest vs Principal</h2>
              <button onClick={() => setShowAIExplain(showAIExplain === 'debt-pie' ? null : 'debt-pie')} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Ask AI">
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="h-72">
              {debtPie ? <Doughnut data={debtPie} /> : <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data</p></div>}
            </div>
            {showAIExplain === 'debt-pie' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">This pie chart shows the proportion of interest vs principal in your debt payments. Higher principal portions indicate more effective debt reduction strategies.</p>
              </div>
            )}
          </div>
        </div>

        {/* Investment Guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">Risk vs Return</h2>
              <button onClick={() => setShowAIExplain(showAIExplain === 'risk-return' ? null : 'risk-return')} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Ask AI">
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="h-72">
              {riskReturn ? <Bubble data={riskReturn} /> : <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data</p></div>}
            </div>
            {showAIExplain === 'risk-return' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">This bubble chart shows risk vs return for different investment options. Larger bubbles indicate higher investment amounts. Aim for a balanced portfolio across risk levels.</p>
              </div>
            )}
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">Portfolio Diversification</h2>
              <button onClick={() => setShowAIExplain(showAIExplain === 'diversification' ? null : 'diversification')} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Ask AI">
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="h-72">
              {diversification ? <Doughnut data={diversification} /> : <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data</p></div>}
            </div>
            {showAIExplain === 'diversification' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">This pie chart shows your portfolio diversification across asset classes. Well-diversified portfolios spread risk and optimize returns across different market conditions.</p>
              </div>
            )}
          </div>
        </div>

        {/* ROI Over Time */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">ROI Over Time</h2>
            <button onClick={() => setShowAIExplain(showAIExplain === 'roi' ? null : 'roi')} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Ask AI">
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="h-72">
            {roiLine ? <Line data={roiLine} /> : <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data</p></div>}
          </div>
          {showAIExplain === 'roi' && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">This line chart shows your portfolio's return on investment over time. Consistent upward trends indicate good investment performance and wealth building.</p>
            </div>
          )}
        </div>

        {/* Anomaly Detection */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">Anomaly Detection</h2>
            <button onClick={() => setShowAIExplain(showAIExplain === 'anomaly' ? null : 'anomaly')} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Ask AI">
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="h-72">
            {anomalyBar ? <Bar data={anomalyBar} options={{ plugins: { legend: { display: false } } }} /> : <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">No data</p></div>}
          </div>
          {showAIExplain === 'anomaly' && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">We flagged spikes in Jun and Aug; review large one-off spends or subscription changes.</p>
            </div>
          )}
        </div>
        {/* Trends Section */}
        <div className="card">
          <h2 className="text-xl font-bold dark:text-white mb-4">Financial Trends</h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-dark-700 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 dark:border-dark-700 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium dark:text-white">Spending</h3>
                </div>
                <div className="flex items-center gap-2">
                  {trends?.spendingTrend === 'increasing' ? (
                    <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  <span className={`font-medium ${
                    trends?.spendingTrend === 'increasing' 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {trends?.spendingTrend === 'increasing' ? 'Increasing' : 'Decreasing'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Compared to last month
                </p>
              </div>
              
              <div className="border border-gray-200 dark:border-dark-700 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-medium dark:text-white">Savings</h3>
                </div>
                <div className="flex items-center gap-2">
                  {trends?.savingTrend === 'decreasing' ? (
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  <span className={`font-medium ${
                    trends?.savingTrend === 'decreasing' 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {trends?.savingTrend === 'decreasing' ? 'Decreasing' : 'Increasing'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Compared to last month
                </p>
              </div>
              
              <div className="border border-gray-200 dark:border-dark-700 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-medium dark:text-white">Income</h3>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Stable
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  No significant changes
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Key Insights */}
        <div className="card">
          <h2 className="text-xl font-bold dark:text-white mb-4">Key Insights</h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-dark-700 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="border border-gray-200 dark:border-dark-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'spending' 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : insight.type === 'savings' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {insight.type === 'spending' ? (
                        <TrendingUp className={`w-5 h-5 ${
                          insight.type === 'spending' 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`} />
                      ) : (
                        <Lightbulb className={`w-5 h-5 ${
                          insight.type === 'spending' 
                            ? 'text-red-600 dark:text-red-400' 
                            : insight.type === 'savings' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium dark:text-white">{insight.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {insight.description}
                      </p>
                      {insight.change && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className={`text-sm font-medium ${
                            insight.change > 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {insight.change > 0 ? '+' : ''}{insight.change}%
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            in {insight.category}
                          </span>
                        </div>
                      )}
                      {insight.potential && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Potential savings: {formatCurrency(insight.potential)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personalized Recommendations */}
        <div className="card">
          <h2 className="text-xl font-bold dark:text-white mb-4">Personalized Recommendations</h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-dark-700 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border border-gray-200 dark:border-dark-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium dark:text-white">{rec.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {rec.description}
                      </p>
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        <p className="text-sm font-medium dark:text-white">Suggested Action</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {rec.action}
                        </p>
                      </div>
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {rec.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Projections */}
        <div className="card">
          <h2 className="text-xl font-bold dark:text-white mb-4">Financial Projections</h2>
          
          <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">What if you invest monthly?</h3>
            <p className="text-primary-100 mb-4">
              See how regular investments can grow your wealth over time
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-primary-100 text-sm">5 Years</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(calculateProjection(10000, 12, 5))}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-primary-100 text-sm">10 Years</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(calculateProjection(10000, 12, 10))}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-primary-100 text-sm">15 Years</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(calculateProjection(10000, 12, 15))}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSimulator(true)}
              className="mt-6 w-full bg-white text-primary-600 font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Customize Projection
            </button>
          </div>
        </div>
      </div>

      {/* Financial Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">Financial Simulator</h3>
              <button
                onClick={() => {
                  setShowSimulator(false);
                  resetSimulation();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Monthly Investment
                </label>
                <input
                  type="number"
                  value={simulationParams.monthlyInvestment}
                  onChange={(e) => setSimulationParams({
                    ...simulationParams,
                    monthlyInvestment: parseInt(e.target.value) || 0
                  })}
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Annual Return (%)
                </label>
                <input
                  type="number"
                  value={simulationParams.annualReturn}
                  onChange={(e) => setSimulationParams({
                    ...simulationParams,
                    annualReturn: parseInt(e.target.value) || 0
                  })}
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Investment Period (Years)
                </label>
                <input
                  type="number"
                  value={simulationParams.years}
                  onChange={(e) => setSimulationParams({
                    ...simulationParams,
                    years: parseInt(e.target.value) || 0
                  })}
                  className="input-field w-full"
                />
              </div>
              
              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                <h4 className="font-medium dark:text-white mb-2">Projection Results</h4>
                {simulationResult !== null ? (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency(simulationResult)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      After {simulationParams.years} years with {simulationParams.annualReturn}% annual return
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    Enter values and click "Calculate" to see projection
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={runSimulation}
                  className="btn-primary flex-1"
                >
                  Calculate
                </button>
                <button
                  onClick={resetSimulation}
                  className="btn-secondary flex-1"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}