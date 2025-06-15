import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 10 },
    type: { type: String, enum: ['public', 'private'], default: 'public' },
    category: {
      type: String,
      enum: ['skills', 'values', 'initiatives', 'goals', 'collaboration', 'leadership'],
      default: 'skills'
    },
    tags: [String], // skill tags
    isAnonymous: { type: Boolean, default: false },
    reviewCycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewCycle' },

    // AI analysis
    sentimentScore: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    aiQualityFlags: [String],
    confidenceScore: { type: Number, min: 0, max: 1 },

    // Status and moderation
    status: {
      type: String,
      enum: ['active', 'hidden', 'flagged', 'deleted'],
      default: 'active'
    },

    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
    moderationReason: String,

    // Visibility and permissions
    isVisible: { type: Boolean, default: true },

    // Response tracking
    hasResponse: { type: Boolean, default: false },
    responseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' },
    parentFeedbackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }
  },
  {
    timestamps: true,
    collection: 'feedback'
  }
);

// Indexes for performance
feedbackSchema.index({ toUserId: 1, createdAt: -1 });
feedbackSchema.index({ fromUserId: 1, createdAt: -1 });
feedbackSchema.index({ reviewCycleId: 1 });
feedbackSchema.index({ status: 1, type: 1 });
feedbackSchema.index({ tags: 1 });

// Prevent self-feedback
feedbackSchema.pre('save', function (next) {
  if (this.fromUserId.equals(this.toUserId)) {
    next(new Error('Users cannot give feedback to themselves'));
  } else {
    next();
  }
});

// Methods
feedbackSchema.methods.canBeViewedBy = function (userId) {
  // Public feedback can be viewed by anyone in the organization
  if (this.type === 'public' && this.status === 'active') {
    return true;
  }

  // Private feedback can only be viewed by sender, recipient, or admins
  if (this.type === 'private') {
    return this.fromUserId.equals(userId) || this.toUserId.equals(userId);
  }

  return false;
};

feedbackSchema.methods.canBeEditedBy = function (userId) {
  // Only the sender can edit feedback, and only if not submitted
  return this.fromUserId.equals(userId) && this.status === 'active';
};

feedbackSchema.methods.moderate = function (moderatorId, reason) {
  this.status = 'hidden';
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
  return this.save();
};

// Static methods
feedbackSchema.statics.findForUser = function (userId, options = {}) {
  const query = {
    toUserId: userId,
    status: 'active'
  };

  if (options.type) query.type = options.type;
  if (options.category) query.category = options.category;
  if (options.reviewCycleId) query.reviewCycleId = options.reviewCycleId;

  return this.find(query)
    .populate('fromUserId', 'firstName lastName email')
    .populate('reviewCycleId', 'name type')
    .sort({ createdAt: -1 });
};

feedbackSchema.statics.findByUser = function (userId, options = {}) {
  const query = {
    fromUserId: userId,
    status: 'active'
  };

  if (options.type) query.type = options.type;
  if (options.category) query.category = options.category;

  return this.find(query)
    .populate('toUserId', 'firstName lastName email')
    .populate('reviewCycleId', 'name type')
    .sort({ createdAt: -1 });
};

feedbackSchema.statics.getFeedbackStats = function (userId, timeRange = null) {
  const matchStage = {
    toUserId: new mongoose.Types.ObjectId(userId),
    status: 'active'
  };

  if (timeRange) {
    matchStage.createdAt = { $gte: new Date(timeRange) };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        positiveCount: {
          $sum: { $cond: [{ $eq: ['$sentimentScore', 'positive'] }, 1, 0] }
        },
        neutralCount: {
          $sum: { $cond: [{ $eq: ['$sentimentScore', 'neutral'] }, 1, 0] }
        },
        negativeCount: {
          $sum: { $cond: [{ $eq: ['$sentimentScore', 'negative'] }, 1, 0] }
        }
      }
    }
  ]);
};

feedbackSchema.statics.getTopSkills = function (userId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        toUserId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        tags: { $exists: true, $ne: [] }
      }
    },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

export default mongoose.model('Feedback', feedbackSchema);
