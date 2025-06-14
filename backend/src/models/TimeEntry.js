import mongoose from 'mongoose';

const { Schema } = mongoose;

const timeEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    okrId: { type: Schema.Types.ObjectId, ref: 'OKR', required: true },
    keyResultId: Schema.Types.ObjectId,
    date: { type: Date, required: true },
    hoursSpent: { type: Number, required: true, min: 0, max: 24 },
    description: String,
    category: {
      type: String,
      enum: ['direct_work', 'planning', 'collaboration', 'review', 'other'],
      default: 'direct_work'
    }
  },
  {
    timestamps: true,
    collection: 'timeEntries'
  }
);

timeEntrySchema.index({ userId: 1, date: -1 });
timeEntrySchema.index({ okrId: 1, date: -1 });

export default mongoose.models.TimeEntry || mongoose.model('TimeEntry', timeEntrySchema);
