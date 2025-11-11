import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  plaidTransactionId: string;
  amount: number;
  date: Date;
  name: string;
  merchantName?: string;
  category: string[];
  categoryId?: string;
  pending: boolean;
  isoCurrencyCode: string;
  paymentChannel: string;
  isAnomaly: boolean;
  aiSuggestedCategory?: string;
  isRecurring: boolean;
  tags: string[];
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    plaidTransactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    merchantName: String,
    category: [String],
    categoryId: String,
    pending: {
      type: Boolean,
      default: false,
    },
    isoCurrencyCode: {
      type: String,
      default: 'USD',
    },
    paymentChannel: String,
    isAnomaly: {
      type: Boolean,
      default: false,
    },
    aiSuggestedCategory: String,
    isRecurring: {
      type: Boolean,
      default: false,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
