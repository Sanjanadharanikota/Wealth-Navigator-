import mongoose, { Document, Schema } from 'mongoose';

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  plaidAccountId: string;
  name: string;
  officialName?: string;
  type: string;
  subtype: string;
  mask?: string;
  currentBalance: number;
  availableBalance?: number;
  currency: string;
  lastSynced: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plaidAccountId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    officialName: String,
    type: {
      type: String,
      required: true,
    },
    subtype: {
      type: String,
      required: true,
    },
    mask: String,
    currentBalance: {
      type: Number,
      required: true,
    },
    availableBalance: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    lastSynced: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAccount>('Account', AccountSchema);
