import express, { Response } from 'express';
import Transaction from '../models/Transaction';
import Account from '../models/Account';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to format currency based on currency code
const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'INR': '₹',
    'EUR': '€',
    'GBP': '£',
  };
  const symbol = symbols[currencyCode] || currencyCode;
  return `${symbol}${amount.toFixed(0)}`;
};

// Helper to get date range
const getDateRange = (days: number) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return { startDate, endDate };
};

// Get comprehensive insights
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // Get accounts
    const accounts = await Account.find({ userId });
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    
    // Get user's currency from first account (all should be same from Plaid)
    const userCurrency = accounts.length > 0 ? accounts[0].currency : 'USD';
    
    // Get transactions for different time periods
    const { startDate: last30Start } = getDateRange(30);
    const { startDate: last60Start } = getDateRange(60);
    const { startDate: last90Start } = getDateRange(90);
    const { startDate: last180Start } = getDateRange(180);
    
    const allTransactions = await Transaction.find({ userId }).sort({ date: -1 });
    const last30Transactions = allTransactions.filter(t => t.date >= last30Start);
    const last60Transactions = allTransactions.filter(t => t.date >= last60Start);
    const last90Transactions = allTransactions.filter(t => t.date >= last90Start);
    const last180Transactions = allTransactions.filter(t => t.date >= last180Start);
    
    // Calculate monthly metrics
    // Handle Plaid Sandbox where all amounts might be positive
    const currentMonthIncome = last30Transactions
      .filter(t => {
        const name = (t.name || '').toLowerCase();
        return t.amount > 0 && (name.includes('deposit') || name.includes('payroll') || name.includes('payment received'));
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentMonthExpenses = last30Transactions
      .filter(t => {
        if (t.amount < 0) return true;
        const name = (t.name || '').toLowerCase();
        // Positive but not income = expense (Sandbox quirk)
        return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll') && !name.includes('payment received');
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const previousMonthIncome = last60Transactions
      .filter(t => {
        const name = (t.name || '').toLowerCase();
        return t.date < last30Start && t.amount > 0 && (name.includes('deposit') || name.includes('payroll') || name.includes('payment received'));
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const previousMonthExpenses = last60Transactions
      .filter(t => {
        if (t.date < last30Start && t.amount < 0) return true;
        const name = (t.name || '').toLowerCase();
        return t.date < last30Start && t.amount > 0 && !name.includes('deposit') && !name.includes('payroll') && !name.includes('payment received');
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Calculate trends
    const spendingChange = previousMonthExpenses > 0 
      ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
      : 0;
    
    const savingsChange = previousMonthIncome > 0
      ? (((currentMonthIncome - currentMonthExpenses) - (previousMonthIncome - previousMonthExpenses)) / (previousMonthIncome - previousMonthExpenses)) * 100
      : 0;
    
    const incomeChange = previousMonthIncome > 0
      ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100
      : 0;
    
    // Category analysis
    const categoryExpenses: { [key: string]: { current: number; previous: number } } = {};
    
    last30Transactions.filter(t => {
      if (t.amount < 0) return true;
      const name = (t.name || '').toLowerCase();
      return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
    }).forEach(t => {
      let cat = 'Uncategorized';
      if (t.category && t.category.length > 0 && t.category[0]) {
        cat = t.category[0];
      } else if (t.merchantName) {
        const merchant = t.merchantName.toLowerCase();
        if (merchant.includes('uber') || merchant.includes('lyft')) cat = 'Transportation';
        else if (merchant.includes('food') || merchant.includes('restaurant')) cat = 'Food and Dining';
        else if (merchant.includes('amazon') || merchant.includes('shop')) cat = 'Shopping';
        else cat = 'General';
      } else if (t.name) {
        const name = t.name.toLowerCase();
        if (name.includes('uber') || name.includes('lyft')) cat = 'Transportation';
        else cat = 'General';
      }
      if (!categoryExpenses[cat]) categoryExpenses[cat] = { current: 0, previous: 0 };
      categoryExpenses[cat].current += Math.abs(t.amount);
    });
    
    last60Transactions.filter(t => {
      if (t.date < last30Start && t.amount < 0) return true;
      const name = (t.name || '').toLowerCase();
      return t.date < last30Start && t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
    }).forEach(t => {
      let cat = 'Uncategorized';
      if (t.category && t.category.length > 0 && t.category[0]) {
        cat = t.category[0];
      } else if (t.merchantName) {
        const merchant = t.merchantName.toLowerCase();
        if (merchant.includes('uber') || merchant.includes('lyft')) cat = 'Transportation';
        else if (merchant.includes('food') || merchant.includes('restaurant')) cat = 'Food and Dining';
        else if (merchant.includes('amazon') || merchant.includes('shop')) cat = 'Shopping';
        else cat = 'General';
      } else if (t.name) {
        const name = t.name.toLowerCase();
        if (name.includes('uber') || name.includes('lyft')) cat = 'Transportation';
        else cat = 'General';
      }
      if (!categoryExpenses[cat]) categoryExpenses[cat] = { current: 0, previous: 0 };
      categoryExpenses[cat].previous += Math.abs(t.amount);
    });
    
    // Find categories with significant changes
    const categoryInsights = Object.entries(categoryExpenses)
      .map(([category, amounts]) => ({
        category,
        current: amounts.current,
        previous: amounts.previous,
        change: amounts.previous > 0 ? ((amounts.current - amounts.previous) / amounts.previous) * 100 : 0
      }))
      .filter(c => Math.abs(c.change) > 15) // Only significant changes
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    
    // Generate insights
    const insights = [];
    
    // Spending pattern insight
    if (categoryInsights.length > 0) {
      const topChange = categoryInsights[0];
      insights.push({
        id: 1,
        title: `${topChange.category} Spending ${topChange.change > 0 ? 'Increased' : 'Decreased'}`,
        description: `Your spending in the ${topChange.category} category has ${topChange.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(topChange.change).toFixed(1)}% this month.`,
        type: topChange.change > 0 ? 'spending' : 'savings',
        change: topChange.change,
        category: topChange.category,
      });
    }
    
    // Savings opportunity
    const topExpenseCategory = Object.entries(categoryExpenses)
      .sort((a, b) => b[1].current - a[1].current)[0];
    
    if (topExpenseCategory && topExpenseCategory[1].current > 0) {
      const potential = topExpenseCategory[1].current * 0.15; // 15% reduction potential
      insights.push({
        id: 2,
        title: 'Savings Opportunity',
        description: `You could save ${formatCurrency(potential, userCurrency)}/month by reducing ${topExpenseCategory[0]} expenses by 15%.`,
        type: 'savings',
        potential: potential,
      });
    }
    
    // Income stability
    insights.push({
      id: 3,
      title: 'Income Stability',
      description: incomeChange > -5 && incomeChange < 5
        ? 'Your income has remained consistent over the past month.'
        : `Your income has ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(1)}% this month.`,
      type: 'income',
      change: incomeChange,
    });
    
    // Generate recommendations
    const recommendations = [];
    
    // Top expense category recommendation
    if (topExpenseCategory && topExpenseCategory[1].current > 1000) {
      recommendations.push({
        id: 1,
        title: `Reduce ${topExpenseCategory[0]} Spending`,
        description: `Consider limiting ${topExpenseCategory[0]} expenses to save more each month.`,
        action: `Set a monthly limit of ${formatCurrency(topExpenseCategory[1].current * 0.85, userCurrency)} for ${topExpenseCategory[0]}`,
        impact: `Save ${formatCurrency(topExpenseCategory[1].current * 0.15, userCurrency)}/month`,
      });
    }
    
    // Investment recommendation
    const monthlySavings = currentMonthIncome - currentMonthExpenses;
    if (monthlySavings > 5000) {
      const investmentAmount = Math.min(monthlySavings * 0.3, 10000);
      recommendations.push({
        id: 2,
        title: 'Invest in Mutual Funds',
        description: `Start investing ${formatCurrency(investmentAmount, userCurrency)}/month in mutual funds for long-term growth.`,
        action: 'Set up automatic investment transfer',
        impact: `Grow wealth by ${formatCurrency(investmentAmount * 12, userCurrency)}/year`,
      });
    }
    
    // Debt recommendation (if liabilities exist)
    const liabilities = accounts.filter(acc => acc.currentBalance < 0);
    if (liabilities.length > 0) {
      const totalDebt = liabilities.reduce((sum, acc) => sum + Math.abs(acc.currentBalance), 0);
      recommendations.push({
        id: 3,
        title: 'Pay Off High-Interest Debt',
        description: `Focus on paying off your debt to reduce interest payments.`,
        action: `Allocate extra ${formatCurrency(Math.min(monthlySavings * 0.2, 5000), userCurrency)}/month towards debt repayment`,
        impact: `Reduce debt faster and save on interest`,
      });
    }
    
    // Build trend chart data (last 6 months)
    const monthlyExpenseData: { [key: string]: number } = {};
    last180Transactions.filter(t => {
      if (t.amount < 0) return true;
      const name = (t.name || '').toLowerCase();
      return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
    }).forEach(t => {
      const month = t.date.toISOString().substring(0, 7);
      monthlyExpenseData[month] = (monthlyExpenseData[month] || 0) + Math.abs(t.amount);
    });
    
    const trendChartData = Object.keys(monthlyExpenseData)
      .sort()
      .slice(-6)
      .map(month => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        expenses: monthlyExpenseData[month]
      }));
    
    res.json({
      trends: {
        spendingTrend: spendingChange > 5 ? 'increasing' : spendingChange < -5 ? 'decreasing' : 'stable',
        savingTrend: savingsChange > 5 ? 'increasing' : savingsChange < -5 ? 'decreasing' : 'stable',
        incomeTrend: incomeChange > 5 ? 'increasing' : incomeChange < -5 ? 'decreasing' : 'stable',
      },
      insights,
      recommendations,
      trendChartData,
      summary: {
        totalBalance,
        monthlyIncome: currentMonthIncome,
        monthlyExpenses: currentMonthExpenses,
        monthlySavings: currentMonthIncome - currentMonthExpenses,
      },
      currency: userCurrency
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export default router;
