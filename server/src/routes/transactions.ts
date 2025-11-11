import express, { Response } from 'express';
import Transaction from '../models/Transaction';
import Account from '../models/Account';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get transactions with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      category,
      accountId,
      limit = '50',
      offset = '0',
      search,
    } = req.query;

    const query: any = { userId: req.userId };

    // Date filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Account filter
    if (accountId) {
      query.accountId = accountId;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { merchantName: { $regex: search, $options: 'i' } },
      ];
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .populate('accountId', 'name mask type');

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('accountId', 'name mask type');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Update transaction (tags, recurring flag)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { tags, isRecurring, aiSuggestedCategory } = req.body;

    const update: any = {};
    if (tags !== undefined) update.tags = tags;
    if (isRecurring !== undefined) update.isRecurring = isRecurring;
    if (aiSuggestedCategory !== undefined) update.aiSuggestedCategory = aiSuggestedCategory;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Get latest transactions
router.get('/latest/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(3)
      .populate('accountId', 'name mask');

    res.json({ transactions });
  } catch (error) {
    console.error('Get latest transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch latest transactions' });
  }
});

// Detect anomalies
router.post('/detect-anomalies', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId });

    // Group by category and calculate averages
    const categoryStats: { [key: string]: { total: number; count: number; avg: number } } = {};

    transactions.forEach((t) => {
      const cat = t.category[0] || 'Other';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, count: 0, avg: 0 };
      }
      categoryStats[cat].total += Math.abs(t.amount);
      categoryStats[cat].count += 1;
    });

    // Calculate averages
    Object.keys(categoryStats).forEach((cat) => {
      categoryStats[cat].avg = categoryStats[cat].total / categoryStats[cat].count;
    });

    // Flag anomalies (>3x average)
    let anomalyCount = 0;
    for (const transaction of transactions) {
      const cat = transaction.category[0] || 'Other';
      const avg = categoryStats[cat]?.avg || 0;
      const isAnomaly = Math.abs(transaction.amount) > avg * 3;

      if (transaction.isAnomaly !== isAnomaly) {
        transaction.isAnomaly = isAnomaly;
        await transaction.save();
        if (isAnomaly) anomalyCount++;
      }
    }

    res.json({
      message: 'Anomaly detection completed',
      anomaliesDetected: anomalyCount,
    });
  } catch (error) {
    console.error('Detect anomalies error:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

export default router;
