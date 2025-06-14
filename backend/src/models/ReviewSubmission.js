import mongoose from 'mongoose';

const reviewSubmissionSchema = new mongoose.Schema(
  {
    reviewCycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewCycle', required: true },
    revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewType: {
      type: String,
      enum: ['self', 'peer', 'manager', 'upward'],
      required: true
    },

    responses: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        questionText: String,
        response: String,
        rating: { type: Number, min: 1, max: 10 }
      }
    ],

    overallRating: { type: Number, min: 1, max: 10 },

    // Additional feedback fields
    strengths: String,
    areasForImprovement: String,
    goals: String,
    comments: String,

    // AI Features
    aiSuggestions: {
      suggestedRating: Number,
      suggestedComments: String,
      suggestedStrengths: String,
      suggestedImprovements: String,
      usedSuggestion: { type: Boolean, default: false }
    },

    // AI Scoring (as per PRD formula)
    aiScoring: {
      recentFeedbackScore: Number,
      okrScore: Number,
      peerFeedbackScore: Number,
      managerFeedbackScore: Number,
      selfAssessmentScore: Number,
      tenureAdjustmentScore: Number,
      finalScore: Number
    },

    sentimentAnalysis: {
      overallSentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative']
      },
      qualityFlags: [String],
      confidenceScore: Number
    },

    // Status and metadata
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed'],
      default: 'draft'
    },

    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Nomination tracking for peer reviews
    isNominated: { type: Boolean, default: false },
    nominatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nominatedAt: Date,

    // Visibility settings
    isAnonymous: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'reviewSubmissions'
  }
);

// Indexes for performance
reviewSubmissionSchema.index({ reviewCycleId: 1, revieweeId: 1 });
reviewSubmissionSchema.index({ reviewerId: 1, reviewType: 1 });
reviewSubmissionSchema.index({ revieweeId: 1, reviewType: 1 });
reviewSubmissionSchema.index({ status: 1, submittedAt: 1 });

// Compound index for finding reviews
reviewSubmissionSchema.index(
  {
    reviewCycleId: 1,
    revieweeId: 1,
    reviewerId: 1,
    reviewType: 1
  },
  { unique: true }
);

// Virtual for calculating completion percentage
reviewSubmissionSchema.virtual('completionPercentage').get(function () {
  if (!this.responses || this.responses.length === 0) return 0;

  const answeredQuestions = this.responses.filter(
    (r) => r.response && r.response.trim() !== ''
  ).length;
  return Math.round((answeredQuestions / this.responses.length) * 100);
});

// Methods
reviewSubmissionSchema.methods.isComplete = function () {
  return this.responses && this.responses.every((r) => r.response && r.response.trim() !== '');
};

reviewSubmissionSchema.methods.canBeSubmitted = function () {
  return this.status === 'draft' && this.isComplete();
};

reviewSubmissionSchema.methods.submit = function () {
  if (this.canBeSubmitted()) {
    this.status = 'submitted';
    this.submittedAt = new Date();
    return this.save();
  }
  throw new Error('Review cannot be submitted - not complete or already submitted');
};

// Static methods
reviewSubmissionSchema.statics.findByReviewCycle = function (reviewCycleId, options = {}) {
  const query = { reviewCycleId };

  if (options.revieweeId) query.revieweeId = options.revieweeId;
  if (options.reviewerId) query.reviewerId = options.reviewerId;
  if (options.reviewType) query.reviewType = options.reviewType;
  if (options.status) query.status = options.status;

  return this.find(query)
    .populate('revieweeId', 'firstName lastName email')
    .populate('reviewerId', 'firstName lastName email')
    .populate('reviewCycleId', 'name type status');
};

reviewSubmissionSchema.statics.getReviewStats = function (reviewCycleId) {
  return this.aggregate([
    { $match: { reviewCycleId: mongoose.Types.ObjectId(reviewCycleId) } },
    {
      $group: {
        _id: '$reviewType',
        total: { $sum: 1 },
        submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
        averageRating: { $avg: '$overallRating' }
      }
    }
  ]);
};

reviewSubmissionSchema.statics.findPendingReviews = function (userId) {
  return this.find({
    reviewerId: userId,
    status: 'draft'
  })
    .populate('revieweeId', 'firstName lastName email')
    .populate('reviewCycleId', 'name endDate status')
    .sort({ 'reviewCycleId.endDate': 1 });
};

// Pre-save middleware
reviewSubmissionSchema.pre('save', function (next) {
  // Auto-calculate completion percentage
  if (this.responses && this.responses.length > 0) {
    const answeredQuestions = this.responses.filter(
      (r) => r.response && r.response.trim() !== ''
    ).length;
    this.completionPercentage = Math.round((answeredQuestions / this.responses.length) * 100);
  }

  next();
});

export default mongoose.model('ReviewSubmission', reviewSubmissionSchema);
