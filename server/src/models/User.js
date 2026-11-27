import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_ROLES } from '../constants/roles.js';

const BCRYPT_ROUNDS = 12;

/**
 * Server-owned user record. `role`, `passwordHash` and `tokenVersion` are
 * never populated from a request body; only trusted server code may write them.
 */
const userSchema = new Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, select: false },
    displayName: { type: String, trim: true, default: '' },
    photoURL: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: {
      addressLine1: { type: String, trim: true, default: '' },
      addressLine2: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'Bangladesh' },
    },
    role: { type: String, enum: USER_ROLES, default: ROLES.USER, index: true },
    sellerStatus: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'rejected'],
      default: 'approved',
      index: true,
    },
    isActive: { type: Boolean, default: true },
    provider: { type: String, default: 'password' },
    tokenVersion: { type: Number, default: 0, min: 0 },
    lastLoginAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('passwordHash') || !this.passwordHash) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, BCRYPT_ROUNDS);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = model('User', userSchema);
