import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: [
        'review_reminder',
        'feedback_received',
        'cycle_created',
        'deadline_approaching',
        'review_submitted',
        'peer_nomination_request',
        'okr_update_reminder',
        'system_announcement'
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },

    // Related entity information
    relatedId: mongoose.Schema.Types.ObjectId, // Review ID, Feedback ID, etc.
    relatedType: {
      type: String,
      enum: ['review', 'feedback', 'okr', 'cycle', 'user']
    },

    // Scheduling
    scheduledFor: Date, // For delayed notifications
    sentAt: Date,

    // Priority and actions
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },

    // Action buttons for notifications
    actions: [
      {
        label: String,
        url: String,
        type: { type: String, enum: ['primary', 'secondary'], default: 'primary' }
      }
    ],

    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'notifications'
  }
);

// Indexes for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, emailSent: 1 });
notificationSchema.index({ type: 1, isRead: 1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
