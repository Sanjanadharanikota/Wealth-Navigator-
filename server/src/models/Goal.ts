import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  category: 'savings' | 'purchase' | 'debt' | 'investment' | 'emergency' | 'other';
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  currency: string;
  monthlyContribution?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      enum: ['savings', 'purchase', 'debt', 'investment', 'emergency', 'other'],
      default: 'savings',
    },
    deadline: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    monthlyContribution: {
      type: Number,
      min: 0,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, deadline: 1 });

// Virtual for progress percentage
goalSchema.virtual('progress').get(function () {
  if (this.targetAmount === 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function () {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Method to calculate estimated completion date
goalSchema.methods.estimatedCompletionDate = function () {
  if (!this.monthlyContribution || this.monthlyContribution === 0) {
    return null;
  }
  
  const remaining = this.targetAmount - this.currentAmount;
  if (remaining <= 0) return new Date();
  
  const monthsNeeded = Math.ceil(remaining / this.monthlyContribution);
  const completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + monthsNeeded);
  
  return completionDate;
};

export default mongoose.model<IGoal>('Goal', goalSchema);
