import mongoose from 'mongoose';

const reviewCycleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['quarterly', 'half-yearly', 'annual', 'custom'],
      required: true
    },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewTemplate' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    gracePeriodDays: { type: Number, default: 3 },
    status: {
      type: String,
      enum: ['draft', 'active', 'grace-period', 'closed'],
      default: 'draft'
    },
    isEmergency: { type: Boolean, default: false },

    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: {
          type: String,
          enum: ['reviewee', 'peer', 'manager', 'self']
        },
        status: {
          type: String,
          enum: ['pending', 'submitted', 'not-submitted'],
          default: 'pending'
        },
        submittedAt: Date,
        removedAt: Date
      }
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Review configuration
    reviewTypes: {
      selfReview: { type: Boolean, default: true },
      peerReview: { type: Boolean, default: true },
      managerReview: { type: Boolean, default: true },
      upwardReview: { type: Boolean, default: false }
    },

    // Peer review settings
    minPeerReviewers: { type: Number, default: 3 },
    maxPeerReviewers: { type: Number, default: 5 },
    allowSelfNomination: { type: Boolean, default: false },

    // Questions for reviews
    questions: [
      {
        category: {
          type: String,
          enum: ['skills', 'values', 'initiatives', 'goals', 'overall'],
          required: true
        },
        question: { type: String, required: true },
        requiresRating: { type: Boolean, default: true },
        ratingScale: { type: Number, default: 10 },
        isRequired: { type: Boolean, default: true },
        order: { type: Number, default: 0 }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'reviewCycles'
  }
);

// Indexes for performance
reviewCycleSchema.index({ status: 1, startDate: 1 });
reviewCycleSchema.index({ createdBy: 1 });
reviewCycleSchema.index({ 'participants.userId': 1 });

// Virtual for grace period end date
reviewCycleSchema.virtual('gracePeriodEndDate').get(function () {
  if (this.endDate && this.gracePeriodDays) {
    const graceEnd = new Date(this.endDate);
    graceEnd.setDate(graceEnd.getDate() + this.gracePeriodDays);
    return graceEnd;
  }
  return this.endDate;
});

// Methods
reviewCycleSchema.methods.isActive = function () {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

reviewCycleSchema.methods.isInGracePeriod = function () {
  const now = new Date();
  return this.status === 'grace-period' && now > this.endDate && now <= this.gracePeriodEndDate;
};

reviewCycleSchema.methods.canAddParticipants = function () {
  return ['draft', 'active'].includes(this.status);
};

// Static methods
reviewCycleSchema.statics.findActiveForUser = function (userId) {
  return this.find({
    'participants.userId': userId,
    status: { $in: ['active', 'grace-period'] }
  }).populate('participants.userId', 'firstName lastName email');
};

reviewCycleSchema.statics.checkForConflicts = function (startDate, endDate, excludeId = null) {
  const query = {
    $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    status: { $in: ['draft', 'active', 'grace-period'] }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query);
};

export default mongoose.model('ReviewCycle', reviewCycleSchema);
