import { z } from 'zod';
import TimeEntry from '../models/TimeEntry.js';
import OKR from '../models/OKR.js';
import User from '../models/User.js';

export const timeEntrySchema = z.object({
  okrId: z.string(),
  keyResultId: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  hoursSpent: z.number().min(0).max(24),
  description: z.string().optional(),
  category: z.enum(['direct_work', 'planning', 'collaboration', 'review', 'other']).optional()
});

export const createTimeEntry = async (req, res, next) => {
  try {
    const parse = timeEntrySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());

    // Verify OKR exists and user has access
    const okr = await OKR.findById(parse.data.okrId);
    if (!okr) return res.status(404).json({ error: 'OKR not found' });

    // Role-based access control
    const canLog =
      req.user.role === 'admin' ||
      req.user.role === 'hr' ||
      okr.assignedTo.toString() === req.user.id;

    if (!canLog) {
      return res.status(403).json({ error: 'Can only log time for your own OKRs' });
    }

    const entryData = {
      ...parse.data,
      userId: req.user.id,
      date: new Date(parse.data.date)
    };

    const entry = await TimeEntry.create(entryData);
    return res.status(201).json(entry);
  } catch (err) {
    return next(err);
  }
};

export const getTimeEntries = async (req, res, next) => {
  try {
    let filter = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      filter.userId = req.user.id;
    } else if (req.user.role === 'manager') {
      // Managers can see their team's time entries
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamIds = teamMembers.map((member) => member._id);
      teamIds.push(req.user.id); // Include manager's own entries
      filter.userId = { $in: teamIds };
    }
    // Admin and HR can see all entries (no filter)

    // Apply query filters
    if (req.query.okrId) filter.okrId = req.query.okrId;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.category) filter.category = req.query.category;

    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const entries = await TimeEntry.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('okrId', 'title type')
      .sort({ date: -1 });

    return res.json(entries);
  } catch (err) {
    return next(err);
  }
};

export const updateTimeEntry = async (req, res, next) => {
  try {
    const parse = timeEntrySchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());

    const entry = await TimeEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Time entry not found' });

    // Role-based access control
    const canEdit =
      req.user.role === 'admin' ||
      req.user.role === 'hr' ||
      entry.userId.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ error: 'Can only edit your own time entries' });
    }

    const updateData = { ...parse.data };
    if (parse.data.date) updateData.date = new Date(parse.data.date);

    const updatedEntry = await TimeEntry.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('userId', 'firstName lastName email')
      .populate('okrId', 'title type');

    return res.json(updatedEntry);
  } catch (err) {
    return next(err);
  }
};

export const deleteTimeEntry = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Time entry not found' });

    // Role-based access control
    const canDelete =
      req.user.role === 'admin' ||
      req.user.role === 'hr' ||
      entry.userId.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ error: 'Can only delete your own time entries' });
    }

    await TimeEntry.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

export const getTimeAnalytics = async (req, res, next) => {
  try {
    let filter = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      filter.userId = req.user.id;
    } else if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamIds = teamMembers.map((member) => member._id);
      teamIds.push(req.user.id);
      filter.userId = { $in: teamIds };
    }

    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const analytics = await TimeEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            userId: '$userId',
            category: '$category'
          },
          totalHours: { $sum: '$hoursSpent' },
          entryCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          categories: {
            $push: {
              category: '$_id.category',
              totalHours: '$totalHours',
              entryCount: '$entryCount'
            }
          },
          totalHours: { $sum: '$totalHours' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            email: '$user.email'
          },
          categories: 1,
          totalHours: 1
        }
      }
    ]);

    return res.json(analytics);
  } catch (err) {
    return next(err);
  }
};
