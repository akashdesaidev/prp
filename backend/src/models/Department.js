import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.models.Department || mongoose.model('Department', departmentSchema);
