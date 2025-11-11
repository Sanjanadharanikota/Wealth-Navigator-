import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge extends Document {
  userId: mongoose.Types.ObjectId;
  challenge: string;
  expiresAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  challenge: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
});

// Auto-delete expired challenges after 5 minutes buffer
ChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 300 });

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);
