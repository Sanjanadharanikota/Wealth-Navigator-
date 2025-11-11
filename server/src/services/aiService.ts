import { GoogleGenerativeAI } from '@google/generative-ai';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface FinancialContext {
  totalBalance: number;
  accounts: any[];
  recentTransactions: any[];
  monthlyIncome: number;
  monthlyExpenses: number;
  topCategories: { category: string; amount: number }[];
  savingsRate: number;
  currency: string;
}

export class AIService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Get comprehensive financial context for the user
   */
  async getFinancialContext(userId: mongoose.Types.ObjectId | string): Promise<FinancialContext> {
    // Get all accounts
    const accounts = await Account.find({ userId }).lean();
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const currency = accounts.length > 0 ? accounts[0].currency : 'USD';

    // Get transactions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await Transaction.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    // Calculate monthly income and expenses
    const monthlyIncome = recentTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = recentTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate top spending categories
    const categoryMap: { [key: string]: number } = {};
    recentTransactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const category = t.category[0] || 'Uncategorized';
        categoryMap[category] = (categoryMap[category] || 0) + Math.abs(t.amount);
      });

    const topCategories = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Calculate savings rate
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    return {
      totalBalance,
      accounts: accounts.map((acc) => ({
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        balance: acc.currentBalance,
      })),
      recentTransactions: recentTransactions.slice(0, 10).map((t) => ({
        name: t.name,
        amount: t.amount,
        category: t.category[0] || 'Uncategorized',
        date: t.date,
      })),
      monthlyIncome,
      monthlyExpenses,
      topCategories,
      savingsRate,
      currency,
    };
  }

  /**
   * Build context string for AI
   */
  buildContextString(context: FinancialContext): string {
    const currencySymbol = context.currency === 'USD' ? '$' : context.currency === 'INR' ? '₹' : context.currency;

    return `
You are a professional financial advisor AI assistant. Here is the user's current financial situation:

ACCOUNT SUMMARY:
- Total Balance: ${currencySymbol}${context.totalBalance.toFixed(2)}
- Currency: ${context.currency}
- Number of Accounts: ${context.accounts.length}

ACCOUNTS:
${context.accounts.map((acc) => `- ${acc.name} (${acc.subtype}): ${currencySymbol}${acc.balance.toFixed(2)}`).join('\n')}

MONTHLY CASH FLOW (Last 30 days):
- Income: ${currencySymbol}${context.monthlyIncome.toFixed(2)}
- Expenses: ${currencySymbol}${context.monthlyExpenses.toFixed(2)}
- Net Savings: ${currencySymbol}${(context.monthlyIncome - context.monthlyExpenses).toFixed(2)}
- Savings Rate: ${context.savingsRate.toFixed(1)}%

TOP SPENDING CATEGORIES:
${context.topCategories.map((cat) => `- ${cat.category}: ${currencySymbol}${cat.amount.toFixed(2)}`).join('\n')}

RECENT TRANSACTIONS:
${context.recentTransactions.map((t) => `- ${t.name}: ${currencySymbol}${t.amount.toFixed(2)} (${t.category})`).join('\n')}

Based on this financial data, provide personalized, actionable advice. Be specific with numbers and realistic recommendations.
`;
  }

  /**
   * Generate AI response with financial context
   */
  async generatePersonalizedResponse(
    userId: mongoose.Types.ObjectId | string,
    userMessage: string,
    conversationHistory: { role: string; content: string }[] = []
  ): Promise<string> {
    try {
      // Get user's financial context
      const context = await this.getFinancialContext(userId);
      const contextString = this.buildContextString(context);

      // Build conversation with context
      const systemPrompt = `${contextString}

INSTRUCTIONS FOR PERSONALIZED RESPONSES:
- You have access to the user's REAL financial data above
- ALWAYS use specific numbers from their actual accounts and transactions
- Structure your response clearly with sections:
  * Start with a direct answer to their question
  * Include relevant data points (balances, spending, income)
  * Provide 2-3 specific, actionable recommendations
  * End with encouragement or next steps

- Format currency amounts properly with ${context.currency} symbol
- Use bullet points or numbered lists for clarity
- Be conversational but professional
- If asked about affordability, calculate based on their actual savings rate and balance
- For spending questions, reference their actual categories and amounts
- Keep responses focused and actionable (3-5 paragraphs max)
- Use emojis sparingly for emphasis (💰 📊 ✅ 🎯)

IMPORTANT: This is PERSONALIZED advice based on THEIR data. Be specific!
`;

      // Combine system prompt with conversation history
      const fullPrompt = `${systemPrompt}

User Question: ${userMessage}

Provide a helpful, PERSONALIZED response using their ACTUAL financial data:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate generic response (when data sharing is off)
   */
  async generateGenericResponse(userMessage: string): Promise<string> {
    try {
      const systemPrompt = `You are a professional financial advisor AI assistant.

⚠️ IMPORTANT: The user has DISABLED data sharing. You do NOT have access to their financial data.

INSTRUCTIONS FOR GENERIC RESPONSES:
- Provide general financial education and advice
- Use hypothetical examples and typical scenarios
- Explain financial concepts clearly
- Give general best practices and guidelines
- DO NOT reference specific account balances, transactions, or personal data
- Use phrases like "typically", "generally", "most people", "financial experts recommend"
- Structure your response:
  * Answer their question generally
  * Provide educational context
  * Give 2-3 general recommendations
  * Remind them about personalized advice

- Keep responses helpful but general (2-4 paragraphs)
- Use bullet points for clarity
- Be encouraging and educational

ALWAYS end with:
"\n\n💡 **Want Personalized Advice?** Enable data sharing in the chat header to get specific recommendations based on your actual financial data!"
`;

      const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}\n\nProvide a helpful, general response:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate suggested questions based on user's financial situation
   */
  async generateSuggestedQuestions(userId: mongoose.Types.ObjectId | string): Promise<string[]> {
    try {
      const context = await this.getFinancialContext(userId);
      
      const suggestions: string[] = [];

      // Dynamic suggestions based on financial situation
      if (context.savingsRate < 10) {
        suggestions.push('How can I improve my savings rate?');
      } else if (context.savingsRate > 30) {
        suggestions.push('Where should I invest my extra savings?');
      }

      if (context.monthlyExpenses > context.monthlyIncome) {
        suggestions.push('How can I reduce my monthly expenses?');
      }

      if (context.topCategories.length > 0) {
        suggestions.push(`Why am I spending so much on ${context.topCategories[0].category.toLowerCase()}?`);
      }

      // Always include these
      suggestions.push('What is my total spending this month?');
      suggestions.push('Can I afford to buy a house?');
      suggestions.push('What should I do to save for a new car?');
      suggestions.push('How can I grow my wealth faster?');

      return suggestions.slice(0, 6); // Return top 6 suggestions
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [
        'What is my total spending this month?',
        'How can I improve my savings?',
        'Where should I invest my money?',
        'Can I afford a major purchase?',
      ];
    }
  }
}

export default new AIService();
