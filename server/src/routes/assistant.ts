import express, { Response } from 'express';
import Transaction from '../models/Transaction';
import Account from '../models/Account';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-8b-8192';

// Helper to get user financial context
async function getUserFinancialContext(userId: string) {
  const accounts = await Account.find({ userId });
  const transactions = await Transaction.find({ userId })
    .sort({ date: -1 })
    .limit(200); // Increased limit for better context

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  
  // Calculate income and expenses for the last 30 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const recentTransactions = transactions.filter(t => t.date >= startDate);
  const monthlyIncome = recentTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyExpenses = recentTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Category breakdown for the last 30 days
  const categoryExpenses: { [key: string]: number } = {};
  recentTransactions
    .filter(t => t.amount < 0)
    .forEach(t => {
      const cat = t.category[0] || 'Other';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + Math.abs(t.amount);
    });

  // Get top expense categories
  const topCategories = Object.entries(categoryExpenses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  // Calculate spending trends
  const weeklySpending: number[] = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    
    const weekExpenses = transactions
      .filter(t => t.date >= weekStart && t.date < weekEnd && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    weeklySpending.push(weekExpenses);
  }

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings: monthlyIncome - monthlyExpenses,
    topCategories,
    weeklySpending,
    accounts: accounts.map(a => ({
      name: a.name,
      type: a.type,
      subtype: a.subtype,
      balance: a.currentBalance,
      currency: a.currency,
      institution: a.officialName || a.name.split(' ')[0] || 'Unknown Institution'
    })),
    recentTransactions: recentTransactions.slice(0, 15).map(t => ({
      date: t.date,
      name: t.name,
      amount: t.amount,
      category: t.category[0],
      pending: t.pending
    })),
  };
}

// Chat query
router.post('/query', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user's financial context
    const context = await getUserFinancialContext(req.user.id);
    
    // Get user's currency from first account
    const userCurrency = context.accounts.length > 0 ? context.accounts[0].currency : 'USD';
    const currencySymbol = userCurrency === 'USD' ? '$' : userCurrency === 'INR' ? '₹' : userCurrency;

    // Build detailed financial context
    const accountsSummary = context.accounts.map(a => 
      `${a.name} (${a.type}${a.subtype ? ` - ${a.subtype}` : ''}): ${a.currency} ${a.balance.toFixed(2)}`
    ).join('\n');
    
    const topCategoriesSummary = context.topCategories.map(c => 
      `${c.category}: ${currencySymbol}${c.amount.toFixed(2)}`
    ).join('\n');
    
    const recentTransactionsSummary = context.recentTransactions.slice(0, 10).map(t =>
      `${t.date.toISOString().split('T')[0]}: ${t.name} - ${currencySymbol}${Math.abs(t.amount).toFixed(2)} (${t.category || 'Uncategorized'})`
    ).join('\n');
    
    const spendingTrend = context.weeklySpending.length >= 2 
      ? (context.weeklySpending[0] > context.weeklySpending[1] ? 'increasing' : 'decreasing')
      : 'stable';

    // Generate response using Groq REST API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are an expert financial advisor AI assistant. Analyze the user's complete financial data and provide personalized, actionable insights.

USER'S COMPLETE FINANCIAL PROFILE:

💰 NET WORTH & ACCOUNTS:
- Total Balance: ${currencySymbol}${context.totalBalance.toFixed(2)}
- Currency: ${userCurrency}
- Accounts:
${accountsSummary}

📊 MONTHLY CASH FLOW (Last 30 days):
- Income: ${currencySymbol}${context.monthlyIncome.toFixed(2)}
- Expenses: ${currencySymbol}${context.monthlyExpenses.toFixed(2)}
- Net Savings: ${currencySymbol}${context.monthlySavings.toFixed(2)}
- Savings Rate: ${context.monthlyIncome > 0 ? ((context.monthlySavings / context.monthlyIncome) * 100).toFixed(1) : 0}%

📈 SPENDING ANALYSIS:
- Trend: ${spendingTrend}
- Top Expense Categories:
${topCategoriesSummary}

📝 RECENT TRANSACTIONS (Last 10):
${recentTransactionsSummary}

INSTRUCTIONS:
1. Always reference specific numbers from the user's actual data
2. Provide personalized recommendations based on their spending patterns
3. Identify opportunities for savings in their top expense categories
4. Suggest realistic budget adjustments
5. Be conversational but professional
6. If asked about specific transactions or categories, use the actual data provided
7. Calculate percentages and trends when relevant
8. Provide actionable next steps

Answer the user's question using their real financial data. Be specific, accurate, and helpful.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        model: MODEL,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';

    res.json({
      response: text,
      sources: [] // Add sources if available
    });

  } catch (error) {
    console.error('Assistant error:', error);

    // More detailed error logging
    if (error instanceof Error && error.message) {
      console.error('Error message:', error.message);
    }
    if (error && typeof error === 'object' && 'status' in error) {
      console.error('Error status:', (error as any).status);
    }

    res.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;