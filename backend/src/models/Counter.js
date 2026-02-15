import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    key: {
      type: String,
      required: true,
    },
    nextId: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

counterSchema.index({ ownerId: 1, key: 1 }, { unique: true });

export const Counter = mongoose.model('Counter', counterSchema);
