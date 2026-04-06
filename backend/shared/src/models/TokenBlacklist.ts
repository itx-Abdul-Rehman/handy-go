import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Token Blacklist — stores revoked JWT tokens until they expire.
 *
 * Uses a TTL index so MongoDB automatically purges expired entries.
 * This prevents deleted / deactivated users from reusing stolen tokens.
 */

export interface ITokenBlacklist extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  reason: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ITokenBlacklistModel extends Model<ITokenBlacklist> {
  /** Returns `true` if the token has been revoked. */
  isRevoked(token: string): Promise<boolean>;
  /** Revoke a single token. */
  revokeToken(token: string, userId: string, reason: string, expiresAt: Date): Promise<void>;
  /** Revoke all tokens for a given user (e.g. on password change). */
  revokeAllForUser(userId: string, reason: string): Promise<void>;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      default: 'logout',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index — MongoDB automatically deletes documents when expiresAt is reached
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast user-level lookups
tokenBlacklistSchema.index({ userId: 1, createdAt: -1 });

// ---------- Statics ----------

tokenBlacklistSchema.statics.isRevoked = async function (
  token: string
): Promise<boolean> {
  const doc = await this.findOne({ token }).lean();
  return !!doc;
};

tokenBlacklistSchema.statics.revokeToken = async function (
  token: string,
  userId: string,
  reason: string,
  expiresAt: Date
): Promise<void> {
  await this.create({ token, userId, reason, expiresAt });
};

tokenBlacklistSchema.statics.revokeAllForUser = async function (
  userId: string,
  reason: string
): Promise<void> {
  // Insert a sentinel record; the auth middleware should additionally
  // verify the user's `isActive` flag in the DB.
  await this.create({
    token: `__all__${userId}__${Date.now()}`,
    userId,
    reason,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
};

export const TokenBlacklist = mongoose.model<ITokenBlacklist, ITokenBlacklistModel>(
  'TokenBlacklist',
  tokenBlacklistSchema
);
