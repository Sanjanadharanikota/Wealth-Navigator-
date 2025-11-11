import express, { Response } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import Account from '../models/Account';
import Goal from '../models/Goal';
import { authenticate, AuthRequest } from '../middleware/auth';
import aiService from '../services/aiService';

const router = express.Router();

// Helper to format currency
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

// Get comprehensive advanced insights
router.get('/advanced', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // Get all data
    const accounts = await Account.find({ userId });
    const allTransactions = await Transaction.find({ userId }).sort({ date: -1 });
    const goals = await Goal.find({ userId, status: 'active' });
    
    const userCurrency = accounts.length > 0 ? accounts[0].currency : 'USD';
    
    // Get transactions for different periods
    const { startDate: last30Start } = getDateRange(30);
    const { startDate: last60Start } = getDateRange(60);
    const { startDate: last90Start } = getDateRange(90);
    const { startDate: last180Start } = getDateRange(180);
    const { startDate: last365Start } = getDateRange(365);
    
    const last30Transactions = allTransactions.filter(t => t.date >= last30Start);
    const last60Transactions = allTransactions.filter(t => t.date >= last60Start);
    const last90Transactions = allTransactions.filter(t => t.date >= last90Start);
    const last180Transactions = allTransactions.filter(t => t.date >= last180Start);
    const last365Transactions = allTransactions.filter(t => t.date >= last365Start);
    
    // ===== TREND INSIGHTS =====
    const trendInsights = await generateTrendInsights(
      last30Transactions,
      last60Transactions,
      last90Transactions,
      last365Transactions,
      userCurrency
    );
    
    // ===== PREDICTIVE ANALYSIS =====
    const predictions = await generatePredictions(
      allTransactions,
      accounts,
      goals,
      userCurrency
    );
    
    // ===== RECOMMENDATIONS =====
    const recommendations = await generateRecommendations(
      userId!.toString(),
      accounts,
      allTransactions,
      goals,
      userCurrency
    );
    
    // ===== ANOMALY DETECTION =====
    const anomalies = detectAnomalies(allTransactions, userCurrency);
    
    // ===== GOAL INSIGHTS =====
    const goalInsights = goals.map(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const remaining = goal.targetAmount - goal.currentAmount;
      
      let estimatedCompletion = null;
      if (goal.monthlyContribution && goal.monthlyContribution > 0) {
        const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution);
        estimatedCompletion = new Date();
        estimatedCompletion.setMonth(estimatedCompletion.getMonth() + monthsNeeded);
      }
      
      return {
        ...goal.toObject(),
        progress,
        remaining,
        estimatedCompletion,
        aiTip: generateGoalTip(goal, userCurrency),
      };
    });
    
    res.json({
      trendInsights,
      predictions,
      recommendations,
      anomalies,
      goalInsights,
      currency: userCurrency,
    });
  } catch (error) {
    console.error('Get advanced insights error:', error);
    res.status(500).json({ error: 'Failed to fetch advanced insights' });
  }
});

// Generate trend insights with AI summaries
async function generateTrendInsights(
  last30: any[],
  last60: any[],
  last90: any[],
  last365: any[],
  currency: string
) {
  // Calculate metrics for different periods
  const currentMonthExpenses = last30
    .filter(t => {
      if (t.amount < 0) return true;
      const name = (t.name || '').toLowerCase();
      return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const previousMonthExpenses = last60
    .filter(t => {
      if (t.date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && t.amount < 0) return true;
      const name = (t.name || '').toLowerCase();
      return t.date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const currentQuarterExpenses = last90
    .filter(t => {
      if (t.amount < 0) return true;
      const name = (t.name || '').toLowerCase();
      return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  // Category breakdown
  const categoryExpenses: { [key: string]: { current: number; previous: number } } = {};
  
  last30.filter(t => {
    if (t.amount < 0) return true;
    const name = (t.name || '').toLowerCase();
    return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
  }).forEach(t => {
    let cat = deriveCategory(t);
    if (!categoryExpenses[cat]) categoryExpenses[cat] = { current: 0, previous: 0 };
    categoryExpenses[cat].current += Math.abs(t.amount);
  });
  
  last60.filter(t => {
    if (t.date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && t.amount < 0) return true;
    const name = (t.name || '').toLowerCase();
    return t.date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
  }).forEach(t => {
    let cat = deriveCategory(t);
    if (!categoryExpenses[cat]) categoryExpenses[cat] = { current: 0, previous: 0 };
    categoryExpenses[cat].previous += Math.abs(t.amount);
  });
  
  // Find significant changes
  const insights = [];
  
  // Month over month change
  if (previousMonthExpenses > 0) {
    const change = ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
    if (Math.abs(change) > 10) {
      insights.push({
        type: 'monthly_trend',
        title: `Monthly Spending ${change > 0 ? 'Increased' : 'Decreased'}`,
        description: `Your expenses ${change > 0 ? 'rose' : 'fell'} ${Math.abs(change).toFixed(1)}% compared to last month.`,
        change: change,
        current: currentMonthExpenses,
        previous: previousMonthExpenses,
        severity: Math.abs(change) > 25 ? 'high' : 'medium',
      });
    }
  }
  
  // Category-specific insights
  for (const [category, amounts] of Object.entries(categoryExpenses)) {
    if (amounts.previous > 0) {
      const change = ((amounts.current - amounts.previous) / amounts.previous) * 100;
      if (Math.abs(change) > 25) {
        insights.push({
          type: 'category_trend',
          title: `${category} Expenses ${change > 0 ? 'Increased' : 'Decreased'}`,
          description: `Your ${category.toLowerCase()} expenses ${change > 0 ? 'rose' : 'fell'} ${Math.abs(change).toFixed(1)}% compared to last month.`,
          category,
          change,
          current: amounts.current,
          previous: amounts.previous,
          severity: Math.abs(change) > 50 ? 'high' : 'medium',
        });
      }
    }
  }
  
  // Monthly comparison data for charts
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    const monthTransactions = last365.filter(t => t.date >= monthStart && t.date < monthEnd);
    const expenses = monthTransactions
      .filter(t => {
        if (t.amount < 0) return true;
        const name = (t.name || '').toLowerCase();
        return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    monthlyData.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      expenses,
    });
  }
  
  return {
    insights,
    monthlyData,
    summary: {
      currentMonth: currentMonthExpenses,
      previousMonth: previousMonthExpenses,
      currentQuarter: currentQuarterExpenses,
    },
  };
}

// Generate predictions using linear regression
async function generatePredictions(
  transactions: any[],
  accounts: any[],
  goals: any[],
  currency: string
) {
  // Calculate monthly cash flow trend
  const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
  
  transactions.forEach(t => {
    const month = t.date.toISOString().substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };
    
    const name = (t.name || '').toLowerCase();
    const isIncome = name.includes('deposit') || name.includes('payroll');
    
    if (t.amount < 0) {
      monthlyData[month].expenses += Math.abs(t.amount);
    } else if (isIncome) {
      monthlyData[month].income += t.amount;
    } else {
      monthlyData[month].expenses += t.amount;
    }
  });
  
  const months = Object.keys(monthlyData).sort().slice(-6);
  const balances = months.map(m => monthlyData[m].income - monthlyData[m].expenses);
  
  // Simple linear regression for next 3 months
  const predictions = [];
  const currentBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  let predictedBalance = currentBalance;
  
  // Calculate average monthly change
  const avgChange = balances.length > 0 
    ? balances.reduce((sum, b) => sum + b, 0) / balances.length 
    : 0;
  
  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + i);
    
    predictedBalance += avgChange;
    
    predictions.push({
      month: futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      predictedBalance: Math.max(predictedBalance, 0),
      confidence: i === 1 ? 'high' : i === 2 ? 'medium' : 'low',
    });
  }
  
  // Predict goal completion
  const goalPredictions = goals.map(goal => {
    if (!goal.monthlyContribution || goal.monthlyContribution === 0) {
      return {
        goalId: goal._id,
        goalName: goal.name,
        estimatedCompletion: null,
        confidence: 'low',
        message: 'Set a monthly contribution to predict completion date',
      };
    }
    
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution);
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsNeeded);
    
    return {
      goalId: goal._id,
      goalName: goal.name,
      estimatedCompletion: completionDate,
      monthsRemaining: monthsNeeded,
      confidence: monthsNeeded <= 6 ? 'high' : monthsNeeded <= 12 ? 'medium' : 'low',
      message: `Expected completion: ${completionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    };
  });
  
  // Detect recurring payments
  const recurringPayments = detectRecurringPayments(transactions);
  
  return {
    cashBalance: predictions,
    goalCompletions: goalPredictions,
    recurringPayments,
    avgMonthlyChange: avgChange,
  };
}

// Detect recurring payments
function detectRecurringPayments(transactions: any[]) {
  const paymentGroups: { [key: string]: any[] } = {};
  
  // Group similar transactions
  transactions.forEach(t => {
    const key = t.name.toLowerCase().replace(/[0-9]/g, '').trim();
    if (!paymentGroups[key]) paymentGroups[key] = [];
    paymentGroups[key].push(t);
  });
  
  const recurring = [];
  
  for (const [name, txns] of Object.entries(paymentGroups)) {
    if (txns.length >= 3) {
      // Check if amounts are similar
      const amounts = txns.map(t => Math.abs(t.amount));
      const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / amounts.length;
      
      if (variance < avgAmount * 0.1) { // Low variance = recurring
        // Calculate average days between transactions
        const dates = txns.map(t => t.date.getTime()).sort();
        const intervals = [];
        for (let i = 1; i < dates.length; i++) {
          intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
        }
        const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
        
        if (avgInterval >= 25 && avgInterval <= 35) { // Monthly
          const nextDate = new Date(dates[dates.length - 1] + avgInterval * 24 * 60 * 60 * 1000);
          
          recurring.push({
            name: txns[0].name,
            amount: avgAmount,
            frequency: 'monthly',
            nextExpectedDate: nextDate,
            confidence: txns.length >= 6 ? 'high' : 'medium',
            lastOccurrence: new Date(dates[dates.length - 1]),
          });
        }
      }
    }
  }
  
  return recurring.slice(0, 10); // Top 10 recurring
}

// Generate AI-powered recommendations
async function generateRecommendations(
  userId: string,
  accounts: any[],
  transactions: any[],
  goals: any[],
  currency: string
) {
  const recommendations = [];
  
  // Calculate current financial state
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const last30 = transactions.filter(t => t.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  
  const monthlyIncome = last30
    .filter(t => {
      const name = (t.name || '').toLowerCase();
      return t.amount > 0 && (name.includes('deposit') || name.includes('payroll'));
    })
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyExpenses = last30
    .filter(t => {
      if (t.amount < 0) return true;
      const name = (t.name || '').toLowerCase();
      return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const monthlySavings = monthlyIncome - monthlyExpenses;
  
  // Category analysis
  const categoryExpenses: { [key: string]: number } = {};
  last30.filter(t => {
    if (t.amount < 0) return true;
    const name = (t.name || '').toLowerCase();
    return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll');
  }).forEach(t => {
    const cat = deriveCategory(t);
    categoryExpenses[cat] = (categoryExpenses[cat] || 0) + Math.abs(t.amount);
  });
  
  const topCategory = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1])[0];
  
  // Recommendation 1: Reduce top spending category
  if (topCategory && topCategory[1] > monthlyIncome * 0.2) {
    const savingsPotential = topCategory[1] * 0.15;
    recommendations.push({
      id: 'reduce-top-category',
      title: `Reduce ${topCategory[0]} Spending`,
      description: `Your ${topCategory[0].toLowerCase()} expenses are ${((topCategory[1] / monthlyIncome) * 100).toFixed(0)}% of your income. Consider reducing by 15%.`,
      action: `Set a monthly limit of ${formatCurrency(topCategory[1] * 0.85, currency)} for ${topCategory[0]}`,
      impact: `Save ${formatCurrency(savingsPotential, currency)}/month`,
      confidence: 'high',
      category: topCategory[0],
      potentialSavings: savingsPotential,
    });
  }
  
  // Recommendation 2: Investment opportunity
  if (monthlySavings > 5000 && totalBalance > 10000) {
    const investmentAmount = Math.min(monthlySavings * 0.3, 10000);
    recommendations.push({
      id: 'start-investing',
      title: 'Start Investing in SIPs',
      description: `You're saving ${formatCurrency(monthlySavings, currency)}/month. Consider investing ${formatCurrency(investmentAmount, currency)} in mutual funds.`,
      action: 'Set up automatic SIP investment',
      impact: `Grow wealth by ${formatCurrency(investmentAmount * 12, currency)}/year`,
      confidence: 'high',
      potentialGrowth: investmentAmount * 12 * 1.12, // Assuming 12% annual return
    });
  }
  
  // Recommendation 3: Emergency fund
  const emergencyFundTarget = monthlyExpenses * 6;
  if (totalBalance < emergencyFundTarget) {
    recommendations.push({
      id: 'build-emergency-fund',
      title: 'Build Emergency Fund',
      description: `Your emergency fund should cover 6 months of expenses (${formatCurrency(emergencyFundTarget, currency)}). You currently have ${formatCurrency(totalBalance, currency)}.`,
      action: `Save ${formatCurrency(Math.min(monthlySavings * 0.5, emergencyFundTarget - totalBalance), currency)}/month`,
      impact: `Reach target in ${Math.ceil((emergencyFundTarget - totalBalance) / (monthlySavings * 0.5))} months`,
      confidence: 'high',
      targetAmount: emergencyFundTarget,
    });
  }
  
  // Recommendation 4: Debt payoff (if liabilities exist)
  const liabilities = accounts.filter(acc => acc.currentBalance < 0);
  if (liabilities.length > 0) {
    const totalDebt = liabilities.reduce((sum, acc) => sum + Math.abs(acc.currentBalance), 0);
    const highestDebt = liabilities.sort((a, b) => Math.abs(b.currentBalance) - Math.abs(a.currentBalance))[0];
    
    recommendations.push({
      id: 'pay-off-debt',
      title: 'Pay Off High-Interest Debt First',
      description: `Focus on paying off ${highestDebt.name} (${formatCurrency(Math.abs(highestDebt.currentBalance), currency)}) to reduce interest payments.`,
      action: `Allocate extra ${formatCurrency(Math.min(monthlySavings * 0.3, 5000), currency)}/month towards debt`,
      impact: 'Reduce debt faster and save on interest',
      confidence: 'high',
      accountName: highestDebt.name,
    });
  }
  
  // Recommendation 5: Goal-based savings
  if (goals.length > 0) {
    const activeGoals = goals.filter(g => g.status === 'active');
    if (activeGoals.length > 0) {
      const totalGoalRemaining = activeGoals.reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0);
      const recommendedContribution = Math.min(monthlySavings * 0.4, totalGoalRemaining / 12);
      
      recommendations.push({
        id: 'increase-goal-contributions',
        title: 'Increase Goal Contributions',
        description: `You have ${activeGoals.length} active goal(s). Increase monthly contributions to reach them faster.`,
        action: `Allocate ${formatCurrency(recommendedContribution, currency)}/month across your goals`,
        impact: `Achieve goals ${Math.ceil(12 - (totalGoalRemaining / (recommendedContribution * 12)) * 12)} months earlier`,
        confidence: 'medium',
        affectedGoals: activeGoals.length,
      });
    }
  }
  
  return recommendations.slice(0, 5); // Top 5 recommendations
}

// Detect anomalies in transactions
function detectAnomalies(transactions: any[], currency: string) {
  const anomalies = [];
  const last30 = transactions.filter(t => t.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  
  // Detect duplicates
  const txnMap: { [key: string]: any[] } = {};
  last30.forEach(t => {
    const key = `${t.name}-${Math.abs(t.amount)}-${t.date.toISOString().substring(0, 10)}`;
    if (!txnMap[key]) txnMap[key] = [];
    txnMap[key].push(t);
  });
  
  for (const [key, txns] of Object.entries(txnMap)) {
    if (txns.length > 1) {
      anomalies.push({
        type: 'duplicate',
        severity: 'medium',
        title: 'Possible Duplicate Transaction',
        description: `Found ${txns.length} identical transactions for "${txns[0].name}" on ${txns[0].date.toLocaleDateString()}`,
        transactions: txns.map(t => t._id),
        amount: Math.abs(txns[0].amount),
        date: txns[0].date,
      });
    }
  }
  
  // Detect unusually high transactions
  const categoryAverages: { [key: string]: { total: number; count: number } } = {};
  
  transactions.forEach(t => {
    const cat = deriveCategory(t);
    if (!categoryAverages[cat]) categoryAverages[cat] = { total: 0, count: 0 };
    categoryAverages[cat].total += Math.abs(t.amount);
    categoryAverages[cat].count++;
  });
  
  last30.forEach(t => {
    const cat = deriveCategory(t);
    const avg = categoryAverages[cat].total / categoryAverages[cat].count;
    
    if (Math.abs(t.amount) > avg * 3) { // 3x average
      anomalies.push({
        type: 'unusual_amount',
        severity: 'high',
        title: `Unusually High ${cat} Transaction`,
        description: `Transaction of ${formatCurrency(Math.abs(t.amount), currency)} is ${((Math.abs(t.amount) / avg) * 100).toFixed(0)}% higher than your average ${cat.toLowerCase()} expense.`,
        transaction: t._id,
        amount: Math.abs(t.amount),
        average: avg,
        category: cat,
        date: t.date,
      });
    }
  });
  
  return anomalies.slice(0, 10); // Top 10 anomalies
}

// Helper: Derive category from transaction
function deriveCategory(t: any): string {
  if (t.category && t.category.length > 0 && t.category[0]) {
    return t.category[0];
  }
  
  if (t.merchantName) {
    const merchant = t.merchantName.toLowerCase();
    if (merchant.includes('uber') || merchant.includes('lyft')) return 'Transportation';
    if (merchant.includes('food') || merchant.includes('restaurant')) return 'Food and Dining';
    if (merchant.includes('amazon') || merchant.includes('shop')) return 'Shopping';
    if (merchant.includes('gas')) return 'Gas';
    return 'General';
  }
  
  if (t.name) {
    const name = t.name.toLowerCase();
    if (name.includes('uber') || name.includes('lyft')) return 'Transportation';
    if (name.includes('deposit') || name.includes('payroll')) return 'Income';
    return 'General';
  }
  
  return 'Uncategorized';
}

// Helper: Generate goal tip
function generateGoalTip(goal: any, currency: string): string {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  
  if (progress >= 100) {
    return '🎉 Congratulations! You\'ve reached your goal!';
  }
  
  if (goal.monthlyContribution && goal.monthlyContribution > 0) {
    const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution);
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsNeeded);
    
    const monthName = completionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return `💡 Add ${formatCurrency(goal.monthlyContribution, currency)}/month to reach your goal by ${monthName}.`;
  }
  
  if (progress < 25) {
    return `🚀 Just getting started! Set a monthly contribution to track progress.`;
  } else if (progress < 50) {
    return `📈 Good progress! You're ${progress.toFixed(0)}% of the way there.`;
  } else if (progress < 75) {
    return `💪 Over halfway! Keep up the momentum.`;
  } else {
    return `🎯 Almost there! Just ${formatCurrency(remaining, currency)} to go.`;
  }
}

export default router;
