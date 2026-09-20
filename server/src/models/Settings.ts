import mongoose, { Schema, model, type Document } from 'mongoose';

/**
 * Singleton settings document. Holds admin-configurable, no-code values:
 * loyalty tuning and global feature flags.
 */
export interface ISettings extends Document {
  key: string;
  categories: { ar: string; en: string; icon?: string }[];
  loyalty: {
    enabled: boolean;
    pointsPerEnrollment: number; // +5 per course taken
    pointsPerReferral: number; // +10 when an invited friend joins
    threshold: number; // 20 → voucher
    voucherDiscountPercent: number; // 20%
    voucherExpiryDays: number | null; // null = no expiry
  };
  enrollment: {
    seatReservationMinPercent: number; // min % to reserve a seat (default 30)
    defaultTeacherCommissionRate: number; // default 0.10
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
    categories: {
      type: [{ ar: String, en: String, icon: { type: String, default: '' } }],
      default: [],
    },
    loyalty: {
      enabled: { type: Boolean, default: true },
      pointsPerEnrollment: { type: Number, default: 5 },
      pointsPerReferral: { type: Number, default: 10 },
      threshold: { type: Number, default: 20 },
      voucherDiscountPercent: { type: Number, default: 20 },
      voucherExpiryDays: { type: Number, default: null },
    },
    enrollment: {
      seatReservationMinPercent: { type: Number, default: 30, min: 0, max: 100 },
      defaultTeacherCommissionRate: { type: Number, default: 0.1, min: 0, max: 1 },
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
