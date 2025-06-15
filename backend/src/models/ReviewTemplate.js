import mongoose from 'mongoose';

const reviewTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ['overall', 'skills', 'values', 'initiatives', 'goals'],
      required: true
    },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'rating', 'rating_text'],
      required: true
    },
    required: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },

    // Template metadata
    usage: {
      selfReview: { type: Boolean, default: true },
      peerReview: { type: Boolean, default: true },
      managerReview: { type: Boolean, default: true },
      upwardReview: { type: Boolean, default: false }
    },

    // Analytics
    usageCount: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true,
    collection: 'reviewTemplates'
  }
);

// Indexes
reviewTemplateSchema.index({ category: 1, isActive: 1 });
reviewTemplateSchema.index({ createdBy: 1 });
reviewTemplateSchema.index({ order: 1 });

// Virtual for display name
reviewTemplateSchema.virtual('displayName').get(function () {
  return this.name || this.text.substring(0, 50) + '...';
});

// Methods
reviewTemplateSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

// Static methods
reviewTemplateSchema.statics.getByCategory = function (category) {
  return this.find({ category, isActive: true }).sort({ order: 1, createdAt: 1 });
};

reviewTemplateSchema.statics.getDefaultTemplates = function () {
  return [
    {
      name: 'Overall Performance Rating',
      category: 'overall',
      text: 'How would you rate your overall performance this period?',
      type: 'rating_text',
      required: true,
      order: 1,
      usage: { selfReview: true, peerReview: true, managerReview: true, upwardReview: false }
    },
    {
      name: 'Key Achievements',
      category: 'goals',
      text: 'What are your key achievements this period?',
      type: 'text',
      required: true,
      order: 2,
      usage: { selfReview: true, peerReview: false, managerReview: true, upwardReview: false }
    },
    {
      name: 'Areas for Improvement',
      category: 'skills',
      text: 'What areas would you like to improve?',
      type: 'text',
      required: true,
      order: 3,
      usage: { selfReview: true, peerReview: false, managerReview: true, upwardReview: false }
    },
    {
      name: 'Technical Skills Rating',
      category: 'skills',
      text: 'Rate your technical/professional skills',
      type: 'rating_text',
      required: true,
      order: 4,
      usage: { selfReview: true, peerReview: true, managerReview: true, upwardReview: false }
    },
    {
      name: 'Company Values Demonstration',
      category: 'values',
      text: 'How well did you demonstrate company values?',
      type: 'rating_text',
      required: true,
      order: 5,
      usage: { selfReview: true, peerReview: true, managerReview: true, upwardReview: false }
    },
    {
      name: 'Leadership Initiatives',
      category: 'initiatives',
      text: 'Describe any initiatives you led or contributed to',
      type: 'text',
      required: false,
      order: 6,
      usage: { selfReview: true, peerReview: false, managerReview: true, upwardReview: false }
    },
    {
      name: 'Future Goals',
      category: 'goals',
      text: 'What are your goals for the next period?',
      type: 'text',
      required: true,
      order: 7,
      usage: { selfReview: true, peerReview: false, managerReview: true, upwardReview: false }
    },
    {
      name: 'Collaboration Skills',
      category: 'skills',
      text: 'Rate your collaboration and teamwork',
      type: 'rating_text',
      required: true,
      order: 8,
      usage: { selfReview: true, peerReview: true, managerReview: true, upwardReview: false }
    },
    {
      name: 'Communication Skills',
      category: 'skills',
      text: 'Rate your communication skills',
      type: 'rating_text',
      required: true,
      order: 9,
      usage: { selfReview: true, peerReview: true, managerReview: true, upwardReview: false }
    },
    {
      name: 'Additional Feedback',
      category: 'overall',
      text: 'Any additional feedback or comments?',
      type: 'text',
      required: false,
      order: 10,
      usage: { selfReview: true, peerReview: true, managerReview: true, upwardReview: true }
    }
  ];
};

export default mongoose.model('ReviewTemplate', reviewTemplateSchema);
