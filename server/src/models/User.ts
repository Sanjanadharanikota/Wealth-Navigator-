import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string; // Optional now, only for first-time registration
  name: string;
  phone?: string;
  dateOfBirth?: Date;
  monthlyIncome?: number;
  pinHash: string; // Required for PhonePe-style authentication
  webAuthnCredentials: Array<{
    credentialID: string;
    credentialPublicKey: string;
    counter: number;
    transports?: string[];
  }>;
  plaidAccessToken?: string;
  plaidItemId?: string;
  hasBankConnected: boolean; // Track if user has connected bank
  onboardingComplete: boolean; // Track onboarding status
  devicePIN?: string;
  consentTimestamp: Date;
  privacySettings: {
    voiceConsent: boolean;
    dataSharing: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false, // Optional for PhonePe-style flow
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    monthlyIncome: {
      type: Number,
      required: false,
    },
    pinHash: {
      type: String,
      required: false, // Make pinHash optional since not all users will have PIN-based auth
      select: false, // Don't return by default
    },
    webAuthnCredentials: [
      {
        credentialID: { type: String, required: true },
        credentialPublicKey: { type: String, required: true },
        counter: { type: Number, required: true },
        transports: [String],
      },
    ],
    plaidAccessToken: {
      type: String,
      select: false, // Don't return by default
    },
    plaidItemId: {
      type: String,
    },
    hasBankConnected: {
      type: Boolean,
      default: false,
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    devicePIN: {
      type: String,
      select: false,
    },
    consentTimestamp: {
      type: Date,
      default: Date.now,
    },
    privacySettings: {
      voiceConsent: {
        type: Boolean,
        default: false,
      },
      dataSharing: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
