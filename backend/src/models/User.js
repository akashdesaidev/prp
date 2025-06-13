import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'hr', 'manager', 'employee'],
    default: 'employee'
  },
  isActive: { type: Boolean, default: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
