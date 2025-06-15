import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'hr', 'manager', 'employee'],
      default: 'employee'
    },
    department: String,
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },

    // Manager history for when managers change
    managerHistory: [
      {
        managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        startDate: Date,
        endDate: Date
      }
    ],

    // Notification preferences
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      weeklyReminders: { type: Boolean, default: true },
      deadlineAlerts: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

export default mongoose.model('User', userSchema);
