import express, { Response } from 'express';
import Transaction from '../models/Transaction';
import Account from '../models/Account';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to parse date range
const getDateRange = (range: string) => {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case '1m':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '12m':
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case '24m':
    case '2y':
      startDate.setFullYear(startDate.getFullYear() - 2);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 6);
  }

  return { startDate, endDate };
};

// Cash flow (inflow vs outflow)
router.get('/cashflow', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { range = '6m' } = req.query;
    const { startDate, endDate } = getDateRange(range as string);

    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Group by month
    const monthlyData: { [key: string]: { inflow: number; outflow: number } } = {};

    transactions.forEach((t) => {
      const month = t.date.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { inflow: 0, outflow: 0 };
      }

      const name = (t.name || '').toLowerCase();
      const isIncome = name.includes('deposit') || name.includes('payroll') || name.includes('payment received') || name.includes('credit');
      
      if (t.amount < 0) {
        monthlyData[month].outflow += Math.abs(t.amount);
      } else if (t.amount > 0 && isIncome) {
        monthlyData[month].inflow += t.amount;
      } else {
        // Positive amount but not income = expense (Plaid Sandbox quirk)
        monthlyData[month].outflow += t.amount;
      }
    });

    const data = Object.keys(monthlyData)
      .sort()
      .map((month) => ({
        month,
        inflow: monthlyData[month].inflow,
        outflow: monthlyData[month].outflow,
        net: monthlyData[month].inflow - monthlyData[month].outflow,
      }));

    res.json({ data });
  } catch (error) {
    console.error('Cashflow chart error:', error);
    res.status(500).json({ error: 'Failed to generate cashflow data' });
  }
});

// Expense breakdown by category
router.get('/expense-breakdown', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { range = '6m' } = req.query;
    const { startDate, endDate } = getDateRange(range as string);

    // Get all transactions (Plaid Sandbox may have incorrect signs)
    const allTransactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate },
    });
    
    // Filter for expenses: negative amounts OR transactions that look like expenses
    const transactions = allTransactions.filter(t => {
      if (t.amount < 0) return true; // Definitely an expense
      
      // If all amounts are positive (Plaid Sandbox issue), treat non-income as expenses
      const name = (t.name || '').toLowerCase();
      const merchant = (t.merchantName || '').toLowerCase();
      
      // These are income
      if (name.includes('deposit') || name.includes('payroll') || name.includes('payment') || name.includes('credit')) {
        return false;
      }
      
      // Everything else is likely an expense in sandbox
      return true;
    });

    // Group by category
    const categoryData: { [key: string]: number } = {};

    transactions.forEach((t) => {
      // Get category from array, or derive from merchant name, or use 'Uncategorized'
      let category = 'Uncategorized';
      
      if (t.category && t.category.length > 0 && t.category[0]) {
        category = t.category[0];
      } else if (t.merchantName) {
        // Derive category from merchant name
        const merchant = t.merchantName.toLowerCase();
        if (merchant.includes('uber') || merchant.includes('lyft') || merchant.includes('taxi')) {
          category = 'Transportation';
        } else if (merchant.includes('restaurant') || merchant.includes('food') || merchant.includes('cafe') || merchant.includes('starbucks')) {
          category = 'Food and Dining';
        } else if (merchant.includes('amazon') || merchant.includes('walmart') || merchant.includes('target')) {
          category = 'Shopping';
        } else if (merchant.includes('gas') || merchant.includes('shell') || merchant.includes('chevron')) {
          category = 'Gas';
        } else {
          category = 'General';
        }
      } else if (t.name) {
        // Derive from transaction name
        const name = t.name.toLowerCase();
        if (name.includes('uber') || name.includes('lyft')) {
          category = 'Transportation';
        } else if (name.includes('payroll') || name.includes('deposit')) {
          category = 'Income';
        } else {
          category = 'General';
        }
      }
      
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category] += Math.abs(t.amount);
    });

    // Sort by amount descending and take top 10
    const sortedData = Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, amount]) => ({
        category,
        amount,
      }));

    res.json({ data: sortedData });
  } catch (error) {
    console.error('Expense breakdown error:', error);
    res.status(500).json({ error: 'Failed to generate expense breakdown' });
  }
});

// Net worth trend
router.get('/networth', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { range = '12m' } = req.query;
    const { startDate, endDate } = getDateRange(range as string);

    // Get all accounts for the user
    const accounts = await Account.find({ userId: req.userId });

    // Get transactions within the date range
    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Calculate net worth over time by processing transactions chronologically
    const monthlyNetWorth: { [key: string]: { assets: number; liabilities: number; netWorth: number } } = {};
    
    // Initialize with current account balances
    let currentAssets = accounts
      .filter(acc => acc.currentBalance >= 0)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);
      
    let currentLiabilities = accounts
      .filter(acc => acc.currentBalance < 0)
      .reduce((sum, acc) => sum + Math.abs(acc.currentBalance), 0);
    
    let currentNetWorth = currentAssets - currentLiabilities;

    // Group transactions by month
    const transactionsByMonth: { [key: string]: any[] } = {};
    transactions.forEach(t => {
      const month = t.date.toISOString().substring(0, 7); // YYYY-MM
      if (!transactionsByMonth[month]) {
        transactionsByMonth[month] = [];
      }
      transactionsByMonth[month].push(t);
    });

    // Process each month's transactions to calculate historical net worth
    const months = Object.keys(transactionsByMonth).sort();
    
    // Start with current net worth and work backwards
    months.forEach(month => {
      monthlyNetWorth[month] = {
        assets: currentAssets,
        liabilities: currentLiabilities,
        netWorth: currentNetWorth
      };
      
      // Apply transactions for this month (working backwards)
      transactionsByMonth[month].forEach(t => {
        if (t.amount > 0) {
          // This was income, so in the past it would reduce our assets
          currentAssets -= t.amount;
        } else {
          // This was an expense, so in the past it would increase our assets
          currentAssets += Math.abs(t.amount);
        }
      });
      
      currentNetWorth = currentAssets - currentLiabilities;
    });

    // Add current month
    const currentMonth = new Date().toISOString().substring(0, 7);
    if (!monthlyNetWorth[currentMonth]) {
      monthlyNetWorth[currentMonth] = {
        assets: accounts
          .filter(acc => acc.currentBalance >= 0)
          .reduce((sum, acc) => sum + acc.currentBalance, 0),
        liabilities: accounts
          .filter(acc => acc.currentBalance < 0)
          .reduce((sum, acc) => sum + Math.abs(acc.currentBalance), 0),
        netWorth: accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
      };
    }

    const data = Object.keys(monthlyNetWorth)
      .sort()
      .map((month) => ({
        month,
        assets: monthlyNetWorth[month].assets,
        liabilities: monthlyNetWorth[month].liabilities,
        netWorth: monthlyNetWorth[month].netWorth,
      }));

    res.json({ 
      data,
      currentNetWorth: accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
    });
  } catch (error) {
    console.error('Net worth chart error:', error);
    res.status(500).json({ error: 'Failed to generate net worth data' });
  }
});

// Summary cards
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await Account.find({ userId: req.userId });

    // Calculate totals
    const totalAssets = accounts
      .filter((acc) => acc.currentBalance > 0)
      .reduce((sum, acc) => sum + acc.currentBalance, 0);

    const totalLiabilities = accounts
      .filter((acc) => acc.currentBalance < 0)
      .reduce((sum, acc) => sum + Math.abs(acc.currentBalance), 0);

    const netWorth = totalAssets - totalLiabilities;

    // Monthly cash flow (last 30 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const monthlyTransactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startDate },
    });

    const monthlyInflow = monthlyTransactions
      .filter((t) => {
        const name = (t.name || '').toLowerCase();
        return t.amount > 0 && (name.includes('deposit') || name.includes('payroll') || name.includes('payment received'));
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyOutflow = monthlyTransactions
      .filter((t) => {
        if (t.amount < 0) return true;
        const name = (t.name || '').toLowerCase();
        return t.amount > 0 && !name.includes('deposit') && !name.includes('payroll') && !name.includes('payment received');
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const monthlyCashFlow = monthlyInflow - monthlyOutflow;

    res.json({
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyCashFlow,
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// What-if simulator
router.post('/simulate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      monthlySavings = 0,
      expectedReturn = 0.07,
      inflation = 0.05,
      years = 10,
    } = req.body;

    const accounts = await Account.find({ userId: req.userId });
    const currentBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    const projections = [];
    let balance = currentBalance;

    for (let year = 0; year <= years; year++) {
      projections.push({
        year,
        balance: Math.round(balance),
        realValue: Math.round(balance / Math.pow(1 + inflation, year)),
      });

      // Calculate next year
      balance = balance * (1 + expectedReturn) + monthlySavings * 12;
    }

    res.json({ projections });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Failed to run simulation' });
  }
});

// Export chart data as CSV
router.get('/export/:chartType', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { chartType } = req.params;
    const { range = '6m' } = req.query;

    let csvData = '';

    switch (chartType) {
      case 'cashflow':
        const cashflowRes = await fetch(
          `${req.protocol}://${req.get('host')}/api/charts/cashflow?range=${range}`,
          {
            headers: { Authorization: req.headers.authorization || '' },
          }
        );
        const cashflowData = await cashflowRes.json();
        csvData = 'Month,Inflow,Outflow,Net\n';
        cashflowData.data.forEach((row: any) => {
          csvData += `${row.month},${row.inflow},${row.outflow},${row.net}\n`;
        });
        break;

      case 'expenses':
        const expenseRes = await fetch(
          `${req.protocol}://${req.get('host')}/api/charts/expense-breakdown?range=${range}`,
          {
            headers: { Authorization: req.headers.authorization || '' },
          }
        );
        const expenseData = await expenseRes.json();
        csvData = 'Category,Amount\n';
        expenseData.data.forEach((row: any) => {
          csvData += `${row.category},${row.amount}\n`;
        });
        break;

      case 'networth':
        const networthRes = await fetch(
          `${req.protocol}://${req.get('host')}/api/charts/networth?range=${range}`,
          {
            headers: { Authorization: req.headers.authorization || '' },
          }
        );
        const networthData = await networthRes.json();
        csvData = 'Month,Assets,Liabilities,Net Worth\n';
        networthData.data.forEach((row: any) => {
          csvData += `${row.month},${row.assets},${row.liabilities},${row.netWorth}\n`;
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid chart type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${chartType}-${range}.csv`);
    res.send(csvData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;