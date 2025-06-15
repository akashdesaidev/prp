import { z } from 'zod';
import OKR from '../models/OKR.js';
import User from '../models/User.js';

const keyResultSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  score: z.number().min(1).max(10).optional(),
  unit: z.string().optional()
});

export const okrSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(['company', 'department', 'team', 'individual']),
  parentOkrId: z.string().optional().nullable(),
  assignedTo: z.string(),
  department: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  keyResults: z.array(keyResultSchema).optional()
});

export const createOKR = async (req, res, next) => {
  try {
    const parse = okrSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());

    const okrData = {
      ...parse.data,
      createdBy: req.user.id
    };

    // Handle optional dates
    if (parse.data.startDate) {
      okrData.startDate = new Date(parse.data.startDate);
    }
    if (parse.data.endDate) {
      okrData.endDate = new Date(parse.data.endDate);
    }

    // Role-based access control
    if (parse.data.type === 'company' && !['admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins can create company OKRs' });
    }

    if (parse.data.type === 'department' && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins and HR can create department OKRs' });
    }

    const okr = await OKR.create(okrData);
    return res.status(201).json(okr);
  } catch (err) {
    return next(err);
  }
};

export const getOKRs = async (req, res, next) => {
  try {
    let filter = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      filter.assignedTo = req.user.id;
    } else if (req.user.role === 'manager') {
      // Managers can see their team's OKRs
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamIds = teamMembers.map((member) => member._id);
      teamIds.push(req.user.id); // Include manager's own OKRs
      filter.assignedTo = { $in: teamIds };
    }
    // Admin and HR can see all OKRs (no filter)

    // Apply query filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    const okrs = await OKR.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('parentOkrId', 'title type')
      .sort({ createdAt: -1 });

    return res.json(okrs);
  } catch (err) {
    return next(err);
  }
};

export const getOKR = async (req, res, next) => {
  try {
    const okr = await OKR.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('parentOkrId', 'title type');

    if (!okr) return res.status(404).json({ error: 'OKR not found' });

    // Role-based access control
    if (req.user.role === 'employee' && okr.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(okr);
  } catch (err) {
    return next(err);
  }
};

export const updateOKR = async (req, res, next) => {
  try {
    const parse = okrSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());

    const okr = await OKR.findById(req.params.id);
    if (!okr) return res.status(404).json({ error: 'OKR not found' });

    // Role-based access control
    const canEdit =
      req.user.role === 'admin' ||
      req.user.role === 'hr' ||
      okr.assignedTo.toString() === req.user.id ||
      okr.createdBy.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = { ...parse.data };
    if (parse.data.startDate) updateData.startDate = new Date(parse.data.startDate);
    if (parse.data.endDate) updateData.endDate = new Date(parse.data.endDate);

    const updatedOKR = await OKR.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('parentOkrId', 'title type');

    return res.json(updatedOKR);
  } catch (err) {
    return next(err);
  }
};

export const deleteOKR = async (req, res, next) => {
  try {
    const okr = await OKR.findById(req.params.id);
    if (!okr) return res.status(404).json({ error: 'OKR not found' });

    // Only admin can delete OKRs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete OKRs' });
    }

    // Soft delete by setting status to archived
    await OKR.findByIdAndUpdate(req.params.id, { status: 'archived' });
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

export const updateKeyResult = async (req, res, next) => {
  try {
    const { okrId, keyResultId } = req.params;
    const parse = keyResultSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());

    const okr = await OKR.findById(okrId);
    if (!okr) return res.status(404).json({ error: 'OKR not found' });

    // Role-based access control
    const canEdit =
      req.user.role === 'admin' ||
      req.user.role === 'hr' ||
      okr.assignedTo.toString() === req.user.id ||
      okr.createdBy.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const keyResult = okr.keyResults.id(keyResultId);
    if (!keyResult) return res.status(404).json({ error: 'Key Result not found' });

    Object.assign(keyResult, parse.data);
    keyResult.updatedAt = new Date();

    // Add progress snapshot if current value changed
    if (parse.data.currentValue !== undefined) {
      okr.progressSnapshots.push({
        keyResultId: keyResultId,
        score: parse.data.score || keyResult.score,
        notes: `Updated to ${parse.data.currentValue}`,
        recordedBy: req.user.id,
        snapshotType: 'manual'
      });
    }

    await okr.save();
    return res.json(okr);
  } catch (err) {
    return next(err);
  }
};

export const addKeyResult = async (req, res, next) => {
  try {
    const { okrId } = req.params;
    const parse = keyResultSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error.flatten());

    const okr = await OKR.findById(okrId);
    if (!okr) return res.status(404).json({ error: 'OKR not found' });

    // Role-based access control
    const canEdit =
      req.user.role === 'admin' ||
      req.user.role === 'hr' ||
      okr.assignedTo.toString() === req.user.id ||
      okr.createdBy.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    okr.keyResults.push(parse.data);
    await okr.save();
    return res.json(okr);
  } catch (err) {
    return next(err);
  }
};

export const getOKRTags = async (req, res, next) => {
  try {
    console.log('🏷️ getOKRTags called by user:', req.user.email, 'role:', req.user.role);

    let filter = {};

    // Role-based filtering - same logic as getOKRs
    if (req.user.role === 'employee') {
      filter.assignedTo = req.user.id;
    } else if (req.user.role === 'manager') {
      // Managers can see their team's OKRs
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamIds = teamMembers.map((member) => member._id);
      teamIds.push(req.user.id); // Include manager's own OKRs
      filter.assignedTo = { $in: teamIds };
    }
    // Admin and HR can see all OKRs (no filter)

    console.log('🔍 Filter applied:', filter);

    // Get all OKRs that match the filter and have tags
    const okrs = await OKR.find({ ...filter, tags: { $exists: true, $ne: [] } }).select('tags');

    console.log('📊 Found OKRs with tags:', okrs.length);

    // Extract and deduplicate tags
    const allTags = okrs.reduce((tags, okr) => {
      if (okr.tags && Array.isArray(okr.tags)) {
        tags.push(...okr.tags);
      }
      return tags;
    }, []);

    // Remove duplicates and sort alphabetically
    const uniqueTags = [...new Set(allTags)].sort();

    console.log('🏷️ Unique tags found:', uniqueTags.length, uniqueTags);

    return res.json(uniqueTags);
  } catch (err) {
    console.error('❌ Error in getOKRTags:', err);
    return next(err);
  }
};

export const updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { keyResults, notes } = req.body;

    console.log('🔄 updateProgress called for OKR:', id);
    console.log('📊 Key results to update:', keyResults);

    const okr = await OKR.findById(id);
    if (!okr) return res.status(404).json({ error: 'OKR not found' });

    // Role-based access control
    const canEdit =
      req.user.role === 'admin' ||
      req.user.role === 'hr' ||
      okr.assignedTo.toString() === req.user.id ||
      okr.createdBy.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update key results
    if (keyResults && Array.isArray(keyResults)) {
      keyResults.forEach((update) => {
        const keyResult = okr.keyResults.id(update.id);
        if (keyResult) {
          if (update.currentValue !== undefined) keyResult.currentValue = update.currentValue;
          if (update.score !== undefined) keyResult.score = update.score;
          keyResult.updatedAt = new Date();

          // Add progress snapshot
          okr.progressSnapshots.push({
            keyResultId: update.id,
            score: keyResult.score,
            notes: notes || `Updated progress to ${update.currentValue}`,
            recordedBy: req.user.id,
            snapshotType: 'manual'
          });

          console.log(
            `✅ Updated key result: ${keyResult.title} - Current: ${keyResult.currentValue}, Score: ${keyResult.score}`
          );
        }
      });
    }

    await okr.save();

    const updatedOKR = await OKR.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('parentOkrId', 'title type');

    console.log('🎉 OKR progress updated successfully');
    return res.json(updatedOKR);
  } catch (err) {
    console.error('❌ Error updating OKR progress:', err);
    return next(err);
  }
};

export const getProgressHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log('📈 getProgressHistory called for OKR:', id);

    const okr = await OKR.findById(id)
      .populate('progressSnapshots.recordedBy', 'firstName lastName email')
      .select('progressSnapshots keyResults title');

    if (!okr) return res.status(404).json({ error: 'OKR not found' });

    // Role-based access control
    const canView =
      req.user.role === 'admin' ||
      req.user.role === 'hr' ||
      okr.assignedTo?.toString() === req.user.id ||
      okr.createdBy?.toString() === req.user.id;

    if (!canView) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Format progress history with key result details
    const progressHistory = okr.progressSnapshots
      .map((snapshot) => {
        const keyResult = okr.keyResults.id(snapshot.keyResultId);
        return {
          id: snapshot._id,
          keyResultId: snapshot.keyResultId,
          keyResultTitle: keyResult ? keyResult.title : 'Unknown Key Result',
          score: snapshot.score,
          notes: snapshot.notes,
          recordedAt: snapshot.recordedAt,
          recordedBy: snapshot.recordedBy,
          snapshotType: snapshot.snapshotType
        };
      })
      .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)); // Most recent first

    console.log(`✅ Retrieved ${progressHistory.length} progress snapshots`);
    return res.json({
      okrId: okr._id,
      okrTitle: okr.title,
      progressHistory
    });
  } catch (err) {
    console.error('❌ Error getting progress history:', err);
    return next(err);
  }
};
