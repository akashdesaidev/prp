import mongoose from 'mongoose';

const { Schema } = mongoose;

const keyResultSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    targetValue: Number,
    currentValue: { type: Number, default: 0 },
    score: { type: Number, min: 1, max: 10, default: 1 },
    unit: String,
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const progressSnapshotSchema = new Schema(
  {
    keyResultId: Schema.Types.ObjectId,
    score: { type: Number, min: 1, max: 10 },
    notes: String,
    recordedAt: { type: Date, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    snapshotType: {
      type: String,
      enum: ['manual', 'auto_weekly', 'cycle_end'],
      default: 'manual'
    }
  },
  { _id: true }
);

const okrSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ['company', 'department', 'team', 'individual'],
      required: true
    },
    parentOkrId: { type: Schema.Types.ObjectId, ref: 'OKR' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    department: String,
    tags: [String],
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,

    keyResults: [keyResultSchema],

    // Progress tracking
    progressSnapshots: [progressSnapshotSchema]
  },
  {
    timestamps: true,
    collection: 'okrs'
  }
);

okrSchema.index({ assignedTo: 1, status: 1 });
okrSchema.index({ type: 1, status: 1 });
okrSchema.index({ parentOkrId: 1 });

export default mongoose.models.OKR || mongoose.model('OKR', okrSchema);
