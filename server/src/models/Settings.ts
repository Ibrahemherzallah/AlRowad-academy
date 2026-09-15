import mongoose, { Schema, model, type Document } from 'mongoose';

/**
 * Singleton settings document. Holds admin-configurable, no-code values:
 * loyalty tuning and global feature flags.
 */
export interface ISettings extends Document {
  key: string; // always 'global'
  loyalty: {
    enabled: boolean;
    pointsPerEnrollment: number; // default 10
    threshold: number; // default 20
    voucherDiscountPercent: number; // default 20
    voucherExpiryDays: number | null; // null = no expiry
  };
  featureFlags: {
    referrals: boolean;
    sessions: boolean;
    certificates: boolean;
    waitlist: boolean;
    blog: boolean;
  };
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default: 'global', unique: true },
    loyalty: {
      enabled: { type: Boolean, default: true },
      pointsPerEnrollment: { type: Number, default: 10 },
      threshold: { type: Number, default: 20 },
      voucherDiscountPercent: { type: Number, default: 20 },
      voucherExpiryDays: { type: Number, default: null },
    },
    featureFlags: {
      referrals: { type: Boolean, default: true },
      sessions: { type: Boolean, default: true },
      certificates: { type: Boolean, default: true },
      waitlist: { type: Boolean, default: true },
      blog: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

const SettingsModel = mongoose.models.Settings || model<ISettings>('Settings', settingsSchema);

/** Fetch (or lazily create) the singleton settings doc. */
export async function getSettings(): Promise<ISettings> {
  let doc = await SettingsModel.findOne({ key: 'global' });
  if (!doc) doc = await SettingsModel.create({ key: 'global' });
  return doc;
}

export const Settings = SettingsModel;
