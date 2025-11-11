import express, { Response } from 'express';
import Goal from '../models/Goal';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all goals for user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    
    const query: any = { userId: req.userId };
    if (status) {
      query.status = status;
    }
    
    const goals = await Goal.find(query).sort({ priority: -1, deadline: 1 });
    
    // Add AI tips for each goal
    const goalsWithTips = goals.map(goal => {
      const goalObj: any = goal.toObject({ virtuals: true });
      goalObj.aiTip = generateGoalTip(goal);
      goalObj.estimatedCompletion = (goal as any).estimatedCompletionDate();
      return goalObj;
    });
    
    res.json({ goals: goalsWithTips });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get single goal
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const goalObj: any = goal.toObject({ virtuals: true });
    goalObj.aiTip = generateGoalTip(goal);
    goalObj.estimatedCompletion = (goal as any).estimatedCompletionDate();
    
    res.json({ goal: goalObj });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Create new goal
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      targetAmount,
      currentAmount,
      category,
      deadline,
      priority,
      monthlyContribution,
    } = req.body;
    
    // Get user's currency from accounts
    const accounts = await Account.find({ userId: req.userId }).limit(1);
    const currency = accounts.length > 0 ? accounts[0].currency : 'USD';
    
    const goal = await Goal.create({
      userId: req.userId,
      name,
      description,
      targetAmount,
      currentAmount: currentAmount || 0,
      category: category || 'savings',
      deadline: deadline ? new Date(deadline) : undefined,
      priority: priority || 'medium',
      currency,
      monthlyContribution,
      status: 'active',
    });
    
    const goalObj: any = goal.toObject({ virtuals: true });
    goalObj.aiTip = generateGoalTip(goal);
    goalObj.estimatedCompletion = (goal as any).estimatedCompletionDate();
    
    res.status(201).json({ goal: goalObj });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      targetAmount,
      currentAmount,
      category,
      deadline,
      priority,
      status,
      monthlyContribution,
    } = req.body;
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Update fields
    if (name !== undefined) goal.name = name;
    if (description !== undefined) goal.description = description;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (category !== undefined) goal.category = category;
    if (deadline !== undefined) goal.deadline = deadline ? new Date(deadline) : undefined;
    if (priority !== undefined) goal.priority = priority;
    if (status !== undefined) goal.status = status;
    if (monthlyContribution !== undefined) goal.monthlyContribution = monthlyContribution;
    
    // Mark as completed if target reached
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = new Date();
    }
    
    await goal.save();
    
    const goalObj: any = goal.toObject({ virtuals: true });
    goalObj.aiTip = generateGoalTip(goal);
    goalObj.estimatedCompletion = (goal as any).estimatedCompletionDate();
    
    res.json({ goal: goalObj });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete goal
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Add contribution to goal
router.post('/:id/contribute', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid contribution amount' });
    }
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    goal.currentAmount += amount;
    
    // Mark as completed if target reached
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = new Date();
    }
    
    await goal.save();
    
    const goalObj: any = goal.toObject({ virtuals: true });
    goalObj.aiTip = generateGoalTip(goal);
    goalObj.estimatedCompletion = (goal as any).estimatedCompletionDate();
    
    res.json({ goal: goalObj });
  } catch (error) {
    console.error('Contribute to goal error:', error);
    res.status(500).json({ error: 'Failed to add contribution' });
  }
});

// Helper function to generate AI tips
function generateGoalTip(goal: any): string {
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
    
    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      if (completionDate > deadline) {
        const additionalNeeded = Math.ceil((remaining / ((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) - goal.monthlyContribution);
        if (additionalNeeded > 0) {
          return `⚠️ Increase monthly contribution by ${goal.currency} ${additionalNeeded.toFixed(0)} to meet your deadline.`;
        }
      } else {
        return `✅ On track! Continue ${goal.currency} ${goal.monthlyContribution}/month to reach goal by ${monthName}.`;
      }
    }
    
    return `💡 Add ${goal.currency} ${goal.monthlyContribution}/month to reach your goal by ${monthName}.`;
  }
  
  if (goal.deadline) {
    const deadline = new Date(goal.deadline);
    const monthsUntilDeadline = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsUntilDeadline > 0) {
      const neededPerMonth = Math.ceil(remaining / monthsUntilDeadline);
      return `💡 Save ${goal.currency} ${neededPerMonth}/month to reach your goal by deadline.`;
    } else {
      return `⚠️ Deadline passed. Consider extending or increasing contributions.`;
    }
  }
  
  // Default tip based on progress
  if (progress < 25) {
    return `🚀 Just getting started! Set a monthly contribution to track progress.`;
  } else if (progress < 50) {
    return `📈 Good progress! You're ${progress.toFixed(0)}% of the way there.`;
  } else if (progress < 75) {
    return `💪 Over halfway! Keep up the momentum.`;
  } else {
    return `🎯 Almost there! Just ${goal.currency} ${remaining.toFixed(0)} to go.`;
  }
}

export default router;
